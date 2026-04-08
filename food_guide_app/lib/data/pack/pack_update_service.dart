import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

import '../local/app_database.dart';
import 'pack_manifest.dart';
import 'pack_pointer_store.dart';
import 'signed_pack_installer.dart';

/// HTTPS fetch → verify → [SignedPackInstaller] (uplift U2).
class PackUpdateService {
  PackUpdateService(
    this._db, {
    http.Client? httpClient,
    this.timeout = const Duration(seconds: 60),
  }) : _client = httpClient ?? http.Client();

  final AppDatabase _db;
  final http.Client _client;
  final Duration timeout;

  Database get _database => _db.db;

  /// [baseUrl] directory URL containing `manifest.json` and listed files (no trailing slash required).
  Future<PackUpdateResult> downloadAndInstall(
    String baseUrl, {
    String? trustedPublicKeyB64,
  }) async {
    final root = baseUrl.trim();
    if (root.isEmpty) {
      return PackUpdateResult.failure('empty_base_url');
    }
    final baseUri = Uri.parse(root.endsWith('/') ? root : '$root/');
    final manifestUri = baseUri.resolve('manifest.json');
    http.Response manResp;
    try {
      manResp = await _client.get(manifestUri).timeout(timeout);
    } on Exception catch (e) {
      return PackUpdateResult.failure('manifest_fetch:$e');
    }
    if (manResp.statusCode < 200 || manResp.statusCode >= 300) {
      return PackUpdateResult.failure('manifest_http_${manResp.statusCode}');
    }

    Map<String, dynamic> manifestJson;
    try {
      manifestJson = json.decode(manResp.body) as Map<String, dynamic>;
    } on Exception catch (e) {
      return PackUpdateResult.failure('manifest_json:$e');
    }
    final manifest = PackManifest.fromJson(manifestJson);

    Directory? staging;
    try {
      staging = await Directory.systemTemp.createTemp('fg_pack_staging_');
      final manifestFile = File(p.join(staging.path, 'manifest.json'));
      await manifestFile.writeAsString(manResp.body);

      for (final rel in manifest.fileHashes.keys) {
        final fileUri = baseUri.resolve(rel);
        final resp = await _client.get(fileUri).timeout(timeout);
        if (resp.statusCode < 200 || resp.statusCode >= 300) {
          return PackUpdateResult.failure('file_http_${resp.statusCode}_$rel');
        }
        final out = File(p.join(staging.path, rel));
        await out.parent.create(recursive: true);
        await out.writeAsBytes(resp.bodyBytes);
      }

      final installer = SignedPackInstaller(_database);
      final install = await installer.installFromDirectory(
        staging,
        trustedPublicKeyB64: trustedPublicKeyB64,
      );
      if (!install.ok) {
        return PackUpdateResult.failure(install.error ?? 'install_failed');
      }
      if (install.path != null) {
        await PackPointerStore.instance.setActivePackPath(install.path);
      }
      return PackUpdateResult.ok(install.version ?? manifest.version, install.path);
    } finally {
      if (staging != null && await staging.exists()) {
        try {
          await staging.delete(recursive: true);
        } on Exception {
          // best effort
        }
      }
    }
  }

  /// Point [PackPointerStore] at the previous successful installation row, if any.
  Future<PackRollbackResult> rollbackToPrevious() async {
    final rows = await _database.query(
      'pack_installations',
      orderBy: 'applied_at DESC',
      limit: 2,
    );
    if (rows.length < 2) {
      return PackRollbackResult.failure('no_previous_pack');
    }
    final prevPath = rows[1]['pack_path'] as String?;
    final prevVersion = rows[1]['version'] as String?;
    if (prevPath == null || prevPath.isEmpty) {
      return PackRollbackResult.failure('invalid_previous_path');
    }
    final dir = Directory(prevPath);
    if (!await dir.exists()) {
      return PackRollbackResult.failure('previous_pack_missing_on_disk');
    }
    await PackPointerStore.instance.setActivePackPath(prevPath);
    return PackRollbackResult.ok(prevVersion ?? '');
  }

  void close() {
    _client.close();
  }
}

class PackUpdateResult {
  PackUpdateResult._(this.ok, this.version, this.path, this.error);

  factory PackUpdateResult.ok(String? version, String? path) =>
      PackUpdateResult._(true, version, path, null);

  factory PackUpdateResult.failure(String error) => PackUpdateResult._(false, null, null, error);

  final bool ok;
  final String? version;
  final String? path;
  final String? error;
}

class PackRollbackResult {
  PackRollbackResult._(this.ok, this.version, this.error);

  factory PackRollbackResult.ok(String version) => PackRollbackResult._(true, version, null);

  factory PackRollbackResult.failure(String error) => PackRollbackResult._(false, null, error);

  final bool ok;
  final String? version;
  final String? error;
}

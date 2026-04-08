import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:cryptography/cryptography.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

import 'pack_manifest.dart';

/// Verifies Ed25519 + per-file SHA-256, then copies pack into app support atomically.
class SignedPackInstaller {
  SignedPackInstaller(this._database);

  final Database _database;

  /// [trustedPublicKeyB64] is optional: when null, only SHA-256 file integrity is checked (dev-only risk).
  Future<PackInstallResult> installFromDirectory(
    Directory sourceDir, {
    String? trustedPublicKeyB64,
  }) async {
    final manifestFile = File(p.join(sourceDir.path, 'manifest.json'));
    if (!await manifestFile.exists()) {
      return PackInstallResult.failure('manifest_missing');
    }
    final manifestJson = json.decode(await manifestFile.readAsString()) as Map<String, dynamic>;
    final manifest = PackManifest.fromJson(manifestJson);

    for (final entry in manifest.fileHashes.entries) {
      final f = File(p.join(sourceDir.path, entry.key));
      if (!await f.exists()) {
        return PackInstallResult.failure('file_missing:${entry.key}');
      }
      final bytes = await f.readAsBytes();
      final hash = sha256.convert(bytes).toString();
      if (hash != entry.value) {
        return PackInstallResult.failure('hash_mismatch:${entry.key}');
      }
    }

    if (trustedPublicKeyB64 != null && trustedPublicKeyB64.isNotEmpty) {
      final ok = await _verifyEd25519(
        message: manifest.canonicalMessageBytes(),
        signatureB64: manifest.signatureB64,
        publicKeyB64: trustedPublicKeyB64,
      );
      if (!ok) {
        return PackInstallResult.failure('signature_invalid');
      }
    }

    final support = await getApplicationSupportDirectory();
    final destRoot = Directory(p.join(support.path, 'packs', 'active_${manifest.version}'));
    if (await destRoot.exists()) {
      await destRoot.delete(recursive: true);
    }
    await destRoot.create(recursive: true);

    for (final entry in manifest.fileHashes.entries) {
      final src = File(p.join(sourceDir.path, entry.key));
      final dest = File(p.join(destRoot.path, entry.key));
      await dest.parent.create(recursive: true);
      await src.copy(dest.path);
    }

    final prev = await _latestInstallation();
    await _database.insert('pack_installations', {
      'version': manifest.version,
      'content_sha256': manifest.fileHashes.values.join(','),
      'applied_at': DateTime.now().millisecondsSinceEpoch,
      'prev_version': prev?.version,
      'pack_path': destRoot.path,
      'status': 'active',
    });

    return PackInstallResult.ok(manifest.version, destRoot.path);
  }

  Future<PackInstallationRow?> _latestInstallation() async {
    final rows = await _database.query(
      'pack_installations',
      orderBy: 'applied_at DESC',
      limit: 1,
    );
    if (rows.isEmpty) return null;
    final m = rows.first;
    return PackInstallationRow(
      version: m['version']! as String,
      packPath: m['pack_path']! as String,
    );
  }

  Future<bool> _verifyEd25519({
    required List<int> message,
    required String signatureB64,
    required String publicKeyB64,
  }) async {
    if (signatureB64.isEmpty) return false;
    try {
      final sigBytes = base64Decode(signatureB64);
      final pubBytes = base64Decode(publicKeyB64);
      final algorithm = Ed25519();
      final publicKey = SimplePublicKey(pubBytes, type: KeyPairType.ed25519);
      final signature = Signature(sigBytes, publicKey: publicKey);
      return await algorithm.verify(message, signature: signature);
    } on Exception {
      return false;
    }
  }
}

class PackInstallResult {
  PackInstallResult._(this.ok, this.version, this.path, this.error);

  factory PackInstallResult.ok(String version, String path) =>
      PackInstallResult._(true, version, path, null);

  factory PackInstallResult.failure(String error) => PackInstallResult._(false, null, null, error);

  final bool ok;
  final String? version;
  final String? path;
  final String? error;
}

class PackInstallationRow {
  PackInstallationRow({required this.version, required this.packPath});

  final String version;
  final String packPath;
}

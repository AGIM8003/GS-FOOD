import 'dart:convert';

/// Signed knowledge pack manifest (Phase 3) — JSON on disk / CDN.
class PackManifest {
  PackManifest({
    required this.version,
    required this.region,
    required this.fileHashes,
    required this.signatureB64,
  });

  factory PackManifest.fromJson(Map<String, dynamic> json) {
    final files = (json['files'] as Map?)?.cast<String, dynamic>() ?? {};
    final hashes = <String, String>{};
    for (final e in files.entries) {
      hashes[e.key] = e.value.toString();
    }
    return PackManifest(
      version: json['version']?.toString() ?? '',
      region: json['region']?.toString() ?? '',
      fileHashes: hashes,
      signatureB64: json['signature_b64']?.toString() ?? '',
    );
  }

  final String version;
  final String region;
  final Map<String, String> fileHashes;
  final String signatureB64;

  /// Canonical UTF-8 message covered by the Ed25519 signature (sorted keys, compact JSON).
  List<int> canonicalMessageBytes() {
    final sortedFiles = Map.fromEntries(fileHashes.entries.toList()..sort((a, b) => a.key.compareTo(b.key)));
    final payload = <String, dynamic>{
      'version': version,
      'region': region,
      'files': sortedFiles,
    };
    return utf8.encode(json.encode(_sortKeys(payload)));
  }

  static dynamic _sortKeys(dynamic value) {
    if (value is Map) {
      final keys = value.keys.map((k) => k.toString()).toList()..sort();
      return <String, dynamic>{for (final k in keys) k: _sortKeys(value[k])};
    }
    if (value is List) {
      return value.map(_sortKeys).toList();
    }
    return value;
  }
}

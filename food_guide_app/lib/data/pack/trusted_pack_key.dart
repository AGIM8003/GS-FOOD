import 'package:flutter/services.dart';

/// Optional Ed25519 public key (base64, 32 bytes) for pack signatures.
class TrustedPackKey {
  TrustedPackKey._();

  static const assetPath = 'assets/config/pack_trusted_public_key.b64';

  static Future<String?> loadFromAssets() async {
    try {
      final s = await rootBundle.loadString(assetPath);
      final t = s.trim();
      return t.isEmpty ? null : t;
    } on Exception {
      return null;
    }
  }
}

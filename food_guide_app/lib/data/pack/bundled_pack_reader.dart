import 'dart:convert';

import 'package:flutter/services.dart';

/// Read-only bundled pack slice shipped with the app (Phase 2 / §10 v0).
class BundledPackReader {
  BundledPackReader._();

  static final BundledPackReader instance = BundledPackReader._();

  static const assetPath = 'assets/packs/v0/default_pack.json';

  Future<Map<String, dynamic>?> loadDefaultPack() async {
    try {
      final raw = await rootBundle.loadString(assetPath);
      final decoded = json.decode(raw);
      if (decoded is Map<String, dynamic>) return decoded;
      return null;
    } on Exception {
      return null;
    }
  }
}

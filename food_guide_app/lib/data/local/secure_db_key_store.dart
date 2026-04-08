import 'dart:convert';
import 'dart:math';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persists a random DB encryption passphrase for future SQLCipher migration (uplift U5).
class SecureDbKeyStore {
  SecureDbKeyStore._();

  static final SecureDbKeyStore instance = SecureDbKeyStore._();

  static const _keyName = 'db.encryption_passphrase_b64';

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  /// Returns existing key or generates a new 32-byte secret (base64).
  Future<String> getOrCreatePassphrase() async {
    final existing = await _storage.read(key: _keyName);
    if (existing != null && existing.isNotEmpty) {
      return existing;
    }
    final bytes = List<int>.generate(32, (_) => Random.secure().nextInt(256));
    final b64 = base64Encode(bytes);
    await _storage.write(key: _keyName, value: b64);
    return b64;
  }
}

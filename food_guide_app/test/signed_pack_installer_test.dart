import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:cryptography/cryptography.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:food_guide_app/data/pack/pack_manifest.dart';
import 'package:food_guide_app/data/pack/signed_pack_installer.dart';
import 'package:sqflite/sqflite.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  });

  test('SignedPackInstaller verifies Ed25519 and records installation', () async {
    final tmp = await Directory.systemTemp.createTemp('pack_test_');
    addTearDown(() async {
      if (await tmp.exists()) {
        await tmp.delete(recursive: true);
      }
    });

    const content = '{"hello":"world"}';
    final dataFile = File('${tmp.path}/data.json');
    await dataFile.writeAsString(content);
    final hash = sha256.convert(await dataFile.readAsBytes()).toString();

    final algorithm = Ed25519();
    final keyPair = await algorithm.newKeyPair();
    final publicKey = await keyPair.extractPublicKey();
    final publicB64 = base64Encode(publicKey.bytes);

    final preSign = PackManifest(
      version: 'test-1',
      region: 'default',
      fileHashes: {'data.json': hash},
      signatureB64: '',
    );
    final message = preSign.canonicalMessageBytes();
    final signature = await algorithm.sign(message, keyPair: keyPair);
    final sigB64 = base64Encode(signature.bytes);

    final manifestFile = File('${tmp.path}/manifest.json');
    await manifestFile.writeAsString(
      json.encode({
        'version': 'test-1',
        'region': 'default',
        'files': {'data.json': hash},
        'signature_b64': sigB64,
      }),
    );

    final db = await databaseFactoryFfi.openDatabase(
      inMemoryDatabasePath,
      options: OpenDatabaseOptions(
        version: 1,
        onCreate: (d, v) async {
          await d.execute('''
            CREATE TABLE pack_installations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              version TEXT NOT NULL,
              content_sha256 TEXT NOT NULL,
              applied_at INTEGER NOT NULL,
              prev_version TEXT,
              pack_path TEXT NOT NULL,
              status TEXT NOT NULL
            )
          ''');
        },
      ),
    );

    final installer = SignedPackInstaller(db);
    final result = await installer.installFromDirectory(Directory(tmp.path), trustedPublicKeyB64: publicB64);

    expect(result.ok, isTrue);
    expect(result.version, 'test-1');

    final rows = await db.query('pack_installations');
    expect(rows.length, 1);
    expect(rows.first['version'], 'test-1');

    await db.close();
  });
}

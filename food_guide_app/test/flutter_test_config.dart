import 'package:sqflite_common_ffi/sqflite_ffi.dart';

/// SQLite on device uses sqflite; tests on Windows/macOS/Linux need FFI.
Future<void> testExecutable(Future<void> Function() testMain) async {
  sqfliteFfiInit();
  databaseFactory = databaseFactoryFfi;
  await testMain();
}

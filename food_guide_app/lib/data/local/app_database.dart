import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

/// Local SQLite (§29.1 encryption path TBD). MVP: plaintext DB in app support dir.
class AppDatabase {
  AppDatabase._();

  static final AppDatabase instance = AppDatabase._();

  Database? _db;

  Database get db {
    final d = _db;
    if (d == null) {
      throw StateError('AppDatabase.open() not called');
    }
    return d;
  }

  /// Bump on schema changes; keep [onUpgrade] in sync.
  static const _version = 6;

  Future<void> open() async {
    if (kIsWeb) {
      throw UnsupportedError('Food Guide App targets iOS and Android (GS-FOOD3 §11), not web.');
    }
    if (_db != null) return;
    final dir = await getApplicationSupportDirectory();
    final path = p.join(dir.path, 'food_guide.db');
    _db = await openDatabase(
      path,
      version: _version,
      onCreate: (db, version) async {
        await _createV1(db);
        await _createV2(db);
        await _createV3(db);
        await _createV4(db);
        await _createV5(db);
        await _createV6(db);
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        if (oldVersion < 2) {
          await _createV2(db);
        }
        if (oldVersion < 3) {
          await _createV3(db);
        }
        if (oldVersion < 4) {
          await _createV4(db);
        }
        if (oldVersion < 5) {
          await _createV5(db);
        }
        if (oldVersion < 6) {
          await _createV6(db);
        }
      },
    );
  }

  static Future<void> _createV1(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS saved_items (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        detail TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS use_first_items (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        note TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    ''');
  }

  /// Open Food Facts product JSON cache (Phase 2).
  static Future<void> _createV2(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS product_cache (
        barcode TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL,
        fetched_at INTEGER NOT NULL,
        etag TEXT
      )
    ''');
  }

  /// Signed pack install history for rollback metadata (Phase 3).
  static Future<void> _createV3(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS pack_installations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL,
        content_sha256 TEXT NOT NULL,
        applied_at INTEGER NOT NULL,
        prev_version TEXT,
        pack_path TEXT NOT NULL,
        status TEXT NOT NULL
      )
    ''');
  }

  /// Optional: coarse classifier last run (debug / UX).
  static Future<void> _createV4(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS perception_debug (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    ''');
  }

  /// Rule engine decision traces (uplift U1).
  static Future<void> _createV5(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS decision_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trace_id TEXT NOT NULL,
        capture_kind TEXT NOT NULL,
        input_summary TEXT NOT NULL,
        answer_headline TEXT,
        payload_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    ''');
  }

  /// Recall cache (uplift U6).
  static Future<void> _createV6(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS recall_cache (
        recall_id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        url TEXT,
        fetched_at INTEGER NOT NULL,
        raw_json TEXT NOT NULL
      )
    ''');
  }

  Future<void> close() async {
    await _db?.close();
    _db = null;
  }
}

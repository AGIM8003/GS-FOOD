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
  static const _version = 9;

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
        await _createV7(db);
        await _createV8(db);
        await _createV9(db);
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
        if (oldVersion < 7) {
          await _createV7(db);
        }
        if (oldVersion < 8) {
          await _createV8(db);
        }
        if (oldVersion < 9) {
          await _createV9(db);
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

  /// Real inventory items (V4 production upgrade).
  static Future<void> _createV7(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        storage_location TEXT NOT NULL DEFAULT 'fridge',
        quantity REAL NOT NULL DEFAULT 1.0,
        unit TEXT NOT NULL DEFAULT 'item',
        added_at INTEGER NOT NULL,
        expiry_date INTEGER,
        opened INTEGER NOT NULL DEFAULT 0,
        opened_at INTEGER,
        confidence REAL NOT NULL DEFAULT 1.0,
        barcode TEXT,
        notes TEXT NOT NULL DEFAULT '',
        icon_code_point INTEGER
      )
    ''');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory_items(expiry_date)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory_items(storage_location)');
  }

  /// Meal plans, shopping, and preferences (V4 production upgrade).
  static Future<void> _createV8(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS meal_plans (
        id TEXT PRIMARY KEY,
        week_start INTEGER NOT NULL
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS day_plans (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL,
        date INTEGER NOT NULL,
        FOREIGN KEY (plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS meal_slots (
        id TEXT PRIMARY KEY,
        day_plan_id TEXT NOT NULL,
        slot_type TEXT NOT NULL DEFAULT 'dinner',
        recipe_id TEXT,
        recipe_title TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (day_plan_id) REFERENCES day_plans(id) ON DELETE CASCADE
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS shopping_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        quantity TEXT NOT NULL DEFAULT '',
        unit TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT '',
        wave TEXT NOT NULL DEFAULT 'midWeek',
        checked INTEGER NOT NULL DEFAULT 0,
        reason TEXT NOT NULL DEFAULT '',
        linked_meal_id TEXT,
        linked_meal_title TEXT,
        added_at INTEGER NOT NULL
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS user_preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    ''');
  }

  /// Premium Stitch features (V5 production upgrade).
  static Future<void> _createV9(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS wine_inventory (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT '',
        vintage TEXT NOT NULL DEFAULT '',
        region TEXT NOT NULL DEFAULT '',
        pairing_notes TEXT NOT NULL DEFAULT '',
        quantity INTEGER NOT NULL DEFAULT 1,
        added_at INTEGER NOT NULL
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS sustainability_logs (
        id TEXT PRIMARY KEY,
        action_type TEXT NOT NULL,
        waste_saved_kg REAL NOT NULL DEFAULT 0.0,
        carbon_neutralized_kg REAL NOT NULL DEFAULT 0.0,
        money_saved REAL NOT NULL DEFAULT 0.0,
        logged_at INTEGER NOT NULL
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS community_posts (
        id TEXT PRIMARY KEY,
        chef_name TEXT NOT NULL,
        chef_avatar_url TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        likes INTEGER NOT NULL DEFAULT 0,
        posted_at INTEGER NOT NULL
      )
    ''');
  }

  Future<void> close() async {
    await _db?.close();
    _db = null;
  }
}

import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

import '../local/app_database.dart';

class SavedItem {
  SavedItem({
    required this.id,
    required this.title,
    required this.detail,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String detail;
  final DateTime createdAt;

  static SavedItem fromMap(Map<String, Object?> m) {
    return SavedItem(
      id: m['id']! as String,
      title: m['title']! as String,
      detail: m['detail']! as String,
      createdAt: DateTime.fromMillisecondsSinceEpoch(m['created_at']! as int),
    );
  }
}

class SavedRepository {
  SavedRepository(this._db);

  final AppDatabase _db;

  static final _uuid = Uuid();

  Database get _database => _db.db;

  Future<List<SavedItem>> listRecent({int limit = 100}) async {
    final rows = await _database.query(
      'saved_items',
      orderBy: 'created_at DESC',
      limit: limit,
    );
    return rows.map(SavedItem.fromMap).toList();
  }

  Future<void> addBarcodeScan(String rawValue) async {
    final id = _uuid.v4();
    await _database.insert('saved_items', {
      'id': id,
      'title': 'Barcode',
      'detail': rawValue,
      'created_at': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Future<void> addNote({required String title, required String detail}) async {
    final id = _uuid.v4();
    await _database.insert('saved_items', {
      'id': id,
      'title': title,
      'detail': detail,
      'created_at': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Future<void> delete(String id) async {
    await _database.delete('saved_items', where: 'id = ?', whereArgs: [id]);
  }
}

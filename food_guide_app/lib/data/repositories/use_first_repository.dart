import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

import '../local/app_database.dart';

class UseFirstEntry {
  UseFirstEntry({
    required this.id,
    required this.label,
    required this.note,
    required this.sortOrder,
    required this.createdAt,
  });

  final String id;
  final String label;
  final String note;
  final int sortOrder;
  final DateTime createdAt;

  static UseFirstEntry fromMap(Map<String, Object?> m) {
    return UseFirstEntry(
      id: m['id']! as String,
      label: m['label']! as String,
      note: m['note']! as String,
      sortOrder: m['sort_order']! as int,
      createdAt: DateTime.fromMillisecondsSinceEpoch(m['created_at']! as int),
    );
  }
}

class UseFirstRepository {
  UseFirstRepository(this._db);

  final AppDatabase _db;

  static final _uuid = Uuid();

  Database get _database => _db.db;

  Future<List<UseFirstEntry>> listOrdered() async {
    final rows = await _database.query(
      'use_first_items',
      orderBy: 'sort_order ASC, created_at ASC',
    );
    return rows.map(UseFirstEntry.fromMap).toList();
  }

  Future<void> seedDemoIfEmpty() async {
    final c = Sqflite.firstIntValue(
      await _database.rawQuery('SELECT COUNT(*) FROM use_first_items'),
    );
    if (c != null && c > 0) return;
    final now = DateTime.now().millisecondsSinceEpoch;
    await _database.insert('use_first_items', {
      'id': _uuid.v4(),
      'label': 'Cut vegetables',
      'note': 'Use within ~2 days when refrigerated (example)',
      'sort_order': 0,
      'created_at': now,
    });
    await _database.insert('use_first_items', {
      'id': _uuid.v4(),
      'label': 'Opened milk',
      'note': 'Check pack dates — label wins (§4)',
      'sort_order': 1,
      'created_at': now,
    });
  }

  Future<void> add({required String label, required String note}) async {
    final maxOrder = Sqflite.firstIntValue(
          await _database.rawQuery('SELECT MAX(sort_order) FROM use_first_items'),
        ) ??
        -1;
    await _database.insert('use_first_items', {
      'id': _uuid.v4(),
      'label': label,
      'note': note,
      'sort_order': maxOrder + 1,
      'created_at': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Future<void> delete(String id) async {
    await _database.delete('use_first_items', where: 'id = ?', whereArgs: [id]);
  }
}

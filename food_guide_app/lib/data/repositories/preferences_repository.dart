import 'package:sqflite/sqflite.dart';
import '../local/app_database.dart';
import '../../engine/models/user_preferences.dart';

/// Real preferences repository — replaces non-functional profile switches.
class PreferencesRepository {
  PreferencesRepository(this._db);
  final AppDatabase _db;

  Database get _d => _db.db;

  static const _table = 'user_preferences';

  Future<void> save(UserPreferences prefs) async {
    final map = prefs.toMap();
    for (final entry in map.entries) {
      await _d.insert(
        _table,
        {'key': entry.key, 'value': entry.value.toString()},
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
  }

  Future<UserPreferences> load() async {
    final rows = await _d.query(_table);
    if (rows.isEmpty) return UserPreferences();
    final map = <String, dynamic>{};
    for (final row in rows) {
      final key = row['key'] as String;
      final value = row['value'] as String;
      // Convert back to proper types
      if (value == '0' || value == '1') {
        map[key] = int.parse(value);
      } else if (int.tryParse(value) != null) {
        map[key] = int.parse(value);
      } else {
        map[key] = value;
      }
    }
    return UserPreferences.fromMap(map);
  }



  Future<void> setLastRevaluationTime(int ms) async {
    await _d.insert(
      _table,
      {'key': 'last_reval_time', 'value': ms.toString()},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<int> getLastRevaluationTime() async {
    final rows = await _d.query(_table, where: 'key = ?', whereArgs: ['last_reval_time']);
    if (rows.isEmpty) return 0;
    return int.tryParse(rows.first['value'] as String) ?? 0;
  }

  /// LEVEL B: SUPPORT LAYER - Bounded, decaying behavioral memory ingestion
  /// Tracks maximum 20 concepts safely. Old habits drop off automatically.
  Future<void> recordAffinity(String term, bool positive) async {
    final prefs = await load();
    term = term.trim().toLowerCase();
    if (term.isEmpty) return;

    List<String> list = positive
        ? List<String>.from(prefs.positiveAffinities)
        : List<String>.from(prefs.negativeAffinities);

    // LRU: If it already exists, remove it so it can jump to the front
    list.removeWhere((item) => item.toLowerCase() == term);
    
    // Front-insert (Freshest memory first)
    list.insert(0, term);
    
    // Bounded hard cap to 20 concepts (Support Layer: prevents bloat, enforces decay)
    if (list.length > 20) {
      list = list.sublist(0, 20);
    }

    final key = positive ? 'positive_affinities' : 'negative_affinities';
    await _d.insert(
      _table,
      {'key': key, 'value': list.join(',')},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }
}

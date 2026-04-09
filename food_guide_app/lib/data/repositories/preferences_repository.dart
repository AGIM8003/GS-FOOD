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

  Future<void> setChefPersona(String personaId) async {
    await _d.insert(
      _table,
      {'key': 'chef_persona_id', 'value': personaId},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> setHighProtein(bool value) async {
    await _d.insert(
      _table,
      {'key': 'high_protein', 'value': value ? '1' : '0'},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> setLowSodium(bool value) async {
    await _d.insert(
      _table,
      {'key': 'low_sodium', 'value': value ? '1' : '0'},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> setFamilySafe(bool value) async {
    await _d.insert(
      _table,
      {'key': 'family_safe', 'value': value ? '1' : '0'},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> setAllergens(List<String> allergens) async {
    await _d.insert(
      _table,
      {'key': 'allergens', 'value': allergens.join(',')},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> setLanguage(String lang) async {
    await _d.insert(
      _table,
      {'key': 'language', 'value': lang},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> setRitualProtocol(String protocol) async {
    await _d.insert(
      _table,
      {'key': 'active_ritual_protocol', 'value': protocol},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> setMedicalConditions(List<String> conditions) async {
    await _d.insert(
      _table,
      {'key': 'active_medical_conditions', 'value': conditions.join(',')},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }
}

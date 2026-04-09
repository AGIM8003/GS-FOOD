import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';
import '../local/app_database.dart';
import '../../engine/models/shopping_item.dart';

/// Real shopping list repository — replaces hardcoded wave data in ShopPage.
class ShoppingRepository {
  ShoppingRepository(this._db);
  final AppDatabase _db;
  static const _uuid = Uuid();

  Database get _d => _db.db;

  Future<String> addItem(ShoppingItem item) async {
    final id = item.id.isEmpty ? _uuid.v4() : item.id;
    final newItem = ShoppingItem(
      id: id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      wave: item.wave,
      checked: item.checked,
      reason: item.reason,
      linkedMealId: item.linkedMealId,
      linkedMealTitle: item.linkedMealTitle,
      addedAt: item.addedAt,
    );
    await _d.insert('shopping_items', newItem.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    return id;
  }

  Future<void> updateItem(ShoppingItem item) async {
    await _d.update('shopping_items', item.toMap(), where: 'id = ?', whereArgs: [item.id]);
  }

  Future<void> deleteItem(String id) async {
    await _d.delete('shopping_items', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> toggleChecked(String id) async {
    final rows = await _d.query('shopping_items', where: 'id = ?', whereArgs: [id]);
    if (rows.isEmpty) return;
    final current = (rows.first['checked'] as int?) == 1;
    await _d.update('shopping_items', {'checked': current ? 0 : 1}, where: 'id = ?', whereArgs: [id]);
  }

  Future<List<ShoppingItem>> getAll() async {
    final rows = await _d.query('shopping_items', orderBy: 'wave ASC, added_at ASC');
    return rows.map((m) => ShoppingItem.fromMap(m)).toList();
  }

  Future<List<ShoppingItem>> getByWave(ShoppingWave wave) async {
    final rows = await _d.query('shopping_items', where: 'wave = ?', whereArgs: [wave.name], orderBy: 'added_at ASC');
    return rows.map((m) => ShoppingItem.fromMap(m)).toList();
  }

  Future<List<ShoppingItem>> getUnchecked() async {
    final rows = await _d.query('shopping_items', where: 'checked = 0', orderBy: 'wave ASC, added_at ASC');
    return rows.map((m) => ShoppingItem.fromMap(m)).toList();
  }

  Future<void> clearChecked() async {
    await _d.delete('shopping_items', where: 'checked = 1');
  }

  Future<Map<ShoppingWave, List<ShoppingItem>>> getGroupedByWave() async {
    final all = await getAll();
    final grouped = <ShoppingWave, List<ShoppingItem>>{};
    for (final wave in ShoppingWave.values) {
      grouped[wave] = all.where((i) => i.wave == wave).toList();
    }
    return grouped;
  }

  Future<int> get count async {
    final result = await _d.rawQuery('SELECT COUNT(*) as c FROM shopping_items');
    return Sqflite.firstIntValue(result) ?? 0;
  }
}

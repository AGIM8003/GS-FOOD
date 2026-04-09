import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';
import '../local/app_database.dart';
import '../../engine/models/inventory_item.dart';

/// Real inventory repository — replaces ALL mock inventory data in screens.
class InventoryRepository {
  InventoryRepository(this._db);
  final AppDatabase _db;
  static const _table = 'inventory_items';
  static const _uuid = Uuid();

  Database get _d => _db.db;

  Future<String> addItem(InventoryItem item) async {
    final id = item.id.isEmpty ? _uuid.v4() : item.id;
    final newItem = InventoryItem(
      id: id,
      name: item.name,
      category: item.category,
      storageLocation: item.storageLocation,
      quantity: item.quantity,
      unit: item.unit,
      addedAt: item.addedAt,
      expiryDate: item.expiryDate,
      opened: item.opened,
      openedAt: item.openedAt,
      confidence: item.confidence,
      barcode: item.barcode,
      notes: item.notes,
      iconCodePoint: item.iconCodePoint,
    );
    await _d.insert(_table, newItem.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    return id;
  }

  Future<void> updateItem(InventoryItem item) async {
    await _d.update(_table, item.toMap(), where: 'id = ?', whereArgs: [item.id]);
  }

  Future<void> deleteItem(String id) async {
    await _d.delete(_table, where: 'id = ?', whereArgs: [id]);
  }

  Future<List<InventoryItem>> getAll() async {
    final rows = await _d.query(_table, orderBy: 'expiry_date ASC');
    return rows.map((m) => InventoryItem.fromMap(m)).toList();
  }

  Future<List<InventoryItem>> getByLocation(StorageLocation location) async {
    final rows = await _d.query(_table, where: 'storage_location = ?', whereArgs: [location.name], orderBy: 'expiry_date ASC');
    return rows.map((m) => InventoryItem.fromMap(m)).toList();
  }

  /// Items expiring within [days] days (sorted by urgency).
  Future<List<InventoryItem>> getExpiringSoon({int days = 5}) async {
    final cutoff = DateTime.now().add(Duration(days: days)).millisecondsSinceEpoch;
    final rows = await _d.query(
      _table,
      where: 'expiry_date IS NOT NULL AND expiry_date <= ?',
      whereArgs: [cutoff],
      orderBy: 'expiry_date ASC',
    );
    return rows.map((m) => InventoryItem.fromMap(m)).toList();
  }

  /// Items already expired.
  Future<List<InventoryItem>> getExpired() async {
    final now = DateTime.now().millisecondsSinceEpoch;
    final rows = await _d.query(
      _table,
      where: 'expiry_date IS NOT NULL AND expiry_date <= ?',
      whereArgs: [now],
      orderBy: 'expiry_date ASC',
    );
    return rows.map((m) => InventoryItem.fromMap(m)).toList();
  }

  /// All items sorted by urgency (critical first).
  Future<List<InventoryItem>> getAllByUrgency() async {
    final all = await getAll();
    all.sort((a, b) => a.urgencyScore.compareTo(b.urgencyScore));
    return all;
  }

  /// All item names for matching against recipes.
  Future<List<String>> getIngredientNames() async {
    final rows = await _d.query(_table, columns: ['name']);
    return rows.map((r) => r['name'] as String).toList();
  }

  Future<int> get count async {
    final result = await _d.rawQuery('SELECT COUNT(*) as c FROM $_table');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  /// Mark item as opened (reduces shelf life).
  Future<void> markOpened(String id) async {
    await _d.update(
      _table,
      {'opened': 1, 'opened_at': DateTime.now().millisecondsSinceEpoch},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  /// Reduce quantity (partial use).
  Future<void> reduceQuantity(String id, double amount) async {
    final rows = await _d.query(_table, where: 'id = ?', whereArgs: [id]);
    if (rows.isEmpty) return;
    final item = InventoryItem.fromMap(rows.first);
    final newQty = item.quantity - amount;
    if (newQty <= 0) {
      await deleteItem(id);
    } else {
      await _d.update(_table, {'quantity': newQty}, where: 'id = ?', whereArgs: [id]);
    }
  }
}

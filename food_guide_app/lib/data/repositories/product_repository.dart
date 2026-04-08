import 'dart:convert';

import 'package:openfoodfacts/openfoodfacts.dart';
import 'package:sqflite/sqflite.dart';

import '../local/app_database.dart';

/// Open Food Facts with SQLite cache + stale-while-revalidate (Phase 2).
class ProductRepository {
  ProductRepository(this._db);

  final AppDatabase _db;

  Database get _database => _db.db;

  static const _staleDuration = Duration(days: 7);

  /// Cached JSON string or null if unknown / error.
  Future<CachedProduct?> getByBarcode(String barcode) async {
    final normalized = barcode.trim();
    if (normalized.isEmpty) return null;

    final row = await _database.query(
      'product_cache',
      where: 'barcode = ?',
      whereArgs: [normalized],
      limit: 1,
    );
    if (row.isNotEmpty) {
      final fetchedAt = DateTime.fromMillisecondsSinceEpoch(row.first['fetched_at']! as int);
      final payload = row.first['payload_json']! as String;
      final age = DateTime.now().difference(fetchedAt);
      if (age < _staleDuration) {
        return CachedProduct(barcode: normalized, payloadJson: payload, stale: false, source: 'cache');
      }
    }

    try {
      final query = ProductQueryConfiguration(
        normalized,
        language: OpenFoodFactsLanguage.ENGLISH,
        fields: [ProductField.ALL],
        version: ProductQueryVersion.v3,
      );
      final result = await OpenFoodAPIClient.getProductV3(query);
      if (result.status != ProductResultV3.statusSuccess || result.product == null) {
        return row.isEmpty
            ? null
            : CachedProduct(
                barcode: normalized,
                payloadJson: row.first['payload_json']! as String,
                stale: true,
                source: 'cache_stale',
              );
      }
      final map = _productToMap(result.product!);
      final jsonStr = json.encode(map);
      await _database.insert(
        'product_cache',
        {
          'barcode': normalized,
          'payload_json': jsonStr,
          'fetched_at': DateTime.now().millisecondsSinceEpoch,
          'etag': null,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
      return CachedProduct(barcode: normalized, payloadJson: jsonStr, stale: false, source: 'network');
    } on Exception {
      if (row.isEmpty) return null;
      return CachedProduct(
        barcode: normalized,
        payloadJson: row.first['payload_json']! as String,
        stale: true,
        source: 'cache_stale',
      );
    }
  }

  static Map<String, Object?> _productToMap(Product product) {
    return <String, Object?>{
      'barcode': product.barcode,
      'productName': product.productName,
      'brands': product.brands,
      'ingredientsText': product.ingredientsText,
      'allergens': product.allergens?.ids,
      'nutriscore': product.nutriscore,
    };
  }
}

class CachedProduct {
  CachedProduct({
    required this.barcode,
    required this.payloadJson,
    required this.stale,
    required this.source,
  });

  final String barcode;
  final String payloadJson;
  final bool stale;
  final String source;
}

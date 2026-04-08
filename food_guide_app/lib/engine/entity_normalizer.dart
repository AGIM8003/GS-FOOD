import 'dart:convert';

import '../data/pack/bundled_pack_reader.dart';
import '../data/repositories/product_repository.dart';
import 'capture_context.dart';
import 'entities.dart';

/// Maps cache / packs / keywords → [NormalizedEntity].
class EntityNormalizer {
  EntityNormalizer({BundledPackReader? packReader}) : _packReader = packReader ?? BundledPackReader.instance;

  final BundledPackReader _packReader;

  static const allergenDisclaimer =
      'Allergen hints are informational only — not medical advice. Always read the label and consult a professional for allergies.';

  Future<NormalizedEntity?> normalize(
    CaptureContext ctx, {
    CachedProduct? cachedProduct,
  }) async {
    switch (ctx.kind) {
      case CaptureKind.barcode:
        final bc = ctx.barcode?.trim() ?? '';
        if (bc.isEmpty) return null;
        if (cachedProduct != null) {
          return NormalizedEntity.product(_productFromJson(bc, cachedProduct.payloadJson));
        }
        return NormalizedEntity.product(ProductEntity(barcode: bc));
      case CaptureKind.labelOcr:
        final t = ctx.ocrText?.trim() ?? '';
        if (t.isEmpty) return null;
        return _fromOcrOrAsk(t, ctx);
      case CaptureKind.askText:
        final t = ctx.rawText?.trim() ?? '';
        if (t.isEmpty) return null;
        return _fromOcrOrAsk(t, ctx);
      case CaptureKind.unknown:
        return null;
    }
  }

  ProductEntity _productFromJson(String barcode, String payloadJson) {
    try {
      final m = json.decode(payloadJson) as Map<String, dynamic>;
      final allergens = m['allergens'];
      final ids = <String>[];
      if (allergens is List) {
        for (final e in allergens) {
          ids.add(e.toString());
        }
      }
      return ProductEntity(
        barcode: barcode,
        productName: m['productName']?.toString(),
        ingredientsText: m['ingredientsText']?.toString(),
        allergenIds: ids,
        nutriscore: m['nutriscore']?.toString(),
      );
    } on Exception {
      return ProductEntity(barcode: barcode);
    }
  }

  Future<NormalizedEntity> _fromOcrOrAsk(String text, CaptureContext ctx) async {
    final lower = text.toLowerCase();
    final pack = await _packReader.loadDefaultPack();
    final hints = pack?['ontology_hints'];
    if (hints is Map) {
      for (final entry in hints.entries) {
        final key = entry.key.toString().toLowerCase();
        if (lower.contains(key)) {
          final v = entry.value;
          if (v is Map) {
            return NormalizedEntity.food(
              FoodEntity(
                canonicalKey: entry.key.toString(),
                displayName: entry.key.toString(),
                storageHint: v['storage']?.toString(),
                separateFrom: _stringList(v['separate_from']),
              ),
            );
          }
        }
      }
    }
    if (_mentionsTomato(lower)) {
      return NormalizedEntity.food(
        FoodEntity(
          canonicalKey: 'tomato',
          displayName: 'tomato',
          storageHint: 'whole: cool dry place; cut: fridge in a container',
          separateFrom: const ['ethylene_sensitive'],
        ),
      );
    }
    if (_mentionsMilk(lower)) {
      return NormalizedEntity.food(
        FoodEntity(
          canonicalKey: 'milk',
          displayName: 'milk',
          storageHint: 'refrigerate; use within date on pack',
          separateFrom: const [],
        ),
      );
    }
    return NormalizedEntity.text(text);
  }

  List<String> _stringList(dynamic v) {
    if (v is List) return v.map((e) => e.toString()).toList();
    return const [];
  }

  bool _mentionsTomato(String lower) =>
      lower.contains('tomato') || lower.contains('tomatoes');

  bool _mentionsMilk(String lower) =>
      lower.contains('milk') || lower.contains('dairy') && lower.contains('carton');
}

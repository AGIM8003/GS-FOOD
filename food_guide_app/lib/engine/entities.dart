/// Normalized product from OFF / cache (Phase 2 uplift).
class ProductEntity {
  ProductEntity({
    required this.barcode,
    this.productName,
    this.ingredientsText,
    this.allergenIds = const [],
    this.nutriscore,
  });

  final String barcode;
  final String? productName;
  final String? ingredientsText;
  final List<String> allergenIds;
  final String? nutriscore;

  bool get hasDeclaredAllergens => allergenIds.isNotEmpty;
}

/// Inferred or pack-driven food concept (ontology hint).
class FoodEntity {
  FoodEntity({
    required this.canonicalKey,
    this.displayName,
    this.storageHint,
    this.separateFrom = const [],
  });

  final String canonicalKey;
  final String? displayName;
  final String? storageHint;
  final List<String> separateFrom;
}

/// Union for rule engine input after normalization.
class NormalizedEntity {
  NormalizedEntity.product(this.product)
      : food = null,
        freeText = null;

  NormalizedEntity.food(this.food)
      : product = null,
        freeText = null;

  NormalizedEntity.text(this.freeText)
      : product = null,
        food = null;

  final ProductEntity? product;
  final FoodEntity? food;
  final String? freeText;
}

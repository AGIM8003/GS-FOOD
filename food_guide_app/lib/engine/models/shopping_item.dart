/// Production shopping item model with wave assignment and meal dependency.
enum ShoppingWave {
  buyNow,     // Needed within 1–3 days
  midWeek,    // Needed in 4–7 days, or perishable timing
  bulkRestock; // Stable goods, can wait for sales

  String get displayName {
    switch (this) {
      case ShoppingWave.buyNow: return 'Buy Now';
      case ShoppingWave.midWeek: return 'Mid-Week';
      case ShoppingWave.bulkRestock: return 'Bulk Restock';
    }
  }

  String get description {
    switch (this) {
      case ShoppingWave.buyNow: return 'Required for upcoming meals';
      case ShoppingWave.midWeek: return 'Schedule for peak freshness';
      case ShoppingWave.bulkRestock: return 'Stable goods — wait for best price';
    }
  }

  int get sortOrder {
    switch (this) {
      case ShoppingWave.buyNow: return 0;
      case ShoppingWave.midWeek: return 1;
      case ShoppingWave.bulkRestock: return 2;
    }
  }

  static ShoppingWave fromString(String s) {
    for (final w in ShoppingWave.values) {
      if (w.name == s) return w;
    }
    return ShoppingWave.midWeek;
  }
}

class ShoppingItem {
  ShoppingItem({
    required this.id,
    required this.name,
    this.quantity = '',
    this.unit = '',
    this.category = '',
    this.wave = ShoppingWave.midWeek,
    this.checked = false,
    this.reason = '',
    this.linkedMealId,
    this.linkedMealTitle,
    required this.addedAt,
  });

  final String id;
  final String name;
  final String quantity;
  final String unit;
  final String category;
  final ShoppingWave wave;
  final bool checked;
  final String reason; // "Why this?" explainability
  final String? linkedMealId;
  final String? linkedMealTitle;
  final DateTime addedAt;

  String get displayQuantity {
    if (quantity.isEmpty && unit.isEmpty) return '';
    if (unit.isEmpty) return quantity;
    return '$quantity $unit';
  }

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'quantity': quantity,
    'unit': unit,
    'category': category,
    'wave': wave.name,
    'checked': checked ? 1 : 0,
    'reason': reason,
    'linked_meal_id': linkedMealId,
    'linked_meal_title': linkedMealTitle,
    'added_at': addedAt.millisecondsSinceEpoch,
  };

  factory ShoppingItem.fromMap(Map<String, dynamic> m) => ShoppingItem(
    id: m['id'] as String,
    name: m['name'] as String,
    quantity: (m['quantity'] as String?) ?? '',
    unit: (m['unit'] as String?) ?? '',
    category: (m['category'] as String?) ?? '',
    wave: ShoppingWave.fromString((m['wave'] as String?) ?? 'midWeek'),
    checked: (m['checked'] as int?) == 1,
    reason: (m['reason'] as String?) ?? '',
    linkedMealId: m['linked_meal_id'] as String?,
    linkedMealTitle: m['linked_meal_title'] as String?,
    addedAt: DateTime.fromMillisecondsSinceEpoch(m['added_at'] as int),
  );

  ShoppingItem copyWith({
    String? name,
    String? quantity,
    String? unit,
    String? category,
    ShoppingWave? wave,
    bool? checked,
    String? reason,
  }) => ShoppingItem(
    id: id,
    name: name ?? this.name,
    quantity: quantity ?? this.quantity,
    unit: unit ?? this.unit,
    category: category ?? this.category,
    wave: wave ?? this.wave,
    checked: checked ?? this.checked,
    reason: reason ?? this.reason,
    linkedMealId: linkedMealId,
    linkedMealTitle: linkedMealTitle,
    addedAt: addedAt,
  );
}

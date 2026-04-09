/// Production inventory item model with real expiry logic.
///
/// Replaces all hardcoded mock inventory data across screens.
enum StorageLocation {
  fridge,
  freezer,
  pantry,
  counter,
  spiceRack,
  other;

  String get displayName {
    switch (this) {
      case StorageLocation.fridge:
        return 'Fridge';
      case StorageLocation.freezer:
        return 'Freezer';
      case StorageLocation.pantry:
        return 'Pantry';
      case StorageLocation.counter:
        return 'Counter';
      case StorageLocation.spiceRack:
        return 'Spice Rack';
      case StorageLocation.other:
        return 'Other';
    }
  }

  static StorageLocation fromString(String s) {
    for (final loc in StorageLocation.values) {
      if (loc.name == s) return loc;
    }
    return StorageLocation.other;
  }
}

enum FreshnessState {
  fresh,    // > 5 days remaining
  warning,  // 3–5 days remaining
  critical, // 1–2 days remaining
  expired,  // 0 or past
  unknown;  // no expiry data

  bool get isUrgent => this == critical || this == expired;
}

class InventoryItem {
  InventoryItem({
    required this.id,
    required this.name,
    this.category = '',
    this.storageLocation = StorageLocation.fridge,
    this.quantity = 1.0,
    this.unit = 'item',
    required this.addedAt,
    this.expiryDate,
    this.opened = false,
    this.openedAt,
    this.confidence = 1.0,
    this.barcode,
    this.notes = '',
    this.iconCodePoint,
  });

  final String id;
  final String name;
  final String category;
  final StorageLocation storageLocation;
  final double quantity;
  final String unit;
  final DateTime addedAt;
  final DateTime? expiryDate;
  final bool opened;
  final DateTime? openedAt;
  final double confidence; // 0.0–1.0 — how sure we are about this item
  final String? barcode;
  final String notes;
  final int? iconCodePoint;

  // ── Computed Fields ──────────────────────────────────────────

  int? get daysRemaining {
    if (expiryDate == null) return null;
    return expiryDate!.difference(DateTime.now()).inDays;
  }

  FreshnessState get freshness {
    final days = daysRemaining;
    if (days == null) return FreshnessState.unknown;
    if (days <= 0) return FreshnessState.expired;
    if (days <= 2) return FreshnessState.critical;
    if (days <= 5) return FreshnessState.warning;
    return FreshnessState.fresh;
  }

  bool get isExpired => freshness == FreshnessState.expired;
  bool get isCritical => freshness == FreshnessState.critical;
  bool get isUrgent => freshness.isUrgent;

  /// Urgency score: lower = more urgent. Used for sort ordering.
  int get urgencyScore {
    final days = daysRemaining;
    if (days == null) return 999;
    if (days <= 0) return 0;
    return days;
  }

  /// Display string for remaining time
  String get expiryDisplayText {
    final days = daysRemaining;
    if (days == null) return 'No date';
    if (days < 0) return 'Expired ${-days} day${-days == 1 ? "" : "s"} ago';
    if (days == 0) return 'Expires today';
    if (days == 1) return '1 day left';
    return '$days days left';
  }

  String get quantityDisplay {
    if (quantity == quantity.roundToDouble() && quantity == quantity.toInt().toDouble()) {
      return '${quantity.toInt()} $unit';
    }
    return '${quantity.toStringAsFixed(1)} $unit';
  }

  // ── Persistence ──────────────────────────────────────────────

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'category': category,
    'storage_location': storageLocation.name,
    'quantity': quantity,
    'unit': unit,
    'added_at': addedAt.millisecondsSinceEpoch,
    'expiry_date': expiryDate?.millisecondsSinceEpoch,
    'opened': opened ? 1 : 0,
    'opened_at': openedAt?.millisecondsSinceEpoch,
    'confidence': confidence,
    'barcode': barcode,
    'notes': notes,
    'icon_code_point': iconCodePoint,
  };

  factory InventoryItem.fromMap(Map<String, dynamic> m) => InventoryItem(
    id: m['id'] as String,
    name: m['name'] as String,
    category: (m['category'] as String?) ?? '',
    storageLocation: StorageLocation.fromString((m['storage_location'] as String?) ?? 'other'),
    quantity: (m['quantity'] as num?)?.toDouble() ?? 1.0,
    unit: (m['unit'] as String?) ?? 'item',
    addedAt: DateTime.fromMillisecondsSinceEpoch(m['added_at'] as int),
    expiryDate: m['expiry_date'] != null ? DateTime.fromMillisecondsSinceEpoch(m['expiry_date'] as int) : null,
    opened: (m['opened'] as int?) == 1,
    openedAt: m['opened_at'] != null ? DateTime.fromMillisecondsSinceEpoch(m['opened_at'] as int) : null,
    confidence: (m['confidence'] as num?)?.toDouble() ?? 1.0,
    barcode: m['barcode'] as String?,
    notes: (m['notes'] as String?) ?? '',
    iconCodePoint: m['icon_code_point'] as int?,
  );

  InventoryItem copyWith({
    String? name,
    String? category,
    StorageLocation? storageLocation,
    double? quantity,
    String? unit,
    DateTime? expiryDate,
    bool? opened,
    DateTime? openedAt,
    double? confidence,
    String? barcode,
    String? notes,
    int? iconCodePoint,
  }) => InventoryItem(
    id: id,
    name: name ?? this.name,
    category: category ?? this.category,
    storageLocation: storageLocation ?? this.storageLocation,
    quantity: quantity ?? this.quantity,
    unit: unit ?? this.unit,
    addedAt: addedAt,
    expiryDate: expiryDate ?? this.expiryDate,
    opened: opened ?? this.opened,
    openedAt: openedAt ?? this.openedAt,
    confidence: confidence ?? this.confidence,
    barcode: barcode ?? this.barcode,
    notes: notes ?? this.notes,
    iconCodePoint: iconCodePoint ?? this.iconCodePoint,
  );
}

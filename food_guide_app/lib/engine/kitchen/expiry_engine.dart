import '../../app/services.dart';
import '../../data/repositories/inventory_repository.dart';
import '../../data/repositories/use_first_repository.dart';
import '../models/inventory_item.dart';

/// Deterministic expiry engine — real food safety logic.
///
/// Computes freshness, urgency, opened-item adjustments,
/// and storage-location-aware shelf life for production use.
class ExpiryEngine {
  /// Default shelf life in days when no expiry date is provided,
  /// keyed by storage location.
  static const Map<StorageLocation, int> _defaultShelfDays = {
    StorageLocation.fridge: 5,
    StorageLocation.freezer: 90,
    StorageLocation.pantry: 30,
    StorageLocation.counter: 3,
    StorageLocation.spiceRack: 365,
    StorageLocation.other: 7,
  };

  /// When an item is opened, its shelf life is typically reduced.
  /// These are multipliers (e.g., 0.5 = half the remaining time).
  static const Map<StorageLocation, double> _openedMultiplier = {
    StorageLocation.fridge: 0.5,
    StorageLocation.freezer: 0.3,
    StorageLocation.pantry: 0.4,
    StorageLocation.counter: 0.3,
    StorageLocation.spiceRack: 0.8,
    StorageLocation.other: 0.3,
  };

  /// Get estimated expiry date for an item without explicit expiry.
  DateTime estimateExpiry(InventoryItem item) {
    if (item.expiryDate != null) {
      // If opened, reduce remaining shelf life
      if (item.opened && item.openedAt != null) {
        final originalRemaining = item.expiryDate!.difference(item.openedAt!);
        final mult = _openedMultiplier[item.storageLocation] ?? 0.5;
        final adjustedRemaining = Duration(
          hours: (originalRemaining.inHours * mult).round(),
        );
        return item.openedAt!.add(adjustedRemaining);
      }
      return item.expiryDate!;
    }
    // Estimate from storage location defaults
    final defaultDays = _defaultShelfDays[item.storageLocation] ?? 7;
    final base = item.addedAt.add(Duration(days: defaultDays));
    if (item.opened && item.openedAt != null) {
      final mult = _openedMultiplier[item.storageLocation] ?? 0.5;
      final remaining = base.difference(item.openedAt!);
      return item.openedAt!.add(Duration(hours: (remaining.inHours * mult).round()));
    }
    return base;
  }

  /// Sort items by urgency (most urgent first).
  List<InventoryItem> sortByUrgency(List<InventoryItem> items) {
    final copy = List<InventoryItem>.from(items);
    copy.sort((a, b) => a.urgencyScore.compareTo(b.urgencyScore));
    return copy;
  }

  /// Get items that need immediate attention (expiring today or expired).
  List<InventoryItem> getCriticalItems(List<InventoryItem> items) {
    return items.where((i) => i.isUrgent).toList();
  }

  /// Get items in warning zone (3–5 days).
  List<InventoryItem> getWarningItems(List<InventoryItem> items) {
    return items.where((i) => i.freshness == FreshnessState.warning).toList();
  }

  /// Generate a human-readable rescue urgency message.
  String urgencyMessage(InventoryItem item) {
    final days = item.daysRemaining;
    if (days == null) return '${item.name} — no expiry date tracked.';
    if (days < 0) return '⚠️ ${item.name} expired ${-days} day${-days == 1 ? "" : "s"} ago. Check before using.';
    if (days == 0) return '🔴 ${item.name} expires TODAY. Use immediately or freeze.';
    if (days == 1) return '🟠 ${item.name} expires TOMORROW. Plan to use today.';
    if (days <= 3) return '🟡 ${item.name} expires in $days days. Consider using soon.';
    return '🟢 ${item.name} is fresh ($days days remaining).';
  }

  /// Storage guidance based on item properties.
  String storageGuidance(InventoryItem item) {
    if (item.opened) {
      switch (item.storageLocation) {
        case StorageLocation.fridge:
          return 'Opened — use within ${(_defaultShelfDays[StorageLocation.fridge]! * _openedMultiplier[StorageLocation.fridge]!).round()} days. Keep sealed.';
        case StorageLocation.pantry:
          return 'Opened — transfer to airtight container. Consider refrigerating.';
        case StorageLocation.counter:
          return 'Opened — use quickly. Most items should be refrigerated once opened.';
        default:
          return 'Opened item — monitor freshness closely.';
      }
    }
    switch (item.storageLocation) {
      case StorageLocation.fridge:
        return 'Store at 1–4°C. Keep away from raw meats.';
      case StorageLocation.freezer:
        return 'Store at -18°C or below. Label with freeze date.';
      case StorageLocation.pantry:
        return 'Cool, dry place. Away from direct sunlight.';
      case StorageLocation.counter:
        return 'Room temperature. Use within a few days.';
      case StorageLocation.spiceRack:
        return 'Cool, dry, dark location. Check potency yearly.';
      case StorageLocation.other:
        return 'Follow package instructions for best storage.';
    }
  }

  /// LEVEL A + B: Continuous Pantry Re-valuation 
  /// Triggers a full-sweep mathematical re-score. Skips if <12hr since last run.
  Future<void> runContinuousRevaluation() async {
    final prefs = AppServices.preferences;
    final lastRun = await prefs.getLastRevaluationTime();
    final now = DateTime.now().millisecondsSinceEpoch;
    
    // Support Level: Prevent redundant IO thrashing (12h cooldown)
    if (now - lastRun < (12 * 60 * 60 * 1000)) {
       return; 
    }
    
    final invRepo = AppServices.inventory;
    final useFirstRepo = AppServices.useFirst;
    
    final items = await invRepo.getAll();
    final activeUseFirst = await useFirstRepo.listOrdered();
    final existingRescueLabels = activeUseFirst.map((e) => e.label.toLowerCase()).toSet();
    
    for (var item in items) {
      bool needSave = false;
      
      // Calculate true estimated expiry bounds combining location and opened state
      if (item.expiryDate == null) {
        final computed = estimateExpiry(item);
        item = item.copyWith(expiryDate: computed);
        needSave = true;
      }
      
      // Persistent State Overwrite -> Fixes UI sorting native dependency
      if (needSave) {
        await invRepo.updateItem(item);
      }
      
      // Auto-Rescue Pathway (Is Critical / Expiring <= 2 days)
      if (item.isUrgent) {
         final targetLabel = 'Use ${item.name}';
         if (!existingRescueLabels.contains(targetLabel.toLowerCase())) {
            // Idempotent Rescue Insert
            await useFirstRepo.add(
              label: targetLabel, 
              note: 'Rescued by Auto-Valuation. ${urgencyMessage(item)}'
            );
            existingRescueLabels.add(targetLabel.toLowerCase());
         }
      }
    }
    
    await prefs.setLastRevaluationTime(now);
  }
}

import '../models/inventory_item.dart';
import '../models/shopping_item.dart';
import '../models/meal_plan.dart';

/// Deterministic shopping wave engine — computes staggered shopping lists.
///
/// Analyzes meal plans + current inventory to determine:
/// - What needs to be purchased
/// - When it should be purchased (wave timing)
/// - Why it's needed (linked to specific meals)
class ShoppingWaveEngine {
  /// Compute shopping items from a meal plan vs current inventory.
  ///
  /// Returns items organized by urgency wave:
  /// - Buy Now: needed within 1-3 days
  /// - Mid-Week: needed in 4-7 days, perishable timing matters
  /// - Bulk Restock: stable goods, can wait for sales
  List<ShoppingItem> computeShoppingList({
    required MealPlan plan,
    required List<InventoryItem> inventory,
    required List<String> requiredIngredients, // All ingredients needed for planned meals
  }) {
    final inventoryNames = inventory.map((i) => i.name.toLowerCase()).toSet();
    final now = DateTime.now();
    final items = <ShoppingItem>[];
    int counter = 0;

    for (final ingredient in requiredIngredients) {
      final lower = ingredient.toLowerCase();
      // Check if we already have it
      if (inventoryNames.any((inv) => inv.contains(lower) || lower.contains(inv))) {
        continue; // Already in pantry
      }

      // Classify into wave based on simple perishability heuristics
      final wave = _classifyWave(ingredient);
      final reason = _generateReason(ingredient, wave);

      items.add(ShoppingItem(
        id: 'computed_${counter++}',
        name: ingredient,
        wave: wave,
        reason: reason,
        addedAt: now,
      ));
    }

    // Sort by wave
    items.sort((a, b) => a.wave.sortOrder.compareTo(b.wave.sortOrder));
    return items;
  }

  /// Quick gap analysis: what's needed but not in pantry?
  List<String> findGaps(List<String> needed, List<InventoryItem> inventory) {
    final inventoryNames = inventory.map((i) => i.name.toLowerCase()).toSet();
    return needed.where((ingredient) {
      final lower = ingredient.toLowerCase();
      return !inventoryNames.any((inv) => inv.contains(lower) || lower.contains(inv));
    }).toList();
  }

  ShoppingWave _classifyWave(String ingredient) {
    final lower = ingredient.toLowerCase();

    // Highly perishable — buy close to use
    const perishable = ['milk', 'cream', 'yogurt', 'fresh', 'lettuce', 'spinach',
      'berries', 'strawberry', 'fish', 'seafood', 'shrimp', 'herbs', 'cilantro',
      'basil', 'parsley', 'avocado', 'banana', 'tomato'];
    if (perishable.any((p) => lower.contains(p))) return ShoppingWave.buyNow;

    // Moderate shelf life — mid-week
    const moderate = ['chicken', 'beef', 'pork', 'eggs', 'cheese', 'bread',
      'tortilla', 'tofu', 'mushroom', 'pepper', 'onion', 'carrot',
      'potato', 'apple', 'orange', 'lemon'];
    if (moderate.any((m) => lower.contains(m))) return ShoppingWave.midWeek;

    // Stable goods — can wait
    const stable = ['rice', 'pasta', 'flour', 'sugar', 'oil', 'vinegar',
      'canned', 'frozen', 'dry', 'spice', 'salt', 'soy sauce',
      'nuts', 'seeds', 'beans', 'lentil'];
    if (stable.any((s) => lower.contains(s))) return ShoppingWave.bulkRestock;

    // Default to mid-week
    return ShoppingWave.midWeek;
  }

  String _generateReason(String ingredient, ShoppingWave wave) {
    switch (wave) {
      case ShoppingWave.buyNow:
        return 'Highly perishable — buy close to when you need it for maximum freshness.';
      case ShoppingWave.midWeek:
        return 'Moderate shelf life. Purchase mid-week for planned meals.';
      case ShoppingWave.bulkRestock:
        return 'Stable pantry staple. Buy in bulk for best value.';
    }
  }
}

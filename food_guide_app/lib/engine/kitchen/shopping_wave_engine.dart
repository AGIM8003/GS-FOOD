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
    double calculatedHouseholdServings = 1.0,
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
        id: 'computed_${now.millisecondsSinceEpoch}_${counter++}',
        name: ingredient,
        quantity: 1.0 * calculatedHouseholdServings,
        wave: wave,
        source: ShoppingSource.deficit, // Explicit hard deficit
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

  /// LEVEL A + B: SMART CART INITIALIZATION (Predictive Shopping Wave)
  /// Looks across Rescue Engine signals (urgent inventory) and Learning Memory (positive affinities)
  /// to predict future needs before absolute depletion. 
  /// Support Layer implemented: Deduplication and stable item source tagging.
  List<ShoppingItem> generatePredictiveWave({
    required List<InventoryItem> inventory,
    required List<String> positiveAffinities,
    required List<ShoppingItem> activeShoppingList,
    double calculatedHouseholdServings = 1.0,
  }) {
    final now = DateTime.now();
    final items = <ShoppingItem>[];
    int counter = 0;

    // Support Layer deduplication: what is ALREADY in the cart?
    final activeNames = activeShoppingList.map((s) => s.name.toLowerCase()).toSet();
    final healthyInventoryNames = inventory
        .where((i) => !i.isUrgent && i.quantity > 0.2) // Only items that are safely stocked
        .map((i) => i.name.toLowerCase())
        .toSet();

    // SIGNAL 1: Rescue-Linked Restock (Items about to hit zero / going bad)
    for (final item in inventory.where((i) => i.isUrgent)) {
      final lower = item.name.toLowerCase();
      if (!activeNames.contains(lower)) {
        items.add(ShoppingItem(
          id: 'predictive_${now.millisecondsSinceEpoch}_${counter++}',
          name: item.name,
          category: item.category,
          quantity: 1.0 * calculatedHouseholdServings,
          wave: _classifyWave(item.name),
          source: ShoppingSource.rescueLinked,
          predictiveScore: item.daysRemaining != null ? (1.0 / (item.daysRemaining! + 1)) : 0.5,
          reason: 'Predicted Restock: Current supply is rapidly expiring and marked for Rescue.',
          addedAt: now,
        ));
        activeNames.add(lower);
      }
    }

    // SIGNAL 2: Memory-Driven Soft Predictive Signals
    // Core staples associated with highly favored affinities
    final memoryMappables = _mapAffinitiesToStaples(positiveAffinities);
    for (final predictedStaple in memoryMappables) {
      final lower = predictedStaple.toLowerCase();
      if (!activeNames.contains(lower) && !healthyInventoryNames.contains(lower)) {
        items.add(ShoppingItem(
          id: 'predictive_${now.millisecondsSinceEpoch}_${counter++}',
          name: predictedStaple,
          quantity: 1.0 * calculatedHouseholdServings,
          wave: _classifyWave(predictedStaple),
          source: ShoppingSource.predictive,
          predictiveScore: 0.8,
          reason: 'Predicted Restock: Matches your repeated cooking patterns and favored taste affinities.',
          addedAt: now,
        ));
        activeNames.add(lower);
      }
    }

    // Sort by wave urgency
    items.sort((a, b) => a.wave.sortOrder.compareTo(b.wave.sortOrder));
    return items;
  }

  /// Maps abstract learning affinities to concrete prediction candidates
  List<String> _mapAffinitiesToStaples(List<String> affinities) {
    if (affinities.isEmpty) return [];
    final staples = <String>{};
    for (final affinity in affinities) {
      final a = affinity.toLowerCase();
      if (a.contains('mexican')) staples.addAll(['tortillas', 'cilantro', 'limes']);
      if (a.contains('italian')) staples.addAll(['olive oil', 'garlic', 'tomatoes', 'pasta']);
      if (a.contains('asian') || a.contains('japanese') || a.contains('chinese')) staples.addAll(['soy sauce', 'ginger', 'green onions']);
      if (a.contains('indian')) staples.addAll(['coconut milk', 'curry powder', 'onions']);
    }
    return staples.toList();
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

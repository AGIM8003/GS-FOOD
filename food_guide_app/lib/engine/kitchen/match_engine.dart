import '../models/inventory_item.dart';
import '../models/recipe.dart';

/// Deterministic recipe match engine — replaces all fake match percentages.
///
/// Scores recipes against current inventory and produces ranked results
/// with real explainability.
class MatchEngine {
  /// Score a single recipe against the available inventory.
  RecipeMatch scoreRecipe(Recipe recipe, List<InventoryItem> inventory) {
    final inventoryNames = inventory.map((i) => i.name.toLowerCase()).toSet();

    final available = <String>[];
    final missing = <String>[];

    for (final ingredient in recipe.ingredients) {
      if (ingredient.optional) continue; // Skip optional ingredients
      final name = ingredient.name.toLowerCase();
      if (inventoryNames.any((inv) => inv.contains(name) || name.contains(inv))) {
        available.add(ingredient.name);
      } else {
        missing.add(ingredient.name);
      }
    }

    final totalRequired = recipe.ingredients.where((i) => !i.optional).length;
    final matchPct = totalRequired == 0 ? 1.0 : available.length / totalRequired;

    // Determine match type
    RecipeMatchType matchType;
    String? rescueItem;
    String whyThis;

    // Check if this rescues an expiring item
    final rescueItems = inventory.where((i) => i.isUrgent).toList();
    final rescuedIngredient = rescueItems.firstWhere(
      (ri) => available.any((a) => a.toLowerCase().contains(ri.name.toLowerCase()) || ri.name.toLowerCase().contains(a.toLowerCase())),
      orElse: () => InventoryItem(id: '', name: '', addedAt: DateTime.now()),
    );

    if (rescuedIngredient.id.isNotEmpty) {
      matchType = RecipeMatchType.saveFoodRescue;
      rescueItem = rescuedIngredient.name;
      whyThis = 'Uses ${rescuedIngredient.name} which ${rescuedIngredient.expiryDisplayText.toLowerCase()}. Prevents waste.';
    } else if (matchPct >= 0.9) {
      matchType = RecipeMatchType.bestMatch;
      whyThis = missing.isEmpty
          ? 'You have all ingredients ready.'
          : 'You have ${available.length}/${totalRequired} ingredients. Only missing: ${missing.join(", ")}.';
    } else if (recipe.totalMinutes <= 20) {
      matchType = RecipeMatchType.quickMeal;
      whyThis = 'Quick ${recipe.timeDisplay} prep. ${available.length}/${totalRequired} ingredients available.';
    } else {
      matchType = RecipeMatchType.bestMatch;
      whyThis = '${available.length}/${totalRequired} ingredients available. Missing: ${missing.join(", ")}.';
    }

    return RecipeMatch(
      recipe: recipe,
      availableIngredients: available,
      missingIngredients: missing,
      matchPercentage: matchPct,
      matchType: matchType,
      whyThis: whyThis,
      rescueItem: rescueItem,
    );
  }

  /// Score and rank multiple recipes. Rescue matches first, then by match %.
  List<RecipeMatch> rankRecipes(List<Recipe> recipes, List<InventoryItem> inventory) {
    final scored = recipes.map((r) => scoreRecipe(r, inventory)).toList();
    scored.sort((a, b) {
      // Rescue matches always first
      if (a.isRescueMatch && !b.isRescueMatch) return -1;
      if (!a.isRescueMatch && b.isRescueMatch) return 1;
      // Then by match percentage descending
      return b.matchPercentage.compareTo(a.matchPercentage);
    });
    return scored;
  }

  /// Emergency offline recipe set — deterministic, no AI needed.
  List<Recipe> getEmergencyRecipes() {
    return [
      Recipe(
        id: 'emergency_1',
        title: 'Quick Pantry Stir-Fry',
        cuisine: 'General',
        prepMinutes: 5,
        cookMinutes: 10,
        ingredients: [
          const RecipeIngredient(name: 'Any vegetables', quantity: '2', unit: 'cups'),
          const RecipeIngredient(name: 'Oil', quantity: '1', unit: 'tbsp'),
          const RecipeIngredient(name: 'Soy sauce', quantity: '2', unit: 'tbsp', optional: true),
          const RecipeIngredient(name: 'Rice or noodles', quantity: '1', unit: 'serving', optional: true),
        ],
        instructions: ['Cut vegetables', 'Heat oil in pan', 'Stir-fry 5-8 minutes', 'Season and serve'],
        tags: ['quick', 'flexible', 'rescue'],
        source: 'fallback',
      ),
      Recipe(
        id: 'emergency_2',
        title: 'Egg Rescue Bowl',
        cuisine: 'Fast Family',
        prepMinutes: 2,
        cookMinutes: 8,
        ingredients: [
          const RecipeIngredient(name: 'Eggs', quantity: '2-3'),
          const RecipeIngredient(name: 'Butter or oil', quantity: '1', unit: 'tsp'),
          const RecipeIngredient(name: 'Any cheese', optional: true),
          const RecipeIngredient(name: 'Any herbs', optional: true),
        ],
        instructions: ['Beat eggs', 'Heat butter in pan', 'Cook eggs to preference', 'Add toppings and serve'],
        tags: ['quick', 'rescue', 'protein'],
        source: 'fallback',
      ),
      Recipe(
        id: 'emergency_3',
        title: 'Bread & Spread Plate',
        cuisine: 'Mediterranean',
        prepMinutes: 5,
        cookMinutes: 0,
        ingredients: [
          const RecipeIngredient(name: 'Bread', quantity: '2-4', unit: 'slices'),
          const RecipeIngredient(name: 'Any spread', quantity: '2', unit: 'tbsp'),
          const RecipeIngredient(name: 'Any fresh vegetables', optional: true),
        ],
        instructions: ['Toast bread if desired', 'Arrange with spreads and any available toppings'],
        tags: ['no-cook', 'rescue', 'quick'],
        source: 'fallback',
      ),
    ];
  }
}

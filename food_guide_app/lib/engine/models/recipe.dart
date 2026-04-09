/// Production recipe model with match scoring and explainability.
class Recipe {
  Recipe({
    required this.id,
    required this.title,
    this.cuisine = '',
    this.prepMinutes = 0,
    this.cookMinutes = 0,
    required this.ingredients,
    this.instructions = const [],
    this.servings = 2,
    this.tags = const [],
    this.source = '',
    this.imageUrl,
  });

  final String id;
  final String title;
  final String cuisine;
  final int prepMinutes;
  final int cookMinutes;
  final List<RecipeIngredient> ingredients;
  final List<String> instructions;
  final int servings;
  final List<String> tags;
  final String source; // 'ai', 'local', 'fallback'
  final String? imageUrl;

  int get totalMinutes => prepMinutes + cookMinutes;

  String get timeDisplay {
    if (totalMinutes <= 0) return 'Quick';
    if (totalMinutes < 60) return '${totalMinutes}m';
    final h = totalMinutes ~/ 60;
    final m = totalMinutes % 60;
    return m > 0 ? '${h}h ${m}m' : '${h}h';
  }
}

class RecipeIngredient {
  const RecipeIngredient({
    required this.name,
    this.quantity = '',
    this.unit = '',
    this.optional = false,
  });

  final String name;
  final String quantity;
  final String unit;
  final bool optional;

  String get displayText {
    final parts = <String>[];
    if (quantity.isNotEmpty) parts.add(quantity);
    if (unit.isNotEmpty) parts.add(unit);
    parts.add(name);
    if (optional) parts.add('(optional)');
    return parts.join(' ');
  }
}

/// Result of matching a recipe against current inventory.
class RecipeMatch {
  RecipeMatch({
    required this.recipe,
    required this.availableIngredients,
    required this.missingIngredients,
    required this.matchPercentage,
    this.matchType = RecipeMatchType.bestMatch,
    this.whyThis = '',
    this.rescueItem,
  });

  final Recipe recipe;
  final List<String> availableIngredients;
  final List<String> missingIngredients;
  final double matchPercentage; // 0.0–1.0
  final RecipeMatchType matchType;
  final String whyThis; // Explainability text
  final String? rescueItem; // If this is a save-food rescue match

  String get matchDisplay => '${(matchPercentage * 100).round()}% Match';

  bool get isFullMatch => missingIngredients.isEmpty;
  bool get isRescueMatch => matchType == RecipeMatchType.saveFoodRescue;
}

enum RecipeMatchType {
  saveFoodRescue,
  bestMatch,
  quickMeal,
  chefStyleMatch,
  healthPreference;

  String get displayName {
    switch (this) {
      case RecipeMatchType.saveFoodRescue:
        return 'Save Food';
      case RecipeMatchType.bestMatch:
        return 'Best Match';
      case RecipeMatchType.quickMeal:
        return 'Quick Meal';
      case RecipeMatchType.chefStyleMatch:
        return 'Chef Style';
      case RecipeMatchType.healthPreference:
        return 'Health Pick';
    }
  }
}

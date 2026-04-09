import '../models/inventory_item.dart';
import '../models/recipe.dart';
import '../models/user_preferences.dart';

/// Allergen guard, substitution safety, and health-language guard.
///
/// Replaces all fake safety surfaces with real production logic.
class SafetyGuard {
  /// Common allergen categories for family-safe mode.
  static const commonAllergens = [
    'peanut', 'tree nut', 'almond', 'walnut', 'cashew', 'pecan',
    'milk', 'dairy', 'lactose',
    'egg',
    'wheat', 'gluten',
    'soy', 'soya',
    'fish', 'shellfish', 'shrimp', 'crab', 'lobster',
    'sesame',
  ];

  /// Check if an ingredient triggers any user allergens.
  bool isAllergen(String ingredient, UserPreferences prefs) {
    if (prefs.allergens.isEmpty) return false;
    final lower = ingredient.toLowerCase();
    return prefs.allergens.any((a) => lower.contains(a.toLowerCase()));
  }

  /// Check recipe for allergen conflicts.
  AllergenCheckResult checkRecipe(Recipe recipe, UserPreferences prefs) {
    if (prefs.allergens.isEmpty) {
      return const AllergenCheckResult(safe: true, conflicts: [], warnings: []);
    }

    final conflicts = <String>[];
    final warnings = <String>[];

    for (final ingredient in recipe.ingredients) {
      if (isAllergen(ingredient.name, prefs)) {
        if (ingredient.optional) {
          warnings.add('${ingredient.name} (optional) may contain allergen — skip or substitute.');
        } else {
          conflicts.add('${ingredient.name} conflicts with your allergen profile.');
        }
      }
    }

    return AllergenCheckResult(
      safe: conflicts.isEmpty,
      conflicts: conflicts,
      warnings: warnings,
    );
  }

  /// Health language guard — non-clinical phrasing only.
  String guardHealthLanguage(String text) {
    // Replace any clinical/medical language with safe alternatives
    var safe = text;
    const replacements = {
      'diagnose': 'suggest',
      'prescribe': 'recommend',
      'cure': 'help with',
      'treatment': 'approach',
      'medical advice': 'general guidance',
      'clinical': 'wellness',
      'disease': 'condition',
      'symptom': 'sign',
    };
    for (final entry in replacements.entries) {
      safe = safe.replaceAll(RegExp(entry.key, caseSensitive: false), entry.value);
    }
    return safe;
  }

  /// Check if a substitution is safe given user allergens.
  bool isSubstitutionSafe(String original, String substitute, UserPreferences prefs) {
    // Must not replace with an allergen
    if (isAllergen(substitute, prefs)) return false;
    return true;
  }

  /// Standard food safety disclaimer.
  static const foodSafetyDisclaimer =
    'Food safety guidance is general. Always check packaging, smell, and appearance. '
    'When in doubt, discard. This app does not replace professional food safety advice.';

  /// Health guidance disclaimer.
  static const healthDisclaimer =
    'Nutritional information is estimated. This app does not provide medical advice, '
    'diagnosis, or treatment. Consult a healthcare professional for dietary concerns.';
}

class AllergenCheckResult {
  const AllergenCheckResult({
    required this.safe,
    required this.conflicts,
    required this.warnings,
  });

  final bool safe;
  final List<String> conflicts;
  final List<String> warnings;

  bool get hasWarnings => warnings.isNotEmpty;
  String get summary {
    if (safe && !hasWarnings) return 'Safe for your dietary profile.';
    if (safe && hasWarnings) return 'Generally safe. ${warnings.length} optional ingredient${warnings.length == 1 ? '' : 's'} to watch.';
    return '⚠️ ${conflicts.length} allergen conflict${conflicts.length == 1 ? '' : 's'} detected.';
  }
}

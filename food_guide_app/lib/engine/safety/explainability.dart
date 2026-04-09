import '../models/inventory_item.dart';
import '../models/recipe.dart';

/// Human-readable explainability engine — replaces fake "Why this?" labels.
///
/// Generates real, non-technical explanations for all recommendations,
/// blocks, urgency alerts, and fallback behaviors.
class Explainability {
  /// Why a recipe is recommended.
  String whyRecommended(RecipeMatch match) {
    if (match.whyThis.isNotEmpty) return match.whyThis;

    final parts = <String>[];
    if (match.isRescueMatch && match.rescueItem != null) {
      parts.add('Helps you use ${match.rescueItem} before it expires.');
    }
    if (match.isFullMatch) {
      parts.add('You have everything you need.');
    } else if (match.matchPercentage >= 0.7) {
      parts.add('You have most ingredients. Only missing: ${match.missingIngredients.join(", ")}.');
    }
    if (match.recipe.totalMinutes <= 20) {
      parts.add('Quick to prepare (${match.recipe.timeDisplay}).');
    }
    return parts.isEmpty ? 'Based on your kitchen inventory.' : parts.join(' ');
  }

  /// Why an item is blocked (allergen, safety).
  String whyBlocked(String itemName, String reason) {
    return 'Blocked: $itemName — $reason. This is for your safety based on your dietary profile.';
  }

  /// Why a missing ingredient matters.
  String whyMissingMatters(String ingredient, Recipe recipe) {
    return '$ingredient is needed for ${recipe.title}. Without it, the recipe may not work as intended.';
  }

  /// Why rescue is urgent.
  String whyRescueUrgent(InventoryItem item) {
    final days = item.daysRemaining;
    if (days == null) return '${item.name} has no tracked expiry date. Consider checking it.';
    if (days <= 0) return '${item.name} has expired. Check it carefully before using.';
    if (days == 1) return '${item.name} expires tomorrow! Use it today to avoid waste.';
    return '${item.name} expires in $days days. Plan to use it soon.';
  }

  /// Why a fallback happened.
  String whyFallback(String context) {
    switch (context) {
      case 'ai_unavailable':
        return 'Our AI helpers are temporarily unavailable. Using trusted kitchen knowledge instead.';
      case 'low_confidence':
        return 'We\'re not fully confident in this suggestion. Here\'s a safer alternative.';
      case 'provider_timeout':
        return 'The response took too long. Here\'s what we know from your kitchen data.';
      case 'no_internet':
        return 'You\'re offline. Using your saved recipes and kitchen knowledge.';
      default:
        return 'Using local kitchen knowledge for this suggestion.';
    }
  }

  /// Why a substitution is suggested.
  String whySubstitution(String original, String substitute) {
    return 'You don\'t have $original. $substitute works as a similar alternative.';
  }

  /// Shopping wave explanation.
  String whyShoppingWave(String itemName, String wave) {
    switch (wave) {
      case 'buyNow':
        return '$itemName is perishable — buy it fresh just before you need it.';
      case 'midWeek':
        return '$itemName has moderate shelf life. Mid-week purchase timing is ideal.';
      case 'bulkRestock':
        return '$itemName is a stable pantry staple. Buy in bulk for best value.';
      default:
        return 'Scheduled based on freshness and meal timing.';
    }
  }
}

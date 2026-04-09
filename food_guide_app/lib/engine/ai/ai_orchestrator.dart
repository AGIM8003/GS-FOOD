import 'dart:convert';
import 'llm_provider.dart';
import 'provider_registry.dart';
import '../persona/persona_engine.dart';
import '../kitchen/match_engine.dart';
import '../safety/safety_guard.dart';
import '../safety/explainability.dart';
import '../models/inventory_item.dart';
import '../models/recipe.dart';
import '../models/user_preferences.dart';

/// Production AI orchestrator — handles intent routing, skill selection,
/// context assembly, persona injection, and fallback chains.
///
/// This is the brain of the AI layer. It decides:
/// - What task is being asked
/// - Whether deterministic rules can answer without AI
/// - Which skill/tool is needed
/// - Which provider to use
/// - Whether confidence is high enough
/// - When to fall back safely
class AIOrchestrator {
  AIOrchestrator({
    required this.providers,
    required this.matchEngine,
    required this.safetyGuard,
    required this.explainability,
    required this.personaEngine,
  });

  final ProviderRegistry providers;
  final MatchEngine matchEngine;
  final SafetyGuard safetyGuard;
  final Explainability explainability;
  final PersonaEngine personaEngine;

  /// Process a user message and return an orchestrated response.
  Future<OrchestratedResponse> processMessage({
    required String userMessage,
    required List<InventoryItem> inventory,
    required UserPreferences preferences,
    List<RecipeMatch>? cachedMatches,
  }) async {
    // Step 1: Intent classification (deterministic first)
    final intent = _classifyIntent(userMessage);

    // Step 2: Check if deterministic logic can answer
    final deterministicAnswer = _tryDeterministic(intent, userMessage, inventory, preferences);
    if (deterministicAnswer != null) return deterministicAnswer;

    // Step 3: If AI is needed, build context and query
    if (!providers.hasAnyProvider) {
      return OrchestratedResponse(
        text: personaEngine.applyPersona(
          'I\'m working offline right now, so I\'ll use your kitchen data directly. ${_offlineFallback(intent, inventory, preferences)}',
          preferences.chefPersonaId,
        ),
        source: ResponseSource.deterministicFallback,
        confidence: 0.7,
        explanation: explainability.whyFallback('no_internet'),
      );
    }

    // Step 4: AI generation with persona
    try {
      final systemPrompt = personaEngine.buildSystemPrompt(preferences.chefPersonaId, inventory, preferences);
      final response = await providers.executeWithFailover(
        userMessage,
        systemPrompt: systemPrompt,
        config: {'temperature': 0.7, 'max_tokens': 512},
      );

      return OrchestratedResponse(
        text: safetyGuard.guardHealthLanguage(response.text),
        source: ResponseSource.aiGenerated,
        confidence: 0.85,
        providerUsed: response.provider,
      );
    } catch (_) {
      // Step 5: AI fallback — use deterministic
      return OrchestratedResponse(
        text: personaEngine.applyPersona(
          _offlineFallback(intent, inventory, preferences),
          preferences.chefPersonaId,
        ),
        source: ResponseSource.deterministicFallback,
        confidence: 0.6,
        explanation: explainability.whyFallback('ai_unavailable'),
      );
    }
  }

  /// Classify user intent from message.
  UserIntent _classifyIntent(String message) {
    final lower = message.toLowerCase();
    if (lower.contains('cook') || lower.contains('recipe') || lower.contains('make') || lower.contains('prepare')) {
      return UserIntent.cookSuggestion;
    }
    if (lower.contains('expir') || lower.contains('expire') || lower.contains('use first') || lower.contains('goes bad')) {
      return UserIntent.expiryCheck;
    }
    if (lower.contains('shop') || lower.contains('buy') || lower.contains('grocery') || lower.contains('need')) {
      return UserIntent.shoppingHelp;
    }
    if (lower.contains('store') || lower.contains('storage') || lower.contains('keep') || lower.contains('fridge') || lower.contains('freeze')) {
      return UserIntent.storageGuidance;
    }
    if (lower.contains('safe') || lower.contains('allergen') || lower.contains('allergy')) {
      return UserIntent.safetyCheck;
    }
    if (lower.contains('plan') || lower.contains('week') || lower.contains('meal plan')) {
      return UserIntent.mealPlanning;
    }
    if (lower.contains('substit') || lower.contains('replace') || lower.contains('instead of')) {
      return UserIntent.substitution;
    }
    return UserIntent.general;
  }

  /// Try to answer with deterministic rules (no AI needed).
  OrchestratedResponse? _tryDeterministic(
    UserIntent intent,
    String message,
    List<InventoryItem> inventory,
    UserPreferences prefs,
  ) {
    switch (intent) {
      case UserIntent.expiryCheck:
        final expiring = inventory.where((i) => i.isUrgent).toList();
        if (expiring.isEmpty) {
          return OrchestratedResponse(
            text: personaEngine.applyPersona(
              'Great news! Nothing in your kitchen is in urgent need of attention right now. Everything looks fresh.',
              prefs.chefPersonaId,
            ),
            source: ResponseSource.deterministic,
            confidence: 1.0,
          );
        }
        final items = expiring.map((i) => '• ${i.name}: ${i.expiryDisplayText}').join('\n');
        return OrchestratedResponse(
          text: personaEngine.applyPersona(
            'Here\'s what needs attention:\n$items\n\nWould you like me to suggest what to cook with these?',
            prefs.chefPersonaId,
          ),
          source: ResponseSource.deterministic,
          confidence: 1.0,
        );

      case UserIntent.safetyCheck:
        return OrchestratedResponse(
          text: personaEngine.applyPersona(
            'Your allergen profile: ${prefs.allergens.isEmpty ? "No allergens set" : prefs.allergens.join(", ")}. '
            'I always check ingredients against your profile before recommending recipes. '
            '${SafetyGuard.foodSafetyDisclaimer}',
            prefs.chefPersonaId,
          ),
          source: ResponseSource.deterministic,
          confidence: 1.0,
        );

      default:
        return null; // Needs AI
    }
  }

  String _offlineFallback(UserIntent intent, List<InventoryItem> inventory, UserPreferences prefs) {
    switch (intent) {
      case UserIntent.cookSuggestion:
        final recipes = matchEngine.getEmergencyRecipes();
        final matches = matchEngine.rankRecipes(recipes, inventory);
        if (matches.isNotEmpty) {
          final top = matches.first;
          return 'How about ${top.recipe.title}? ${top.whyThis}';
        }
        return 'Check your pantry for any protein and vegetables. A simple stir-fry or omelet is always reliable.';
      case UserIntent.expiryCheck:
        final expiring = inventory.where((i) => i.isUrgent).toList();
        if (expiring.isEmpty) return 'Everything in your pantry looks good!';
        return 'These items need attention: ${expiring.map((i) => i.name).join(", ")}';
      default:
        return 'I\'m working with limited capabilities right now. Try asking about what to cook, what\'s expiring, or how to store something.';
    }
  }
}

enum UserIntent {
  cookSuggestion,
  expiryCheck,
  shoppingHelp,
  storageGuidance,
  safetyCheck,
  mealPlanning,
  substitution,
  general,
}

enum ResponseSource {
  deterministic,         // Answered by rules only
  deterministicFallback, // AI failed, fell back to rules
  aiGenerated,          // Primary AI response
}

class OrchestratedResponse {
  const OrchestratedResponse({
    required this.text,
    required this.source,
    required this.confidence,
    this.explanation,
    this.providerUsed,
    this.actions = const [],
  });

  final String text;
  final ResponseSource source;
  final double confidence;
  final String? explanation;
  final String? providerUsed;
  final List<String> actions;

  bool get isFallback => source == ResponseSource.deterministicFallback;
  bool get isLowConfidence => confidence < 0.7;
}

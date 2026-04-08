import 'dart:convert';
import 'package:http/http.dart' as http;

class MealCard {
  final String title;
  final String time;
  final String cuisine;
  final String matchType; // Best Match, Save Food, Fastest
  final List<String> available;
  final List<String> missing;
  final String whyThis;

  MealCard({
    required this.title,
    required this.time,
    required this.cuisine,
    required this.matchType,
    required this.available,
    required this.missing,
    required this.whyThis,
  });
}

class CookRepository {
  static const String _baseUrl = 'http://127.0.0.1:8099/v1/cook/suggest'; // Legacy fallback route

  /// Generates a structured list of MealCards.
  /// Mocks the structural cards while gracefully falling back to the backend API
  /// when available to enrich the "Best Match" scenario.
  Future<List<MealCard>> generateMealCards(List<String> pantryIngredients) async {
    // Attempt fallback to existing backend route
    String apiSuggestion = "Could not reach backend. Using fully offline engine.";
    try {
      if (pantryIngredients.isNotEmpty) {
        final res = await http.post(
          Uri.parse(_baseUrl),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'ingredients': pantryIngredients,
            'health_envelope': {'mode': 'H1'}, 
            'meal_slot': 'dinner',
          }),
        ).timeout(const Duration(seconds: 3));

        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          apiSuggestion = data['suggestion'] ?? "No suggestion provided.";
        }
      }
    } catch (e) {
      // API unresponsive, fallback safely.
    }

    // Temporary Adapter Layer: Returns structural ranking 
    return [
      MealCard(
        title: 'Api Suggestion / Base Recipe',
        time: '30 min',
        cuisine: 'Balanced',
        matchType: 'Best Match',
        available: pantryIngredients.take(3).toList(),
        missing: [],
        whyThis: 'Backend says: $apiSuggestion',
      ),
      MealCard(
        title: 'Leftover Skillet',
        time: '15 min',
        cuisine: 'Fast Family',
        matchType: 'Save Food',
        available: pantryIngredients,
        missing: [],
        whyThis: 'Uses your expiring ingredients first.',
      ),
      MealCard(
        title: 'Quick Tacos',
        time: '10 min',
        cuisine: 'Mexican',
        matchType: 'Fastest',
        available: ['Tortillas', 'Cheese'],
        missing: ['Avocado', 'Salsa'],
        whyThis: 'Quickest option available, heavily relying on staples.',
      ),
    ];
  }
}

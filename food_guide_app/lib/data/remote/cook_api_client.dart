import 'dart:convert';
import 'package:http/http.dart' as http;

class CookApiClient {
  final String baseUrl;

  CookApiClient({this.baseUrl = 'http://127.0.0.1:3120'}); // Dev target or Replit target

  Future<Map<String, dynamic>> suggestMeals({
    required List<String> inventory,
    String? chefPersona,
    List<String> healthModifiers = const [],
    List<String> positiveAffinities = const [],
    List<String> negativeAffinities = const [],
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/v1/cook/suggest');
      
      // Building the specific Cybernetic Payload structure mapped in main.py
      final payload = {
        'ingredients': inventory,
        'chef_persona': chefPersona ?? 'Professional Chef',
        'positive_affinities': positiveAffinities,
        'negative_affinities': negativeAffinities,
        'health_envelope': {
           'mode': 'H1', // Enforcing non-clinical fallback
           'snapshot': null // To be replaced with actual watch/health data when available
        }
      };

      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      } else {
        throw Exception('Server rejected the cook request. HTTP ${response.statusCode}');
      }
    } catch (e) {
      // Fallback adapter handling for offline or disconnected scenarios
      return {
        'action': 'fallback_mock',
        'cards': [
           {'name': 'Emergency Pantry Rescue', 'time': '10m', 'why': 'Server unreachable. Using local SQLite rules for safety.'}
        ]
      };
    }
  }
}

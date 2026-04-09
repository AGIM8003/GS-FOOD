import 'dart:convert';
import 'package:http/http.dart' as http;

/// Binds the GS FOOD Mobile App to the Swarm CRAG Server
/// for Phase 1.5 Cook Mode escalations.
class CragApiClient {
  static const String _baseUrl = "http://localhost:8000/v1/cook/crag_verify";
  
  static Future<Map<String, dynamic>> verifyRecipe(Map<String, dynamic> recipeProposal) async {
    try {
      final response = await http.post(
        Uri.parse(_baseUrl),
        headers: {"Content-Type": "application/json"},
        body: json.encode(recipeProposal),
      ).timeout(const Duration(seconds: 10)); // Bounded loading per GS-FOOD3

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['crag_result'];
      } else {
        // Degrade to strict local subset rule mapping on API failure
        return {
          "status": "UNKNOWN", 
          "reason": "CRAG Server Unavailable - Reverting to strict local SQLite definitions.",
          "rewrite_required": false,
          "recipe": null
        };
      }
    } catch (e) {
      // Offline degradation logic (UX-AC-01)
      return {
        "status": "OFFLINE", 
        "reason": "No connectivity. Reverting to strictly offline rule engine.",
        "rewrite_required": false,
        "recipe": null
      };
    }
  }
}

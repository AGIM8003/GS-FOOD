import 'dart:convert';
import 'package:uuid/uuid.dart';
import '../../app/services.dart';
import '../models/inventory_item.dart';

class AIGenerativeRecipeEngine {
  AIGenerativeRecipeEngine();

  Future<Map<String, dynamic>> synthesizeExactMatch(List<InventoryItem> ingredients, String contextPrefix) async {
    final orchestrator = AppServices.aiOrchestrator;
    final prefs = await AppServices.preferences.load();
    
    final itemStrings = ingredients.map((e) => "${e.quantity} ${e.unit} of ${e.name}").join(', ');

    String medicalOverride = "";
    if (prefs.activeMedicalConditions.isNotEmpty) {
      medicalOverride = "[MEDICAL OVERRIDE ACTIVE] You must biologically substitute ingredients to be safe for: ${prefs.activeMedicalConditions.join(', ')} (e.g. swap Soy Sauce for Liquid Aminos if Hypertension is present).";
    }

    String ritualOverride = "";
    if (prefs.activeRitualProtocol != 'none') {
      ritualOverride = "[RITUAL PROTOCOL ACTIVE] You must strictly adhere to the dietary rules of: ${prefs.activeRitualProtocol.toUpperCase()}. Violations are forbidden.";
    }

    final householdConstraints = prefs.householdMembers.isEmpty
        ? "Servings: ${prefs.servings}"
        : "Servings: Scale the output volume specifically for ${prefs.calculatedHouseholdServings} standard adult servings to feed this exact household composition: [${prefs.householdMembers.map((m) => m.role.name).join(', ')}].";

    final memoryConstraints = prefs.positiveAffinities.isNotEmpty || prefs.negativeAffinities.isNotEmpty
        ? "- Learning Memory (Favored Cuisines/Flavors): ${prefs.positiveAffinities.join(', ')}\n    - Learning Memory (Avoided/Disliked): ${prefs.negativeAffinities.join(', ')}"
        : "";

    final prompt = '''
    [SYSTEM-V6: EXACT SYNTHESIS MODE]
    You are to procedurally generate a completely new recipe perfectly calibrated to consume exactly the following ingredients to achieve zero food waste:
    INGREDIENTS: $itemStrings

    Constraints:
    - Persona Focus: $contextPrefix
    - $householdConstraints
    - High Protein: ${prefs.highProtein}
    - Family Safe / Allergens avoided: ${prefs.allergens.join(',')}
    $memoryConstraints
    
    $medicalOverride
    $ritualOverride

    Return ONLY a raw JSON object with the following schema:
    {
       "id": "<generate uuid>",
       "title": "Creative Name",
       "heroImageUrl": "https://images.unsplash.com/photo-X",
       "tags": ["zero-waste", "quick"],
       "timeRange": "20 mins",
       "matchScore": 100,
       "ingredientList": ["..."],
       "instructions": [
          {"step": 1, "text": "...", "duration": 5, "appliance": "stove"}
       ]
    }
    DO NOT WRAP IN ```json
    ''';

    // Call orchestrator using internal LLM wrapper
    final responsePayload = await orchestrator.instructEngineDirect(prompt);
    
    try {
      final decoded = jsonDecode(responsePayload.trim());
      return decoded as Map<String, dynamic>;
    } catch (e) {
      // Graceful fallback synthesis if AI output fails to parse.
      return {
        "id": const Uuid().v4(),
        "title": "Emergency Zero-Waste Skillet",
        "heroImageUrl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
        "tags": ["zero-waste", "fallback"],
        "timeRange": "15 mins",
        "matchScore": 100,
        "ingredientList": ingredients.map((e) => e.name).toList(),
        "instructions": [
          {"step": 1, "text": "Chop all available ingredients.", "duration": 5, "appliance": "none"},
          {"step": 2, "text": "Sauté in skillet over medium heat until cooked through.", "duration": 10, "appliance": "stove"}
        ]
      };
    }
  }
}

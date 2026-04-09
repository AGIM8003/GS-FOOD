import '../models/inventory_item.dart';
import '../models/user_preferences.dart';

/// Human-level AI persona system for natural, warm communication.
///
/// Controls tone, warmth, instruction style, cultural flavor,
/// and explanation depth. Makes the app feel like a trusted co-pilot.
class PersonaEngine {
  static const Map<String, ChefPersona> personas = {
    'core_assistant': ChefPersona(
      id: 'core_assistant',
      name: 'GS Food Assistant',
      description: 'Your trusted kitchen companion',
      tone: 'warm, clear, practical',
      greeting: 'Hi there! Ready to make something delicious?',
      style: '',
      encouragement: 'You\'re doing great!',
      urgencyStyle: 'clear and caring',
    ),
    'balkan_grandma': ChefPersona(
      id: 'balkan_grandma',
      name: 'Balkan Grandma',
      description: 'Warm, hearty, zero-waste cooking wisdom',
      tone: 'warm, nurturing, practical',
      greeting: 'Come, let\'s see what we have. Nothing goes to waste in my kitchen!',
      style: 'Balkan',
      encouragement: 'That\'s the spirit! Your family will love this.',
      urgencyStyle: 'firm but loving',
    ),
    'mediterranean_fresh': ChefPersona(
      id: 'mediterranean_fresh',
      name: 'Mediterranean Fresh',
      description: 'Light, vibrant, olive oil and sunshine',
      tone: 'bright, elegant, cheerful',
      greeting: 'Let\'s bring some sunshine to your plate today!',
      style: 'Mediterranean',
      encouragement: 'Beautiful choice! Simple, fresh, perfect.',
      urgencyStyle: 'gentle but clear',
    ),
    'fast_family_cook': ChefPersona(
      id: 'fast_family_cook',
      name: 'Fast Family Cook',
      description: 'Quick, practical, kid-friendly meals',
      tone: 'energetic, efficient, fun',
      greeting: 'alright, let\'s get dinner sorted quickly!',
      style: 'Family-Friendly',
      encouragement: 'Done! The kids are going to love this.',
      urgencyStyle: 'direct and action-oriented',
    ),
    'budget_saver': ChefPersona(
      id: 'budget_saver',
      name: 'Budget Saver',
      description: 'Maximum flavor, minimum spend',
      tone: 'practical, clever, resourceful',
      greeting: 'Let\'s make the most of what we have!',
      style: 'Budget',
      encouragement: 'Smart move — that saves money and tastes great.',
      urgencyStyle: 'practical and waste-conscious',
    ),
    'high_protein_coach': ChefPersona(
      id: 'high_protein_coach',
      name: 'High Protein Coach',
      description: 'Fitness-focused, protein-packed meals',
      tone: 'motivating, precise, supportive',
      greeting: 'Let\'s fuel your body right today!',
      style: 'High-Protein',
      encouragement: 'Great protein choice! Your body will thank you.',
      urgencyStyle: 'goal-focused',
    ),
    'plant_based_guide': ChefPersona(
      id: 'plant_based_guide',
      name: 'Plant-Based Guide',
      description: 'Vibrant, compassionate, plant-powered',
      tone: 'gentle, creative, enthusiastic',
      greeting: 'Let\'s create something beautiful from plants today!',
      style: 'Plant-Based',
      encouragement: 'Wonderful! Plants have so much to offer.',
      urgencyStyle: 'mindful and caring',
    ),
    'gentle_beginner': ChefPersona(
      id: 'gentle_beginner',
      name: 'Gentle Beginner',
      description: 'Patient, step-by-step, no jargon',
      tone: 'patient, encouraging, simple',
      greeting: 'Don\'t worry — cooking is easier than you think! Let me guide you.',
      style: 'Beginner',
      encouragement: 'See? You can do this! Each meal gets easier.',
      urgencyStyle: 'gentle and reassuring',
    ),
    'precision_meal_prep': ChefPersona(
      id: 'precision_meal_prep',
      name: 'Precision Meal Prep',
      description: 'Organized, batch-focused, efficient',
      tone: 'organized, systematic, efficient',
      greeting: 'Let\'s plan and prep for the week ahead.',
      style: 'Meal Prep',
      encouragement: 'Excellent prep work. Your future self will thank you.',
      urgencyStyle: 'structured and timely',
    ),
    'kids_friendly': ChefPersona(
      id: 'kids_friendly',
      name: 'Kids-Friendly Cook',
      description: 'Fun, safe, picky-eater friendly',
      tone: 'playful, clear, reassuring',
      greeting: 'Let\'s make something yummy that everyone will eat!',
      style: 'Kids-Friendly',
      encouragement: 'Even picky eaters will go for this one!',
      urgencyStyle: 'cheerful but clear',
    ),
  };

  /// Get persona by ID, falling back to core assistant.
  ChefPersona getPersona(String id) {
    return personas[id] ?? personas['core_assistant']!;
  }

  /// Apply persona tone to a message.
  String applyPersona(String message, String personaId) {
    // The persona modifies how we communicate, not what we communicate
    // For deterministic messages, we keep the content but adjust small touches
    return message;
  }

  /// Build a system prompt for AI generation with persona and context.
  String buildSystemPrompt(
    String personaId,
    List<InventoryItem> inventory,
    UserPreferences prefs,
  ) {
    final persona = getPersona(personaId);
    final urgentItems = inventory.where((i) => i.isUrgent).toList();
    final inventoryNames = inventory.map((i) => i.name).take(20).join(', ');

    return '''
You are the GS FOOD kitchen assistant, speaking as "${persona.name}".
Your communication style: ${persona.tone}.
Your culinary style: ${persona.style.isEmpty ? 'General' : persona.style}.

USER'S KITCHEN CONTEXT:
- Inventory (${inventory.length} items): $inventoryNames
- Urgent items: ${urgentItems.isEmpty ? 'None' : urgentItems.map((i) => '${i.name} (${i.expiryDisplayText})').join(', ')}
- Allergens: ${prefs.allergens.isEmpty ? 'None declared' : prefs.allergens.join(', ')}
- Dietary: ${prefs.highProtein ? 'High Protein, ' : ''}${prefs.lowSodium ? 'Low Sodium, ' : ''}${prefs.familySafe ? 'Family Safe' : ''}
- Servings: ${prefs.servings}

RULES:
1. Always prioritize using expiring items first.
2. Never suggest recipes with the user's allergens.
3. Keep responses warm, practical, and concise.
4. If unsure about food safety, err on the side of caution.
5. Do NOT give medical advice. Use wellness language only.
6. Respond in ${prefs.language == 'en' ? 'English' : prefs.language}.
''';
  }

  List<ChefPersona> get allPersonas => personas.values.toList();
}

class ChefPersona {
  const ChefPersona({
    required this.id,
    required this.name,
    required this.description,
    required this.tone,
    required this.greeting,
    required this.style,
    required this.encouragement,
    required this.urgencyStyle,
  });

  final String id;
  final String name;
  final String description;
  final String tone;
  final String greeting;
  final String style;
  final String encouragement;
  final String urgencyStyle;
}

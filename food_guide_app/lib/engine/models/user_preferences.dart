/// Production user preferences model — persisted and connected to outputs.
class UserPreferences {
  UserPreferences({
    this.chefPersonaId = 'core_assistant',
    this.allergens = const [],
    this.dietaryRestrictions = const [],
    this.cuisinePreferences = const [],
    this.highProtein = false,
    this.lowSodium = false,
    this.familySafe = true,
    this.maxCookMinutes = 60,
    this.servings = 2,
    this.language = 'en',
    this.activeRitualProtocol = 'none',
    this.activeMedicalConditions = const [],
    this.positiveAffinities = const [],
    this.negativeAffinities = const [],
  });

  final String chefPersonaId;
  final List<String> allergens;
  final List<String> dietaryRestrictions;
  final List<String> cuisinePreferences;
  final bool highProtein;
  final bool lowSodium;
  final bool familySafe;
  final int maxCookMinutes;
  final int servings;
  final String language;
  final String activeRitualProtocol;
  final List<String> activeMedicalConditions;
  
  // Behavioral Learning Memory
  final List<String> positiveAffinities;
  final List<String> negativeAffinities;

  bool isAllergen(String ingredient) {
    final lower = ingredient.toLowerCase();
    return allergens.any((a) => lower.contains(a.toLowerCase()));
  }

  Map<String, dynamic> toMap() => {
    'chef_persona_id': chefPersonaId,
    'allergens': allergens.join(','),
    'dietary_restrictions': dietaryRestrictions.join(','),
    'cuisine_preferences': cuisinePreferences.join(','),
    'high_protein': highProtein ? 1 : 0,
    'low_sodium': lowSodium ? 1 : 0,
    'family_safe': familySafe ? 1 : 0,
    'max_cook_minutes': maxCookMinutes,
    'servings': servings,
    'language': language,
    'active_ritual_protocol': activeRitualProtocol,
    'active_medical_conditions': activeMedicalConditions.join(','),
    'positive_affinities': positiveAffinities.join(','),
    'negative_affinities': negativeAffinities.join(','),
  };

  factory UserPreferences.fromMap(Map<String, dynamic> m) => UserPreferences(
    chefPersonaId: (m['chef_persona_id'] as String?) ?? 'core_assistant',
    allergens: _splitList(m['allergens']),
    dietaryRestrictions: _splitList(m['dietary_restrictions']),
    cuisinePreferences: _splitList(m['cuisine_preferences']),
    highProtein: (m['high_protein'] as int?) == 1,
    lowSodium: (m['low_sodium'] as int?) == 1,
    familySafe: (m['family_safe'] as int?) != 0,
    maxCookMinutes: (m['max_cook_minutes'] as int?) ?? 60,
    servings: (m['servings'] as int?) ?? 2,
    language: (m['language'] as String?) ?? 'en',
    activeRitualProtocol: (m['active_ritual_protocol'] as String?) ?? 'none',
    activeMedicalConditions: _splitList(m['active_medical_conditions']),
    positiveAffinities: _splitList(m['positive_affinities']),
    negativeAffinities: _splitList(m['negative_affinities']),
  );

  static List<String> _splitList(dynamic v) {
    if (v == null) return [];
    final s = v as String;
    if (s.isEmpty) return [];
    return s.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
  }

  UserPreferences copyWith({
    String? chefPersonaId,
    List<String>? allergens,
    List<String>? dietaryRestrictions,
    List<String>? cuisinePreferences,
    bool? highProtein,
    bool? lowSodium,
    bool? familySafe,
    int? maxCookMinutes,
    int? servings,
    String? language,
    String? activeRitualProtocol,
    List<String>? activeMedicalConditions,
    List<String>? positiveAffinities,
    List<String>? negativeAffinities,
  }) => UserPreferences(
    chefPersonaId: chefPersonaId ?? this.chefPersonaId,
    allergens: allergens ?? this.allergens,
    dietaryRestrictions: dietaryRestrictions ?? this.dietaryRestrictions,
    cuisinePreferences: cuisinePreferences ?? this.cuisinePreferences,
    highProtein: highProtein ?? this.highProtein,
    lowSodium: lowSodium ?? this.lowSodium,
    familySafe: familySafe ?? this.familySafe,
    maxCookMinutes: maxCookMinutes ?? this.maxCookMinutes,
    servings: servings ?? this.servings,
    language: language ?? this.language,
    activeRitualProtocol: activeRitualProtocol ?? this.activeRitualProtocol,
    activeMedicalConditions: activeMedicalConditions ?? this.activeMedicalConditions,
    positiveAffinities: positiveAffinities ?? this.positiveAffinities,
    negativeAffinities: negativeAffinities ?? this.negativeAffinities,
  );
}

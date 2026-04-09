import 'dart:convert';

/// Replaces generic servings with actual household member profiling.
enum HouseholdRole {
  adult,
  youngster,
  child,
  elder;

  double get portionMultiplier {
    switch (this) {
      case HouseholdRole.adult: return 1.0;
      case HouseholdRole.youngster: return 1.2; // Teens typically eat more
      case HouseholdRole.child: return 0.6;
      case HouseholdRole.elder: return 0.8;
    }
  }

  static HouseholdRole fromString(String val) {
    if (val == 'youngster') return HouseholdRole.youngster;
    if (val == 'child') return HouseholdRole.child;
    if (val == 'elder') return HouseholdRole.elder;
    return HouseholdRole.adult;
  }
}

class HouseholdMember {
  HouseholdMember({
    required this.id,
    required this.name,
    this.role = HouseholdRole.adult,
    this.isIncludedInSharedMeals = true,
  });

  final String id;
  final String name;
  final HouseholdRole role;
  final bool isIncludedInSharedMeals;

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'role': role.name,
    'included': isIncludedInSharedMeals ? 1 : 0,
  };

  factory HouseholdMember.fromMap(Map<String, dynamic> m) => HouseholdMember(
    id: m['id'] as String,
    name: m['name'] as String,
    role: HouseholdRole.fromString(m['role'] as String? ?? 'adult'),
    isIncludedInSharedMeals: (m['included'] as int?) != 0,
  );
}

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
    this.householdMembers = const [],
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

  // Household Model
  final List<HouseholdMember> householdMembers;

  /// CORE QUANTITY ENGINE: Calculate exact serving sizes based on member inclusion.
  double get calculatedHouseholdServings {
    if (householdMembers.isEmpty) return servings.toDouble(); // Fallback to raw generic servings

    double total = 0.0;
    for (final member in householdMembers.where((m) => m.isIncludedInSharedMeals)) {
      total += member.role.portionMultiplier;
    }
    return total > 0 ? total : 1.0;
  }

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
    'household_members': jsonEncode(householdMembers.map((e) => e.toMap()).toList()),
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
    householdMembers: _parseHousehold(m['household_members']),
  );

  static List<HouseholdMember> _parseHousehold(dynamic v) {
    if (v == null) return [];
    try {
      final List decoded = jsonDecode(v as String);
      return decoded.map((e) => HouseholdMember.fromMap(Map<String, dynamic>.from(e))).toList();
    } catch (_) {
      return [];
    }
  }

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
    List<HouseholdMember>? householdMembers,
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
    householdMembers: householdMembers ?? this.householdMembers,
  );
}

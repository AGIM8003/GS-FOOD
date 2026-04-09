import '../data/local/app_database.dart';
import '../data/repositories/decision_log_repository.dart';
import '../data/repositories/recall_repository.dart';
import '../data/repositories/product_repository.dart';
import '../data/repositories/saved_repository.dart';
import '../data/repositories/use_first_repository.dart';
import '../data/repositories/inventory_repository.dart';
import '../data/repositories/shopping_repository.dart';
import '../data/repositories/meal_plan_repository.dart';
import '../data/repositories/preferences_repository.dart';
import '../data/repositories/premium_repositories.dart';
import '../data/repositories/hardware_repository.dart';

import '../engine/entity_normalizer.dart';
import '../engine/rule_engine.dart';
import '../engine/kitchen/expiry_engine.dart';
import '../engine/kitchen/match_engine.dart';
import '../engine/kitchen/shopping_wave_engine.dart';
import '../engine/kitchen/generative_recipe_engine.dart';
import '../engine/kitchen/forecasting_engine.dart';
import '../engine/kitchen/recipe_importer.dart';
import '../engine/integration/hardware_sync_engine.dart';
import '../engine/i18n/online_translator.dart';
import '../engine/i18n/language_engine.dart';
import '../engine/safety/safety_guard.dart';
import '../engine/safety/explainability.dart';
import '../engine/persona/persona_engine.dart';
import '../engine/ai/provider_registry.dart';
import '../engine/ai/ai_orchestrator.dart';
import '../perception/food_classifier_tflite.dart';
import '../perception/roi_detector.dart';

/// Lightweight service locator until DI is introduced.
class AppServices {
  AppServices._();

  static late final SavedRepository saved;
  static late final UseFirstRepository useFirst;
  static late final ProductRepository products;
  
  // Production Repositories
  static late final InventoryRepository inventory;
  static late final ShoppingRepository shopping;
  static late final MealPlanRepository mealPlans;
  static late final PreferencesRepository preferences;

  // Premium Repositories (V5)
  static late final WineRepository wine;
  static late final SustainabilityRepository sustainability;
  static late final CommunityRepository community;
  static late final HardwareRepository hardware;
  

  static late final FoodClassifierTflite foodClassifier;
  static late final RoiDetector roiDetector;
  
  // Deterministic Engines
  static late final RuleEngine ruleEngine;
  static late final EntityNormalizer normalizer;
  static late final ExpiryEngine expiryEngine;
  static late final MatchEngine matchEngine;
  static late final ShoppingWaveEngine shoppingWaveEngine;
  static late final SafetyGuard safetyGuard;
  static late final Explainability explainability;
  static late final PersonaEngine personaEngine;
  static late final AIGenerativeRecipeEngine generativeRecipeEngine;
  static late final RecipeImporter recipeImporter;
  static late final ForecastingEngine forecastingEngine;
  static late final HardwareSyncEngine hardwareSyncEngine;
  static late final OnlineTranslator onlineTranslator;
  static late final LanguageEngine languageEngine;

  // AI Orchestration
  static late final ProviderRegistry providerRegistry;
  static late final AIOrchestrator aiOrchestrator;

  static late final DecisionLogRepository decisionLog;
  static late final RecallRepository recalls;

  static void register() {
    final db = AppDatabase.instance;
    
    saved = SavedRepository(db);
    useFirst = UseFirstRepository(db);
    products = ProductRepository(db);
    decisionLog = DecisionLogRepository(db);
    recalls = RecallRepository(db);
    
    // Core Repositories
    inventory = InventoryRepository(db);
    shopping = ShoppingRepository(db);
    mealPlans = MealPlanRepository(db);
    preferences = PreferencesRepository(db);

    // Premium Repositories (V5)
    wine = WineRepository();
    sustainability = SustainabilityRepository();
    community = CommunityRepository();
    hardware = HardwareRepository();



    // AI & Deterministic Engines
    foodClassifier = FoodClassifierTflite();
    roiDetector = PassthroughRoiDetector();
    ruleEngine = RuleEngine();
    normalizer = EntityNormalizer();
    expiryEngine = ExpiryEngine();
    matchEngine = MatchEngine();
    shoppingWaveEngine = ShoppingWaveEngine();
    safetyGuard = SafetyGuard();
    explainability = Explainability();
    personaEngine = PersonaEngine();
    generativeRecipeEngine = AIGenerativeRecipeEngine();
    recipeImporter = RecipeImporter();
    forecastingEngine = ForecastingEngine();
    hardwareSyncEngine = HardwareSyncEngine();
    onlineTranslator = OnlineTranslator();
    languageEngine = LanguageEngine();

    // Orchestrator Setup
    providerRegistry = ProviderRegistry();
    // In a real app we load env vars here, for now it initializes empty config keys
    providerRegistry.registerFromConfig(const {}); 

    aiOrchestrator = AIOrchestrator(
      providers: providerRegistry,
      matchEngine: matchEngine,
      safetyGuard: safetyGuard,
      explainability: explainability,
      personaEngine: personaEngine,
    );
  }

  /// Best-effort load of optional TFLite asset (no throw).
  static Future<void> initializePerception() async {
    await foodClassifier.load();
  }
}

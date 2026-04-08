import '../data/local/app_database.dart';
import '../data/repositories/decision_log_repository.dart';
import '../data/repositories/recall_repository.dart';
import '../data/repositories/product_repository.dart';
import '../data/repositories/saved_repository.dart';
import '../data/repositories/use_first_repository.dart';
import '../engine/entity_normalizer.dart';
import '../engine/rule_engine.dart';
import '../perception/food_classifier_tflite.dart';
import '../perception/roi_detector.dart';

/// Lightweight service locator until DI is introduced.
class AppServices {
  AppServices._();

  static late final SavedRepository saved;
  static late final UseFirstRepository useFirst;
  static late final ProductRepository products;
  static late final FoodClassifierTflite foodClassifier;
  static late final RoiDetector roiDetector;
  static late final RuleEngine ruleEngine;
  static late final EntityNormalizer normalizer;
  static late final DecisionLogRepository decisionLog;
  static late final RecallRepository recalls;

  static void register() {
    saved = SavedRepository(AppDatabase.instance);
    useFirst = UseFirstRepository(AppDatabase.instance);
    products = ProductRepository(AppDatabase.instance);
    foodClassifier = FoodClassifierTflite();
    roiDetector = PassthroughRoiDetector();
    ruleEngine = RuleEngine();
    normalizer = EntityNormalizer();
    decisionLog = DecisionLogRepository(AppDatabase.instance);
    recalls = RecallRepository(AppDatabase.instance);
  }

  /// Best-effort load of optional TFLite asset (no throw).
  static Future<void> initializePerception() async {
    await foodClassifier.load();
  }
}

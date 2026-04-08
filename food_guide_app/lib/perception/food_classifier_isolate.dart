import 'dart:async';

import 'food_classifier_tflite.dart';

/// Runs optional TFLite load timing off the UI isolate (uplift U3 perf budget).
class FoodClassifierIsolate {
  FoodClassifierIsolate._();

  /// Target wall-clock budget for future inference (documented; wire when model tensors exist).
  static const Duration perfBudgetMidTier = Duration(milliseconds: 200);

  static Future<Duration> measureLoadTime() async {
    final sw = Stopwatch()..start();
    final c = FoodClassifierTflite();
    await c.load();
    await c.close();
    sw.stop();
    return sw.elapsed;
  }
}

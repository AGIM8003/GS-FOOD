import 'package:tflite_flutter/tflite_flutter.dart';

/// Optional coarse food classifier (Phase 4). Add `assets/models/food_coarse.tflite` then wire tensor I/O.
/// For label bounding boxes before OCR, consider a native MediaPipe Tasks detector plugin (Android-first).
class FoodClassifierTflite {
  Interpreter? _interpreter;

  bool get isLoaded => _interpreter != null;

  Interpreter? get interpreterOrNull => _interpreter;

  static const defaultAssetPath = 'assets/models/food_coarse.tflite';

  Future<void> load({String assetPath = defaultAssetPath}) async {
    if (_interpreter != null) return;
    try {
      _interpreter = await Interpreter.fromAsset(assetPath);
    } on Exception {
      _interpreter = null;
    }
  }

  Future<void> close() async {
    _interpreter?.close();
    _interpreter = null;
  }
}

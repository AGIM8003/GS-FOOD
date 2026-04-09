import 'dart:ui' as ui;
import 'dart:typed_data';
import 'dart:io';
import 'package:flutter/services.dart' show rootBundle;
import 'package:tflite_flutter/tflite_flutter.dart';

class ClassifierResult {
  final String label;
  final double confidence; // 0.0 to 1.0
  final bool modelLoaded;
  final bool success;
  final String? failureReason;

  ClassifierResult({
    required this.label,
    required this.confidence,
    this.modelLoaded = true,
    this.success = true,
    this.failureReason,
  });

  factory ClassifierResult.fail(String reason) => 
    ClassifierResult(label: 'Unknown', confidence: 0, modelLoaded: false, success: false, failureReason: reason);
}

/// Real Coarse Image Classifier backed by MobileNet V1 224 Quantized.
class FoodClassifierTflite {
  Interpreter? _interpreter;
  List<String>? _labels;

  bool get isLoaded => _interpreter != null && _labels != null;

  static const String _modelPath = 'assets/models/mobilenet_v1_1.0_224_quant.tflite';
  static const String _labelPath = 'assets/models/labels_mobilenet_quant_v1_224.txt';

  Future<void> load() async {
    if (isLoaded) return;
    try {
      _interpreter = await Interpreter.fromAsset(_modelPath);
      final lbRaw = await rootBundle.loadString(_labelPath);
      _labels = lbRaw.split('\n').where((l) => l.trim().isNotEmpty).toList();
    } catch (e) {
      _interpreter = null;
      _labels = null;
    }
  }

  Future<ClassifierResult> classifyImagePath(String imagePath) async {
    if (!isLoaded) return ClassifierResult.fail("Model not loaded");
    
    try {
      final bytes = await File(imagePath).readAsBytes();
      return _classifyBytes(bytes);
    } catch (e) {
      return ClassifierResult.fail("File read error: ${e.toString()}");
    }
  }

  Future<ClassifierResult> _classifyBytes(Uint8List rawBytes) async {
    if (!isLoaded) return ClassifierResult.fail("Model not loaded");

    try {
      // 1. Precise Preprocessing: Target size 224x224 interpolation
      final codec = await ui.instantiateImageCodec(rawBytes, targetWidth: 224, targetHeight: 224);
      final frame = await codec.getNextFrame();
      final ui.Image image = frame.image;
      final byteData = await image.toByteData(format: ui.ImageByteFormat.rawRgba);
      
      if (byteData == null) return ClassifierResult.fail("Corrupt pixel data");

      // 2. Strict Tensor Layout translation: [1, 224, 224, 3] UInt8
      final buffer = byteData.buffer.asUint8List();
      final inputBytes = Uint8List(224 * 224 * 3);
      int j = 0;
      for (int i = 0; i < buffer.length; i += 4) {
        inputBytes[j++] = buffer[i];     // R
        inputBytes[j++] = buffer[i+1];   // G
        inputBytes[j++] = buffer[i+2];   // B
      }

      // Convert flat array into nested tensor architecture [1, 224, 224, 3]
      var inputTensor = [List.generate(224, (y) => List.generate(224, (x) {
        int idx = (y * 224 + x) * 3;
        return [inputBytes[idx], inputBytes[idx+1], inputBytes[idx+2]];
      }))];

      // 3. Mathematical Output Buffer: [1, 1001] for Mobilenet V1 Quant Object Classification
      var outputTensor = [List.filled(1001, 0)];

      // 4. Run Neural Engine
      _interpreter!.run(inputTensor, outputTensor);

      // 5. ArgMax Execution (Top 1 Confidence)
      final scores = outputTensor[0];
      int highestIdx = 0;
      int highestScore = -1;
      
      for (int i = 0; i < scores.length; i++) {
        if (scores[i] > highestScore) {
          highestScore = scores[i] as int;
          highestIdx = i;
        }
      }

      final confidence = highestScore / 255.0; // Quantized normalization constraint
      String label = (highestIdx < _labels!.length) ? _labels![highestIdx] : "Unknown";
      
      // Clean up common synset tags e.g. 'Granny Smith, apple' -> 'apple'
      if (label.contains(',')) {
        label = label.split(',').last.trim();
      }

      return ClassifierResult(
        label: label, 
        confidence: confidence,
        success: true,
      );

    } catch (e) {
      return ClassifierResult.fail("Inference Failure: ${e.toString()}");
    }
  }

  Future<void> close() async {
    _interpreter?.close();
    _interpreter = null;
    _labels = null;
  }
}

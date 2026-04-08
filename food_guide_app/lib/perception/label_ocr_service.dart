import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';

/// ML Kit text recognition (Android/iOS). Desktop/test may throw [MissingPluginException].
class LabelOcrService {
  LabelOcrService() : _recognizer = TextRecognizer(script: TextRecognitionScript.latin);

  final TextRecognizer _recognizer;

  Future<String> recognizeFilePath(String path) async {
    final input = InputImage.fromFilePath(path);
    final result = await _recognizer.processImage(input);
    return result.text.trim();
  }

  Future<void> dispose() async {
    await _recognizer.close();
  }
}

import '../../app/services.dart';

class OnlineTranslator {
  Future<String> translateText(String englishText, String targetLangNativeLabel) async {
    final prompt = '''
    [SYSTEM: EXACT TRANSLATOR]
    Translate the following English string into $targetLangNativeLabel. 
    Return ONLY the translated string. Do not include quotes, wrappers, or markdown.
    
    TEXT: "$englishText"
    ''';

    try {
      final res = await AppServices.aiOrchestrator.instructEngineDirect(prompt);
      return res.trim();
    } catch (e) {
      // Fallback if AI fails: Return original english string
      return englishText;
    }
  }
}

import 'dart:convert';
import 'package:http/http.dart' as http;

/// Abstract LLM provider interface — the core of multi-provider support.
///
/// All AI providers (Gemini, OpenAI, Anthropic, Groq, DeepSeek, Mistral)
/// implement this interface. The router selects the best provider per task.
abstract class LLMProvider {
  String get name;
  String get modelId;
  bool get isAvailable;

  /// Generate a complete text response.
  Future<LLMResponse> generateText(String prompt, {String? systemPrompt, Map<String, dynamic>? config});

  /// Health check — is this provider reachable?
  Future<bool> healthCheck();
}

class LLMResponse {
  const LLMResponse({
    required this.text,
    required this.provider,
    this.tokensUsed = 0,
    this.latencyMs = 0,
    this.confidence = 1.0,
  });

  final String text;
  final String provider;
  final int tokensUsed;
  final int latencyMs;
  final double confidence;

  bool get isEmpty => text.trim().isEmpty;
}

// ── Provider Implementations ────────────────────────────────────────

/// Provider that calls any OpenAI-compatible API.
class OpenAICompatibleProvider implements LLMProvider {
  OpenAICompatibleProvider({
    required this.name,
    required this.modelId,
    required this.endpoint,
    required this.apiKey,
    this.timeout = const Duration(seconds: 15),
  });

  @override
  final String name;
  @override
  final String modelId;
  final String endpoint;
  final String apiKey;
  final Duration timeout;

  @override
  bool get isAvailable => apiKey.isNotEmpty;

  @override
  Future<LLMResponse> generateText(String prompt, {String? systemPrompt, Map<String, dynamic>? config}) async {
    if (!isAvailable) throw ProviderUnavailableException(name);

    final sw = Stopwatch()..start();
    final messages = <Map<String, String>>[];
    if (systemPrompt != null && systemPrompt.isNotEmpty) {
      messages.add({'role': 'system', 'content': systemPrompt});
    }
    messages.add({'role': 'user', 'content': prompt});

    try {
      final response = await http.post(
        Uri.parse(endpoint),
        headers: {
          'Authorization': 'Bearer $apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'model': modelId,
          'messages': messages,
          'max_tokens': config?['max_tokens'] ?? 1024,
          'temperature': config?['temperature'] ?? 0.7,
        }),
      ).timeout(timeout);

      sw.stop();
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final choices = data['choices'] as List?;
        if (choices != null && choices.isNotEmpty) {
          final text = choices[0]['message']['content'] as String;
          return LLMResponse(
            text: text,
            provider: name,
            latencyMs: sw.elapsedMilliseconds,
          );
        }
      }
      throw ProviderErrorException(name, 'HTTP ${response.statusCode}');
    } catch (e) {
      if (e is ProviderUnavailableException || e is ProviderErrorException) rethrow;
      throw ProviderErrorException(name, e.toString());
    }
  }

  @override
  Future<bool> healthCheck() async {
    if (!isAvailable) return false;
    try {
      final response = await http.get(
        Uri.parse(endpoint.replaceAll('/chat/completions', '/models')),
        headers: {'Authorization': 'Bearer $apiKey'},
      ).timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}

class ProviderUnavailableException implements Exception {
  ProviderUnavailableException(this.provider);
  final String provider;
  @override
  String toString() => 'Provider $provider is not configured or unavailable.';
}

class ProviderErrorException implements Exception {
  ProviderErrorException(this.provider, this.message);
  final String provider;
  final String message;
  @override
  String toString() => 'Provider $provider error: $message';
}

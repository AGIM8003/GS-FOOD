import 'llm_provider.dart';

/// Multi-provider registry with configurable routing policy.
///
/// Supports: Gemini, OpenAI, Anthropic, Groq, DeepSeek, Mistral
/// through a unified interface with health-aware failover.
class ProviderRegistry {
  final List<LLMProvider> _providers = [];
  final Map<String, bool> _healthCache = {};

  /// Register a provider.
  void register(LLMProvider provider) {
    _providers.add(provider);
  }

  /// Register all providers from environment/config keys.
  void registerFromConfig(Map<String, String> apiKeys) {
    if (apiKeys.containsKey('GROQ_API_KEY') && apiKeys['GROQ_API_KEY']!.isNotEmpty) {
      register(OpenAICompatibleProvider(
        name: 'Groq',
        modelId: 'llama-3.1-8b-instant',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: apiKeys['GROQ_API_KEY']!,
      ));
    }
    if (apiKeys.containsKey('OPENROUTER_API_KEY') && apiKeys['OPENROUTER_API_KEY']!.isNotEmpty) {
      register(OpenAICompatibleProvider(
        name: 'OpenRouter',
        modelId: 'meta-llama/llama-3.1-8b-instruct:free',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: apiKeys['OPENROUTER_API_KEY']!,
      ));
    }
    if (apiKeys.containsKey('OPENAI_API_KEY') && apiKeys['OPENAI_API_KEY']!.isNotEmpty) {
      register(OpenAICompatibleProvider(
        name: 'OpenAI',
        modelId: 'gpt-4o-mini',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: apiKeys['OPENAI_API_KEY']!,
      ));
    }
    if (apiKeys.containsKey('DEEPSEEK_API_KEY') && apiKeys['DEEPSEEK_API_KEY']!.isNotEmpty) {
      register(OpenAICompatibleProvider(
        name: 'DeepSeek',
        modelId: 'deepseek-chat',
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
        apiKey: apiKeys['DEEPSEEK_API_KEY']!,
      ));
    }
    if (apiKeys.containsKey('MISTRAL_API_KEY') && apiKeys['MISTRAL_API_KEY']!.isNotEmpty) {
      register(OpenAICompatibleProvider(
        name: 'Mistral',
        modelId: 'mistral-small-latest',
        endpoint: 'https://api.mistral.ai/v1/chat/completions',
        apiKey: apiKeys['MISTRAL_API_KEY']!,
      ));
    }
  }

  /// Get all available providers.
  List<LLMProvider> get available => _providers.where((p) => p.isAvailable).toList();

  /// Get provider by name.
  LLMProvider? getByName(String name) {
    try {
      return _providers.firstWhere((p) => p.name == name);
    } catch (_) {
      return null;
    }
  }

  /// Get the best available provider.
  LLMProvider? get primary => available.isEmpty ? null : available.first;

  bool get hasAnyProvider => available.isNotEmpty;

  /// Execute with cascade failover: try each provider in order.
  Future<LLMResponse> executeWithFailover(
    String prompt, {
    String? systemPrompt,
    Map<String, dynamic>? config,
  }) async {
    for (final provider in available) {
      try {
        return await provider.generateText(prompt, systemPrompt: systemPrompt, config: config);
      } catch (_) {
        continue; // Try next provider
      }
    }
    throw ProviderUnavailableException('all_providers');
  }

  /// Check health of all providers and cache results.
  Future<Map<String, bool>> checkAllHealth() async {
    _healthCache.clear();
    for (final provider in _providers) {
      _healthCache[provider.name] = await provider.healthCheck();
    }
    return Map.unmodifiable(_healthCache);
  }

  Map<String, bool> get lastHealthCheck => Map.unmodifiable(_healthCache);
}

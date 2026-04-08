import 'dart:convert';

import 'package:http/http.dart' as http;

import '../local/settings_store.dart';
import 'api_config.dart';

/// Consent-gated `POST /v1/cook/suggest` (Phase 5 / §13).
class CookApiClient {
  CookApiClient({http.Client? httpClient, this.timeout = const Duration(seconds: 20)});

  final http.Client _client = httpClient ?? http.Client();
  final Duration timeout;

  final SettingsStore _settings = SettingsStore.instance;
  final ApiConfig _config = ApiConfig.instance;

  Future<CookSuggestResponse> suggest({
    required List<String> ingredients,
    String? mealSlot,
    String? locale,
  }) async {
    if (!await _settings.cookCloudEnabled) {
      throw StateError('cook_cloud_disabled');
    }
    final base = await _config.resolvedBaseUri();
    if (base == null) {
      throw StateError('api_base_url_not_set');
    }
    final uri = base.replace(path: _joinCookPath(base.path));
    final body = json.encode({
      'ingredients': ingredients,
      if (mealSlot != null) 'meal_slot': mealSlot,
      if (locale != null) 'locale': locale,
    });
    final response = await _client
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: body,
        )
        .timeout(timeout);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw StateError('cook_http_${response.statusCode}');
    }
    final decoded = json.decode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw StateError('cook_invalid_json');
    }
    return CookSuggestResponse.fromJson(decoded);
  }

  void close() {
    _client.close();
  }

  static String _joinCookPath(String basePath) {
    final trimmed = basePath.replaceAll(RegExp(r'/+$'), '');
    const suffix = '/v1/cook/suggest';
    if (trimmed.isEmpty) return suffix;
    return '$trimmed$suffix';
  }
}

class CookSuggestResponse {
  CookSuggestResponse({required this.suggestions, required this.source});

  factory CookSuggestResponse.fromJson(Map<String, dynamic> json) {
    final raw = json['suggestions'];
    final list = <String>[];
    if (raw is List) {
      for (final e in raw) {
        list.add(e.toString());
      }
    }
    return CookSuggestResponse(
      suggestions: list,
      source: json['source']?.toString() ?? 'api',
    );
  }

  final List<String> suggestions;
  final String source;
}

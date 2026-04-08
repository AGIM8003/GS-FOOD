import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_config.dart';

/// GET /health or /v1/health — configurable path (Phase 0).
class HealthClient {
  HealthClient({http.Client? httpClient, this.healthPath = '/health', this.timeout = const Duration(seconds: 5)});

  final http.Client _client = httpClient ?? http.Client();
  final String healthPath;
  final Duration timeout;

  final ApiConfig _config = ApiConfig.instance;

  Future<HealthResult> ping() async {
    final base = await _config.resolvedBaseUri();
    if (base == null) {
      return HealthResult.notConfigured();
    }
    final uri = base.replace(path: _joinPath(base.path, healthPath));
    try {
      final response = await _client.get(uri).timeout(timeout);
      final bodyPreview = _previewBody(response.body);
      final ok = response.statusCode >= 200 && response.statusCode < 300;
      return HealthResult(
        reachable: ok,
        statusCode: response.statusCode,
        bodyPreview: bodyPreview,
        error: ok ? null : 'HTTP ${response.statusCode}',
      );
    } on Exception catch (e) {
      return HealthResult(reachable: false, statusCode: null, bodyPreview: null, error: '$e');
    }
  }

  void close() {
    _client.close();
  }

  static String _joinPath(String basePath, String path) {
    if (path.startsWith('/')) {
      final trimmed = basePath.replaceAll(RegExp(r'/+$'), '');
      return trimmed.isEmpty ? path : '$trimmed$path';
    }
    return path;
  }

  static String? _previewBody(String body, {int max = 256}) {
    if (body.isEmpty) return null;
    try {
      final decoded = json.decode(body);
      final s = decoded.toString();
      if (s.length <= max) return s;
      return '${s.substring(0, max)}…';
    } catch (_) {
      if (body.length <= max) return body;
      return '${body.substring(0, max)}…';
    }
  }
}

class HealthResult {
  HealthResult({
    required this.reachable,
    required this.statusCode,
    required this.bodyPreview,
    required this.error,
  });

  factory HealthResult.notConfigured() => HealthResult(
        reachable: false,
        statusCode: null,
        bodyPreview: null,
        error: 'api_base_url_not_set',
      );

  final bool reachable;
  final int? statusCode;
  final String? bodyPreview;
  final String? error;
}

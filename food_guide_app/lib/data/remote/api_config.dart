import '../local/settings_store.dart';

/// Resolves API base URL from settings (Phase 0 / §13).
class ApiConfig {
  ApiConfig._();

  static final ApiConfig instance = ApiConfig._();

  final SettingsStore _settings = SettingsStore.instance;

  Future<Uri?> resolvedBaseUri() async {
    final raw = await _settings.apiBaseUrl;
    if (raw.isEmpty) return null;
    try {
      return Uri.parse(raw);
    } on FormatException {
      return null;
    }
  }
}

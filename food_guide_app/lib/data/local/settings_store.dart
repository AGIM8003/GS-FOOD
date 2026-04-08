import 'package:shared_preferences/shared_preferences.dart';

/// User toggles (§12 cloud off by default, §34.5) + API / region (Phase 0).
class SettingsStore {
  SettingsStore._();

  static final SettingsStore instance = SettingsStore._();

  static const _cloudAssist = 'settings.cloud_assist_enabled';
  static const _analytics = 'settings.analytics_enabled';
  static const _apiBaseUrl = 'settings.api_base_url';
  static const _regionCode = 'settings.region_code';
  static const _localeProfile = 'settings.locale_profile';
  static const _cookCloud = 'settings.cook_cloud_enabled';
  static const _slmOptIn = 'settings.slm_bundle_opt_in';
  static const _slmBundlePath = 'settings.slm_bundle_path';
  static const _packCdnBaseUrl = 'settings.pack_cdn_base_url';
  static const _packBackgroundSync = 'settings.pack_background_sync';

  Future<bool> get cloudAssistEnabled async {
    final p = await SharedPreferences.getInstance();
    return p.getBool(_cloudAssist) ?? false;
  }

  Future<void> setCloudAssistEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_cloudAssist, value);
  }

  Future<bool> get analyticsEnabled async {
    final p = await SharedPreferences.getInstance();
    return p.getBool(_analytics) ?? false;
  }

  Future<void> setAnalyticsEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_analytics, value);
  }

  /// Backend base URL (no trailing slash), e.g. http://10.0.2.2:8000
  Future<String> get apiBaseUrl async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_apiBaseUrl) ?? '';
  }

  Future<void> setApiBaseUrl(String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_apiBaseUrl, value.trim());
  }

  Future<String> get regionCode async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_regionCode) ?? 'default';
  }

  Future<void> setRegionCode(String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_regionCode, value.trim().isEmpty ? 'default' : value.trim());
  }

  Future<String> get localeProfile async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_localeProfile) ?? 'en';
  }

  Future<void> setLocaleProfile(String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_localeProfile, value.trim().isEmpty ? 'en' : value.trim());
  }

  /// Cook suggestions via cloud API — separate consent from generic cloud assist.
  Future<bool> get cookCloudEnabled async {
    final p = await SharedPreferences.getInstance();
    return p.getBool(_cookCloud) ?? false;
  }

  Future<void> setCookCloudEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_cookCloud, value);
  }

  Future<bool> get slmBundleOptIn async {
    final p = await SharedPreferences.getInstance();
    return p.getBool(_slmOptIn) ?? false;
  }

  Future<void> setSlmBundleOptIn(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_slmOptIn, value);
  }

  Future<String?> get slmBundlePath async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_slmBundlePath);
  }

  Future<void> setSlmBundlePath(String? path) async {
    final prefs = await SharedPreferences.getInstance();
    if (path == null || path.isEmpty) {
      await prefs.remove(_slmBundlePath);
    } else {
      await prefs.setString(_slmBundlePath, path);
    }
  }

  /// HTTPS directory containing `manifest.json` and pack files (uplift U2).
  Future<String> get packCdnBaseUrl async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_packCdnBaseUrl) ?? '';
  }

  Future<void> setPackCdnBaseUrl(String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_packCdnBaseUrl, value.trim());
  }

  Future<bool> get packBackgroundSyncEnabled async {
    final p = await SharedPreferences.getInstance();
    return p.getBool(_packBackgroundSync) ?? false;
  }

  Future<void> setPackBackgroundSyncEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_packBackgroundSync, value);
  }
}

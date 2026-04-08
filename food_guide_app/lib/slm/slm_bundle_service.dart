import 'dart:io';

import '../data/local/settings_store.dart';

/// Tracks optional on-device SLM bundle path (Phase 6 / §34.4). No model shipped in-repo.
class SlmBundleService {
  SlmBundleService._();

  static final SlmBundleService instance = SlmBundleService._();

  final SettingsStore _settings = SettingsStore.instance;

  Future<bool> get isOptedIn => _settings.slmBundleOptIn;

  Future<bool> get isBundlePresent async {
    if (!await _settings.slmBundleOptIn) return false;
    final path = await _settings.slmBundlePath;
    if (path == null || path.isEmpty) return false;
    return File(path).existsSync();
  }

  /// Template / SLM hint for Cook UX — true when a bundle file exists at stored path.
  Future<String> describeState() async {
    if (!await _settings.slmBundleOptIn) {
      return 'SLM bundle not enabled (Settings).';
    }
    if (!await isBundlePresent) {
      return 'SLM opted in, but no bundle file on disk yet.';
    }
    return 'SLM bundle path registered — inference wiring is device-specific (Gemma / Gemini Nano / etc.).';
  }
}

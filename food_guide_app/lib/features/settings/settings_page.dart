import 'package:flutter/foundation.dart' show TargetPlatform, defaultTargetPlatform;
import 'package:flutter/material.dart';

import '../../data/local/app_database.dart';
import '../../data/local/settings_store.dart';
import '../../data/pack/bundled_pack_reader.dart';
import '../../data/pack/pack_update_service.dart';
import '../../data/pack/trusted_pack_key.dart';
import '../../data/remote/health_client.dart';
import '../../workers/pack_sync_worker.dart';

/// Privacy, API base, region, pack tools — §12, §26, §34.5, Phase 0–3.
class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _store = SettingsStore.instance;
  final _apiController = TextEditingController();
  final _regionController = TextEditingController();
  final _localeController = TextEditingController();
  final _slmPathController = TextEditingController();
  final _packUrlController = TextEditingController();

  bool _cloud = false;
  bool _cookCloud = false;
  bool _analytics = false;
  bool _slmOptIn = false;
  bool _packBg = false;
  bool _packBusy = false;
  bool _loading = true;
  String? _healthMessage;
  String? _bundledPackRegion;
  String? _lastPackVersion;
  String _trustedKeyStatus = '—';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _apiController.dispose();
    _regionController.dispose();
    _localeController.dispose();
    _slmPathController.dispose();
    _packUrlController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final c = await _store.cloudAssistEnabled;
    final cook = await _store.cookCloudEnabled;
    final a = await _store.analyticsEnabled;
    final api = await _store.apiBaseUrl;
    final region = await _store.regionCode;
    final loc = await _store.localeProfile;
    final slm = await _store.slmBundleOptIn;
    final slmPath = await _store.slmBundlePath;
    final packUrl = await _store.packCdnBaseUrl;
    final packBg = await _store.packBackgroundSyncEnabled;
    final pack = await BundledPackReader.instance.loadDefaultPack();
    final trusted = await TrustedPackKey.loadFromAssets();
    final rows = await AppDatabase.instance.db.query(
      'pack_installations',
      orderBy: 'applied_at DESC',
      limit: 1,
    );
    if (!mounted) return;
    setState(() {
      _cloud = c;
      _cookCloud = cook;
      _analytics = a;
      _apiController.text = api;
      _regionController.text = region;
      _localeController.text = loc;
      _slmOptIn = slm;
      _slmPathController.text = slmPath ?? '';
      _packUrlController.text = packUrl;
      _packBg = packBg;
      _bundledPackRegion = pack?['region']?.toString();
      _lastPackVersion = rows.isEmpty ? null : rows.first['version']?.toString();
      _trustedKeyStatus = trusted == null ? 'empty (hash-only integrity)' : 'loaded';
      _loading = false;
    });
  }

  Future<void> _pingHealth() async {
    setState(() => _healthMessage = 'Checking…');
    final client = HealthClient();
    final r = await client.ping();
    client.close();
    if (!mounted) return;
    setState(() {
      if (r.error == 'api_base_url_not_set') {
        _healthMessage = 'Set API base URL first (e.g. http://10.0.2.2:8000 for Android emulator).';
      } else if (r.reachable) {
        _healthMessage = 'OK ${r.statusCode}${r.bodyPreview != null ? ' — ${r.bodyPreview}' : ''}';
      } else {
        _healthMessage = 'Unreachable: ${r.error}';
      }
    });
  }

  Future<void> _saveConnectivityFields() async {
    await _store.setApiBaseUrl(_apiController.text);
    await _store.setRegionCode(_regionController.text);
    await _store.setLocaleProfile(_localeController.text);
    await _store.setSlmBundlePath(_slmPathController.text.trim().isEmpty ? null : _slmPathController.text.trim());
    await _store.setPackCdnBaseUrl(_packUrlController.text);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved connection settings')));
    }
  }

  Future<void> _downloadPackNow() async {
    final url = _packUrlController.text.trim();
    if (url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Set pack CDN base URL first')),
      );
      return;
    }
    setState(() => _packBusy = true);
    final key = await TrustedPackKey.loadFromAssets();
    final svc = PackUpdateService(AppDatabase.instance);
    final r = await svc.downloadAndInstall(url, trustedPublicKeyB64: key);
    svc.close();
    if (!mounted) return;
    setState(() => _packBusy = false);
    await _load();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(r.ok ? 'Pack ${r.version} installed' : 'Pack update failed: ${r.error}')),
    );
  }

  Future<void> _rollbackPack() async {
    setState(() => _packBusy = true);
    final svc = PackUpdateService(AppDatabase.instance);
    final r = await svc.rollbackToPrevious();
    svc.close();
    if (!mounted) return;
    setState(() => _packBusy = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(r.ok ? 'Rolled back to ${r.version}' : 'Rollback failed: ${r.error}')),
    );
  }

  Future<void> _onPackBgChanged(bool v) async {
    await _store.setPackBackgroundSyncEnabled(v);
    setState(() => _packBg = v);
    if (defaultTargetPlatform != TargetPlatform.android) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Background pack sync is tuned for Android WorkManager.')),
        );
      }
      return;
    }
    try {
      if (v) {
        await schedulePackBackgroundSync();
      } else {
        await cancelPackBackgroundSync();
      }
    } on Object catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('WorkManager: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              children: [
                SwitchListTile(
                  secondary: const Icon(Icons.cloud_outlined),
                  title: const Text('Cloud assist'),
                  subtitle: const Text(
                    'Off by default. When on, sends minimized payloads only with consent (§12).',
                  ),
                  value: _cloud,
                  onChanged: (v) async {
                    await _store.setCloudAssistEnabled(v);
                    setState(() => _cloud = v);
                  },
                ),
                SwitchListTile(
                  secondary: const Icon(Icons.restaurant_outlined),
                  title: const Text('Cook cloud API'),
                  subtitle: const Text(
                    'Separate toggle for POST /v1/cook/suggest (Phase 5). Requires API base URL.',
                  ),
                  value: _cookCloud,
                  onChanged: (v) async {
                    await _store.setCookCloudEnabled(v);
                    setState(() => _cookCloud = v);
                  },
                ),
                SwitchListTile(
                  secondary: const Icon(Icons.analytics_outlined),
                  title: const Text('Help improve the app'),
                  subtitle: const Text(
                    'Optional analytics — opt-in per blueprint (§26.3).',
                  ),
                  value: _analytics,
                  onChanged: (v) async {
                    await _store.setAnalyticsEnabled(v);
                    setState(() => _analytics = v);
                  },
                ),
                SwitchListTile(
                  secondary: const Icon(Icons.psychology_outlined),
                  title: const Text('Offline SLM bundle (opt-in)'),
                  subtitle: const Text('Phase 6 — register a local bundle path when you add one.'),
                  value: _slmOptIn,
                  onChanged: (v) async {
                    await _store.setSlmBundleOptIn(v);
                    setState(() => _slmOptIn = v);
                  },
                ),
                const Divider(),
                const ListTile(
                  leading: Icon(Icons.link),
                  title: Text('Backend & region'),
                  subtitle: Text('Phase 0 — health check uses GET /health'),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    controller: _apiController,
                    decoration: const InputDecoration(
                      labelText: 'API base URL',
                      hintText: 'http://10.0.2.2:8000',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.url,
                    autocorrect: false,
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    controller: _regionController,
                    decoration: const InputDecoration(
                      labelText: 'Region code',
                      hintText: 'default, EU, US, …',
                      border: OutlineInputBorder(),
                    ),
                    autocorrect: false,
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    controller: _localeController,
                    decoration: const InputDecoration(
                      labelText: 'Locale profile',
                      hintText: 'en',
                      border: OutlineInputBorder(),
                    ),
                    autocorrect: false,
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    controller: _slmPathController,
                    decoration: const InputDecoration(
                      labelText: 'SLM bundle file path (optional)',
                      border: OutlineInputBorder(),
                    ),
                    autocorrect: false,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      FilledButton(onPressed: _saveConnectivityFields, child: const Text('Save connection')),
                      const SizedBox(width: 12),
                      OutlinedButton(onPressed: _pingHealth, child: const Text('Ping health')),
                    ],
                  ),
                ),
                if (_healthMessage != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(_healthMessage!, style: Theme.of(context).textTheme.bodySmall),
                  ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.inventory_2_outlined),
                  title: const Text('Content packs'),
                  subtitle: Text(
                    _lastPackVersion == null
                        ? 'No signed pack installed yet. Bundled region: ${_bundledPackRegion ?? "—"}'
                        : 'Last installed pack version: $_lastPackVersion',
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    controller: _packUrlController,
                    decoration: const InputDecoration(
                      labelText: 'Pack CDN base URL',
                      hintText: 'https://cdn.example.com/packs/current',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.url,
                    autocorrect: false,
                  ),
                ),
                SwitchListTile(
                  secondary: const Icon(Icons.schedule_outlined),
                  title: const Text('Background pack check'),
                  subtitle: const Text('Android: periodic download via WorkManager (24h).'),
                  value: _packBg,
                  onChanged: _packBusy ? null : _onPackBgChanged,
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      FilledButton.tonal(
                        onPressed: _packBusy ? null : _downloadPackNow,
                        child: const Text('Download pack now'),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: _packBusy ? null : _rollbackPack,
                        child: const Text('Rollback pointer'),
                      ),
                    ],
                  ),
                ),
                ListTile(
                  leading: const Icon(Icons.verified_outlined),
                  title: const Text('Trusted pack public key'),
                  subtitle: Text(
                    'assets/config/pack_trusted_public_key.b64 — $_trustedKeyStatus',
                  ),
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.privacy_tip_outlined),
                  title: const Text('Privacy'),
                  subtitle: const Text('No mandatory account. See GS-FOOD3 §26–27.'),
                ),
              ],
            ),
    );
  }
}

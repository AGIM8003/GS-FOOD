import 'package:flutter/material.dart';

import '../../data/local/settings_store.dart';
import '../../data/remote/cook_api_client.dart';
import '../../slm/slm_bundle_service.dart';

/// Cook mode — T1 templates + optional cloud (Phase 5) + SLM path (Phase 6).
class CookPage extends StatefulWidget {
  const CookPage({super.key});

  @override
  State<CookPage> createState() => _CookPageState();
}

class _CookPageState extends State<CookPage> {
  final _ingredients = TextEditingController();
  final _store = SettingsStore.instance;
  bool _busy = false;
  String? _result;
  String? _slmHint;

  @override
  void initState() {
    super.initState();
    _refreshSlm();
  }

  @override
  void dispose() {
    _ingredients.dispose();
    super.dispose();
  }

  Future<void> _refreshSlm() async {
    final h = await SlmBundleService.instance.describeState();
    if (mounted) setState(() => _slmHint = h);
  }

  List<String> _parseIngredients() {
    return _ingredients.text
        .split(RegExp(r'[\n,;]+'))
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();
  }

  List<String> _templateSuggestions(List<String> ingredients) {
    if (ingredients.isEmpty) {
      return [
        'Add a few ingredients you have on hand.',
        'Try: tomato, eggs, bread — short answers only (§17).',
      ];
    }
    final first = ingredients.first;
    return [
      'Quick: $first with olive oil, salt, and whatever herbs you have.',
      'Batch-cook $first and refrigerate up to your comfort zone — verify storage rules in the app packs.',
    ];
  }

  Future<void> _suggestCloud() async {
    setState(() {
      _busy = true;
      _result = null;
    });
    final client = CookApiClient();
    try {
      final loc = await _store.localeProfile;
      final res = await client.suggest(
        ingredients: _parseIngredients(),
        mealSlot: 'any',
        locale: loc,
      );
      if (!mounted) return;
      setState(() {
        _busy = false;
        _result = res.suggestions.join('\n• ');
      });
    } on StateError catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _result = 'Cannot use cloud: $e';
      });
    } on Exception catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _result = 'Request failed: $e';
      });
    } finally {
      client.close();
    }
  }

  void _suggestLocal() {
    final list = _templateSuggestions(_parseIngredients());
    setState(() => _result = '• ${list.join('\n• ')}');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cook')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Recipe ideas from what you have',
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _ingredients,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Ingredients (comma or newline separated)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _busy ? null : _suggestLocal,
              child: const Text('Suggest (local templates — T1)'),
            ),
            const SizedBox(height: 8),
            FilledButton.tonal(
              onPressed: _busy ? null : _suggestCloud,
              child: const Text('Suggest via API (Cook cloud toggle + base URL)'),
            ),
            if (_busy) const Padding(padding: EdgeInsets.all(16), child: LinearProgressIndicator()),
            if (_result != null) ...[
              const SizedBox(height: 16),
              Text('Suggestions', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              Expanded(
                child: SingleChildScrollView(
                  child: SelectableText(_result!, style: Theme.of(context).textTheme.bodyMedium),
                ),
              ),
            ] else
              const Spacer(),
            if (_slmHint != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(_slmHint!, style: Theme.of(context).textTheme.labelSmall),
              ),
          ],
        ),
      ),
    );
  }
}

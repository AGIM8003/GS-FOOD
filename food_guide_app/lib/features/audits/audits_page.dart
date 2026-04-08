import 'package:flutter/material.dart';

import '../../app/services.dart';
import '../../recall/openfda_recall_provider.dart';
import '../../recall/recall_record.dart';

/// Shelf audit + recall feed with provenance (§18, uplift U6).
class AuditsPage extends StatefulWidget {
  const AuditsPage({super.key});

  @override
  State<AuditsPage> createState() => _AuditsPageState();
}

class _AuditsPageState extends State<AuditsPage> {
  List<RecallRecord> _items = [];
  String _provenance = '';
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCached();
  }

  Future<void> _loadCached() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final list = await AppServices.recalls.listCached();
    final prov = await AppServices.recalls.provenanceSummary();
    if (!mounted) return;
    setState(() {
      _items = list;
      _provenance = prov;
      _loading = false;
    });
  }

  Future<void> _refreshFromOpenFda() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final client = OpenFdaRecallProvider();
    try {
      await AppServices.recalls.replaceFromProvider(client, limit: 12);
      client.close();
      await _loadCached();
    } on Exception catch (e) {
      client.close();
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = '$e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Audits')),
      body: RefreshIndicator(
        onRefresh: _refreshFromOpenFda,
        child: _loading && _items.isEmpty
            ? const ListView(children: [SizedBox(height: 120), Center(child: CircularProgressIndicator())])
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text('Kitchen shelf audit', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(
                    'Calm, non-judgmental copy (§17.1). Below: US enforcement recalls (openFDA) — not a complete worldwide list.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 16),
                  FilledButton.tonal(
                    onPressed: _loading ? null : _refreshFromOpenFda,
                    child: const Text('Refresh recalls (openFDA)'),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _provenance,
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                    ),
                  const SizedBox(height: 16),
                  ..._items.map(
                    (r) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        title: Text(r.title, maxLines: 2, overflow: TextOverflow.ellipsis),
                        subtitle: Text(
                          '${r.summary}\n\nProvenance: ${r.source} — openFDA food enforcement API',
                          maxLines: 6,
                          overflow: TextOverflow.ellipsis,
                        ),
                        isThreeLine: true,
                      ),
                    ),
                  ),
                  if (_items.isEmpty && !_loading)
                    const Padding(
                      padding: EdgeInsets.all(24),
                      child: Text('No recalls cached. Pull to refresh or tap the button when online.'),
                    ),
                ],
              ),
      ),
    );
  }
}

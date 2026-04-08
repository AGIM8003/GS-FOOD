import 'package:flutter/material.dart';

import '../../app/services.dart';
import '../../data/repositories/saved_repository.dart';

/// Saved items — local SQLite (§5.1 persistence).
class SavedPage extends StatefulWidget {
  const SavedPage({super.key});

  @override
  State<SavedPage> createState() => _SavedPageState();
}

class _SavedPageState extends State<SavedPage> {
  late Future<List<SavedItem>> _future;

  @override
  void initState() {
    super.initState();
    _future = AppServices.saved.listRecent();
  }

  void _reload() {
    setState(() {
      _future = AppServices.saved.listRecent();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Saved')),
      body: FutureBuilder<List<SavedItem>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(child: Text('Error: ${snap.error}'));
          }
          final items = snap.data ?? [];
          if (items.isEmpty) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                SizedBox(
                  height: MediaQuery.sizeOf(context).height * 0.35,
                ),
                Center(
                  child: Text(
                    'Nothing saved yet.\nScan a barcode or add an Ask draft.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ),
              ],
            );
          }
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final it = items[i];
                return Dismissible(
                  key: ValueKey(it.id),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    color: Theme.of(context).colorScheme.errorContainer,
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 16),
                    child: Icon(
                      Icons.delete_outline,
                      color: Theme.of(context).colorScheme.onErrorContainer,
                    ),
                  ),
                  onDismissed: (_) async {
                    await AppServices.saved.delete(it.id);
                    _reload();
                  },
                  child: ListTile(
                    title: Text(it.title),
                    subtitle: Text(
                      it.detail,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    isThreeLine: it.detail.length > 48,
                    trailing: Text(
                      _shortDate(it.createdAt),
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await AppServices.saved.addNote(
            title: 'Note',
            detail: 'Manual entry ${DateTime.now().toIso8601String()}',
          );
          _reload();
        },
        icon: const Icon(Icons.add),
        label: const Text('Add note'),
      ),
    );
  }

  String _shortDate(DateTime d) {
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }
}

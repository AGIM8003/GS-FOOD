import 'package:flutter/material.dart';

import '../../app/services.dart';
import '../../data/repositories/use_first_repository.dart';

/// Use-first list — rules-driven ranking when packs ship (§5.1).
class UseFirstPage extends StatefulWidget {
  const UseFirstPage({super.key});

  @override
  State<UseFirstPage> createState() => _UseFirstPageState();
}

class _UseFirstPageState extends State<UseFirstPage> {
  late Future<List<UseFirstEntry>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<UseFirstEntry>> _load() async {
    await AppServices.useFirst.seedDemoIfEmpty();
    return AppServices.useFirst.listOrdered();
  }

  void _reload() {
    setState(() {
      _future = _load();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Use first')),
      body: FutureBuilder<List<UseFirstEntry>>(
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
            return RefreshIndicator(
              onRefresh: () async => _reload(),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(height: MediaQuery.sizeOf(context).height * 0.25),
                  Center(
                    child: Text(
                      'Nothing here yet. Tap + Add or pull to refresh.',
                      style: Theme.of(context).textTheme.bodyLarge,
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
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
                return ListTile(
                  leading: CircleAvatar(
                    child: Text('${i + 1}'),
                  ),
                  title: Text(it.label),
                  subtitle: Text(it.note),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () async {
                      await AppServices.useFirst.delete(it.id);
                      _reload();
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final label = await showDialog<String>(
            context: context,
            builder: (ctx) {
              final c = TextEditingController();
              return AlertDialog(
                title: const Text('Add item'),
                content: TextField(
                  controller: c,
                  decoration: const InputDecoration(
                    labelText: 'Label',
                    hintText: 'e.g. Leftover soup',
                  ),
                  autofocus: true,
                  onSubmitted: (v) {
                    final t = v.trim();
                    if (t.isNotEmpty) Navigator.pop(ctx, t);
                  },
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Cancel'),
                  ),
                  FilledButton(
                    onPressed: () {
                      final t = c.text.trim();
                      if (t.isEmpty) return;
                      Navigator.pop(ctx, t);
                    },
                    child: const Text('Add'),
                  ),
                ],
              );
            },
          );
          if (label == null || label.isEmpty || !mounted) return;
          await AppServices.useFirst.add(label: label, note: 'Added from app');
          _reload();
        },
        icon: const Icon(Icons.add),
        label: const Text('Add'),
      ),
    );
  }
}

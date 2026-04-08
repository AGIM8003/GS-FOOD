import 'package:sqflite/sqflite.dart';

import '../../recall/recall_provider.dart';
import '../../recall/recall_record.dart';
import '../local/app_database.dart';

class RecallRepository {
  RecallRepository(this._db);

  final AppDatabase _db;

  Database get _database => _db.db;

  Future<void> replaceFromProvider(RecallProvider provider, {int limit = 15}) async {
    final rows = await provider.fetchRecent(limit: limit);
    final batch = _database.batch();
    batch.delete('recall_cache');
    for (final r in rows) {
      batch.insert('recall_cache', {
        'recall_id': r.id,
        'source': r.source,
        'title': r.title,
        'summary': r.summary,
        'url': r.url,
        'fetched_at': r.fetchedAt.millisecondsSinceEpoch,
        'raw_json': r.rawJson,
      });
    }
    await batch.commit(noResult: true);
  }

  Future<List<RecallRecord>> listCached() async {
    final maps = await _database.query(
      'recall_cache',
      orderBy: 'fetched_at DESC',
    );
    return maps.map((m) {
      return RecallRecord(
        id: m['recall_id']! as String,
        source: m['source']! as String,
        title: m['title']! as String,
        summary: m['summary']! as String,
        url: m['url'] as String?,
        fetchedAt: DateTime.fromMillisecondsSinceEpoch(m['fetched_at']! as int),
        rawJson: m['raw_json']! as String,
      );
    }).toList();
  }

  /// Provenance line for UI.
  Future<String> provenanceSummary() async {
    final rows = await _database.query('recall_cache', limit: 1);
    if (rows.isEmpty) {
      return 'No cached recalls — pull to refresh when online.';
    }
    final src = rows.first['source'] as String? ?? 'unknown';
    final t = rows.first['fetched_at'] as int;
    final when = DateTime.fromMillisecondsSinceEpoch(t).toIso8601String();
    return 'Source: $src — cached at $when';
  }
}

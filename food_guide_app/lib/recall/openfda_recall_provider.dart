import 'dart:convert';

import 'package:http/http.dart' as http;

import 'recall_provider.dart';
import 'recall_record.dart';

/// openFDA food enforcement API (public, rate-limited).
class OpenFdaRecallProvider implements RecallProvider {
  OpenFdaRecallProvider({http.Client? client, this.timeout = const Duration(seconds: 20)})
      : _client = client ?? http.Client();

  final http.Client _client;
  final Duration timeout;

  static const _base = 'https://api.fda.gov/food/enforcement.json';

  @override
  String get provenanceLabel => 'openFDA food enforcement API';

  @override
  Future<List<RecallRecord>> fetchRecent({int limit = 15}) async {
    final uri = Uri.parse('$_base?limit=$limit');
    final res = await _client.get(uri).timeout(timeout);
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw StateError('openfda_http_${res.statusCode}');
    }
    final decoded = json.decode(res.body) as Map<String, dynamic>;
    final results = decoded['results'];
    if (results is! List) {
      return [];
    }
    final now = DateTime.now();
    final out = <RecallRecord>[];
    for (final item in results) {
      if (item is! Map) continue;
      final m = Map<String, dynamic>.from(item as Map);
      final id = m['recall_number']?.toString() ?? m['product_code']?.toString() ?? '';
      if (id.isEmpty) continue;
      final title = m['product_description']?.toString() ?? 'Recall';
      final summary = m['reason_for_recall']?.toString() ?? '';
      out.add(
        RecallRecord(
          id: id,
          source: 'openFDA',
          title: title,
          summary: summary,
          url: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts',
          fetchedAt: now,
          rawJson: json.encode(m),
        ),
      );
    }
    return out;
  }

  void close() {
    _client.close();
  }
}

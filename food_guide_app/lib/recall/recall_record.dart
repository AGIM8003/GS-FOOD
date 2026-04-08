class RecallRecord {
  RecallRecord({
    required this.id,
    required this.source,
    required this.title,
    required this.summary,
    this.url,
    required this.fetchedAt,
    required this.rawJson,
  });

  final String id;
  final String source;
  final String title;
  final String summary;
  final String? url;
  final DateTime fetchedAt;
  final String rawJson;
}

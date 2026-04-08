import 'recall_record.dart';

/// Pluggable authority recall feed (uplift U6).
abstract class RecallProvider {
  String get provenanceLabel;

  Future<List<RecallRecord>> fetchRecent({int limit = 15});
}

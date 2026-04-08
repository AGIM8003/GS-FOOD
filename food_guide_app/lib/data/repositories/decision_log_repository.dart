import 'dart:convert';

import 'package:sqflite/sqflite.dart';

import '../../engine/answer_card.dart';
import '../local/app_database.dart';

/// Persist decision traces for evaluation replay (uplift U1 / U7).
class DecisionLogRepository {
  DecisionLogRepository(this._db);

  final AppDatabase _db;

  Database get _database => _db.db;

  Future<void> append({
    required String traceId,
    required String captureKind,
    required String inputSummary,
    AnswerCard? answer,
  }) async {
    final payload = json.encode({
      'traceId': traceId,
      'captureKind': captureKind,
      'inputSummary': inputSummary,
      if (answer != null)
        'answer': {
          'headline': answer.headline,
          'body': answer.body,
          'clarification': answer.clarificationQuestion,
        },
    });
    await _database.insert('decision_log', {
      'trace_id': traceId,
      'capture_kind': captureKind,
      'input_summary': inputSummary,
      'answer_headline': answer?.headline,
      'payload_json': payload,
      'created_at': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Future<List<Map<String, Object?>>> recent({int limit = 50}) async {
    return _database.query(
      'decision_log',
      orderBy: 'created_at DESC',
      limit: limit,
    );
  }
}

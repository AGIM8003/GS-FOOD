/// Single-screen answer (GS-FOOD3 §17 — short, one clarification max).
class AnswerCard {
  AnswerCard({
    required this.headline,
    required this.body,
    this.actions = const [],
    this.clarificationQuestion,
    this.disclaimerFooter,
    this.confidenceNote,
    this.traceId,
  });

  final String headline;
  final String body;
  final List<String> actions;
  final String? clarificationQuestion;
  final String? disclaimerFooter;
  final String? confidenceNote;
  final String? traceId;

  String get primaryText {
    final b = StringBuffer(headline);
    if (body.isNotEmpty) {
      b.writeln();
      b.write(body);
    }
    if (clarificationQuestion != null && clarificationQuestion!.isNotEmpty) {
      b.writeln();
      b.write('\n$clarificationQuestion');
    }
    if (disclaimerFooter != null && disclaimerFooter!.isNotEmpty) {
      b.writeln();
      b.write('\n$disclaimerFooter');
    }
    return b.toString();
  }
}

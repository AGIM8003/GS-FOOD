import 'package:flutter/material.dart';

import '../../app/answer_sheet.dart';
import '../../app/services.dart';
import '../../engine/capture_context.dart';

/// Free-text Ask — routes through [RuleEngine] (§5 Decision).
class AskPage extends StatefulWidget {
  const AskPage({super.key});

  @override
  State<AskPage> createState() => _AskPageState();
}

class _AskPageState extends State<AskPage> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    final ctx = CaptureContext(
      kind: CaptureKind.askText,
      rawText: text,
    );
    final entity = await AppServices.normalizer.normalize(ctx);
    final answer = AppServices.ruleEngine.decide(ctx, entity);

    await AppServices.decisionLog.append(
      traceId: answer.traceId ?? 'unknown',
      captureKind: 'askText',
      inputSummary: text.length > 200 ? '${text.substring(0, 200)}…' : text,
      answer: answer,
    );

    await AppServices.saved.addNote(title: 'Ask: ${answer.headline}', detail: answer.primaryText);
    _controller.clear();
    if (!mounted) return;
    await showAnswerSheet(context, answer);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ask')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Short question → short answer. One clarification at most (§17).',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _controller,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                hintText: 'e.g. Where should I store cut tomatoes?',
                border: OutlineInputBorder(),
              ),
              onSubmitted: (_) => _submit(),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _submit,
              child: const Text('Get answer'),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';

import '../engine/answer_card.dart';

/// Reusable bottom sheet for [AnswerCard] (one-screen answers §17).
Future<void> showAnswerSheet(BuildContext context, AnswerCard card) {
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (ctx) {
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(card.headline, style: Theme.of(ctx).textTheme.titleLarge),
                const SizedBox(height: 12),
                Text(card.body, style: Theme.of(ctx).textTheme.bodyLarge),
                if (card.clarificationQuestion != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    card.clarificationQuestion!,
                    style: Theme.of(ctx).textTheme.titleSmall?.copyWith(
                          color: Theme.of(ctx).colorScheme.primary,
                        ),
                  ),
                ],
                if (card.confidenceNote != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    card.confidenceNote!,
                    style: Theme.of(ctx).textTheme.labelSmall,
                  ),
                ],
                if (card.disclaimerFooter != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    card.disclaimerFooter!,
                    style: Theme.of(ctx).textTheme.bodySmall?.copyWith(
                          fontStyle: FontStyle.italic,
                          color: Theme.of(ctx).colorScheme.outline,
                        ),
                  ),
                ],
                if (card.traceId != null) ...[
                  const SizedBox(height: 8),
                  SelectableText(
                    'Trace: ${card.traceId}',
                    style: Theme.of(ctx).textTheme.labelSmall,
                  ),
                ],
              ],
            ),
          ),
        ),
      );
    },
  );
}

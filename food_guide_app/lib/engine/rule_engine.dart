import 'dart:math';

import 'answer_card.dart';
import 'capture_context.dart';
import 'entities.dart';
import 'entity_normalizer.dart';

/// Deterministic templates — ML/cloud only narrows entities upstream (GS-FOOD3 §5.2 Decision).
class RuleEngine {
  RuleEngine({Random? random}) : _random = random ?? Random.secure();

  final Random _random;

  String newTraceId() {
    final b = StringBuffer('tr_');
    for (var i = 0; i < 12; i++) {
      b.write(_random.nextInt(16).toRadixString(16));
    }
    return b.toString();
  }

  AnswerCard decide(CaptureContext ctx, NormalizedEntity? entity) {
    final trace = newTraceId();
    if (entity == null) {
      return AnswerCard(
        headline: 'Need a bit more',
        body: 'I could not match that yet. Try scanning a barcode or naming one food.',
        clarificationQuestion: 'What single item are you asking about?',
        disclaimerFooter: EntityNormalizer.allergenDisclaimer,
        traceId: trace,
      );
    }
    if (entity.product != null) {
      return _productCard(entity.product!, trace);
    }
    if (entity.food != null) {
      return _foodCard(entity.food!, trace);
    }
    if (entity.freeText != null) {
      return _askTextCard(ctx, entity.freeText!, trace);
    }
    return AnswerCard(
      headline: 'Try again',
      body: 'Unexpected state — please rephrase.',
      disclaimerFooter: EntityNormalizer.allergenDisclaimer,
      traceId: trace,
    );
  }

  AnswerCard _productCard(ProductEntity p, String trace) {
    final name = p.productName ?? 'This product';
    final lines = <String>[];
    if (p.ingredientsText != null && p.ingredientsText!.trim().isNotEmpty) {
      lines.add('Ingredients on file: check packaging if anything changed.');
    }
    lines.add('Store sealed products per label; after opening, refrigerate if the label says so.');
    if (p.hasDeclaredAllergens) {
      lines.add('Declared allergens (from data): ${p.allergenIds.join(", ")}.');
    }
    return AnswerCard(
      headline: name,
      body: lines.join(' '),
      actions: const ['Save to list', 'Scan another'],
      disclaimerFooter: EntityNormalizer.allergenDisclaimer,
      confidenceNote: p.ingredientsText == null ? 'Limited product data — verify on pack.' : null,
      traceId: trace,
    );
  }

  AnswerCard _foodCard(FoodEntity f, String trace) {
    final name = f.displayName ?? f.canonicalKey;
    final storage = f.storageHint ?? 'Use regional pack guidance when available.';
    final sep = f.separateFrom.isEmpty ? '' : ' Keep away from: ${f.separateFrom.join(", ")}.';
    return AnswerCard(
      headline: name,
      body: 'Storage: $storage.$sep',
      actions: const ['Mark use-first', 'Save note'],
      clarificationQuestion: null,
      disclaimerFooter: EntityNormalizer.allergenDisclaimer,
      traceId: trace,
    );
  }

  AnswerCard _askTextCard(CaptureContext ctx, String text, String trace) {
    final lower = text.toLowerCase();
    if (lower.contains('use first') || lower.contains('eat first')) {
      return AnswerCard(
        headline: 'Use first',
        body: 'Check dates and opened vs unopened items. Move anything close to date to the front.',
        actions: const ['Open Use first tab'],
        disclaimerFooter: EntityNormalizer.allergenDisclaimer,
        traceId: trace,
      );
    }
    if (lower.contains('fridge') || lower.contains('refrigerat')) {
      return AnswerCard(
        headline: 'Fridge storage',
        body: 'Most cooked leftovers and cut produce go in the fridge within 2 hours of cooking/cutting. Cover containers.',
        clarificationQuestion: 'Is the item already cut or cooked?',
        disclaimerFooter: EntityNormalizer.allergenDisclaimer,
        traceId: trace,
      );
    }
    if (lower.contains('freeze') || lower.contains('freezer')) {
      return AnswerCard(
        headline: 'Freezing',
        body: 'Cool hot food before freezing. Label with date. Texture may change after thaw for some items.',
        disclaimerFooter: EntityNormalizer.allergenDisclaimer,
        traceId: trace,
      );
    }
    return AnswerCard(
      headline: 'Quick tip',
      body: 'Keep questions to one food or one barcode for the shortest answer.',
      clarificationQuestion: 'Is this about storage, shelf life, or what to cook?',
      disclaimerFooter: EntityNormalizer.allergenDisclaimer,
      traceId: trace,
    );
  }
}

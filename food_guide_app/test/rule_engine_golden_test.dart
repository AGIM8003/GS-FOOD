import 'package:flutter_test/flutter_test.dart';
import 'package:food_guide_app/engine/capture_context.dart';
import 'package:food_guide_app/engine/entity_normalizer.dart';
import 'package:food_guide_app/engine/rule_engine.dart';

void main() {
  final engine = RuleEngine();

  test('askText fridge path includes single clarification', () {
    final ctx = CaptureContext(kind: CaptureKind.askText, rawText: 'Should milk go in the fridge?');
    final card = engine.decide(ctx, null);
    expect(card.headline, isNotEmpty);
    expect(card.clarificationQuestion, isNotNull);
    expect(card.disclaimerFooter, contains('Allergen'));
  });

  test('tomato normalized from bundled pack hints + rule headline', () async {
    final norm = EntityNormalizer();
    final ctx = CaptureContext(kind: CaptureKind.askText, rawText: 'store tomatoes');
    final entity = await norm.normalize(ctx);
    final card = engine.decide(ctx, entity);
    expect(card.headline.toLowerCase(), contains('tomato'));
    expect(card.disclaimerFooter, contains('Allergen'));
  });
}

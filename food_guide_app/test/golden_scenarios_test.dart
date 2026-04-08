import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('golden_scenarios.json parses and has expected shape', () async {
    final f = File('test/fixtures/golden_scenarios.json');
    expect(await f.exists(), isTrue);
    final decoded = json.decode(await f.readAsString()) as Map<String, dynamic>;
    expect(decoded['schema_version'], 2);
    final list = decoded['scenarios'] as List<dynamic>;
    expect(list.length, greaterThanOrEqualTo(3));
    for (final s in list) {
      final m = s as Map<String, dynamic>;
      expect(m['id'], isNotNull);
      expect(m['kind'], isNotNull);
      expect(m['expect'], isNotNull);
    }

    final tomato = list.cast<Map<String, dynamic>>().firstWhere(
          (m) => m['id'] == 'ask_storage_tomato',
        );
    final expectMap = tomato['expect'] as Map<String, dynamic>;
    expect(expectMap['max_clarifications'], 1);
    expect(expectMap['answer_headline_contains'], 'tomato');
  });
}

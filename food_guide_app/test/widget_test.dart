import 'package:flutter_test/flutter_test.dart';

import 'package:food_guide_app/app/food_guide_app.dart';

void main() {
  testWidgets('Food Guide shell shows Scan tab', (tester) async {
    await tester.pumpWidget(const FoodGuideApp());
    await tester.pumpAndSettle();
    expect(find.text('Scan'), findsOneWidget);
  });
}

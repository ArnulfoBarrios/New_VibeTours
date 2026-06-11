import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:vibetoursapp/src/app.dart';

void main() {
  testWidgets('VIBETOURS boots without startup exceptions', (tester) async {
    SharedPreferences.setMockInitialValues({
      'vibetours_onboarding_complete': false,
    });

    await tester.pumpWidget(const ProviderScope(child: VibeToursApp()));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    expect(tester.takeException(), isNull);
  });
}

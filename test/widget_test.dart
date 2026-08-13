import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:vibetoursapp/src/app.dart';
import 'package:vibetoursapp/src/state/app_state.dart';
import 'package:vibetoursapp/src/features/ai/ai_planner_screen.dart';

void main() {
  testWidgets('VIBETOURS boots without startup exceptions', (tester) async {
    // Configurar pantalla simulada de tamaño estándar móvil para evitar falsos positivos de desbordamiento (RenderFlex overflow)
    tester.view.physicalSize = const Size(412, 892);
    tester.view.devicePixelRatio = 1.0;
    
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    SharedPreferences.setMockInitialValues({
      'vibetours_onboarding_complete': false,
    });
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
      ],
      child: const VibeToursApp(),
    ));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
  });

  testWidgets('FormattedMessageText renders headers, bold text and bullets cleanly', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: FormattedMessageText(
            text: '### Título Recomendado\n**Presupuesto:** Moderado\n- Hotel Centro\n- Museo del Prado',
            isUser: false,
            textColor: Colors.black,
          ),
        ),
      ),
    );

    expect(find.text('Título Recomendado'), findsOneWidget);
    expect(find.text('### Título Recomendado'), findsNothing);
    expect(find.textContaining('•'), findsNWidgets(2));
  });
}

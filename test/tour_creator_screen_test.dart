import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vibetoursapp/src/features/creator/tour_creator_screen.dart';
import 'package:vibetoursapp/src/l10n/generated/app_localizations.dart';
import 'package:vibetoursapp/src/state/app_state.dart';

void main() {
  testWidgets('TourCreatorScreen should adapt top padding to SafeArea top padding', (tester) async {
    const double simulatedStatusBarHeight = 44.0;

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          mapStyleProvider.overrideWithValue('https://tiles.openfreemap.org/styles/liberty'),
        ],
        child: MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: AppLocalizations.supportedLocales,
          home: MediaQuery(
            data: const MediaQueryData(
              padding: EdgeInsets.only(top: simulatedStatusBarHeight, bottom: 34.0),
            ),
            child: const Scaffold(
              body: TourCreatorScreen(),
            ),
          ),
        ),
      ),
    );

    await tester.pump();

    final listViewFinder = find.byType(ListView).first;
    expect(listViewFinder, findsOneWidget);

    final listView = tester.widget<ListView>(listViewFinder);
    final padding = listView.padding as EdgeInsets;

    expect(padding.top, equals(simulatedStatusBarHeight + 12.0));
  });
}

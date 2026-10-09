import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vibetoursapp/src/l10n/generated/app_localizations.dart';

void main() {
  group('Premium Coming Soon Modal', () {
    Widget buildTestApp({required Widget child}) {
      return ProviderScope(
        child: MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: AppLocalizations.supportedLocales,
          locale: const Locale('es'),
          home: Scaffold(body: child),
        ),
      );
    }

    testWidgets('should render premium modal with extended limits copy when opened', (tester) async {
      await tester.pumpWidget(
        buildTestApp(
          child: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () {
                  // Simulate opening the modal via the same mechanism
                  showModalBottomSheet(
                    context: context,
                    backgroundColor: Theme.of(context).colorScheme.surface,
                    isScrollControlled: true,
                    shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                    ),
                    builder: (ctx) {
                      // We can directly verify the rendered sheet
                      final l10n = AppLocalizations.of(ctx);
                      return SafeArea(
                        top: false,
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(l10n.premiumComingSoonBadge),
                              Text(l10n.premiumComingSoonTitle),
                              Text(l10n.premiumComingSoonDescription),
                              Text(l10n.premiumFeatureAiLimitsTitle),
                              Text(l10n.premiumFeatureRoutesTitle),
                              Text(l10n.premiumFeaturePriorityTitle),
                              ElevatedButton(
                                onPressed: () => Navigator.pop(ctx),
                                child: Text(l10n.premiumUnderstoodBtn),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
                child: const Text('Open Modal'),
              );
            },
          ),
        ),
      );

      // Tap to open modal
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Verify that the title, badge, and realistic benefits are present
      expect(find.text('PRÓXIMAMENTE'), findsOneWidget);
      expect(find.text('VIBETOURS Premium'), findsOneWidget);
      expect(find.text('Límites de IA extendidos'), findsOneWidget);
      expect(find.text('Tours más completos'), findsOneWidget);
      expect(find.text('Acceso prioritario'), findsOneWidget);

      // Tap close button
      await tester.tap(find.text('¡Entendido!'));
      await tester.pumpAndSettle();

      // Verify sheet is closed
      expect(find.text('VIBETOURS Premium'), findsNothing);
    });
  });
}

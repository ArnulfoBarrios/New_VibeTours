import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vibetoursapp/src/features/legal/licenses_screen.dart';
import 'package:vibetoursapp/src/l10n/generated/app_localizations.dart';

void main() {
  group('PackageLicense Model', () {
    test('should format fullText correctly when PackageLicense has multiple paragraphs and indentations', () {
      const package = PackageLicense(
        name: 'test_package',
        entries: [
          [
            LicenseParagraph('MIT License', LicenseParagraph.centeredIndent),
            LicenseParagraph('Copyright (c) 2026 Test', 0),
            LicenseParagraph('Permission is hereby granted...', 1),
          ],
        ],
      );

      final text = package.fullText;
      expect(text, contains('MIT License'));
      expect(text, contains('Copyright (c) 2026 Test'));
      expect(text, contains('  Permission is hereby granted...'));
      expect(package.licenseCount, equals(1));
    });
  });

  group('LicensesScreen Widget', () {
    final mockPackages = [
      const PackageLicense(
        name: 'flutter_map',
        entries: [
          [LicenseParagraph('BSD License', 0)],
        ],
      ),
      const PackageLicense(
        name: 'supabase_flutter',
        entries: [
          [LicenseParagraph('MIT License', 0)],
          [LicenseParagraph('Apache 2.0', 0)],
        ],
      ),
    ];

    Widget buildTestWidget() {
      return ProviderScope(
        overrides: [
          packageLicensesProvider.overrideWith((ref) async => mockPackages),
        ],
        child: const MaterialApp(
          localizationsDelegates: [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: AppLocalizations.supportedLocales,
          locale: Locale('es'),
          home: LicensesScreen(),
        ),
      );
    }

    testWidgets('should render branding and package cards when screen is loaded', (tester) async {
      tester.view.physicalSize = const Size(412, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('VIBETOURS'), findsOneWidget);
      expect(find.text('OpenStreetMap Contributors'), findsOneWidget);
      expect(find.text('flutter_map'), findsOneWidget);
      expect(find.text('supabase_flutter'), findsOneWidget);
    });

    testWidgets('should filter packages when search query is entered', (tester) async {
      tester.view.physicalSize = const Size(412, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      final searchField = find.byType(TextField);
      expect(searchField, findsOneWidget);

      await tester.enterText(searchField, 'supabase');
      await tester.pumpAndSettle();

      expect(find.text('supabase_flutter'), findsOneWidget);
      expect(find.text('flutter_map'), findsNothing);
    });

    testWidgets('should show empty state message when search has no matches', (tester) async {
      tester.view.physicalSize = const Size(412, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      final searchField = find.byType(TextField);
      await tester.enterText(searchField, 'nonexistent_package');
      await tester.pumpAndSettle();

      expect(find.text('Limpiar búsqueda'), findsOneWidget);
      expect(find.text('supabase_flutter'), findsNothing);
    });

    testWidgets('should open license detail modal when package tile is tapped', (tester) async {
      tester.view.physicalSize = const Size(412, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.tap(find.text('flutter_map'));
      await tester.pumpAndSettle();

      expect(find.text('BSD License'), findsOneWidget);
      expect(find.text('Copiar texto'), findsOneWidget);
    });
  });
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:vibetoursapp/src/features/splash/splash_view.dart';
import 'package:vibetoursapp/src/features/splash/splash_screen.dart';
import 'package:vibetoursapp/src/state/app_state.dart';

class FakeOnboardingCompleteTrue extends OnboardingCompleteController {
  @override
  Future<bool> build() async => true;
}

void main() {
  group('SplashView Widget Tests', () {
    testWidgets('should render clean light branding with white background', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: SplashView(),
        ),
      );

      expect(find.text('from'), findsOneWidget);
      expect(find.byType(Image), findsNWidgets(2)); // Center circular logo + Emotiva logo
      
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold));
      expect(scaffold.backgroundColor, Colors.white);
    });
  });

  group('SplashScreen Navigation Tests', () {
    testWidgets('should navigate to home when onboarding is complete', (tester) async {
      tester.view.physicalSize = const Size(412, 892);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final router = GoRouter(
        initialLocation: '/',
        routes: [
          GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
          GoRoute(path: '/home', builder: (context, state) => const Scaffold(body: Text('Home Screen'))),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            onboardingCompleteProvider.overrideWith(FakeOnboardingCompleteTrue.new),
          ],
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );

      // Initially renders splash view
      expect(find.byType(SplashView), findsOneWidget);

      // Advance past splash timer
      await tester.pump(const Duration(milliseconds: 1100));
      await tester.pumpAndSettle();

      // Successfully routes to home screen
      expect(find.text('Home Screen'), findsOneWidget);
    });
  });
}

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'features/ai/ai_builder_screen.dart';
import 'features/ai/ai_planner_screen.dart';
import 'features/admin/admin_screen.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/require_auth.dart';
import 'features/creator/tour_creator_screen.dart';
import 'features/home/home_screen.dart';
import 'features/home/place_route_screen.dart';
import 'features/legal/legal_screen.dart';
import 'features/onboarding/onboarding_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/profile/tourist_preferences_screen.dart';
import 'features/settings/settings_screen.dart';
import 'features/shell/main_shell.dart';
import 'features/support/help_center_screen.dart';
import 'features/support/pqrs_screen.dart';
import 'features/tour_live/live_tour_screen.dart';
import 'features/tours/tour_detail_screen.dart';
import 'features/tours/tours_screen.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_core/firebase_core.dart';
import 'state/app_state.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final client = ref.watch(supabaseClientProvider);
  return GoRouter(
    initialLocation: '/',
    observers: [
      if (Firebase.apps.isNotEmpty)
        FirebaseAnalyticsObserver(analytics: FirebaseAnalytics.instance),
    ],
    refreshListenable: client != null
        ? GoRouterRefreshStream(client.auth.onAuthStateChange)
        : null,
    redirect: (context, state) {
      final currentUser = ref.read(authServiceProvider).currentUser;
      final isAdmin = ref.read(isAdminProvider);
      if (state.matchedLocation == '/admin' && !isAdmin) {
        return currentUser == null ? '/login' : '/settings';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const _StartupRoute()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
              GoRoute(path: '/ai', builder: (context, state) => const AiPlannerScreen()),
              GoRoute(path: '/ai/builder', builder: (context, state) => const AiBuilderScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/creator', builder: (context, state) => const AiPlannerScreen()),
              GoRoute(path: '/creator/manual', builder: (context, state) => const RequireAuth(child: TourCreatorScreen())),
              GoRoute(path: '/creator/ai', builder: (context, state) => const AiPlannerScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/tours', builder: (context, state) => const ToursScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/profile', builder: (context, state) => const RequireAuth(child: ProfileScreen())),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/tours/:id',
        pageBuilder: (context, state) {
          return CustomTransitionPage(
            key: state.pageKey,
            child: TourDetailScreen(tourId: state.pathParameters['id']!),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              return SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(1.0, 0.0),
                  end: Offset.zero,
                ).animate(CurvedAnimation(
                  parent: animation,
                  curve: Curves.easeOutCubic,
                )),
                child: child,
              );
            },
          );
        },
      ),
      GoRoute(
        path: '/live/:id',
        pageBuilder: (context, state) {
          return CustomTransitionPage(
            key: state.pageKey,
            child: LiveTourScreen(tourId: state.pathParameters['id']!),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              return FadeTransition(
                opacity: animation,
                child: ScaleTransition(
                  scale: Tween<double>(begin: 0.96, end: 1.0).animate(CurvedAnimation(
                    parent: animation,
                    curve: Curves.easeOutCubic,
                  )),
                  child: child,
                ),
              );
            },
          );
        },
      ),
      GoRoute(path: '/pqrs', builder: (context, state) => const PqrsScreen()),
      GoRoute(
        path: '/place-route',
        builder: (context, state) => const PlaceRouteScreen(),
      ),
      GoRoute(path: '/admin', builder: (context, state) => const AdminScreen()),
      GoRoute(
        path: '/tourist_preferences',
        builder: (context, state) => const TouristPreferencesScreen(isOnboarding: true),
      ),
      GoRoute(
        path: '/legal/:kind',
        builder: (context, state) =>
            LegalScreen(kind: state.pathParameters['kind'] ?? 'terms'),
      ),
      GoRoute(
        path: '/help',
        builder: (context, state) => const HelpCenterScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
  );
});

class _StartupRoute extends ConsumerStatefulWidget {
  const _StartupRoute();
  @override
  ConsumerState<_StartupRoute> createState() => _StartupRouteState();
}

class _StartupRouteState extends ConsumerState<_StartupRoute> {
  @override
  void initState() {
    super.initState();
    _checkOnboarding();
  }

  Future<void> _checkOnboarding() async {
    try {
      final complete = await ref.read(onboardingCompleteProvider.future);
      if (mounted && complete) {
        context.go('/home');
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final onboarding = ref.watch(onboardingCompleteProvider);

    return onboarding.when(
      data: (complete) {
        if (complete) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        return const OnboardingScreen();
      },
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, stackTrace) => const OnboardingScreen(),
    );
  }
}

class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  late final StreamSubscription<dynamic> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

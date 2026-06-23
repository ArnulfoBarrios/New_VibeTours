import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'features/ai/ai_planner_screen.dart';
import 'features/admin/admin_screen.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/require_auth.dart';
import 'features/creator/my_tours_screen.dart';
import 'features/creator/tour_creator_screen.dart';
import 'features/home/home_screen.dart';
import 'features/home/place_route_screen.dart';
import 'features/legal/legal_screen.dart';
import 'features/onboarding/onboarding_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/settings/settings_screen.dart';
import 'features/shell/main_shell.dart';
import 'features/support/help_center_screen.dart';
import 'features/support/pqrs_screen.dart';
import 'features/tour_live/live_tour_screen.dart';
import 'features/tours/tour_detail_screen.dart';
import 'features/tours/tours_screen.dart';
import 'state/app_state.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final currentUser = ref.watch(authUserProvider).valueOrNull;
  final isAdmin = ref.watch(isAdminProvider);
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      if (state.matchedLocation == '/admin' && !isAdmin) {
        return currentUser == null ? '/login' : '/settings';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const _StartupRoute()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/home',
        builder: (context, state) =>
            const MainShell(currentIndex: 0, child: HomeScreen()),
      ),
      GoRoute(
        path: '/tours',
        builder: (context, state) =>
            const MainShell(currentIndex: 1, child: ToursScreen()),
      ),
      GoRoute(
        path: '/tours/:id',
        builder: (context, state) =>
            TourDetailScreen(tourId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/live/:id',
        builder: (context, state) =>
            LiveTourScreen(tourId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/ai',
        builder: (context, state) =>
            const MainShell(currentIndex: 0, child: AiPlannerScreen()),
      ),
      GoRoute(
        path: '/creator',
        builder: (context, state) => const MainShell(
          currentIndex: 2,
          child: RequireAuth(child: MyToursScreen()),
        ),
      ),
      GoRoute(
        path: '/creator/manual',
        builder: (context, state) => const MainShell(
          currentIndex: 2,
          child: RequireAuth(child: TourCreatorScreen()),
        ),
      ),
      GoRoute(
        path: '/creator/ai',
        builder: (context, state) => const MainShell(
          currentIndex: 2,
          child: RequireAuth(child: AiPlannerScreen()),
        ),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const MainShell(
          currentIndex: 3,
          child: RequireAuth(child: ProfileScreen()),
        ),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const MainShell(
          currentIndex: 3,
          child: SettingsScreen(embedded: true),
        ),
      ),
      GoRoute(path: '/pqrs', builder: (context, state) => const PqrsScreen()),
      GoRoute(
        path: '/place-route',
        builder: (context, state) => const PlaceRouteScreen(),
      ),
      GoRoute(path: '/admin', builder: (context, state) => const AdminScreen()),
      GoRoute(
        path: '/legal/:kind',
        builder: (context, state) =>
            LegalScreen(kind: state.pathParameters['kind'] ?? 'terms'),
      ),
      GoRoute(
        path: '/help',
        builder: (context, state) => const HelpCenterScreen(),
      ),
    ],
  );
});

class _StartupRoute extends ConsumerWidget {
  const _StartupRoute();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final onboarding = ref.watch(onboardingCompleteProvider);
    return onboarding.when(
      data: (complete) => complete
          ? const MainShell(currentIndex: 0, child: HomeScreen())
          : const OnboardingScreen(),
      loading: () => const MainShell(
        currentIndex: 0,
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (error, stackTrace) => const OnboardingScreen(),
    );
  }
}

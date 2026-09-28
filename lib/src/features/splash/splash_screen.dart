import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../state/app_state.dart';
import '../onboarding/onboarding_screen.dart';
import 'splash_view.dart';

/// Entry screen that presents the clean, high-fidelity splash screen (Image 2)
/// and smoothly routes to the main app once ready.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  Timer? _timer;
  bool _readyToNavigate = false;
  bool _isOnboardingComplete = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initialize();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _initialize() async {
    try {
      _isOnboardingComplete =
          await ref.read(onboardingCompleteProvider.future);
    } catch (_) {
      _isOnboardingComplete = false;
    }

    if (!mounted) return;

    // Display the clean, high-resolution splash screen (Image 2)
    // for 1000ms so the user experiences the crisp branding.
    _timer = Timer(const Duration(milliseconds: 1000), () {
      if (!mounted) return;
      if (_isOnboardingComplete) {
        context.go('/home');
      } else {
        setState(() {
          _readyToNavigate = true;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_readyToNavigate && !_isOnboardingComplete) {
      return const OnboardingScreen();
    }

    return const SplashView();
  }
}

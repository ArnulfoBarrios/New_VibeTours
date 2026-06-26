import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/premium_components.dart';
import '../../l10n/generated/app_localizations.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return PremiumScaffold(
      safeBottom: true,
      child: Column(
        children: [
          Expanded(
            child: const _IntroPage(),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: double.infinity,
                  child: LiquidButton(
                    label: l10n.startNow,
                    icon: Icons.rocket_launch_rounded,
                    onPressed: () {
                      context.push('/tourist_preferences');
                    },
                  ),
                ),
                const SizedBox(height: 16),
                GestureDetector(
                  onTap: () => context.go('/login'),
                  child: Text.rich(
                    TextSpan(
                      text: l10n.alreadyUsedApp,
                      style: Theme.of(context).textTheme.bodyMedium,
                      children: [
                        TextSpan(
                          text: l10n.login,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.onSurface,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _IntroPage extends StatelessWidget {
  const _IntroPage();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          'VibeTours.',
          style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 56),
        ).animate().fadeIn().slideY(begin: -0.1),
        const SizedBox(height: 16),
        Text(
          AppLocalizations.of(context).introSlogan1,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ).animate().fadeIn(delay: 100.ms).slideY(begin: -0.1),
        const SizedBox(height: 48),
        Image.asset(
          Theme.of(context).brightness == Brightness.dark 
              ? 'assets/images/logo_dark.png' 
              : 'assets/images/logo_light.png',
          width: 320,
          height: 320,
          fit: BoxFit.contain,
        ).animate().fadeIn(delay: 200.ms).scale(begin: const Offset(0.9, 0.9)),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../state/app_state.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _pageController = PageController();
  int _page = 0;

  static const interests = [
    '❤️ Romántico',
    '🎉 Fiesta',
    '🌳 Naturaleza',
    '⛱️ Playa',
    '🦁 Safari',
    '🏔️ Aventura',
    '🎨 Arte y cultura',
    '👨‍👩‍👧 Familia',
    '🍽️ Gourmet',
    '🛍️ Compras',
    '🧘 Bienestar',
    '🎿 Esquí',
    '🥾 Senderismo',
    '💭 ¿Otra cosa?',
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(touristProfileProvider);
    return PremiumScaffold(
      safeBottom: true,
      child: Column(
        children: [
          if (_page > 0)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded),
                    onPressed: () => _pageController.previousPage(
                        duration: 300.ms, curve: Curves.easeOutCubic),
                  ),
                  Expanded(
                    child: AnimatedContainer(
                      duration: 220.ms,
                      height: 6,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: FractionallySizedBox(
                        alignment: Alignment.centerLeft,
                        widthFactor: 0.5,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 48), // Balance for back button
                ],
              ),
            ),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              onPageChanged: (value) => setState(() => _page = value),
              children: [
                const _IntroPage(),
                _ProfilePage(
                  profile: profile,
                  interests: interests,
                  onToggle: (interest) => ref
                      .read(touristProfileProvider.notifier)
                      .toggleInterest(interest),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: double.infinity,
                  child: LiquidButton(
                    label: _page == 1 ? 'Continuar' : 'Comienza',
                    icon: _page == 1 ? Icons.arrow_forward_rounded : Icons.rocket_launch_rounded,
                    onPressed: () {
                      if (_page == 1) {
                        _finish();
                      } else {
                        _pageController.nextPage(
                          duration: 300.ms,
                          curve: Curves.easeOutCubic,
                        );
                      }
                    },
                  ),
                ),
                if (_page == 0) ...[
                  const SizedBox(height: 16),
                  GestureDetector(
                    onTap: () => context.go('/login'),
                    child: Text.rich(
                      TextSpan(
                        text: '¿Ya has usado VibeTours? ',
                        style: Theme.of(context).textTheme.bodyMedium,
                        children: [
                          TextSpan(
                            text: 'Iniciar sesión',
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
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _finish() async {
    await ref.read(onboardingCompleteProvider.notifier).complete();
    if (!mounted) return;
    context.go('/login');
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
          'Tu viaje en minutos,\nno en semanas.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ).animate().fadeIn(delay: 100.ms).slideY(begin: -0.1),
        const SizedBox(height: 48),
        Container(
          height: 320,
          width: 320,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(160),
              topRight: Radius.circular(160),
              bottomLeft: Radius.circular(160),
              bottomRight: Radius.circular(80),
            ),
          ),
          child: const Center(
            child: Icon(Icons.travel_explore, size: 120, color: Colors.white),
          ),
        ).animate().fadeIn(delay: 200.ms).scale(begin: const Offset(0.9, 0.9)),
      ],
    );
  }
}

class _ProfilePage extends StatelessWidget {
  const _ProfilePage({
    required this.profile,
    required this.interests,
    required this.onToggle,
  });

  final dynamic profile;
  final List<String> interests;
  final ValueChanged<String> onToggle;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      children: [
        Text(
          'Dime qué tipo de viajes te gustan.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 24),
        ).animate().fadeIn(),
        const SizedBox(height: 32),
        Wrap(
          spacing: 12,
          runSpacing: 16,
          alignment: WrapAlignment.center,
          children: [
            for (final interest in interests)
              _InterestChip(
                label: interest,
                isSelected: profile.interests.contains(interest),
                onSelected: () => onToggle(interest),
              ),
          ],
        ).animate().fadeIn(delay: 100.ms),
      ],
    );
  }
}

class _InterestChip extends StatelessWidget {
  const _InterestChip({
    required this.label,
    required this.isSelected,
    required this.onSelected,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onSelected;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onSelected,
      child: AnimatedContainer(
        duration: 200.ms,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary.withValues(alpha: 0.15) : Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: isSelected ? AppTheme.primary : Colors.grey.withValues(alpha: 0.2),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? []
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                color: Theme.of(context).colorScheme.onSurface,
              ),
        ),
      ),
    );
  }
}

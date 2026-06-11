import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lottie/lottie.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../l10n/generated/app_localizations.dart';
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
    'Historia',
    'Cultura',
    'Gastronomia',
    'Naturaleza',
    'Playas',
    'Arquitectura',
    'Museos',
    'Vida nocturna',
    'Deportes',
    'Compras',
    'Fotografia',
    'Ecoturismo',
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final profile = ref.watch(touristProfileProvider);
    return PremiumScaffold(
      safeBottom: true,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
            child: Row(
              children: [
                Text(
                  l10n.appName,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const Spacer(),
                TextButton(onPressed: _finish, child: Text(l10n.skip)),
              ],
            ),
          ),
          Expanded(
            child: PageView(
              controller: _pageController,
              onPageChanged: (value) => setState(() => _page = value),
              children: [
                _IntroPage(
                  title: l10n.onboardingTitle,
                  subtitle: l10n.onboardingSubtitle,
                  icon: Icons.travel_explore_rounded,
                  steps: const [
                    'Descubre tours cercanos y tendencias globales',
                    'Crea rutas manuales con paradas reordenables',
                    'Usa IA para investigar destinos reales',
                    'Recorre con GPS, voz y modo manos libres',
                  ],
                ),
                _IntroPage(
                  title: 'TourSync AI evoluciono a VIBETOURS',
                  subtitle:
                      'La IA analiza destino, horarios, traslados, imagenes reales y zonas turisticas para crear experiencias listas para recorrer.',
                  icon: Icons.auto_awesome_rounded,
                  steps: const [
                    'Detecta tipo de tour automaticamente',
                    'Prioriza lugares importantes sin repetir',
                    'Organiza rutas logicas por cercania',
                    'Funciona para cualquier pais del mundo',
                  ],
                ),
                _ProfilePage(
                  profile: profile,
                  interests: interests,
                  onToggle: (interest) => ref
                      .read(touristProfileProvider.notifier)
                      .toggleInterest(interest),
                  onPace: (pace) =>
                      ref.read(touristProfileProvider.notifier).setPace(pace),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
            child: Row(
              children: [
                for (var i = 0; i < 3; i++)
                  AnimatedContainer(
                    duration: 220.ms,
                    margin: const EdgeInsets.only(right: 8),
                    width: _page == i ? 28 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _page == i
                          ? AppTheme.primary
                          : Theme.of(context).colorScheme.outlineVariant,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                const Spacer(),
                SizedBox(
                  width: 168,
                  child: LiquidButton(
                    label: _page == 2 ? l10n.start : l10n.continueAction,
                    icon: Icons.arrow_forward_rounded,
                    onPressed: () {
                      if (_page == 2) {
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
    context.go('/home');
  }
}

class _IntroPage extends StatelessWidget {
  const _IntroPage({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.steps,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final List<String> steps;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      children: [
        GlassPanel(
          padding: const EdgeInsets.all(26),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: 180,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Lottie.asset('assets/lottie/ai_pulse.json'),
                    Icon(icon, size: 58, color: AppTheme.primary),
                  ],
                ),
              ),
              Text(title, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 12),
              Text(subtitle, style: Theme.of(context).textTheme.bodyLarge),
            ],
          ),
        ),
        const SizedBox(height: 18),
        for (final step in steps)
          GlassPanel(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            radius: 20,
            child: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: AppTheme.primary),
                const SizedBox(width: 12),
                Expanded(child: Text(step)),
              ],
            ),
          ).animate().fadeIn().slideX(begin: 0.05, end: 0),
      ],
    );
  }
}

class _ProfilePage extends StatelessWidget {
  const _ProfilePage({
    required this.profile,
    required this.interests,
    required this.onToggle,
    required this.onPace,
  });

  final dynamic profile;
  final List<String> interests;
  final ValueChanged<String> onToggle;
  final ValueChanged<String> onPace;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      children: [
        Text(
          l10n.profileTitle,
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 8),
        Text(
          l10n.profileSubtitle,
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 22),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            for (final interest in interests)
              FilterChip(
                selected: profile.interests.contains(interest),
                label: Text(interest),
                onSelected: (_) => onToggle(interest),
              ),
          ],
        ),
        const SizedBox(height: 22),
        GlassPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Ritmo de viaje',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'calmado', label: Text('Calmado')),
                  ButtonSegment(value: 'balanced', label: Text('Balance')),
                  ButtonSegment(value: 'intenso', label: Text('Intenso')),
                ],
                selected: {profile.preferredPace},
                onSelectionChanged: (value) => onPace(value.first),
              ),
              if (profile.aiSummary.isNotEmpty) ...[
                const SizedBox(height: 18),
                Text(profile.aiSummary),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

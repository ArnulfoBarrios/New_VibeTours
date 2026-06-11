import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final profile = ref.watch(touristProfileProvider);
    final favorites = ref.watch(favoriteTourIdsProvider);
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 120),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                l10n.profile,
                style: Theme.of(context).textTheme.displayLarge,
              ),
            ),
            IconButton.filledTonal(
              onPressed: () => context.push('/settings'),
              icon: const Icon(Icons.settings_rounded),
            ),
          ],
        ),
        const SizedBox(height: 18),
        GlassPanel(
          child: Row(
            children: [
              const CircleAvatar(
                radius: 38,
                backgroundColor: AppTheme.primary,
                child: Icon(
                  Icons.person_rounded,
                  color: Colors.white,
                  size: 38,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Viajero VIBETOURS',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Text(
                      profile.isReady
                          ? profile.aiSummary
                          : 'Explorador global listo para descubrir rutas premium.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          childAspectRatio: 1.65,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          children: [
            _Kpi(label: 'Total tours', value: '50'),
            _Kpi(label: 'Likes', value: '2.4K'),
            _Kpi(label: 'Favoritos', value: '${favorites.length}'),
            _Kpi(label: 'Km recorridos', value: '128'),
            _Kpi(label: 'Ciudades', value: '18'),
            _Kpi(label: 'Paises', value: '7'),
          ],
        ),
        SectionHeader(title: l10n.monthlyActivity),
        const GlassPanel(
          child: _Bars(values: [0.25, 0.7, 0.42, 0.9, 0.62, 0.8]),
        ),
        SectionHeader(title: l10n.favoriteCategories),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            for (final interest
                in profile.interests.isEmpty
                    ? ['Historia', 'Gastronomia', 'Naturaleza']
                    : profile.interests)
              Chip(
                avatar: const Icon(Icons.auto_awesome_rounded, size: 16),
                label: Text(interest),
              ),
          ],
        ),
        SectionHeader(title: l10n.favoriteDestinations),
        const GlassPanel(
          child: Text('Cartagena · Medellin · Paris · Tokio · Barcelona'),
        ),
      ],
    );
  }
}

class _Kpi extends StatelessWidget {
  const _Kpi({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      padding: const EdgeInsets.all(14),
      radius: 22,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(value, style: Theme.of(context).textTheme.headlineMedium),
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class _Bars extends StatelessWidget {
  const _Bars({required this.values});

  final List<double> values;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 120,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (final value in values)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 5),
                child: FractionallySizedBox(
                  heightFactor: value,
                  alignment: Alignment.bottomCenter,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primary, AppTheme.violet],
                      ),
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

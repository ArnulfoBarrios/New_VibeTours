import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lottie/lottie.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';

class AiPlannerScreen extends ConsumerStatefulWidget {
  const AiPlannerScreen({super.key});

  @override
  ConsumerState<AiPlannerScreen> createState() => _AiPlannerScreenState();
}

class _AiPlannerScreenState extends ConsumerState<AiPlannerScreen> {
  final _destination = TextEditingController(text: 'Centro historico');
  final _country = TextEditingController(text: 'Colombia');
  final _city = TextEditingController(text: 'Cartagena');
  final _prompt = TextEditingController();
  double _duration = 4;
  TourType _type = TourType.cultural;
  String _language = 'es';

  @override
  void dispose() {
    _destination.dispose();
    _country.dispose();
    _city.dispose();
    _prompt.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final aiState = ref.watch(aiPlannerControllerProvider);
    final remaining = ref.watch(guestAiRemainingProvider);
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 120),
      children: [
        Text(l10n.aiPlanner, style: Theme.of(context).textTheme.displayLarge),
        const SizedBox(height: 8),
        Text(
          l10n.guestLimit(remaining),
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 18),
        GlassPanel(
          child: Column(
            children: [
              TextField(
                controller: _destination,
                decoration: InputDecoration(
                  labelText: l10n.destination,
                  prefixIcon: const Icon(Icons.travel_explore_rounded),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _country,
                      decoration: InputDecoration(labelText: l10n.country),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _city,
                      decoration: InputDecoration(labelText: l10n.city),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              DropdownMenu<TourType>(
                width: double.infinity,
                initialSelection: _type,
                label: Text(l10n.type),
                onSelected: (value) => setState(() => _type = value!),
                dropdownMenuEntries: [
                  for (final type in TourType.values)
                    DropdownMenuEntry(value: type, label: tourTypeLabel(type)),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Slider(
                      value: _duration,
                      min: 2,
                      max: 12,
                      divisions: 10,
                      label: '${_duration.toStringAsFixed(0)} h',
                      onChanged: (value) => setState(() => _duration = value),
                    ),
                  ),
                  Text('${_duration.toStringAsFixed(0)} h'),
                ],
              ),
              const SizedBox(height: 12),
              SegmentedButton<String>(
                selected: {_language},
                onSelectionChanged: (value) =>
                    setState(() => _language = value.first),
                segments: const [
                  ButtonSegment(value: 'es', label: Text('ES')),
                  ButtonSegment(value: 'en', label: Text('EN')),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _prompt,
                minLines: 3,
                maxLines: 5,
                decoration: InputDecoration(labelText: l10n.freePrompt),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        GlassPanel(
          child: Row(
            children: [
              const Icon(Icons.radar_rounded, color: AppTheme.violet),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Detectamos: ${_city.text}, ${_country.text} · ${tourTypeLabel(_type)} · ${_duration.toStringAsFixed(0)} h',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        LiquidButton(
          label: l10n.generateTour,
          icon: Icons.auto_awesome_rounded,
          onPressed: aiState.isLoading ? null : _generate,
        ),
        if (aiState.isLoading) _GenerationProgress(l10n: l10n),
        aiState.when(
          data: (tour) => tour == null
              ? const SizedBox.shrink()
              : Padding(
                  padding: const EdgeInsets.only(top: 18),
                  child: Column(
                    children: [
                      TourCard(
                        tour: tour,
                        onTap: () {
                          ref.read(selectedTourProvider.notifier).state = tour;
                          context.push('/live/${tour.id}');
                        },
                      ),
                      const SizedBox(height: 12),
                      _AiJsonPreview(tour: tour),
                      const SizedBox(height: 12),
                      LiquidButton(
                        label: l10n.startTour,
                        icon: Icons.navigation_rounded,
                        onPressed: () {
                          ref.read(selectedTourProvider.notifier).state = tour;
                          context.push('/live/${tour.id}');
                        },
                      ),
                    ],
                  ),
                ),
          loading: () => const SizedBox.shrink(),
          error: (error, stackTrace) => Padding(
            padding: const EdgeInsets.only(top: 16),
            child: EmptyState(
              icon: Icons.lock_clock_rounded,
              title: 'Demo agotada',
              body: error.toString(),
            ),
          ),
        ),
      ],
    );
  }

  void _generate() {
    ref
        .read(aiPlannerControllerProvider.notifier)
        .generate(
          AiTourRequest(
            destination: _destination.text,
            country: _country.text,
            city: _city.text,
            durationHours: _duration,
            type: _type,
            language: _language,
            prompt: _prompt.text,
          ),
        );
  }
}

class _AiJsonPreview extends StatelessWidget {
  const _AiJsonPreview({required this.tour});

  final Tour tour;

  @override
  Widget build(BuildContext context) {
    final jsonPreview = const JsonEncoder.withIndent(
      '  ',
    ).convert(tour.toCreationJson());
    return GlassPanel(
      padding: const EdgeInsets.all(14),
      child: ExpansionTile(
        tilePadding: EdgeInsets.zero,
        childrenPadding: EdgeInsets.zero,
        title: const Text('JSON de creacion IA'),
        leading: const Icon(Icons.data_object_rounded),
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.28),
              borderRadius: BorderRadius.circular(16),
            ),
            child: SelectableText(
              jsonPreview,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontFamily: 'monospace',
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GenerationProgress extends StatelessWidget {
  const _GenerationProgress({required this.l10n});

  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final steps = [
      l10n.generatingDestination,
      l10n.generatingPlaces,
      l10n.generatingRoute,
      l10n.generatingImages,
      l10n.generatingExperience,
    ];
    return GlassPanel(
      margin: const EdgeInsets.only(top: 18),
      child: Column(
        children: [
          SizedBox(
            height: 130,
            child: Lottie.asset('assets/lottie/ai_pulse.json'),
          ),
          Text(
            l10n.generatingTitle,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          for (final step in steps)
            ListTile(
                  dense: true,
                  leading: const Icon(
                    Icons.blur_circular_rounded,
                    color: AppTheme.primary,
                  ),
                  title: Text(step),
                )
                .animate(onPlay: (controller) => controller.repeat())
                .shimmer(
                  duration: 1300.ms,
                  color: AppTheme.primary.withValues(alpha: 0.25),
                ),
        ],
      ),
    );
  }
}

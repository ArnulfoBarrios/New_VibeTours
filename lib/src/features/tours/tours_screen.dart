import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/premium_components.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';

class ToursScreen extends ConsumerStatefulWidget {
  const ToursScreen({super.key});

  @override
  ConsumerState<ToursScreen> createState() => _ToursScreenState();
}

class _ToursScreenState extends ConsumerState<ToursScreen> {
  final _search = TextEditingController();
  String _country = '';
  String _city = '';
  TourType? _type;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final toursAsync = ref.watch(toursProvider);
    
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor, // O fondo sólido si falla el mapa
      body: toursAsync.when(
        data: (allTours) {
          final countries = allTours.map((tour) => tour.country).toSet().toList()..sort();
          final cities = allTours
              .where((tour) => _country.isEmpty || tour.country == _country)
              .map((tour) => tour.city)
              .toSet().toList()..sort();
          
          final tours = allTours.where((tour) {
            final countryOk = _country.isEmpty || tour.country == _country;
            final cityOk = _city.isEmpty || tour.city == _city;
            final typeOk = _type == null || tour.type == _type;
            final searchOk = _matchesSearch(tour, _search.text);
            return countryOk && cityOk && typeOk && searchOk;
          }).toList();

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                floating: true,
                centerTitle: false,
                title: Text(l10n.trips, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 32)),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                  child: Container(
                    height: 42,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: TextField(
                      controller: _search,
                      onChanged: (_) => setState(() {}),
                      style: const TextStyle(fontSize: 16),
                      decoration: InputDecoration(
                        hintText: l10n.searchDestination,
                        prefixIcon: Icon(Icons.search_rounded, size: 20, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      _MenuFilter(
                        label: l10n.country,
                        value: _country.isEmpty ? l10n.all : _country,
                        values: [l10n.all, ...countries],
                        onChanged: (value) => setState(() {
                          _country = value == l10n.all ? '' : value;
                          _city = '';
                        }),
                      ),
                      const SizedBox(width: 8),
                      _MenuFilter(
                        label: l10n.city,
                        value: _city.isEmpty ? l10n.allFem : _city,
                        values: [l10n.allFem, ...cities],
                        onChanged: (value) => setState(() {
                          _city = value == l10n.allFem ? '' : value;
                        }),
                      ),
                      const SizedBox(width: 8),
                      _MenuFilter(
                        label: l10n.type,
                        value: _type == null ? l10n.any : tourTypeL10n(context, _type!),
                        values: [l10n.any, ...TourType.values.map((t) => tourTypeL10n(context, t))],
                        onChanged: (value) => setState(() {
                          _type = value == l10n.any
                              ? null
                              : TourType.values.firstWhere((t) => tourTypeL10n(context, t) == value);
                        }),
                      ),
                    ],
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 16)),
              if (tours.isEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 40),
                    child: Center(
                      child: Text(l10n.noToursAvailable, style: const TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final tour = tours[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: TourCard(
                            tour: tour,
                            onTap: () => context.push('/tours/${tour.id}'),
                          ),
                        );
                      },
                      childCount: tours.length,
                    ),
                  ),
                ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => const EmptyState(
              icon: Icons.wifi_off_rounded,
              title: 'Sin conexión',
              body: '¡Vaya! No pudimos cargar los tours. Verifica tu conexión a internet y vuelve a intentarlo.',
            ),
      ),
    );
  }

  bool _matchesSearch(Tour tour, String query) {
    final normalized = query.trim().toLowerCase();
    if (normalized.isEmpty) return true;
    final haystack = [
      tour.title,
      tour.city,
      tour.country,
      tour.description,
      tourTypeL10n(context, tour.type),
      ...tour.tags,
    ].join(' ').toLowerCase();
    return haystack.contains(normalized);
  }
}

class _MenuFilter extends StatelessWidget {
  const _MenuFilter({
    required this.label,
    required this.value,
    required this.values,
    required this.onChanged,
  });

  final String label;
  final String value;
  final List<String> values;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return MenuAnchor(
      builder: (context, controller, child) => GestureDetector(
        onTap: () => controller.isOpen ? controller.close() : controller.open(),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                value,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
              const SizedBox(width: 4),
              Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
            ],
          ),
        ),
      ),
      menuChildren: [
        for (final item in values)
          MenuItemButton(onPressed: () => onChanged(item), child: Text(item)),
      ],
    );
  }
}


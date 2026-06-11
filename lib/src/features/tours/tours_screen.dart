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
    return toursAsync.when(
      data: (allTours) {
        final countries = allTours.map((tour) => tour.country).toSet().toList()
          ..sort();
        final cities =
            allTours
                .where((tour) => _country.isEmpty || tour.country == _country)
                .map((tour) => tour.city)
                .toSet()
                .toList()
              ..sort();
        final tours = allTours.where((tour) {
          final countryOk = _country.isEmpty || tour.country == _country;
          final cityOk = _city.isEmpty || tour.city == _city;
          final typeOk = _type == null || tour.type == _type;
          final searchOk = _matchesSearch(tour, _search.text);
          return countryOk && cityOk && typeOk && searchOk;
        }).toList();
        return CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
                child: Text(
                  l10n.tours,
                  style: Theme.of(context).textTheme.displayLarge,
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: TextField(
                  controller: _search,
                  onChanged: (_) => setState(() {}),
                  textInputAction: TextInputAction.search,
                  decoration: const InputDecoration(
                    hintText: 'Buscar destino, ciudad o tour',
                    prefixIcon: Icon(Icons.search_rounded),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: GlassPanel(
                margin: const EdgeInsets.fromLTRB(20, 18, 20, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.filters,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        _MenuFilter(
                          label: l10n.country,
                          value: _country.isEmpty ? 'Todos' : _country,
                          values: ['Todos', ...countries],
                          onChanged: (value) => setState(() {
                            _country = value == 'Todos' ? '' : value;
                            _city = '';
                          }),
                        ),
                        _MenuFilter(
                          label: l10n.city,
                          value: _city.isEmpty ? 'Todas' : _city,
                          values: ['Todas', ...cities],
                          onChanged: (value) => setState(() {
                            _city = value == 'Todas' ? '' : value;
                          }),
                        ),
                        _MenuFilter(
                          label: l10n.type,
                          value: _type == null
                              ? 'Todos'
                              : tourTypeLabel(_type!),
                          values: [
                            'Todos',
                            ...TourType.values.map(tourTypeLabel),
                          ],
                          onChanged: (value) => setState(() {
                            _type = value == 'Todos'
                                ? null
                                : TourType.values.firstWhere(
                                    (type) => tourTypeLabel(type) == value,
                                  );
                          }),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
              sliver: tours.isEmpty
                  ? const SliverToBoxAdapter(
                      child: EmptyState(
                        icon: Icons.search_off_rounded,
                        title: 'Sin resultados',
                        body: 'Prueba con otra ciudad, pais o tipo de tour.',
                      ),
                    )
                  : SliverList.separated(
                      itemCount: tours.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        final tour = tours[index];
                        return TourCard(
                          tour: tour,
                          onTap: () => context.push('/tours/${tour.id}'),
                        );
                      },
                    ),
            ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => EmptyState(
        icon: Icons.error_outline_rounded,
        title: 'Error',
        body: error.toString(),
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
      tourTypeLabel(tour.type),
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
      builder: (context, controller, child) => ActionChip(
        label: Text('$label: $value'),
        avatar: const Icon(Icons.expand_more_rounded, size: 18),
        onPressed: () =>
            controller.isOpen ? controller.close() : controller.open(),
      ),
      menuChildren: [
        for (final item in values)
          MenuItemButton(onPressed: () => onChanged(item), child: Text(item)),
      ],
    );
  }
}

import 'dart:convert';
import 'dart:math' as math;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/openfree_route_map.dart';
import '../../core/design/premium_components.dart';
import '../../core/design/vibe_logo.dart';
import '../../domain/models.dart';
import '../../state/app_state.dart';

class TourCreatorScreen extends ConsumerStatefulWidget {
  const TourCreatorScreen({super.key});

  @override
  ConsumerState<TourCreatorScreen> createState() => _TourCreatorScreenState();
}

class _TourCreatorScreenState extends ConsumerState<TourCreatorScreen> {
  final _name = TextEditingController();
  final _description = TextEditingController();
  final _placeSearch = TextEditingController();
  final _bestSeason = TextEditingController(text: 'Todo el ano');
  final _recommendedSchedule = TextEditingController(
    text: 'Manana o tarde con buena luz natural',
  );
  final _meetingPoint = TextEditingController();
  final _includes = TextEditingController();
  final _excludes = TextEditingController(
    text: 'Transporte privado, entradas a recintos pagos',
  );
  final _recommendations = TextEditingController(
    text: 'Lleva agua, usa calzado comodo, confirma horarios locales',
  );
  final _accessibility = TextEditingController(
    text: 'Consultar condiciones de accesibilidad en cada parada.',
  );
  final List<_DraftStop> _stops = [];
  final List<String> _galleryImages = [];
  final Set<String> _languages = {'es'};
  final Set<String> _audience = {'Familias', 'Parejas', 'Viajeros curiosos'};
  List<NearbyPlace> _placeResults = _defaultPlaceSuggestions;
  NearbyPlace? _previewPlace = _defaultPlaceSuggestions.first;
  String? _editingTourId;
  TourType _type = TourType.cultural;
  TourDifficulty _difficulty = TourDifficulty.easy;
  String _language = 'es';
  String _coverImage = '';
  bool _isSearching = false;
  bool _isPaid = false;
  bool _includeGuide = true;
  bool _includeMap = true;
  bool _includeRecommendations = true;
  bool _petsAllowed = false;
  bool _childFriendly = true;
  bool _seniorFriendly = true;

  @override
  void initState() {
    super.initState();
    final selected = ref.read(selectedTourProvider);
    if (selected != null) {
      _editingTourId = selected.id.startsWith('manual-') ? selected.id : null;
      _name.text = selected.title;
      _description.text = selected.description;
      _coverImage = selected.coverUrl;
      _galleryImages.addAll(selected.gallery.take(8));
      _type = selected.type;
      _difficulty = selected.difficulty;
      _language = selected.language;
      _languages
        ..clear()
        ..addAll(
          selected.availableLanguages.isEmpty
              ? [selected.language]
              : selected.availableLanguages,
        );
      _audience
        ..clear()
        ..addAll(selected.recommendedAudience);
      _bestSeason.text = selected.bestSeason;
      _recommendedSchedule.text = selected.recommendedSchedule;
      _meetingPoint.text = selected.meetingPoint;
      _includes.text = selected.includes.join(', ');
      _excludes.text = selected.excludes.join(', ');
      _recommendations.text = selected.recommendations.join(', ');
      _accessibility.text = selected.additionalInfo.accesibilidad;
      _petsAllowed = selected.additionalInfo.mascotasPermitidas;
      _childFriendly = selected.additionalInfo.aptoParaNinos;
      _seniorFriendly = selected.additionalInfo.aptoParaAdultosMayores;
      _stops.addAll([
        for (final stop in selected.stops.take(8))
          _DraftStop.fromTourStop(stop),
      ]);
      if (_stops.isNotEmpty) {
        final stop = _stops.first;
        _previewPlace = NearbyPlace(
          name: stop.name,
          type: stop.description,
          distanceMeters: 0,
          location: stop.location,
        );
      }
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    _placeSearch.dispose();
    _bestSeason.dispose();
    _recommendedSchedule.dispose();
    _meetingPoint.dispose();
    _includes.dispose();
    _excludes.dispose();
    _recommendations.dispose();
    _accessibility.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mapStyle = ref.watch(mapStyleProvider);
    return Stack(
      children: [
        ListView(
          padding: const EdgeInsets.fromLTRB(17, 14, 17, 190),
          children: [
            _CreatorHeader(onBack: () => context.go('/creator')),
            const SizedBox(height: 28),
            _SectionTitle(icon: Icons.edit_note_rounded, label: '1. Basicos'),
            const SizedBox(height: 12),
            _CreatorCard(
              child: Column(
                children: [
                  TextField(
                    controller: _name,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Nombre del tour',
                      hintText: 'Ej. Tarde cultural en Cartagena',
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownMenu<TourType>(
                    width: double.infinity,
                    initialSelection: _type,
                    label: const Text('Tipo de experiencia'),
                    onSelected: (value) =>
                        setState(() => _type = value ?? _type),
                    dropdownMenuEntries: [
                      for (final type in TourType.values)
                        DropdownMenuEntry(
                          value: type,
                          label: tourTypeLabel(type),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _description,
                    minLines: 4,
                    maxLines: 6,
                    decoration: const InputDecoration(
                      labelText: 'Descripcion del tour',
                      hintText:
                          'Cuentale a los viajeros que hace este tour especial...',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _bestSeason,
                    decoration: const InputDecoration(
                      labelText: 'Mejor epoca',
                      prefixIcon: Icon(Icons.wb_sunny_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _recommendedSchedule,
                    decoration: const InputDecoration(
                      labelText: 'Horario recomendado',
                      prefixIcon: Icon(Icons.schedule_rounded),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _meetingPoint,
                    decoration: const InputDecoration(
                      labelText: 'Punto de encuentro',
                      hintText: 'Ej. Entrada principal del museo',
                      prefixIcon: Icon(Icons.flag_outlined),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
            const _SectionTitle(
              icon: Icons.groups_2_outlined,
              label: '2. Publico e idiomas',
            ),
            const SizedBox(height: 12),
            _CreatorCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Idiomas disponibles',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 10),
                  _ChoicePills(
                    options: const ['es', 'en'],
                    selected: _languages,
                    labels: const {'es': 'Espanol', 'en': 'English'},
                    onChanged: (value) {
                      setState(() {
                        if (_languages.contains(value)) {
                          if (_languages.length > 1) _languages.remove(value);
                        } else {
                          _languages.add(value);
                        }
                        _language = _languages.first;
                      });
                    },
                  ),
                  const SizedBox(height: 22),
                  Text(
                    'Publico recomendado',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 10),
                  _ChoicePills(
                    options: const [
                      'Familias',
                      'Parejas',
                      'Viajeros curiosos',
                      'Adultos mayores',
                      'Fotografos',
                      'Aventureros',
                    ],
                    selected: _audience,
                    onChanged: (value) {
                      setState(() {
                        _audience.contains(value)
                            ? _audience.remove(value)
                            : _audience.add(value);
                      });
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
            const _SectionTitle(
              icon: Icons.image_outlined,
              label: '3. Imagenes',
            ),
            const SizedBox(height: 12),
            _CreatorCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Imagen principal',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 14),
                  _CoverPicker(
                    imageUrl: _coverImage,
                    onTap: _showCoverImageSheet,
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      const Icon(Icons.grid_view_rounded, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        'Galeria del tour',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const Spacer(),
                      Text(
                        '${_galleryCount()} / 8',
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: const Color(0xFFAFCBFF),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  _GalleryHint(
                    images: _galleryImages,
                    onTap: _showGalleryImageSheet,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
            const _SectionTitle(
              icon: Icons.search_rounded,
              label: '4. Lugares para tu ruta',
            ),
            const SizedBox(height: 12),
            _PlaceSearchBar(
              controller: _placeSearch,
              isSearching: _isSearching,
              onSearch: _searchPlaces,
            ),
            const SizedBox(height: 12),
            _PlaceResults(
              places: _placeResults,
              selectedPlace: _previewPlace,
              onSelect: (place) => setState(() => _previewPlace = place),
            ),
            if (_previewPlace != null) ...[
              const SizedBox(height: 12),
              _CreatorCard(
                padding: const EdgeInsets.all(10),
                child: Column(
                  children: [
                    OpenFreeRouteMap(
                      key: ValueKey(
                        '${_previewPlace!.name}-${_previewPlace!.location.latitude}-${_previewPlace!.location.longitude}',
                      ),
                      points: [_previewPlace!.location],
                      labels: [_previewPlace!.name],
                      styleUrl: mapStyle,
                      height: 180,
                      fitPadding: const EdgeInsets.all(24),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: LiquidButton(
                        label: 'Agregar parada seleccionada',
                        icon: Icons.add_location_alt_rounded,
                        onPressed: () => _addPlace(_previewPlace!),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 28),
            const _SectionTitle(
              icon: Icons.format_list_bulleted_rounded,
              label: '5. Orden de paradas',
            ),
            const SizedBox(height: 12),
            _CreatorCard(
              padding: const EdgeInsets.all(0),
              child: _stops.isEmpty
                  ? _EmptyStops(
                      onAdd: _placeResults.isEmpty
                          ? null
                          : () => _addPlace(_placeResults.first),
                    )
                  : ReorderableListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: _stops.length,
                      // ignore: deprecated_member_use
                      onReorder: (oldIndex, newIndex) {
                        setState(() {
                          if (newIndex > oldIndex) newIndex--;
                          final item = _stops.removeAt(oldIndex);
                          _stops.insert(newIndex, item);
                        });
                      },
                      itemBuilder: (context, index) => _StopOrderTile(
                        key: ValueKey(_stops[index].id),
                        index: index,
                        stop: _stops[index],
                        onRemove: () => setState(() {
                          _stops.removeAt(index);
                        }),
                      ),
                    ),
            ),
            if (_stops.isNotEmpty) ...[
              const SizedBox(height: 16),
              GlassPanel(
                padding: const EdgeInsets.all(10),
                radius: 26,
                child: OpenFreeRouteMap.fromStops(
                  stops: _previewStops(),
                  height: 210,
                  styleUrl: mapStyle,
                ),
              ),
            ],
            const SizedBox(height: 28),
            const _SectionTitle(
              icon: Icons.sell_outlined,
              label: '6. Precio y detalles',
            ),
            const SizedBox(height: 12),
            _CreatorCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _PaidSwitch(
                    value: _isPaid,
                    onChanged: (value) => setState(() => _isPaid = value),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownMenu<String>(
                          initialSelection: _language,
                          label: const Text('Idioma'),
                          onSelected: (value) =>
                              setState(() => _language = value ?? _language),
                          dropdownMenuEntries: const [
                            DropdownMenuEntry(value: 'es', label: 'Espanol'),
                            DropdownMenuEntry(value: 'en', label: 'English'),
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: DropdownMenu<TourDifficulty>(
                          initialSelection: _difficulty,
                          label: const Text('Dificultad'),
                          onSelected: (value) => setState(
                            () => _difficulty = value ?? _difficulty,
                          ),
                          dropdownMenuEntries: const [
                            DropdownMenuEntry(
                              value: TourDifficulty.easy,
                              label: 'Facil',
                            ),
                            DropdownMenuEntry(
                              value: TourDifficulty.moderate,
                              label: 'Media',
                            ),
                            DropdownMenuEntry(
                              value: TourDifficulty.intense,
                              label: 'Intensa',
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 26),
                  Text(
                    'QUE INCLUYE?',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.66),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _IncludedTile(
                    label: 'Guia digital',
                    value: _includeGuide,
                    onChanged: (value) => setState(() => _includeGuide = value),
                  ),
                  _IncludedTile(
                    label: 'Ruta en mapa interactivo',
                    value: _includeMap,
                    onChanged: (value) => setState(() => _includeMap = value),
                  ),
                  _IncludedTile(
                    label: 'Recomendaciones por parada',
                    value: _includeRecommendations,
                    onChanged: (value) =>
                        setState(() => _includeRecommendations = value),
                  ),
                  const SizedBox(height: 18),
                  TextField(
                    controller: _includes,
                    minLines: 2,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Incluye',
                      hintText: 'Separado por comas',
                      prefixIcon: Icon(Icons.check_circle_outline_rounded),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _excludes,
                    minLines: 2,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'No incluye',
                      hintText: 'Separado por comas',
                      prefixIcon: Icon(Icons.remove_circle_outline_rounded),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _recommendations,
                    minLines: 2,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'Recomendaciones',
                      hintText: 'Separado por comas',
                      prefixIcon: Icon(Icons.tips_and_updates_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _accessibility,
                    minLines: 2,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'Accesibilidad',
                      prefixIcon: Icon(Icons.accessible_forward_rounded),
                    ),
                  ),
                  const SizedBox(height: 10),
                  _IncludedTile(
                    label: 'Mascotas permitidas',
                    value: _petsAllowed,
                    onChanged: (value) => setState(() => _petsAllowed = value),
                  ),
                  _IncludedTile(
                    label: 'Apto para ninos',
                    value: _childFriendly,
                    onChanged: (value) =>
                        setState(() => _childFriendly = value),
                  ),
                  _IncludedTile(
                    label: 'Apto para adultos mayores',
                    value: _seniorFriendly,
                    onChanged: (value) =>
                        setState(() => _seniorFriendly = value),
                  ),
                ],
              ),
            ),
          ],
        ),
        Positioned(
          left: 17,
          right: 17,
          bottom: 104,
          child: _CreatorActionBar(
            onPreview: _showPreview,
            onSave: _saveDraft,
            onOptions: _showOptions,
          ),
        ),
      ],
    );
  }

  Future<void> _searchPlaces() async {
    final query = _placeSearch.text.trim();
    if (query.length < 2) {
      setState(() {
        _placeResults = _defaultPlaceSuggestions;
        _previewPlace = _defaultPlaceSuggestions.first;
      });
      return;
    }
    setState(() => _isSearching = true);
    List<NearbyPlace> remote = const [];
    try {
      remote = await ref.read(discoveryRepositoryProvider).searchPlaces(query);
    } catch (_) {
      remote = const [];
    }
    if (!mounted) return;
    final fallback = _defaultPlaceSuggestions
        .where(
          (place) => place.name.toLowerCase().contains(query.toLowerCase()),
        )
        .toList();
    setState(() {
      _placeResults = remote.isNotEmpty ? remote : fallback;
      _previewPlace = _placeResults.isEmpty ? null : _placeResults.first;
      _isSearching = false;
    });
    if (_placeResults.isEmpty) {
      _message('No encontramos ese lugar. Prueba con ciudad y nombre.');
    }
  }

  void _addPlace(NearbyPlace place) {
    if (_stops.any((stop) => stop.name == place.name)) {
      _message('Ese lugar ya esta en la ruta.');
      return;
    }
    setState(() {
      _stops.add(_DraftStop.fromPlace(place));
      _previewPlace = place;
      _coverImage = _coverImage.isEmpty
          ? _suggestedCoverFor(_stops.length - 1)
          : _coverImage;
      if (_galleryImages.length < 8 && place.name.isNotEmpty) {
        final image = _suggestedCoverFor(place.name.hashCode);
        if (!_galleryImages.contains(image)) _galleryImages.add(image);
      }
    });
  }

  void _showCoverImageSheet() {
    _showImageSheet(
      title: 'Imagen de portada',
      actionLabel: 'Usar como portada',
      onApply: (url) => setState(() => _coverImage = url),
    );
  }

  void _showGalleryImageSheet() {
    _showImageSheet(
      title: 'Galeria del tour',
      actionLabel: 'Agregar a galeria',
      onApply: (url) {
        if (_galleryImages.length >= 8) {
          _message('La galeria permite maximo 8 imagenes.');
          return;
        }
        setState(() {
          if (!_galleryImages.contains(url)) _galleryImages.add(url);
        });
      },
    );
  }

  void _showImageSheet({
    required String title,
    required String actionLabel,
    required ValueChanged<String> onApply,
  }) {
    final controller = TextEditingController();
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            18,
            0,
            18,
            18 + MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                keyboardType: TextInputType.url,
                decoration: const InputDecoration(
                  labelText: 'URL de imagen',
                  hintText: 'https://...',
                  prefixIcon: Icon(Icons.link_rounded),
                ),
              ),
              const SizedBox(height: 14),
              Text('Sugeridas', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 10),
              SizedBox(
                height: 88,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _suggestedImages.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(width: 10),
                  itemBuilder: (context, index) {
                    final image = _suggestedImages[index];
                    return InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        onApply(image);
                        context.pop();
                        _message('Imagen agregada.');
                      },
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: CachedNetworkImage(
                          imageUrl: image,
                          width: 120,
                          height: 88,
                          fit: BoxFit.cover,
                          placeholder: (context, url) =>
                              const SkeletonBox(width: 120, height: 88),
                          errorWidget: (context, url, error) =>
                              const TravelImageFallback(title: 'Imagen'),
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: LiquidButton(
                  label: actionLabel,
                  icon: Icons.add_photo_alternate_outlined,
                  onPressed: () {
                    final url = controller.text.trim();
                    if (!_isImageUrl(url)) {
                      _message('Pega una URL de imagen valida.');
                      return;
                    }
                    onApply(url);
                    context.pop();
                    _message('Imagen agregada.');
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    ).whenComplete(controller.dispose);
  }

  bool _isImageUrl(String value) {
    final uri = Uri.tryParse(value);
    return uri != null &&
        uri.hasScheme &&
        (uri.scheme == 'http' || uri.scheme == 'https') &&
        uri.host.isNotEmpty;
  }

  int _galleryCount() => _galleryImages.length.clamp(0, 8).toInt();

  List<TourStop> _previewStops() {
    return _stops.asMap().entries.map((entry) {
      final stop = entry.value;
      return TourStop(
        id: stop.id,
        name: stop.name,
        location: stop.location,
        imageUrl: stop.imageUrl,
        description: stop.description,
        activities: stop.activities,
        curiousFacts: stop.curiousFacts,
        tips: stop.tips,
        locationInfo: stop.locationInfo,
        images: stop.images,
        suggestedMinutes: stop.minutes,
        order: entry.key,
      );
    }).toList();
  }

  Tour _buildTour() {
    final stops = _previewStops();
    final cover = _coverImage.isNotEmpty ? _coverImage : stops.first.imageUrl;
    final gallery = <String>{
      cover,
      ..._galleryImages,
      for (final stop in stops) ...stop.images,
      for (final stop in stops) stop.imageUrl,
    }.where((url) => url.isNotEmpty).take(8).toList();
    final includes = <String>{
      if (_includeGuide) 'Guia digital',
      if (_includeMap) 'Ruta en mapa interactivo',
      if (_includeRecommendations) 'Recomendaciones por parada',
      ..._splitList(_includes.text),
    }.toList();
    final description = _description.text.trim().isEmpty
        ? 'Ruta personalizada creada por un viajero de VibeTours.'
        : _description.text.trim();
    final meetingPoint = _meetingPoint.text.trim().isEmpty
        ? stops.first.name
        : _meetingPoint.text.trim();
    final category = tourTypeLabel(_type);
    return Tour(
      id: _editingTourId ?? 'manual-${DateTime.now().microsecondsSinceEpoch}',
      title: _name.text.trim(),
      country: stops.first.locationInfo.pais.isEmpty
          ? 'Global'
          : stops.first.locationInfo.pais,
      city: stops.first.locationInfo.ciudad.isEmpty
          ? stops.first.name
          : stops.first.locationInfo.ciudad,
      type: _type,
      description: description,
      coverUrl: cover,
      gallery: gallery,
      durationHours:
          stops.fold<double>(
            0,
            (total, stop) => total + stop.suggestedMinutes,
          ) /
          60,
      distanceKm: _routeDistanceKm(stops),
      rating: 0,
      reviewCount: 0,
      likes: 0,
      difficulty: _difficulty,
      language: _language,
      tags: [
        tourTypeLabel(_type),
        ..._languages.map((item) => item == 'es' ? 'Espanol' : 'English'),
        if (_includeGuide) 'Guia digital',
        if (_includeMap) 'Mapa interactivo',
      ],
      stops: stops,
      shortSummary: description.length > 180
          ? '${description.substring(0, 177)}...'
          : description,
      subcategories: [category, ..._audience.take(2)],
      featuredExperience: stops.isEmpty
          ? ''
          : 'Recorrido personalizado que conecta ${stops.first.name} con ${stops.length - 1} paradas adicionales.',
      placeHistory: 'Informacion historica editable por el creador del tour.',
      culturalContext:
          'Experiencia disenada para mostrar el caracter local del destino con una ruta facil de seguir.',
      availableLanguages: _languages.toList(),
      recommendedAudience: _audience.toList(),
      bestSeason: _bestSeason.text.trim(),
      recommendedSchedule: _recommendedSchedule.text.trim(),
      meetingPoint: meetingPoint,
      meetingPointInfo: TourLocationInfo(
        nombreLugar: meetingPoint,
        direccion: stops.first.locationInfo.direccion,
        ciudad: stops.first.locationInfo.ciudad,
        region: stops.first.locationInfo.region,
        pais: stops.first.locationInfo.pais,
        placeId: stops.first.locationInfo.placeId,
        urlMapa: stops.first.locationInfo.urlMapa,
      ),
      includes: includes,
      excludes: _splitList(_excludes.text),
      recommendations: _splitList(_recommendations.text),
      whatToBring: const ['Agua', 'Calzado comodo', 'Bateria suficiente'],
      tourRules: const [
        'Respetar los espacios publicos y privados',
        'Seguir el orden sugerido de paradas',
        'Confirmar horarios antes de ingresar a recintos cerrados',
      ],
      keywords: [
        category,
        ..._audience,
        for (final stop in stops.take(4)) stop.name,
      ],
      mainCategory: category,
      budget: const TourBudget(low: 10, medium: 35, high: 80),
      additionalInfo: TourAdditionalInfo(
        accesibilidad: _accessibility.text.trim().isEmpty
            ? TourAdditionalInfo.standard.accesibilidad
            : _accessibility.text.trim(),
        mascotasPermitidas: _petsAllowed,
        aptoParaNinos: _childFriendly,
        aptoParaAdultosMayores: _seniorFriendly,
      ),
      isPublished: false,
      isAiGenerated: false,
    );
  }

  void _showPreview() {
    if (_stops.isEmpty) {
      _message('Agrega al menos una parada para previsualizar.');
      return;
    }
    final tour = _buildTour();
    final jsonPreview = const JsonEncoder.withIndent(
      '  ',
    ).convert(tour.toCreationJson());
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => SafeArea(
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.82,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
            children: [
              Text(
                tour.title.isEmpty ? 'Vista previa' : tour.title,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 14),
              OpenFreeRouteMap.fromStops(
                stops: tour.stops,
                styleUrl: ref.read(mapStyleProvider),
                height: 260,
              ),
              const SizedBox(height: 16),
              Text(
                'JSON de creacion',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _creatorIsDark(context)
                      ? Colors.black.withValues(alpha: 0.28)
                      : const Color(0xFFF4F8FF),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: _creatorBorder(context)),
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
        ),
      ),
    );
  }

  Future<void> _saveDraft() async {
    if (_name.text.trim().isEmpty || _stops.isEmpty) {
      _message('Agrega nombre y al menos una parada.');
      return;
    }
    final tour = _buildTour();
    await ref.read(userToursProvider.notifier).saveTour(tour);
    ref.read(selectedTourProvider.notifier).state = tour;
    if (!mounted) return;
    _message('Tour guardado como borrador.');
    context.go('/creator');
  }

  double _routeDistanceKm(List<TourStop> stops) {
    if (stops.length < 2) return 0;
    var meters = 0.0;
    for (var index = 1; index < stops.length; index++) {
      meters += _distanceMeters(
        stops[index - 1].location,
        stops[index].location,
      );
    }
    return meters / 1000;
  }

  double _distanceMeters(GeoPoint a, GeoPoint b) {
    const earthRadius = 6371000.0;
    final lat1 = _degToRad(a.latitude);
    final lat2 = _degToRad(b.latitude);
    final dLat = _degToRad(b.latitude - a.latitude);
    final dLng = _degToRad(b.longitude - a.longitude);
    final h =
        math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1) *
            math.cos(lat2) *
            math.sin(dLng / 2) *
            math.sin(dLng / 2);
    return earthRadius * 2 * math.atan2(math.sqrt(h), math.sqrt(1 - h));
  }

  double _degToRad(double degrees) => degrees * math.pi / 180;

  List<String> _splitList(String value) => value
      .split(RegExp(r'[\n,]'))
      .map((item) => item.trim())
      .where((item) => item.isNotEmpty)
      .toList();

  void _showOptions() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SwitchListTile(
              value: _includeGuide,
              onChanged: (value) {
                setState(() => _includeGuide = value);
                context.pop();
              },
              title: const Text('Narracion y guia digital'),
              secondary: const Icon(Icons.record_voice_over_rounded),
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline_rounded),
              title: const Text('Limpiar formulario'),
              onTap: () {
                setState(() {
                  _name.clear();
                  _description.clear();
                  _placeSearch.clear();
                  _bestSeason.text = 'Todo el ano';
                  _recommendedSchedule.text =
                      'Manana o tarde con buena luz natural';
                  _meetingPoint.clear();
                  _includes.clear();
                  _excludes.text =
                      'Transporte privado, entradas a recintos pagos';
                  _recommendations.text =
                      'Lleva agua, usa calzado comodo, confirma horarios locales';
                  _accessibility.text =
                      'Consultar condiciones de accesibilidad en cada parada.';
                  _stops.clear();
                  _galleryImages.clear();
                  _languages
                    ..clear()
                    ..add('es');
                  _audience
                    ..clear()
                    ..addAll(['Familias', 'Parejas', 'Viajeros curiosos']);
                  _coverImage = '';
                  _placeResults = _defaultPlaceSuggestions;
                  _previewPlace = _defaultPlaceSuggestions.first;
                  _petsAllowed = false;
                  _childFriendly = true;
                  _seniorFriendly = true;
                });
                context.pop();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _message(String message) {
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(SnackBar(content: Text(message)));
  }
}

class _CreatorHeader extends StatelessWidget {
  const _CreatorHeader({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 999,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        children: [
          IconButton(
            tooltip: 'Volver',
            onPressed: onBack,
            icon: const Icon(Icons.arrow_back_rounded),
          ),
          const VibeLogoMark(size: 30),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Crear tour',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          IconButton(
            tooltip: 'Buscar',
            onPressed: () {},
            icon: const Icon(Icons.search_rounded),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final accent = _creatorAccent(context);
    return Row(
      children: [
        Icon(icon, size: 20, color: accent),
        const SizedBox(width: 10),
        Text(label, style: Theme.of(context).textTheme.titleMedium),
      ],
    );
  }
}

class _CreatorCard extends StatelessWidget {
  const _CreatorCard({
    required this.child,
    this.padding = const EdgeInsets.all(34),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final isDark = _creatorIsDark(context);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF151A23).withValues(alpha: 0.92)
            : Colors.white.withValues(alpha: 0.82),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : Colors.white.withValues(alpha: 0.72),
        ),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withValues(alpha: 0.22)
                : AppTheme.primary.withValues(alpha: 0.10),
            blurRadius: isDark ? 28 : 34,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      child: Padding(padding: padding, child: child),
    );
  }
}

bool _creatorIsDark(BuildContext context) =>
    Theme.of(context).brightness == Brightness.dark;

Color _creatorAccent(BuildContext context) =>
    _creatorIsDark(context) ? const Color(0xFFAFCBFF) : AppTheme.primary;

Color _creatorSoftFill(BuildContext context) => _creatorIsDark(context)
    ? Colors.white.withValues(alpha: 0.07)
    : const Color(0xFFFFFFFF).withValues(alpha: 0.74);

Color _creatorSubtleFill(BuildContext context) => _creatorIsDark(context)
    ? Colors.white.withValues(alpha: 0.08)
    : const Color(0xFFEAF3FF).withValues(alpha: 0.92);

Color _creatorBorder(BuildContext context) => _creatorIsDark(context)
    ? Colors.white.withValues(alpha: 0.10)
    : AppTheme.primary.withValues(alpha: 0.14);

class _ChoicePills extends StatelessWidget {
  const _ChoicePills({
    required this.options,
    required this.selected,
    required this.onChanged,
    this.labels = const {},
  });

  final List<String> options;
  final Set<String> selected;
  final ValueChanged<String> onChanged;
  final Map<String, String> labels;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (final option in options)
          FilterChip(
            selected: selected.contains(option),
            label: Text(labels[option] ?? option),
            avatar: selected.contains(option)
                ? const Icon(Icons.check_rounded, size: 18)
                : null,
            onSelected: (_) => onChanged(option),
          ),
      ],
    );
  }
}

class _CoverPicker extends StatelessWidget {
  const _CoverPicker({required this.imageUrl, required this.onTap});

  final String imageUrl;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final accent = _creatorAccent(context);
    return InkWell(
      borderRadius: BorderRadius.circular(24),
      onTap: onTap,
      child: Container(
        height: 148,
        width: double.infinity,
        decoration: BoxDecoration(
          color: _creatorSoftFill(context),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: accent.withValues(alpha: 0.32), width: 1.4),
        ),
        child: imageUrl.isEmpty
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: accent.withValues(alpha: 0.16),
                    child: Icon(
                      Icons.add_photo_alternate_outlined,
                      color: accent,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Elegir imagen de portada',
                    style: Theme.of(
                      context,
                    ).textTheme.titleMedium?.copyWith(color: accent),
                  ),
                ],
              )
            : ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    CachedNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => const SkeletonBox(),
                      errorWidget: (context, url, error) =>
                          const TravelImageFallback(title: 'Portada'),
                    ),
                    Positioned(
                      right: 12,
                      bottom: 12,
                      child: FilledButton.icon(
                        onPressed: onTap,
                        icon: const Icon(Icons.edit_rounded, size: 18),
                        label: const Text('Cambiar'),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

class _GalleryHint extends StatelessWidget {
  const _GalleryHint({required this.images, required this.onTap});

  final List<String> images;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final accent = _creatorAccent(context);
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: _creatorSoftFill(context),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _creatorBorder(context)),
        ),
        child: images.isEmpty
            ? Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: accent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.photo_library_outlined, color: accent),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      'Agrega hasta 8 fotos para la seccion de detalles que veran los usuarios.',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ),
                ],
              )
            : SizedBox(
                height: 82,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: images.length + 1,
                  separatorBuilder: (context, index) =>
                      const SizedBox(width: 10),
                  itemBuilder: (context, index) {
                    if (index == images.length) {
                      return Container(
                        width: 82,
                        decoration: BoxDecoration(
                          color: const Color(
                            0xFFAFCBFF,
                          ).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.add_photo_alternate_outlined,
                          color: Color(0xFFAFCBFF),
                        ),
                      );
                    }
                    return ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: CachedNetworkImage(
                        imageUrl: images[index],
                        width: 92,
                        height: 82,
                        fit: BoxFit.cover,
                        placeholder: (context, url) =>
                            const SkeletonBox(width: 92, height: 82),
                        errorWidget: (context, url, error) =>
                            const TravelImageFallback(title: 'Foto'),
                      ),
                    );
                  },
                ),
              ),
      ),
    );
  }
}

class _PlaceSearchBar extends StatelessWidget {
  const _PlaceSearchBar({
    required this.controller,
    required this.isSearching,
    required this.onSearch,
  });

  final TextEditingController controller;
  final bool isSearching;
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      textInputAction: TextInputAction.search,
      onSubmitted: (_) => onSearch(),
      decoration: InputDecoration(
        hintText: 'Buscar lugar para el tour...',
        prefixIcon: const Icon(Icons.search_rounded),
        suffixIcon: Padding(
          padding: const EdgeInsets.all(8),
          child: IconButton.filled(
            tooltip: 'Buscar lugar',
            onPressed: isSearching ? null : onSearch,
            icon: isSearching
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.near_me_rounded),
          ),
        ),
      ),
    );
  }
}

class _PlaceResults extends StatelessWidget {
  const _PlaceResults({
    required this.places,
    required this.selectedPlace,
    required this.onSelect,
  });

  final List<NearbyPlace> places;
  final NearbyPlace? selectedPlace;
  final ValueChanged<NearbyPlace> onSelect;

  @override
  Widget build(BuildContext context) {
    if (places.isEmpty) {
      return Text(
        'Busca una ciudad, museo, parque, plaza o punto turistico.',
        style: Theme.of(context).textTheme.bodyMedium,
      );
    }
    return SizedBox(
      height: 100,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: places.length,
        separatorBuilder: (context, index) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final place = places[index];
          final selected =
              selectedPlace?.name == place.name &&
              selectedPlace?.location.latitude == place.location.latitude &&
              selectedPlace?.location.longitude == place.location.longitude;
          return SizedBox(
            width: 230,
            child: _PlaceResultCard(
              place: place,
              selected: selected,
              onTap: () => onSelect(place),
            ),
          );
        },
      ),
    );
  }
}

class _PlaceResultCard extends StatelessWidget {
  const _PlaceResultCard({
    required this.place,
    required this.selected,
    required this.onTap,
  });

  final NearbyPlace place;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final accent = _creatorAccent(context);
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: selected
              ? accent.withValues(alpha: _creatorIsDark(context) ? 0.16 : 0.10)
              : _creatorSoftFill(context),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected ? accent : _creatorBorder(context),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: accent.withValues(alpha: 0.16),
                child: Icon(
                  selected
                      ? Icons.check_rounded
                      : Icons.add_location_alt_rounded,
                  color: accent,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      place.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      place.type,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyStops extends StatelessWidget {
  const _EmptyStops({required this.onAdd});

  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(42),
      child: Column(
        children: [
          Stack(
            alignment: Alignment.topRight,
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: const Color(
                  0xFFAFCBFF,
                ).withValues(alpha: 0.14),
                child: const Icon(
                  Icons.location_on_rounded,
                  color: Color(0xFFAFCBFF),
                  size: 34,
                ),
              ),
              const CircleAvatar(
                radius: 12,
                backgroundColor: Color(0xFFAFCBFF),
                child: Icon(
                  Icons.add_rounded,
                  size: 16,
                  color: Color(0xFF0A1424),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'Aun no hay paradas',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'VibeTours usara este orden para calcular los tramos, tiempos y rutas optimas.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: 210,
            child: LiquidButton(
              label: 'Anadir primera parada',
              icon: Icons.add_location_alt_rounded,
              onPressed: onAdd,
            ),
          ),
        ],
      ),
    );
  }
}

class _StopOrderTile extends StatelessWidget {
  const _StopOrderTile({
    super.key,
    required this.index,
    required this.stop,
    required this.onRemove,
  });

  final int index;
  final _DraftStop stop;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      key: key,
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
      leading: CircleAvatar(
        backgroundColor: AppTheme.primary.withValues(alpha: 0.18),
        child: Text('${index + 1}'),
      ),
      title: Text(stop.name, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: Text('${stop.minutes} min - ${stop.description}'),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            tooltip: 'Eliminar parada',
            onPressed: onRemove,
            icon: const Icon(Icons.close_rounded),
          ),
          ReorderableDragStartListener(
            index: index,
            child: const Icon(Icons.drag_handle_rounded),
          ),
        ],
      ),
    );
  }
}

class _PaidSwitch extends StatelessWidget {
  const _PaidSwitch({required this.value, required this.onChanged});

  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _creatorSubtleFill(context),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _creatorBorder(context)),
      ),
      child: SwitchListTile(
        value: value,
        onChanged: onChanged,
        contentPadding: EdgeInsets.zero,
        secondary: const Icon(Icons.payments_outlined),
        title: const Text('Tour pago'),
        subtitle: const Text('Se cobrara al iniciar tour'),
      ),
    );
  }
}

class _IncludedTile extends StatelessWidget {
  const _IncludedTile({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final isDark = _creatorIsDark(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: CheckboxListTile(
        value: value,
        onChanged: (next) => onChanged(next ?? value),
        title: Text(label),
        controlAffinity: ListTileControlAffinity.leading,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        tileColor: _creatorSubtleFill(context),
        checkColor: isDark ? const Color(0xFF071934) : Colors.white,
        activeColor: _creatorAccent(context),
      ),
    );
  }
}

class _CreatorActionBar extends StatelessWidget {
  const _CreatorActionBar({
    required this.onPreview,
    required this.onSave,
    required this.onOptions,
  });

  final VoidCallback onPreview;
  final VoidCallback onSave;
  final VoidCallback onOptions;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 999,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: _ActionTab(
              icon: Icons.visibility_outlined,
              label: 'Previsualizar',
              onTap: onPreview,
            ),
          ),
          Expanded(
            child: FilledButton.icon(
              onPressed: onSave,
              icon: const Icon(Icons.save_outlined),
              label: const Text('Guardar tour'),
              style: FilledButton.styleFrom(
                minimumSize: const Size(0, 54),
                backgroundColor: const Color(0xFFAFCBFF),
                foregroundColor: const Color(0xFF071934),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
          Expanded(
            child: _ActionTab(
              icon: Icons.settings_outlined,
              label: 'Opciones',
              onTap: onOptions,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionTab extends StatelessWidget {
  const _ActionTab({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 21),
            const SizedBox(height: 4),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(label, style: Theme.of(context).textTheme.labelLarge),
            ),
          ],
        ),
      ),
    );
  }
}

class _DraftStop {
  _DraftStop({
    required this.id,
    required this.name,
    required this.location,
    required this.imageUrl,
    required this.description,
    required this.minutes,
    required this.activities,
    required this.curiousFacts,
    required this.tips,
    required this.locationInfo,
    required this.images,
  });

  factory _DraftStop.fromPlace(NearbyPlace place) {
    final image = _suggestedCoverFor(place.name.hashCode);
    return _DraftStop(
      id: '${place.name}-${place.location.latitude}-${place.location.longitude}',
      name: place.name,
      location: place.location,
      imageUrl: image,
      description: place.type,
      minutes: 25,
      activities: const [
        'Explorar',
        'Fotografiar',
        'Escuchar narracion guiada',
      ],
      curiousFacts: ['${place.name} es una parada seleccionada desde el mapa.'],
      tips: const ['Confirma horarios locales antes de llegar'],
      locationInfo: TourLocationInfo(
        nombreLugar: place.name,
        direccion: place.type,
        ciudad: '',
        region: '',
        pais: '',
        placeId: _placeIdFor(place),
        urlMapa: _mapUrlFor(place.location),
      ),
      images: [image],
    );
  }

  factory _DraftStop.fromTourStop(TourStop stop) {
    return _DraftStop(
      id: stop.id,
      name: stop.name,
      location: stop.location,
      imageUrl: stop.imageUrl,
      description: stop.activities.isEmpty
          ? 'Parada turistica'
          : stop.activities.first,
      minutes: stop.suggestedMinutes,
      activities: stop.activities.isEmpty
          ? const ['Explorar']
          : stop.activities,
      curiousFacts: stop.curiousFacts,
      tips: stop.tips.isEmpty
          ? const ['Confirma horarios locales antes de llegar']
          : stop.tips,
      locationInfo: stop.locationInfo,
      images: stop.images.isEmpty
          ? [if (stop.imageUrl.isNotEmpty) stop.imageUrl]
          : stop.images,
    );
  }

  final String id;
  final String name;
  final GeoPoint location;
  final String imageUrl;
  final String description;
  final int minutes;
  final List<String> activities;
  final List<String> curiousFacts;
  final List<String> tips;
  final TourLocationInfo locationInfo;
  final List<String> images;
}

String _placeIdFor(NearbyPlace place) {
  final raw =
      '${place.name}-${place.location.latitude}-${place.location.longitude}';
  return raw
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
      .replaceAll(RegExp(r'^-|-$'), '');
}

String _mapUrlFor(GeoPoint point) {
  return 'https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}';
}

const _defaultPlaceSuggestions = [
  NearbyPlace(
    name: 'Gran Malecon del Rio',
    type: 'Paseo turistico',
    distanceMeters: 0,
    location: GeoPoint(latitude: 11.0191, longitude: -74.8007),
  ),
  NearbyPlace(
    name: 'Castillo San Felipe',
    type: 'Historico',
    distanceMeters: 0,
    location: GeoPoint(latitude: 10.4229, longitude: -75.5392),
  ),
  NearbyPlace(
    name: 'Plaza Botero',
    type: 'Arte publico',
    distanceMeters: 0,
    location: GeoPoint(latitude: 6.2526, longitude: -75.5683),
  ),
  NearbyPlace(
    name: 'Museo del Oro',
    type: 'Museo',
    distanceMeters: 0,
    location: GeoPoint(latitude: 4.6019, longitude: -74.0721),
  ),
  NearbyPlace(
    name: 'Torre Eiffel',
    type: 'Icono urbano',
    distanceMeters: 0,
    location: GeoPoint(latitude: 48.8584, longitude: 2.2945),
  ),
  NearbyPlace(
    name: 'Shibuya Crossing',
    type: 'Urbano',
    distanceMeters: 0,
    location: GeoPoint(latitude: 35.6595, longitude: 139.7005),
  ),
];

String _suggestedCoverFor(int seed) {
  return _suggestedImages[seed.abs() % _suggestedImages.length];
}

const _suggestedImages = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=1200&q=80',
];

import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;

import '../../core/config/app_config.dart';
import '../../core/design/app_theme.dart';
import '../../core/design/openfree_route_map.dart';
import '../../core/design/premium_components.dart';
import '../../core/services/road_route_service.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';
import 'tour_rating_dialog.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Data model for a voice assistant response from the backend
// ─────────────────────────────────────────────────────────────────────────────
class _RouteAssistantResponse {
  const _RouteAssistantResponse({
    required this.isRelatedToTravel,
    required this.responseText,
    this.actionType,
    this.nearbyPlaces = const [],
  });

  factory _RouteAssistantResponse.fromJson(Map<String, dynamic> json) {
    final places = <_NearbyFoodPlace>[];
    final rawPlaces = json['nearbyPlaces'];
    if (rawPlaces is List) {
      for (final item in rawPlaces) {
        if (item is Map<String, dynamic>) {
          places.add(_NearbyFoodPlace.fromJson(item));
        }
      }
    }
    return _RouteAssistantResponse(
      isRelatedToTravel: json['isRelatedToTravel'] == true,
      responseText: (json['responseText'] as String?) ?? '',
      actionType: json['actionType'] as String?,
      nearbyPlaces: places,
    );
  }

  final bool isRelatedToTravel;
  final String responseText;
  final String? actionType;
  final List<_NearbyFoodPlace> nearbyPlaces;
}

class _NearbyFoodPlace {
  const _NearbyFoodPlace({
    required this.name,
    required this.latitude,
    required this.longitude,
    this.type,
    this.cuisine,
  });

  factory _NearbyFoodPlace.fromJson(Map<String, dynamic> json) {
    return _NearbyFoodPlace(
      name: (json['name'] as String?) ?? 'Restaurante',
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      type: json['type'] as String?,
      cuisine: json['cuisine'] as String?,
    );
  }

  final String name;
  final double latitude;
  final double longitude;
  final String? type;
  final String? cuisine;

  GeoPoint toGeoPoint() => GeoPoint(latitude: latitude, longitude: longitude);
}

// ─────────────────────────────────────────────────────────────────────────────
// LiveTourScreen
// ─────────────────────────────────────────────────────────────────────────────
class LiveTourScreen extends ConsumerStatefulWidget {
  const LiveTourScreen({super.key, required this.tourId});

  final String tourId;

  @override
  ConsumerState<LiveTourScreen> createState() => _LiveTourScreenState();
}

class _LiveTourScreenState extends ConsumerState<LiveTourScreen>
    with TickerProviderStateMixin {
  final RoadRouteService _routeService = RoadRouteService();

  StreamSubscription<Position>? _positionSubscription;
  Tour? _navigationTour;
  GeoPoint? _currentPoint;
  RoadRouteResult? _liveRoute;
  DateTime? _lastRerouteAt;
  DateTime? _lastTrafficRefreshAt;
  int? _liveRouteStopIndex;
  int _activeStop = 0;
  bool _isRouting = false;
  bool _isOffRoute = false;
  bool _locationStreamRequested = false;
  bool _noLandRouteAvailable = false;
  bool _isTrackingMode = false;
  bool _navigatingToHotel = false;
  double? _currentHeading;
  bool _stopsEnriched = false;

  // ── Voice assistant state ──────────────────────────────────────────────────
  bool _isListening = false;
  bool _isProcessingVoice = false;
  List<_NearbyFoodPlace> _voiceFoodPlaces = [];

  // ── Mic pulse animation ────────────────────────────────────────────────────
  late final AnimationController _micPulseController;
  late final Animation<double> _micPulseAnimation;

  @override
  void initState() {
    super.initState();
    _micPulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          _micPulseController.reverse();
        } else if (status == AnimationStatus.dismissed && _isListening) {
          _micPulseController.forward();
        }
      });
    _micPulseAnimation = Tween<double>(begin: 1.0, end: 1.35).animate(
      CurvedAnimation(parent: _micPulseController, curve: Curves.easeInOut),
    );
  }

  void _enrichGenericStops(Tour tour) async {
    if (_stopsEnriched) return;
    _stopsEnriched = true;

    final voiceGuide = ref.read(voiceGuideProvider);
    List<TourStop> updatedStops = List.from(tour.stops);
    bool changed = false;

    for (int i = 0; i < tour.stops.length; i++) {
      final stop = tour.stops[i];
      final title = stop.name.trim();
      final description = stop.description.trim();

      final isGenericName = title.isEmpty ||
                            title.toLowerCase() == 'parada' ||
                            title.toLowerCase().startsWith('parada ') ||
                            title.toLowerCase().startsWith('atracción del recorrido');

      final isDescriptionEmpty = description.isEmpty ||
                                 description.toLowerCase() == 'parada' ||
                                 description.toLowerCase() == 'parada turistica';

      if (isGenericName || isDescriptionEmpty) {
        final details = await voiceGuide.fetchWikipediaAndGeocodingDetails(
          stop.location.latitude,
          stop.location.longitude,
          lang: tour.language,
        );

        if (details != null) {
          final newName = details['name'] ?? stop.name;
          final newDesc = details['description'] ?? stop.description;
          updatedStops[i] = stop.copyWith(
            name: newName,
            description: newDesc,
          );
          changed = true;
        }
      }
    }

    if (changed && mounted) {
      final updatedTour = tour.copyWith(stops: updatedStops);
      setState(() {
        _navigationTour = updatedTour;
      });
      ref.read(selectedTourProvider.notifier).state = updatedTour;
    }
  }

  TourStop? _findHotelStop(Tour tour) {
    for (final stop in tour.stops) {
      if (stop.id == 'hotel_end') return stop;
    }
    for (final stop in tour.stops) {
      if (stop.id == 'hotel_start') return stop;
    }
    for (final stop in tour.stops.reversed) {
      if (stop.name.toLowerCase().contains('hotel')) return stop;
    }
    return null;
  }

  void _startHotelNavigation() {
    final tour = _navigationTour;
    if (tour == null) return;
    setState(() {
      _navigatingToHotel = true;
      _liveRoute = null;
      _liveRouteStopIndex = null;
    });
    _recalculateRoute(tour, force: true);
  }

  // ── Voice assistant ────────────────────────────────────────────────────────

  /// Starts the mic listening cycle, sends transcript to backend,
  /// speaks the response, and executes any structured action.
  Future<void> _onMicPressed() async {
    if (_isListening || _isProcessingVoice) return;

    final voiceGuide = ref.read(voiceGuideProvider);
    final tour = _navigationTour;

    // Start listening with blue pulse animation
    setState(() {
      _isListening = true;
      _voiceFoodPlaces = [];
    });
    _micPulseController.forward();

    String? transcript;
    try {
      transcript = await voiceGuide.listenCommand();
    } catch (_) {
      transcript = null;
    }

    // Stop pulse animation
    _micPulseController.stop();
    _micPulseController.reset();

    if (!mounted) return;
    setState(() {
      _isListening = false;
    });

    if (transcript == null || transcript.trim().isEmpty) return;

    // Show processing state
    setState(() {
      _isProcessingVoice = true;
    });

    try {
      final response = await _callRouteAssistant(
        userQuery: transcript.trim(),
        tour: tour,
      );

      if (!mounted) return;

      // Speak the AI response
      await voiceGuide.speak(response.responseText);

      if (!mounted) return;

      // Execute structured action
      await _executeVoiceAction(response, tour);
    } catch (e) {
      debugPrint('[voice-assistant] Error: $e');
      if (mounted) {
        await voiceGuide.speak(
          'Lo siento, no pude conectarme al asistente. Intenta de nuevo.',
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessingVoice = false;
        });
      }
    }
  }

  /// Sends the transcript to POST /api/ai/chat/route-assistant
  Future<_RouteAssistantResponse> _callRouteAssistant({
    required String userQuery,
    Tour? tour,
  }) async {
    final stop = tour != null && _activeStop < tour.stops.length
        ? tour.stops[_activeStop]
        : null;

    final body = <String, dynamic>{
      'userQuery': userQuery,
      if (_currentPoint != null) 'latitude': _currentPoint!.latitude,
      if (_currentPoint != null) 'longitude': _currentPoint!.longitude,
      'tourContext': {
        'currentStopName': stop?.name ?? '',
        'city': tour?.city ?? '',
        'country': tour?.country ?? '',
      },
    };

    final baseUrls = AppConfig.apiBaseUrls;
    Object? lastError;

    for (final base in baseUrls) {
      try {
        final uri = Uri.parse('$base/ai/chat/route-assistant');
        final res = await http
            .post(
              uri,
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode(body),
            )
            .timeout(const Duration(seconds: 20));

        if (res.statusCode == 200) {
          final json = jsonDecode(res.body) as Map<String, dynamic>;
          return _RouteAssistantResponse.fromJson(json);
        }
      } catch (e) {
        lastError = e;
      }
    }

    throw lastError ?? Exception('No se pudo conectar al asistente de voz.');
  }

  /// Executes the structured action returned by the backend
  Future<void> _executeVoiceAction(
    _RouteAssistantResponse response,
    Tour? tour,
  ) async {
    switch (response.actionType) {
      case 'SEARCH_RESTAURANTS':
        if (response.nearbyPlaces.isNotEmpty) {
          setState(() {
            _voiceFoodPlaces = response.nearbyPlaces;
          });
          // Narrate the found options
          final names = response.nearbyPlaces
              .take(3)
              .map((p) => p.name)
              .join(', ');
          final voiceGuide = ref.read(voiceGuideProvider);
          await voiceGuide.speak(
            'Encontré los siguientes lugares: $names. Los marqué en el mapa.',
          );
        }

      case 'RETURN_TO_ACCOMMODATION':
        if (tour != null && _findHotelStop(tour) != null) {
          _startHotelNavigation();
        }

      // DESCRIBE_CURRENT_POI and CHANGE_DESTINATION are handled
      // by the spoken response alone — no extra UI action needed.
      default:
        break;
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  @override
  void dispose() {
    _positionSubscription?.cancel();
    _micPulseController.dispose();
    super.dispose();
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final toursAsync = ref.watch(toursProvider);
    final mapStyle = ref.watch(mapStyleProvider);
    return PremiumScaffold(
      child: toursAsync.when(
        data: (tours) {
          final selected = ref.watch(selectedTourProvider);
          final tour = selected?.id == widget.tourId
              ? selected!
              : tours.firstWhere(
                  (item) => item.id == widget.tourId,
                  orElse: () => tours.first,
                );
          final stop = tour.stops[_activeStop];
          final progress = (_activeStop + 1) / tour.stops.length;
          _navigationTour = tour;
          _scheduleLiveNavigation(tour);
          final liveRoute = (_navigatingToHotel && _liveRouteStopIndex == -1) ||
                            (!_navigatingToHotel && _liveRouteStopIndex == _activeStop)
              ? _liveRoute
              : null;

          // Combine regular map points with temporary food markers
          final basePoints = _mapPointsFor(stop);
          final allPoints = _voiceFoodPlaces.isEmpty
              ? basePoints
              : [...basePoints, ..._voiceFoodPlaces.map((p) => p.toGeoPoint())];

          final baseLabels = [
            if (_currentPoint != null) 'Tu ubicacion',
            _navigatingToHotel
                ? (_findHotelStop(tour)?.name ?? 'Hotel')
                : stop.name,
          ];
          final allLabels = _voiceFoodPlaces.isEmpty
              ? baseLabels
              : [...baseLabels, ..._voiceFoodPlaces.map((p) => p.name)];

          return Stack(
            children: [
              Positioned.fill(
                child: OpenFreeRouteMap(
                  key: ValueKey('${tour.id}-$mapStyle-${_navigatingToHotel ? "hotel" : "stop"}-${_voiceFoodPlaces.length}'),
                  points: allPoints,
                  labels: allLabels,
                  activeIndex: _currentPoint == null ? 0 : 1,
                  styleUrl: mapStyle,
                  height: MediaQuery.of(context).size.height,
                  borderRadius: 0,
                  fitPadding: const EdgeInsets.fromLTRB(36, 108, 36, 360),
                  showNumbers: _currentPoint == null,
                  myLocationEnabled: true,
                  routeOverride: _noLandRouteAvailable || liveRoute == null ? const RoadRouteResult(geometry: []) : liveRoute,
                  currentLocation: _currentPoint,
                  useRoadRouting: false,
                  trackingMode: _isTrackingMode,
                  trackingHeading: _currentHeading,
                ),
              ),
              Positioned(
                right: 16,
                top: MediaQuery.of(context).padding.top + 8,
                child: FloatingActionButton.small(
                  heroTag: 'tracking_btn',
                  backgroundColor: Theme.of(context).colorScheme.surface,
                  onPressed: () {
                    setState(() {
                      _isTrackingMode = !_isTrackingMode;
                    });
                  },
                  child: Icon(
                    _isTrackingMode ? Icons.map_rounded : Icons.explore_rounded,
                    color: AppTheme.primary,
                  ),
                ),
              ),
              Positioned(
                left: 16,
                top: MediaQuery.of(context).padding.top + 8,
                child: IconButton.filledTonal(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.close_rounded),
                ),
              ),
              if (_findHotelStop(tour) != null && !_navigatingToHotel)
                Positioned(
                  right: 16,
                  bottom: 270,
                  child: FloatingActionButton.extended(
                    heroTag: 'return_hotel_fab',
                    backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                    onPressed: _startHotelNavigation,
                    icon: const Icon(Icons.hotel_rounded),
                    label: const Text('Regresar al hotel'),
                  ),
                ),
              // Clear voice markers button when food places are visible
              if (_voiceFoodPlaces.isNotEmpty)
                Positioned(
                  right: 16,
                  bottom: _findHotelStop(tour) != null && !_navigatingToHotel
                      ? 330
                      : 270,
                  child: FloatingActionButton.small(
                    heroTag: 'clear_voice_markers',
                    backgroundColor: Theme.of(context).colorScheme.errorContainer,
                    onPressed: () => setState(() => _voiceFoodPlaces = []),
                    child: Icon(
                      Icons.clear_rounded,
                      color: Theme.of(context).colorScheme.onErrorContainer,
                    ),
                  ),
                ),
              Positioned(
                left: 16,
                right: 16,
                bottom: 18,
                child: GlassPanel(
                  padding: const EdgeInsets.all(16),
                  child: _navigatingToHotel
                      ? _buildHotelNavigationPanel(context, tour)
                      : _buildStandardNavigationPanel(context, tour, stop, progress, liveRoute, l10n),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => EmptyState(
          icon: Icons.map_rounded,
          title: 'Mapa no disponible',
          body: error.toString(),
        ),
      ),
    );
  }

  void _scheduleLiveNavigation(Tour tour) {
    if (!_locationStreamRequested) {
      _locationStreamRequested = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          unawaited(_startLiveNavigation());
          _enrichGenericStops(tour);
        }
      });
    }
    if (_liveRouteStopIndex != _activeStop && !_isRouting) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) unawaited(_recalculateRoute(tour, force: true));
      });
    }
  }

  Future<void> _startLiveNavigation() async {
    final service = ref.read(locationServiceProvider);
    final initialPosition = await service.currentPosition();
    if (!mounted) return;
    if (initialPosition != null) {
      setState(() {
        _currentPoint = _pointFromPosition(initialPosition);
      });
      final tour = _navigationTour;
      if (tour != null) {
        await _recalculateRoute(tour, force: true);
      }
    }
    final stream = await service.positionStream(distanceFilterMeters: 10);
    if (!mounted || stream == null) return;
    await _positionSubscription?.cancel();
    _positionSubscription = stream.listen(_handlePositionUpdate);
  }

  void _handlePositionUpdate(Position position) {
    final point = _pointFromPosition(position);
    if (!mounted) return;
    setState(() {
      _currentPoint = point;
      if (position.heading > 0) {
        _currentHeading = position.heading;
      }
    });
    final tour = _navigationTour;
    if (tour == null || tour.stops.isEmpty) return;
    final route = _liveRouteStopIndex == _activeStop ? _liveRoute : null;
    final distanceToRoute = route == null
        ? double.infinity
        : _distanceToRouteMeters(point, route.geometry);
    final now = DateTime.now();
    final refreshTraffic =
        route != null &&
        _routeService.hasLiveTrafficProvider &&
        now.difference(
              _lastTrafficRefreshAt ?? DateTime.fromMillisecondsSinceEpoch(0),
            ) >
            const Duration(minutes: 2);
    final deviated = distanceToRoute > 85;
    if (deviated || refreshTraffic || route == null) {
      if (_canReroute(now)) {
        if (deviated) {
          setState(() {
            _isOffRoute = true;
          });
        }
        unawaited(
          _recalculateRoute(
            tour,
            force: route == null || refreshTraffic,
            markOffRoute: deviated,
          ),
        );
      }
    }
  }

  Future<void> _recalculateRoute(
    Tour tour, {
    bool force = false,
    bool markOffRoute = false,
  }) async {
    if (_isRouting && !force) return;
    var origin = _currentPoint;
    if (origin == null) {
      final position = await ref
          .read(locationServiceProvider)
          .currentPosition();
      if (!mounted || position == null) return;
      origin = _pointFromPosition(position);
      setState(() {
        _currentPoint = origin;
      });
    }
    if (tour.stops.isEmpty) return;
    final stopIndex = _navigatingToHotel ? -1 : _activeStop;
    final hotelStop = _findHotelStop(tour);
    if (_navigatingToHotel && hotelStop == null) return;
    final destination = _navigatingToHotel ? hotelStop!.location : tour.stops[_activeStop].location;
    setState(() {
      _isRouting = true;
      _isOffRoute = markOffRoute;
    });
    final route = await _routeService.resolveRoute(
      [origin, destination],
      preferLiveTraffic: true,
      forceRefresh: true,
    );
    if (!mounted) return;
    
    final directDist = Geolocator.distanceBetween(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude,
    );
    
    bool isUnreachable = route.usedFallback && directDist > 20000;
    
    if (route.geometry.isNotEmpty) {
      final snapStart = Geolocator.distanceBetween(
        origin.latitude, origin.longitude,
        route.geometry.first.latitude, route.geometry.first.longitude,
      );
      if (snapStart > 50000) {
        isUnreachable = true;
      }
    }
    
    if (route.usesMaritimeTransfer && directDist > 500000) {
      isUnreachable = true;
    }

    setState(() {
      _liveRoute = route;
      _liveRouteStopIndex = stopIndex;
      _lastRerouteAt = DateTime.now();
      _lastTrafficRefreshAt = DateTime.now();
      _isRouting = false;
      _isOffRoute = false;
      _noLandRouteAvailable = isUnreachable;
    });
  }

  bool _canReroute(DateTime now) {
    final last = _lastRerouteAt;
    return !_isRouting &&
        (last == null || now.difference(last) > const Duration(seconds: 18));
  }

  List<GeoPoint> _mapPointsFor(TourStop stop) {
    final origin = _currentPoint;
    final destination = _navigatingToHotel
        ? (_findHotelStop(_navigationTour!)?.location ?? stop.location)
        : stop.location;
    if (origin == null) return [destination];
    return [origin, destination];
  }

  GeoPoint _pointFromPosition(Position position) {
    return GeoPoint(latitude: position.latitude, longitude: position.longitude);
  }

  String _distanceLabel(Tour tour, double progress, RoadRouteResult? route) {
    final meters = route?.distanceMeters ?? 0;
    if (meters > 0) {
      return '${(meters / 1000).toStringAsFixed(1)} km restantes';
    }
    if (_navigatingToHotel) return 'Por calcular';
    return '${(tour.distanceKm * (1 - progress)).toStringAsFixed(1)} km restantes';
  }

  String _timeLabel(Tour tour, double progress, RoadRouteResult? route) {
    final seconds = route?.travelTimeSeconds;
    if (seconds != null && seconds > 0) return _formatDuration(seconds);
    if (_navigatingToHotel) return 'Calculando...';
    final fallbackMinutes = ((tour.durationHours * 60) * (1 - progress))
        .round();
    return '$fallbackMinutes min';
  }

  String _trafficLabel(RoadRouteResult? route) {
    if (_isRouting) return 'Calculando trafico';
    if (!_routeService.hasLiveTrafficProvider) return 'Sin trafico en vivo';
    if (route == null || !route.usesLiveTraffic) return 'Trafico pendiente';
    final delayMinutes = ((route.trafficDelaySeconds ?? 0) / 60).round();
    final status = switch (route.trafficSeverity) {
      TrafficSeverity.clear => 'Trafico fluido',
      TrafficSeverity.moderate => 'Trafico moderado',
      TrafficSeverity.heavy => 'Trafico pesado',
      TrafficSeverity.severe => 'Trafico critico',
      TrafficSeverity.unavailable => 'Trafico no disponible',
    };
    if (delayMinutes <= 0) return status;
    return '$status +$delayMinutes min';
  }

  String _formatDuration(int seconds) {
    final minutes = (seconds / 60).round();
    if (minutes < 60) return '$minutes min';
    final hours = minutes ~/ 60;
    final remaining = minutes % 60;
    if (remaining == 0) return '$hours h';
    return '$hours h $remaining min';
  }

  double _distanceToRouteMeters(GeoPoint point, List<GeoPoint> route) {
    if (route.isEmpty) return double.infinity;
    var best = double.infinity;
    for (final routePoint in route) {
      final distance = Geolocator.distanceBetween(
        point.latitude,
        point.longitude,
        routePoint.latitude,
        routePoint.longitude,
      );
      if (distance < best) best = distance;
    }
    return best;
  }

  Widget _buildHotelNavigationPanel(BuildContext context, Tour tour) {
    final hotelStop = _findHotelStop(tour);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Regresando al hotel',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
            Icon(Icons.hotel_rounded, color: Theme.of(context).colorScheme.primary),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          hotelStop?.name ?? 'Hotel de alojamiento',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
              ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            if (!_noLandRouteAvailable)
              _LiveChip(
                icon: Icons.route_rounded,
                label: _distanceLabel(tour, 0, _liveRoute),
              ),
            if (!_noLandRouteAvailable)
              _LiveChip(
                icon: Icons.schedule_rounded,
                label: _timeLabel(tour, 0, _liveRoute),
              ),
            if (_isOffRoute || _isRouting)
              _LiveChip(
                icon: Icons.alt_route_rounded,
                label: _isRouting ? 'Actualizando ruta' : 'Desvio detectado',
              ),
            if (_currentPoint != null)
              const _LiveChip(
                icon: Icons.gps_fixed_rounded,
                label: 'GPS live',
              )
            else
              const _LiveChip(
                icon: Icons.gps_not_fixed_rounded,
                label: 'Buscando GPS',
              ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: LiquidButton(
                label: 'Reanudar Tour',
                icon: Icons.play_arrow_rounded,
                isPrimary: true,
                onPressed: () {
                  setState(() {
                    _navigatingToHotel = false;
                    _liveRoute = null;
                    _liveRouteStopIndex = null;
                  });
                  _recalculateRoute(tour, force: true);
                },
              ),
            ),
            const SizedBox(width: 10),
            IconButton.filledTonal(
              tooltip: 'Recalcular ruta al hotel',
              onPressed: () => _recalculateRoute(tour, force: true),
              icon: const Icon(Icons.sync_rounded),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStandardNavigationPanel(
    BuildContext context,
    Tour tour,
    TourStop stop,
    double progress,
    RoadRouteResult? liveRoute,
    AppLocalizations l10n,
  ) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                stop.name,
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ),
            Text('${_activeStop + 1}/${tour.stops.length}'),
          ],
        ),
        const SizedBox(height: 10),
        LinearProgressIndicator(
          value: progress,
          minHeight: 8,
          borderRadius: BorderRadius.circular(999),
        ),
        const SizedBox(height: 12),
        if (_noLandRouteAvailable)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.errorContainer.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Theme.of(context).colorScheme.error.withValues(alpha: 0.5)),
            ),
            child: Row(
              children: [
                Icon(Icons.directions_off_rounded, color: Theme.of(context).colorScheme.onErrorContainer),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'No se puede calcular la ruta debido a que no hay ruta terrestre disponible.',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onErrorContainer,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            if (!_noLandRouteAvailable)
              _LiveChip(
                icon: Icons.route_rounded,
                label: _distanceLabel(tour, progress, liveRoute),
              ),
            if (!_noLandRouteAvailable)
              _LiveChip(
                icon: Icons.schedule_rounded,
                label: _timeLabel(tour, progress, liveRoute),
              ),
            if (!_noLandRouteAvailable)
              _LiveChip(
                icon: Icons.traffic_rounded,
                label: _trafficLabel(liveRoute),
              ),
            if (_isOffRoute || _isRouting)
              _LiveChip(
                icon: Icons.alt_route_rounded,
                label: _isRouting
                    ? 'Actualizando ruta'
                    : 'Desvio detectado',
              ),
            if (_currentPoint != null)
              const _LiveChip(
                icon: Icons.gps_fixed_rounded,
                label: 'GPS live',
              )
            else
              const _LiveChip(
                icon: Icons.gps_not_fixed_rounded,
                label: 'Buscando GPS',
              ),
          ],
        ),
        if (!_noLandRouteAvailable)
          const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: LiquidButton(
                label: l10n.voiceGuide,
                icon: Icons.record_voice_over_rounded,
                onPressed: () async {
                  await ref.read(voiceGuideProvider).narrateStop(
                    stop,
                    lang: tour.language,
                    onResolved: (name, description) {
                      if (mounted) {
                        setState(() {
                          final updatedStops = tour.stops.map((s) {
                            if (s.id == stop.id) {
                              return s.copyWith(name: name, description: description);
                            }
                            return s;
                          }).toList();
                          final updatedTour = tour.copyWith(stops: updatedStops);
                          _navigationTour = updatedTour;
                          ref.read(selectedTourProvider.notifier).state = updatedTour;
                        });
                      }
                    },
                  );
                },
              ),
            ),
            const SizedBox(width: 10),
            // ── Voice assistant mic button (replaces hands-free) ────────────
            _buildMicButton(context),
            IconButton.filledTonal(
              tooltip: l10n.recalculate,
              onPressed: () =>
                  _recalculateRoute(tour, force: true),
              icon: const Icon(Icons.sync_rounded),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: LiquidButton(
            label: _activeStop == tour.stops.length - 1 ? 'Terminar tour' : l10n.nextStop,
            icon: _activeStop == tour.stops.length - 1 ? Icons.flag_rounded : Icons.arrow_forward_rounded,
            isPrimary: _activeStop == tour.stops.length - 1,
            onPressed: () {
              if (_activeStop == tour.stops.length - 1) {
                final currentUser = ref.read(authServiceProvider).currentUser;
                
                if (currentUser == null) {
                  context.pop(); // Guests cannot rate
                  return;
                }

                final userTours = ref.read(userToursProvider).valueOrNull?.manualTours ?? [];
                final isOwnTour = userTours.any((t) => t.id == tour.id) || tour.id.startsWith('manual-');
                
                final userRatings = ref.read(userRatingsProvider(currentUser.id)).valueOrNull ?? [];
                final hasRated = userRatings.any((r) => r.tour.id == tour.id);
                
                if (isOwnTour || hasRated) {
                  context.pop();
                } else {
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (context) => TourRatingDialog(tour: tour),
                  );
                }
              } else {
                setState(() {
                  _activeStop =
                      ((_activeStop + 1) % tour.stops.length)
                          .toInt();
                  _liveRoute = null;
                  _liveRouteStopIndex = null;
                  _isOffRoute = false;
                  _noLandRouteAvailable = false;
                  _voiceFoodPlaces = []; // Clear food markers on stop change
                });
                _recalculateRoute(tour, force: true);
              }
            },
          ),
        ),
      ],
    );
  }

  /// The animated microphone button that replaces the hands-free button
  Widget _buildMicButton(BuildContext context) {
    final isActive = _isListening || _isProcessingVoice;
    final theme = Theme.of(context);

    final micIcon = _isProcessingVoice
        ? const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          )
        : Icon(
            _isListening ? Icons.mic_rounded : Icons.mic_none_rounded,
            color: isActive ? Colors.white : null,
          );

    if (!_isListening) {
      return IconButton.filledTonal(
        tooltip: 'Asistente de voz',
        onPressed: _isProcessingVoice ? null : _onMicPressed,
        style: _isProcessingVoice
            ? IconButton.styleFrom(
                backgroundColor: theme.colorScheme.primary.withValues(alpha: 0.6),
              )
            : null,
        icon: micIcon,
      );
    }

    // Pulsing blue animation while listening
    return AnimatedBuilder(
      animation: _micPulseAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _micPulseAnimation.value,
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF007AFF),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF007AFF).withValues(alpha: 0.5),
                  blurRadius: 12 * _micPulseAnimation.value,
                  spreadRadius: 2 * _micPulseAnimation.value,
                ),
              ],
            ),
            child: const Icon(
              Icons.mic_rounded,
              color: Colors.white,
              size: 20,
            ),
          ),
        );
      },
    );
  }
}

class _LiveChip extends StatelessWidget {
  const _LiveChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 16, color: AppTheme.primary),
      label: Text(label),
      visualDensity: VisualDensity.compact,
    );
  }
}

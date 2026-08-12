import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:wakelock_plus/wakelock_plus.dart';

import '../../core/config/app_config.dart';
import '../../core/design/app_theme.dart';
import '../../core/design/live_navigation_map.dart';
import '../../core/design/premium_components.dart';
import '../../core/services/road_route_service.dart';
import '../../core/services/tour_runtime_services.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';
import '../../state/live_tour_state.dart';
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
  // Live navigation opens in follow mode. The full-route view remains
  // available from the map menu, but is not useful while driving or walking.
  bool _isTrackingMode = true;
  bool _navigatingToHotel = false;
  double? _currentHeading;
  bool _stopsEnriched = false;
  LocationSamplingMode _currentSamplingMode = LocationSamplingMode.walking;
  DateTime? _stoppedSince;
  DateTime? _lastModeSwitchAt;
  double _ttsSpeedMultiplier = 1.0;
  bool _autoPlayProximityEnabled = true;
  final Set<String> _autoTriggeredStopIds = {};



  Future<void> _updateBatterySamplingMode(double speed, double distanceToStop) async {
    final isStopped = speed < 0.5 || distanceToStop < 30.0;
    final now = DateTime.now();

    if (isStopped) {
      _stoppedSince ??= now;
    } else {
      _stoppedSince = null;
    }

    final stoppedDuration = _stoppedSince != null ? now.difference(_stoppedSince!) : Duration.zero;
    final shouldBeStationary = isStopped && (stoppedDuration.inSeconds >= 15 || distanceToStop < 20.0);
    final targetMode = shouldBeStationary ? LocationSamplingMode.stationary : LocationSamplingMode.walking;

    final canSwitch = _lastModeSwitchAt == null || now.difference(_lastModeSwitchAt!).inSeconds >= 15;

    if (_currentSamplingMode != targetMode && canSwitch) {
      _currentSamplingMode = targetMode;
      _lastModeSwitchAt = now;
      if (mounted) {
        setState(() {});
      }
      final service = ref.read(locationServiceProvider);
      final stream = await service.positionStream(
        // Navigation needs frequent fixes; sparse fixes are still smoothed by
        // LiveNavigationMap, but a 3 m filter keeps GPS corrections subtle.
        distanceFilterMeters: targetMode == LocationSamplingMode.stationary ? 35 : 3,
        mode: targetMode,
      );
      if (!mounted || stream == null) return;
      await _positionSubscription?.cancel();
      _positionSubscription = stream.listen(_handlePositionUpdate);
    }
  }

  // ── Pocket Mode & Map Menu State ───────────────────────────────────────────
  bool _isPocketModeEnabled = false;
  bool _isMapMenuExpanded = false;

  // ── Voice assistant state ──────────────────────────────────────────────────
  bool _isListening = false;
  bool _isProcessingVoice = false;
  List<_NearbyFoodPlace> _voiceFoodPlaces = [];
  _NearbyFoodPlace? _selectedVoicePlace;

  // ── Mic pulse animation ────────────────────────────────────────────────────
  late final AnimationController _micPulseController;
  late final Animation<double> _micPulseAnimation;

  @override
  void initState() {
    super.initState();
    unawaited(WakelockPlus.enable());
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
      _selectedVoicePlace = null;
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
      _selectedVoicePlace = null;
    });
    _micPulseController.forward();

    String? sttError;
    String? transcript;
    try {
      transcript = await voiceGuide.listenCommand(
        onError: (err) => sttError = err,
      );
    } catch (e) {
      transcript = null;
      sttError = e.toString();
    }

    // Stop pulse animation
    _micPulseController.stop();
    _micPulseController.reset();

    if (!mounted) return;
    setState(() {
      _isListening = false;
    });

    if (transcript == null || transcript.trim().isEmpty) {
      final feedbackText = sttError ?? 'No logré escucharte. Por favor, intenta de nuevo.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(feedbackText),
          behavior: SnackBarBehavior.floating,
        ),
      );
      await voiceGuide.speak(feedbackText);
      return;
    }

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
    unawaited(WakelockPlus.disable());
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
    final mapStyleOption = ref.watch(mapStyleOptionProvider);
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
          
          final liveRoute = _liveRoute;

          final destinationPoint = _selectedVoicePlace != null
              ? _selectedVoicePlace!.toGeoPoint()
              : _navigatingToHotel
                  ? (_findHotelStop(tour)?.location ?? stop.location)
                  : stop.location;
          final destinationName = _selectedVoicePlace != null
              ? _selectedVoicePlace!.name
              : _navigatingToHotel
                  ? (_findHotelStop(tour)?.name ?? 'Hotel')
                  : stop.name;

          return Stack(
            children: [
              Positioned.fill(
                child: LiveNavigationMap(
                  key: ValueKey('${tour.id}-$mapStyle-${_selectedVoicePlace != null ? "voice" : _navigatingToHotel ? "hotel" : "stop"}'),
                  destination: destinationPoint,
                  destinationName: destinationName,
                  styleUrl: mapStyle,
                  fitPadding: const EdgeInsets.fromLTRB(28, 100, 28, 390),
                  route: _noLandRouteAvailable ? const RoadRouteResult(geometry: []) : liveRoute,
                  currentLocation: _currentPoint,
                  trackingMode: _isTrackingMode,
                  trackingHeading: _currentHeading,
                  onPointSelected: (point) {
                    _NearbyFoodPlace? tappedPlace;
                    for (final p in _voiceFoodPlaces) {
                      final dist = Geolocator.distanceBetween(
                        p.latitude,
                        p.longitude,
                        point.latitude,
                        point.longitude,
                      );
                      if (dist < 25.0) {
                        tappedPlace = p;
                        break;
                      }
                    }
                    if (tappedPlace != null) {
                      setState(() {
                        _selectedVoicePlace = tappedPlace;
                        _navigatingToHotel = false;
                        _liveRoute = null;
                        _liveRouteStopIndex = null;
                      });
                      _recalculateRoute(tour, force: true);
                    }
                  },
                ),
              ),

              // ── Single Hamburger Menu FAB (Top Right) ───────────────────────────
              Positioned(
                right: 16,
                top: MediaQuery.of(context).padding.top + 2,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    FloatingActionButton.small(
                      heroTag: 'map_menu_hamburger_fab',
                      backgroundColor: Theme.of(context).colorScheme.surface,
                      onPressed: () {
                        setState(() {
                          _isMapMenuExpanded = !_isMapMenuExpanded;
                        });
                      },
                      child: Icon(
                        _isMapMenuExpanded ? Icons.close_rounded : Icons.menu_rounded,
                        color: AppTheme.primary,
                      ),
                    ),
                    if (_isMapMenuExpanded) ...[
                      const SizedBox(height: 8),
                      Container(
                        width: 170,
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.15),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            _MapMenuItem(
                              icon: _isTrackingMode ? Icons.my_location_rounded : Icons.explore_rounded,
                              label: _isTrackingMode ? 'Vista general' : 'Seguimiento',
                              isActive: _isTrackingMode,
                              onTap: () {
                                setState(() {
                                  _isTrackingMode = !_isTrackingMode;
                                  _isMapMenuExpanded = false;
                                });
                              },
                            ),
                            const SizedBox(height: 4),
                            _MapMenuItem(
                              icon: mapStyleOption == MapStyleOption.satellite
                                  ? Icons.satellite_alt_rounded
                                  : mapStyleOption == MapStyleOption.night
                                      ? Icons.nights_stay_rounded
                                      : Icons.map_rounded,
                              label: mapStyleOption == MapStyleOption.satellite
                                  ? 'Mapa Satélite'
                                  : mapStyleOption == MapStyleOption.night
                                      ? 'Mapa Oscuro'
                                      : 'Mapa Calles',
                              isActive: false,
                              onTap: () {
                                final current = ref.read(mapStyleOptionProvider);
                                final next = current == MapStyleOption.day
                                    ? MapStyleOption.satellite
                                    : current == MapStyleOption.satellite
                                        ? MapStyleOption.night
                                        : MapStyleOption.day;
                                ref.read(mapStyleOptionProvider.notifier).setOption(next);
                                setState(() => _isMapMenuExpanded = false);
                              },
                            ),
                            if (_findHotelStop(tour) != null && !_navigatingToHotel) ...[
                              const SizedBox(height: 4),
                              _MapMenuItem(
                                icon: Icons.hotel_rounded,
                                label: 'Ir al Hotel',
                                isActive: _navigatingToHotel,
                                onTap: () {
                                  setState(() => _isMapMenuExpanded = false);
                                  _startHotelNavigation();
                                },
                              ),
                            ],
                            const SizedBox(height: 4),
                            _MapMenuItem(
                              icon: Icons.power_settings_new_rounded,
                              label: 'Modo Bolsillo',
                              isActive: _isPocketModeEnabled,
                              onTap: () {
                                setState(() {
                                  _isPocketModeEnabled = !_isPocketModeEnabled;
                                  _isMapMenuExpanded = false;
                                });
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      _isPocketModeEnabled
                                          ? '🔋 Modo Bolsillo activado: Audio y geocerca activos en bajo consumo.'
                                          : '📱 Modo Bolsillo desactivado.',
                                    ),
                                    duration: const Duration(seconds: 3),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Positioned(
                left: 16,
                top: MediaQuery.of(context).padding.top + 2,
                child: IconButton.filledTonal(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.close_rounded),
                ),
              ),
              Positioned(
                left: 16,
                right: 16,
                bottom: 18 + MediaQuery.of(context).padding.bottom,
                child: GlassPanel(
                  padding: const EdgeInsets.all(12),
                  radius: 24,
                  child: _selectedVoicePlace != null
                      ? _buildRestaurantNavigationPanel(context, tour)
                      : _navigatingToHotel
                          ? _buildHotelNavigationPanel(context, tour)
                          : _buildStandardNavigationPanel(context, tour, stop, progress, liveRoute, l10n),
                ),
              ),
              if (_isPocketModeEnabled)
                Positioned.fill(
                  child: GestureDetector(
                    onTap: () => setState(() => _isPocketModeEnabled = false),
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      color: const Color(0xFF030712),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
                      child: SafeArea(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                IconButton.filledTonal(
                                  onPressed: () => setState(() => _isPocketModeEnabled = false),
                                  icon: const Icon(Icons.close_rounded, color: Colors.white),
                                  style: IconButton.styleFrom(backgroundColor: Colors.white24),
                                ),
                              ],
                            ),
                            const Spacer(),
                            const Icon(
                              Icons.bolt_rounded,
                              color: Colors.amber,
                              size: 52,
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Modo Bolsillo Activo 🔋',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Puedes guardar tu smartphone en el bolsillo. La voz del guía y el GPS siguen activos en tiempo real.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.grey.shade400,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 32),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                              decoration: BoxDecoration(
                                color: Colors.white10,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.white12),
                              ),
                              child: Column(
                                children: [
                                  Text(
                                    'Siguiente parada:',
                                    style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    stop.name,
                                    style: const TextStyle(
                                      color: Colors.amberAccent,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Spacer(),
                            FilledButton.icon(
                              onPressed: () => setState(() => _isPocketModeEnabled = false),
                              icon: const Icon(Icons.touch_app_rounded),
                              label: const Text('Toca en cualquier lugar para salir'),
                              style: FilledButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                foregroundColor: Colors.white,
                                minimumSize: const Size(double.infinity, 54),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final playback = ref.read(liveTourPlaybackProvider);
        final currentUser = ref.read(authServiceProvider).currentUser;
        if (playback.tour?.id != tour.id || playback.currentStopIndex != _activeStop) {
          ref.read(liveTourPlaybackProvider.notifier).startTour(
                tour,
                initialStopIndex: _activeStop,
                userId: currentUser?.id ?? 'guest',
              );
        }
      }
    });
    if (!_locationStreamRequested) {
      _locationStreamRequested = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          unawaited(_startLiveNavigation());
          _enrichGenericStops(tour);
        }
      });
    }
    final targetStopIndex = _selectedVoicePlace != null
        ? -2
        : _navigatingToHotel
            ? -1
            : _activeStop;
    if (_liveRouteStopIndex != targetStopIndex && !_isRouting) {
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
    final stream = await service.positionStream(distanceFilterMeters: 2);
    if (!mounted || stream == null) return;
    await _positionSubscription?.cancel();
    _positionSubscription = stream.listen(_handlePositionUpdate);
  }

  void _handlePositionUpdate(Position position) {
    final point = _pointFromPosition(position);
    if (!mounted) return;

    _currentPoint = point;
    if (position.heading >= 0) {
      _currentHeading = position.heading;
    }

    setState(() {});
    final tour = _navigationTour;
    if (tour == null || tour.stops.isEmpty) return;

    final activeStopPoint = _activeStop < tour.stops.length ? tour.stops[_activeStop].location : null;
    final distanceToActiveStop = activeStopPoint != null
        ? Geolocator.distanceBetween(point.latitude, point.longitude, activeStopPoint.latitude, activeStopPoint.longitude)
        : double.infinity;
    _updateBatterySamplingMode(position.speed, distanceToActiveStop);

    // Audioguía automática por proximidad (< 30 metros)
    if (_autoPlayProximityEnabled && _activeStop < tour.stops.length) {
      final currentStop = tour.stops[_activeStop];
      if (distanceToActiveStop <= 30.0 && !_autoTriggeredStopIds.contains(currentStop.id)) {
        _autoTriggeredStopIds.add(currentStop.id);
        debugPrint('[ProximityTTS] Disparando narración automática para parada ${currentStop.name} (distancia: ${distanceToActiveStop.toStringAsFixed(1)}m)');
        unawaited(
          ref.read(voiceGuideProvider).narrateStop(
            currentStop,
            lang: tour.language,
            onResolved: (name, description) {
              if (mounted) {
                setState(() {
                  final updatedStops = tour.stops.map((s) {
                    if (s.id == currentStop.id) {
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
          ),
        );
        ref.read(liveTourPlaybackProvider.notifier).setPlaying(true);
      }
    }
    final route = _liveRoute;
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
    final deviated = distanceToRoute > 35;
    if (deviated || refreshTraffic || route == null) {
      if (_canReroute(now, isOffRoute: deviated)) {
        if (deviated) {
          setState(() {
            _isOffRoute = true;
          });
        }
        unawaited(
          _recalculateRoute(
            tour,
            force: route == null || refreshTraffic || deviated,
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
    
    final stopIndex = _selectedVoicePlace != null
        ? -2
        : _navigatingToHotel
            ? -1
            : _activeStop;
            
    final hotelStop = _findHotelStop(tour);
    if (_navigatingToHotel && hotelStop == null) return;
    
    final GeoPoint destination;
    if (_selectedVoicePlace != null) {
      destination = _selectedVoicePlace!.toGeoPoint();
    } else if (_navigatingToHotel) {
      destination = hotelStop!.location;
    } else {
      destination = tour.stops[_activeStop].location;
    }

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

  bool _canReroute(DateTime now, {bool isOffRoute = false}) {
    if (_isRouting) return false;
    final last = _lastRerouteAt;
    if (last == null) return true;
    final minInterval = isOffRoute ? const Duration(seconds: 2) : const Duration(seconds: 12);
    return now.difference(last) > minInterval;
  }

  GeoPoint _pointFromPosition(Position position) {
    return GeoPoint(latitude: position.latitude, longitude: position.longitude);
  }

  String _distanceLabel(Tour tour, double progress, RoadRouteResult? route) {
    final meters = _remainingRouteDistanceMeters(route) ?? route?.distanceMeters ?? 0;
    if (meters > 0) {
      if (meters < 1000) return '${meters.round()} m restantes';
      return '${(meters / 1000).toStringAsFixed(1)} km restantes';
    }
    if (_selectedVoicePlace != null || _navigatingToHotel) return 'Por calcular';
    return '${(tour.distanceKm * (1 - progress)).toStringAsFixed(1)} km restantes';
  }

  String _timeLabel(Tour tour, double progress, RoadRouteResult? route) {
    final seconds = route?.travelTimeSeconds;
    if (seconds != null && seconds > 0 && seconds < 7200) {
      final remainingMeters = _remainingRouteDistanceMeters(route);
      final totalMeters = route?.distanceMeters ?? 0;
      final remainingSeconds = remainingMeters != null && totalMeters > 0
          ? (seconds * (remainingMeters / totalMeters)).round()
          : seconds;
      return _formatDuration(remainingSeconds.clamp(0, 7200));
    }
    if (_selectedVoicePlace != null || _navigatingToHotel) return 'Calculando...';
    // Calculate realistic walking time for the active leg based on remaining meters
    final legMeters = _remainingRouteDistanceMeters(route) ?? route?.distanceMeters ?? 0;
    if (legMeters > 0) {
      // Estimated walking speed: 4.2 km/h (1.16 m/s)
      final estimatedMins = (legMeters / 1000.0 / 4.2 * 60).round().clamp(1, 90);
      return '$estimatedMins min';
    }
    final activeStopMins = tour.stops.isNotEmpty && _activeStop < tour.stops.length
        ? (tour.stops[_activeStop].suggestedMinutes > 0 ? tour.stops[_activeStop].suggestedMinutes : 25)
        : 25;
    return '$activeStopMins min';
  }

  String _trafficLabel(RoadRouteResult? route) {
    // Route and traffic requests are asynchronous. Keep the previous route on
    // screen while they refresh instead of suggesting that navigation stopped.
    if (_isRouting) return 'Actualizando trafico';
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
    if (route.length == 1) {
      return Geolocator.distanceBetween(
        point.latitude,
        point.longitude,
        route.first.latitude,
        route.first.longitude,
      );
    }

    var best = double.infinity;
    for (var index = 0; index < route.length - 1; index++) {
      final distance = _distanceToSegmentMeters(
        point,
        route[index],
        route[index + 1],
      );
      if (distance < best) best = distance;
    }
    return best;
  }

  double _distanceToSegmentMeters(GeoPoint point, GeoPoint start, GeoPoint end) {
    // Local equirectangular projection is sufficiently accurate at navigation
    // distances and measures the road segment itself, not just its vertices.
    final referenceLatitude = (start.latitude + end.latitude + point.latitude) / 3;
    final longitudeScale = math.cos(referenceLatitude * math.pi / 180);
    final segmentX = (end.longitude - start.longitude) * longitudeScale;
    final segmentY = end.latitude - start.latitude;
    final pointX = (point.longitude - start.longitude) * longitudeScale;
    final pointY = point.latitude - start.latitude;
    final lengthSquared = segmentX * segmentX + segmentY * segmentY;
    final t = lengthSquared == 0
        ? 0.0
        : ((pointX * segmentX + pointY * segmentY) / lengthSquared).clamp(0.0, 1.0);
    final projectedLatitude = start.latitude + t * (end.latitude - start.latitude);
    final projectedLongitude = start.longitude + t * (end.longitude - start.longitude);
    return Geolocator.distanceBetween(
      point.latitude,
      point.longitude,
      projectedLatitude,
      projectedLongitude,
    );
  }

  double? _remainingRouteDistanceMeters(RoadRouteResult? route) {
    final current = _currentPoint;
    final geometry = route?.geometry;
    if (current == null || geometry == null || geometry.length < 2) return null;

    var closestIndex = 0;
    var closestDistance = double.infinity;
    for (var index = 0; index < geometry.length; index++) {
      final candidate = geometry[index];
      final distance = Geolocator.distanceBetween(
        current.latitude,
        current.longitude,
        candidate.latitude,
        candidate.longitude,
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    }

    // Keep the original estimate when the GPS is not close enough to the
    // current route for a meaningful remaining-distance calculation.
    if (closestDistance > 250) return null;

    var remaining = closestDistance;
    for (var index = closestIndex; index < geometry.length - 1; index++) {
      final start = geometry[index];
      final end = geometry[index + 1];
      remaining += Geolocator.distanceBetween(
        start.latitude,
        start.longitude,
        end.latitude,
        end.longitude,
      );
    }
    return remaining;
  }

  Widget _buildRestaurantNavigationPanel(BuildContext context, Tour tour) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Ruta al restaurante',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
            Icon(Icons.restaurant_rounded, color: Theme.of(context).colorScheme.primary),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          _selectedVoicePlace?.name ?? 'Restaurante',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
              ),
        ),
        if (_selectedVoicePlace?.cuisine != null) ...[
          const SizedBox(height: 2),
          Text(
            'Cocina: ${_selectedVoicePlace!.cuisine!}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                ),
          ),
        ],
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
                    _selectedVoicePlace = null;
                    _liveRoute = null;
                    _liveRouteStopIndex = null;
                  });
                  _recalculateRoute(tour, force: true);
                },
              ),
            ),
            const SizedBox(width: 10),
            IconButton.filledTonal(
              tooltip: 'Recalcular ruta al restaurante',
              onPressed: () => _recalculateRoute(tour, force: true),
              icon: const Icon(Icons.sync_rounded),
            ),
          ],
        ),
      ],
    );
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
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.8),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                '${_activeStop + 1}/${tour.stops.length}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: progress,
          minHeight: 4,
          borderRadius: BorderRadius.circular(999),
        ),
        const SizedBox(height: 10),
        if (_noLandRouteAvailable)
          Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.errorContainer.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Theme.of(context).colorScheme.error.withValues(alpha: 0.5)),
            ),
            child: Row(
              children: [
                Icon(Icons.directions_off_rounded, size: 20, color: Theme.of(context).colorScheme.onErrorContainer),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Sin ruta terrestre disponible.',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onErrorContainer,
                      fontWeight: FontWeight.w500,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        // Unified Telemetry Strip
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.25),
            ),
          ),
          child: FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Row(
              children: [
                if (!_noLandRouteAvailable) ...[
                  Icon(Icons.route_rounded, size: 14, color: AppTheme.primary),
                  const SizedBox(width: 4),
                  Text(_distanceLabel(tour, progress, liveRoute), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(width: 10),
                  Text('•', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3))),
                  const SizedBox(width: 10),
                  Icon(Icons.schedule_rounded, size: 14, color: AppTheme.primary),
                  const SizedBox(width: 4),
                  Text(_timeLabel(tour, progress, liveRoute), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(width: 10),
                  Text('•', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3))),
                  const SizedBox(width: 10),
                  Icon(Icons.traffic_rounded, size: 14, color: AppTheme.primary),
                  const SizedBox(width: 4),
                  Text(_trafficLabel(liveRoute), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(width: 10),
                  Text('•', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3))),
                  const SizedBox(width: 10),
                ],
                Icon(
                  _currentPoint != null ? Icons.gps_fixed_rounded : Icons.gps_not_fixed_rounded,
                  size: 14,
                  color: _currentPoint != null ? Colors.green : Colors.orange,
                ),
                const SizedBox(width: 4),
                Text(
                  _currentPoint != null ? 'GPS live' : 'Buscando GPS',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _currentPoint != null ? Colors.green : Colors.orange,
                  ),
                ),
                if (_currentSamplingMode == LocationSamplingMode.stationary) ...[
                  const SizedBox(width: 10),
                  Text('•', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3))),
                  const SizedBox(width: 10),
                  const Icon(Icons.battery_saver_rounded, size: 14, color: Colors.blueAccent),
                  const SizedBox(width: 4),
                  const Text('Ahorro GPS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.blueAccent)),
                ],
                if (_isOffRoute || _isRouting) ...[
                  const SizedBox(width: 10),
                  Text('•', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3))),
                  const SizedBox(width: 10),
                  const Icon(Icons.alt_route_rounded, size: 14, color: Colors.amber),
                  const SizedBox(width: 4),
                  Text(_isRouting ? 'Recalculando' : 'Desvío', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.amber)),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        // Action Controls Row 1: Primary Voice & AI Assistant
        Row(
          children: [
            Expanded(
              child: LiquidButton(
                label: 'Audioguía',
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
            const SizedBox(width: 8),
            _buildMicButton(context),
          ],
        ),
        const SizedBox(height: 8),
        // Action Controls Row 2: Settings & Tools
        Row(
          children: [
            Expanded(
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    setState(() {
                      _autoPlayProximityEnabled = !_autoPlayProximityEnabled;
                    });
                    ScaffoldMessenger.of(context).hideCurrentSnackBar();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          _autoPlayProximityEnabled
                              ? 'Audioguía automática por proximidad activada'
                              : 'Audioguía automática por proximidad desactivada',
                        ),
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: _autoPlayProximityEnabled
                          ? Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.85)
                          : Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _autoPlayProximityEnabled ? Icons.sensors_rounded : Icons.sensors_off_rounded,
                          size: 16,
                          color: _autoPlayProximityEnabled
                              ? Theme.of(context).colorScheme.onPrimaryContainer
                              : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _autoPlayProximityEnabled ? 'Auto Voz: ON' : 'Auto Voz: OFF',
                          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                                color: _autoPlayProximityEnabled
                                    ? Theme.of(context).colorScheme.onPrimaryContainer
                                    : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            PopupMenuButton<double>(
              tooltip: 'Velocidad de voz',
              initialValue: _ttsSpeedMultiplier,
              onSelected: (speed) async {
                setState(() {
                  _ttsSpeedMultiplier = speed;
                });
                await ref.read(voiceGuideProvider).setSpeedMultiplier(speed);
              },
              itemBuilder: (context) => const [
                PopupMenuItem(value: 0.75, child: Text('0.75x (Lento)')),
                PopupMenuItem(value: 1.0, child: Text('1.0x (Normal)')),
                PopupMenuItem(value: 1.25, child: Text('1.25x (Rápido)')),
                PopupMenuItem(value: 1.5, child: Text('1.5x (Muy rápido)')),
              ],
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.speed_rounded, size: 16, color: AppTheme.primary),
                    const SizedBox(width: 4),
                    Text(
                      '${_ttsSpeedMultiplier}x',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filledTonal(
              tooltip: l10n.recalculate,
              onPressed: () => _recalculateRoute(tour, force: true),
              icon: const Icon(Icons.sync_rounded, size: 18),
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

                final canRate = tour.canBeRatedBy(currentUser.id);
                
                if (!canRate) {
                  context.pop();
                } else {
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (context) => TourRatingDialog(
                      tour: tour,
                      popScreenOnComplete: true,
                    ),
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
                  _selectedVoicePlace = null; // Clear selected restaurant on stop change
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

class _MapMenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _MapMenuItem({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      width: double.infinity,
      child: Material(
        color: isActive
            ? AppTheme.primary.withValues(alpha: 0.15)
            : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Row(
              children: [
                Icon(
                  icon,
                  size: 18,
                  color: isActive ? AppTheme.primary : Theme.of(context).colorScheme.onSurface,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
                      color: isActive ? AppTheme.primary : Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

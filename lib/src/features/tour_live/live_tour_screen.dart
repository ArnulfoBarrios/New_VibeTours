import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../../core/config/app_config.dart';
import '../../core/design/app_theme.dart';
import '../../core/design/live_navigation_map.dart';
import '../../core/design/premium_components.dart';
import '../../core/services/road_route_service.dart';
import '../../core/tour/tour_builder.dart';
import '../../core/tour/tour_controller.dart';
import '../../core/tour/tour_phase.dart';
import '../../data/discovery_repository.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';
import '../../state/live_tour_state.dart';
import 'tour_rating_dialog.dart';
import 'package:tutorial_coach_mark/tutorial_coach_mark.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Data model for a voice assistant response from the backend
// ─────────────────────────────────────────────────────────────────────────────
class _RouteAssistantResponse {
  const _RouteAssistantResponse({
    required this.isRelatedToTravel,
    required this.responseText,
    this.actionType,
    this.nearbyPlaces = const [],
    this.targetDestination,
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
    _NearbyFoodPlace? dest;
    if (json['targetDestination'] is Map<String, dynamic>) {
      dest = _NearbyFoodPlace.fromJson(json['targetDestination'] as Map<String, dynamic>);
    }
    return _RouteAssistantResponse(
      isRelatedToTravel: json['isRelatedToTravel'] == true,
      responseText: (json['responseText'] as String?) ?? '',
      actionType: json['actionType'] as String?,
      nearbyPlaces: places,
      targetDestination: dest,
    );
  }

  final bool isRelatedToTravel;
  final String responseText;
  final String? actionType;
  final List<_NearbyFoodPlace> nearbyPlaces;
  final _NearbyFoodPlace? targetDestination;
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
  // Live navigation opens in close vehicle tracking mode (zoom 16.5-17.0) by default for immediate navigation.
  bool _isTrackingMode = true;
  GeoPoint? _initialOverviewPoint;
  bool _hasUserManuallyToggledTracking = false;
  bool _hasInitialAccurateRoute = false;
  bool _navigatingToHotel = false;
  bool _isAtStopMode = false;
  int _selectedDay = 1;
  _NearbyFoodPlace? _userLodgingPlace;
  bool _progressLoaded = false;
  double? _currentHeading;
  bool _stopsEnriched = false;
  double _ttsSpeedMultiplier = 1.0;
  bool _autoPlayProximityEnabled = true;
  final Set<String> _autoTriggeredStopIds = {};
  final _menuFabKey = GlobalKey();
  final _audioGuideKey = GlobalKey();
  final _aiAssistantKey = GlobalKey();
  final _nextStopKey = GlobalKey();
  bool _tourChecked = false;

  int _calculateMaxDays(Tour tour) {
    if (tour.stops.isEmpty) return 1;
    int maxDay = 1;
    for (final s in tour.stops) {
      if (s.day > maxDay) maxDay = s.day;
    }
    return maxDay;
  }

  bool _isDayCompleted(Tour tour, int day) {
    final dayStops = tour.stops.where((s) => s.day == day).toList();
    if (dayStops.isEmpty) return false;
    final lastStopOfDay = dayStops.last;
    final lastIndex = tour.stops.indexOf(lastStopOfDay);
    return _activeStop > lastIndex;
  }

  void _onSelectDay(Tour tour, int day) {
    final targetIndex = tour.stops.indexWhere((s) => s.day == day);
    if (targetIndex != -1) {
      setState(() {
        _selectedDay = day;
        _activeStop = targetIndex;
        _isAtStopMode = false;
        _liveRoute = null;
        _liveRouteStopIndex = null;
        _isOffRoute = false;
        _selectedVoicePlace = null;
      });
      _saveProgress(targetIndex);
      _recalculateRoute(tour, force: true);
    }
  }

  double _getStopProximityRadius(TourStop stop) {
    final nameLower = stop.name.toLowerCase();
    final descLower = stop.description.toLowerCase();
    final text = '$nameLower $descLower';

    // 1. Large venues / Complexes (140m): Stadiums, boardwalks, beaches, large parks, airports
    if (text.contains('estadio') ||
        text.contains('malecón') ||
        text.contains('malecon') ||
        text.contains('playa') ||
        text.contains('parque metropolitano') ||
        text.contains('complejo') ||
        text.contains('puerto') ||
        text.contains('aeropuerto') ||
        text.contains('zoologico') ||
        text.contains('zoológico')) {
      return 140.0;
    }

    // 2. Medium open venues (75m): Plazas, squares, parks, cathedrals, campuses, boulevards
    if (text.contains('plaza') ||
        text.contains('parque') ||
        text.contains('plazoleta') ||
        text.contains('catedral') ||
        text.contains('boulevard') ||
        text.contains('paseo') ||
        text.contains('mirador') ||
        text.contains('castillo')) {
      return 75.0;
    }

    // 3. Standard POIs (40m): Restaurants, shops, boutique museums, normal urban spots
    return 40.0;
  }

  void _enterAtStopMode(TourStop currentStop) {
    final tour = _navigationTour;
    if (tour == null) return;
    setState(() {
      _isAtStopMode = true;
    });
    if (_autoPlayProximityEnabled) {
      unawaited(
        ref.read(voiceGuideProvider).narrateStop(
          currentStop,
          stopIndex: _activeStop,
          totalStops: tour.stops.length,
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

  void _triggerTourIfNeeded() {
    if (_tourChecked) return;
    _tourChecked = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final l10n = AppLocalizations.of(context);
      final steps = [
        TourStepItem(
          key: _menuFabKey,
          title: l10n.tourLiveRecenterTitle,
          description: l10n.tourLiveRecenterDesc,
          icon: Icons.explore_rounded,
          shape: ShapeLightFocus.Circle,
          radius: 26,
          align: ContentAlign.bottom,
        ),
        TourStepItem(
          key: _audioGuideKey,
          title: l10n.tourLiveAudioTitle,
          description: l10n.tourLiveAudioDesc,
          icon: Icons.record_voice_over_rounded,
          shape: ShapeLightFocus.RRect,
          radius: 20,
          align: ContentAlign.top,
        ),
        TourStepItem(
          key: _aiAssistantKey,
          title: l10n.tourLiveAiAssistantTitle,
          description: l10n.tourLiveAiAssistantDesc,
          icon: Icons.mic_rounded,
          shape: ShapeLightFocus.Circle,
          radius: 26,
          align: ContentAlign.top,
        ),
        TourStepItem(
          key: _nextStopKey,
          title: l10n.stops,
          description: l10n.tourLiveSosDesc,
          icon: Icons.navigation_rounded,
          shape: ShapeLightFocus.RRect,
          radius: 20,
          align: ContentAlign.top,
        ),
      ];

      ref.read(tourControllerProvider.notifier).showTourIfPending(
            context: context,
            phase: TourPhase.liveTour,
            steps: steps,
            delay: const Duration(milliseconds: 750),
          );
    });
  }

  // GPS stream is maintained fixed and uninterrupted throughout the active tour


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

  Future<void> _saveUserLodging(String city, _NearbyFoodPlace place) async {
    final prefs = await SharedPreferences.getInstance();
    final key = 'user_lodging_${city.trim().toLowerCase()}';
    await prefs.setString(
      key,
      jsonEncode({
        'name': place.name,
        'latitude': place.latitude,
        'longitude': place.longitude,
        'type': place.type,
      }),
    );
  }

  Future<void> _saveProgress(int stopIndex) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('tour_progress_${widget.tourId}', stopIndex);
  }

  Future<void> _loadSavedProgressAndLodging(Tour tour) async {
    final prefs = await SharedPreferences.getInstance();
    
    // 1. Progress
    final savedIndex = prefs.getInt('tour_progress_${widget.tourId}');
    if (savedIndex != null && savedIndex > 0 && savedIndex < tour.stops.length) {
      if (mounted) {
        setState(() {
          _activeStop = savedIndex;
          _selectedDay = tour.stops[savedIndex].day;
        });
      }
    }

    // 2. User Lodging for this city
    final cityKey = 'user_lodging_${tour.city.trim().toLowerCase()}';
    final rawLodging = prefs.getString(cityKey);
    if (rawLodging != null) {
      try {
        final decoded = jsonDecode(rawLodging) as Map<String, dynamic>;
        if (mounted) {
          setState(() {
            _userLodgingPlace = _NearbyFoodPlace.fromJson(decoded);
          });
        }
      } catch (_) {}
    }
  }

  TourStop? _findHotelStop(Tour tour) {
    if (_userLodgingPlace != null) {
      return TourStop(
        id: 'user_hotel',
        name: _userLodgingPlace!.name,
        location: _userLodgingPlace!.toGeoPoint(),
        imageUrl: '',
        description: 'Tu lugar de alojamiento registrado',
        activities: const ['Descanso', 'Alojamiento'],
        tips: const ['Lugar de hospedaje'],
        suggestedMinutes: 30,
      );
    }
    return null;
  }

  void _startHotelNavigation() {
    final tour = _navigationTour;
    if (tour == null) return;
    if (_userLodgingPlace == null) {
      _promptForAccommodation(tour);
      return;
    }
    setState(() {
      _navigatingToHotel = true;
      _selectedVoicePlace = null;
      _isAtStopMode = false;
      _liveRoute = null;
      _liveRouteStopIndex = null;
    });
    _recalculateRoute(tour, force: true);
  }

  Future<void> _promptForAccommodation(Tour tour) async {
    final textController = TextEditingController();
    bool isSearching = false;
    String? searchError;

    await showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Row(
                children: [
                  Icon(Icons.hotel_rounded, color: AppTheme.primary),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Tu Alojamiento',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Ingresa el nombre o dirección de tu hotel o alojamiento en ${tour.city}:',
                    style: const TextStyle(fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: textController,
                    autofocus: true,
                    decoration: InputDecoration(
                      hintText: 'Ej: Hotel El Prado, Cra 54 #70',
                      prefixIcon: const Icon(Icons.search_rounded),
                      filled: true,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                  if (searchError != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      searchError!,
                      style: const TextStyle(color: Colors.red, fontSize: 12),
                    ),
                  ],
                  if (isSearching) ...[
                    const SizedBox(height: 12),
                    const Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                          SizedBox(width: 8),
                          Text('Buscando ubicación...', style: TextStyle(fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
              actions: [
                TextButton(
                  onPressed: isSearching ? null : () => Navigator.of(dialogContext).pop(),
                  child: const Text('Cancelar'),
                ),
                FilledButton.icon(
                  icon: const Icon(Icons.navigation_rounded, size: 16),
                  label: const Text('Ir al hotel'),
                  onPressed: isSearching
                      ? null
                      : () async {
                          final query = textController.text.trim();
                          if (query.isEmpty) return;
                          setDialogState(() {
                            isSearching = true;
                            searchError = null;
                          });
                          try {
                            final refLoc = _currentPoint ?? (tour.stops.isNotEmpty ? tour.stops.first.location : null);
                            final results = await DiscoveryRepository().searchPlaces(
                              '$query, ${tour.city}',
                              userLat: refLoc?.latitude,
                              userLon: refLoc?.longitude,
                            );
                            if (results.isEmpty) {
                              setDialogState(() {
                                isSearching = false;
                                searchError = 'No se encontró el lugar. Intenta con otra dirección.';
                              });
                              return;
                            }
                            final place = results.first;
                            final hotelPlace = _NearbyFoodPlace(
                              name: place.name,
                              latitude: place.location.latitude,
                              longitude: place.location.longitude,
                              type: place.category,
                            );
                            await _saveUserLodging(tour.city, hotelPlace);
                            if (dialogContext.mounted) {
                              Navigator.of(dialogContext).pop();
                            }
                            if (mounted) {
                              setState(() {
                                _userLodgingPlace = hotelPlace;
                              });
                              _startHotelNavigation();
                              final voiceGuide = ref.read(voiceGuideProvider);
                              unawaited(voiceGuide.speak('Alojamiento guardado. Trazando ruta a ${hotelPlace.name}.'));
                            }
                          } catch (e) {
                            setDialogState(() {
                              isSearching = false;
                              searchError = 'Error al buscar la ubicación.';
                            });
                          }
                        },
                ),
              ],
            );
          },
        );
      },
    );
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

    final savedLodging = _userLodgingPlace;
    final hotelName = savedLodging?.name ?? '';
    final hotelAddress = savedLodging?.type ?? '';
    final hotelLat = savedLodging?.latitude;
    final hotelLon = savedLodging?.longitude;

    final body = <String, dynamic>{
      'userQuery': userQuery,
      if (_currentPoint != null) 'latitude': _currentPoint!.latitude,
      if (_currentPoint != null) 'longitude': _currentPoint!.longitude,
      'tourContext': {
        'currentStopName': stop?.name ?? '',
        'city': tour?.city ?? '',
        'country': tour?.country ?? '',
        if (hotelName.isNotEmpty) 'hotelName': hotelName,
        if (hotelAddress.isNotEmpty) 'hotelAddress': hotelAddress,
        if (hotelLat != null && hotelLat != 0.0) 'hotelLat': hotelLat,
        if (hotelLon != null && hotelLon != 0.0) 'hotelLon': hotelLon,
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
      case 'SEARCH_PLACES':
        if (response.nearbyPlaces.isNotEmpty) {
          setState(() {
            _voiceFoodPlaces = response.nearbyPlaces;
            _selectedVoicePlace = null;
            _navigatingToHotel = false;
          });
          // Narrate the found options
          final names = response.nearbyPlaces
              .take(3)
              .map((p) => p.name)
              .join(', ');
          final voiceGuide = ref.read(voiceGuideProvider);
          await voiceGuide.speak(
            'Encontré estas opciones en la zona: $names. Las marqué en el mapa para ti.',
          );
        }

      case 'RETURN_TO_ACCOMMODATION':
        if (response.targetDestination != null) {
          setState(() {
            _selectedVoicePlace = response.targetDestination;
            _navigatingToHotel = true;
            _isAtStopMode = false;
            _liveRoute = null;
            _liveRouteStopIndex = null;
          });
          if (tour != null) {
            _recalculateRoute(tour, force: true);
          }
        } else if (_userLodgingPlace != null) {
          _startHotelNavigation();
        } else if (tour != null) {
          _promptForAccommodation(tour);
        }

      case 'REQUEST_ACCOMMODATION_LOCATION':
        if (tour != null) {
          _promptForAccommodation(tour);
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
          _triggerTourIfNeeded();
          final int maxDays = _calculateMaxDays(tour);
          final stop = tour.stops[_activeStop];
          if (stop.day != _selectedDay && _activeStop < tour.stops.length) {
            _selectedDay = stop.day;
          }
          final progress = (_activeStop + 1) / tour.stops.length;
          _navigationTour = tour;
          _scheduleLiveNavigation(tour);
          
          final liveRoute = _liveRoute;

          final destinationPoint = _selectedVoicePlace != null
              ? _selectedVoicePlace!.toGeoPoint()
              : _navigatingToHotel
                  ? ((_findHotelStop(tour) != null && _findHotelStop(tour)!.location.latitude != 0.0)
                      ? _findHotelStop(tour)!.location
                      : stop.location)
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
                  key: ValueKey('${tour.id}-$mapStyle-${_selectedVoicePlace != null ? "voice" : _navigatingToHotel ? "hotel" : "stop"}-$_selectedDay'),
                  destination: destinationPoint,
                  destinationName: destinationName,
                  styleUrl: mapStyle,
                  fitPadding: const EdgeInsets.fromLTRB(28, 100, 28, 200),
                  route: liveRoute,
                  currentLocation: _currentPoint,
                  additionalWaypoints: _voiceFoodPlaces.isNotEmpty
                      ? _voiceFoodPlaces.map((p) => p.toGeoPoint()).toList()
                      : (_selectedVoicePlace != null
                          ? null
                          : tour.stops.where((s) => s.day == _selectedDay).map((s) => s.location).toList()),
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

              if (liveRoute?.transitAdviceMessage != null)
                Positioned(
                  left: 16,
                  right: 16,
                  top: MediaQuery.of(context).padding.top + 70,
                  child: InkWell(
                    onTap: () async {
                      await _handleTransitBannerTap(liveRoute);
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.95),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: AppTheme.primary.withValues(alpha: 0.4),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.12),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(7),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primaryContainer,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              liveRoute?.usesFlightTransfer == true
                                  ? Icons.flight_takeoff_rounded
                                  : liveRoute?.usesMaritimeTransfer == true
                                      ? Icons.directions_boat_rounded
                                      : Icons.navigation_rounded,
                              size: 18,
                              color: Theme.of(context).colorScheme.onPrimaryContainer,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  liveRoute!.transitAdviceMessage!,
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                        fontWeight: FontWeight.w600,
                                        color: Theme.of(context).colorScheme.onSurface,
                                      ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Text(
                                      'Toca aquí para trazar ruta al terminal',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Icon(Icons.arrow_forward_rounded, size: 12, color: AppTheme.primary),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

              // ── Close Button (Top Left) ───────────────────────────────────────────
              Positioned(
                left: 16,
                top: MediaQuery.of(context).padding.top + 12,
                child: IconButton.filledTonal(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.close_rounded),
                ),
              ),

              // ── Single Hamburger Menu FAB (Top Right) ───────────────────────────
              Positioned(
                right: 16,
                top: MediaQuery.of(context).padding.top + 12,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    KeyedSubtree(
                      key: _menuFabKey,
                      child: FloatingActionButton.small(
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
                    ),
                    if (_isMapMenuExpanded) ...[
                      const SizedBox(height: 8),
                      Container(
                        width: 180,
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
                              icon: _isTrackingMode ? Icons.explore_rounded : Icons.my_location_rounded,
                              label: _isTrackingMode ? 'Vista general' : 'Seguimiento',
                              isActive: _isTrackingMode,
                              onTap: () {
                                setState(() {
                                  _isTrackingMode = !_isTrackingMode;
                                  _hasUserManuallyToggledTracking = true;
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
                            if (!_navigatingToHotel) ...[
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
                            const SizedBox(height: 4),
                            _MapMenuItem(
                              icon: _autoPlayProximityEnabled ? Icons.sensors_rounded : Icons.sensors_off_rounded,
                              label: _autoPlayProximityEnabled ? 'Auto-Voz: ON' : 'Auto-Voz: OFF',
                              isActive: _autoPlayProximityEnabled,
                              onTap: () {
                                setState(() {
                                  _autoPlayProximityEnabled = !_autoPlayProximityEnabled;
                                  _isMapMenuExpanded = false;
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
                            ),
                            const SizedBox(height: 4),
                            _MapMenuItem(
                              icon: Icons.speed_rounded,
                              label: 'Voz: ${_ttsSpeedMultiplier}x',
                              isActive: false,
                              onTap: () async {
                                const speeds = [0.75, 1.0, 1.25, 1.5];
                                final currentIdx = speeds.indexOf(_ttsSpeedMultiplier);
                                final nextSpeed = speeds[(currentIdx + 1) % speeds.length];
                                setState(() {
                                  _ttsSpeedMultiplier = nextSpeed;
                                });
                                final messenger = ScaffoldMessenger.of(context);
                                await ref.read(voiceGuideProvider).setSpeedMultiplier(nextSpeed);
                                if (!mounted) return;
                                messenger.hideCurrentSnackBar();
                                messenger.showSnackBar(
                                  SnackBar(
                                    content: Text('Velocidad de voz: ${nextSpeed}x'),
                                    duration: const Duration(seconds: 1),
                                  ),
                                );
                              },
                            ),
                            const SizedBox(height: 4),
                            _MapMenuItem(
                              icon: Icons.sync_rounded,
                              label: 'Recalcular ruta',
                              isActive: false,
                              onTap: () {
                                setState(() => _isMapMenuExpanded = false);
                                _recalculateRoute(tour, force: true);
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // ── Day Selector Chips (Top Center - for multi-day tours) ──────────────
              if (maxDays > 1)
                Positioned(
                  left: 68,
                  right: 68,
                  top: MediaQuery.of(context).padding.top + 12,
                  child: Center(
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: List.generate(maxDays, (idx) {
                          final dayNum = idx + 1;
                          final isSelected = _selectedDay == dayNum;
                          final isCompleted = _isDayCompleted(tour, dayNum);
                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 3),
                            child: FilterChip(
                              avatar: isCompleted
                                  ? const Icon(Icons.check_circle_rounded, size: 14, color: Colors.green)
                                  : null,
                              label: Text(
                                'Día $dayNum',
                                style: TextStyle(
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  fontSize: 12,
                                ),
                              ),
                              selected: isSelected,
                              onSelected: (_) => _onSelectDay(tour, dayNum),
                              backgroundColor: Theme.of(context).colorScheme.surface.withValues(alpha: 0.9),
                              selectedColor: Theme.of(context).colorScheme.primaryContainer,
                              checkmarkColor: Theme.of(context).colorScheme.onPrimaryContainer,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
                              visualDensity: VisualDensity.compact,
                            ),
                          );
                        }),
                      ),
                    ),
                  ),
                ),

              if (!_isTrackingMode)
                Positioned(
                  right: 16,
                  bottom: 140 + MediaQuery.of(context).padding.bottom,
                  child: FloatingActionButton.extended(
                    heroTag: 'live_tour_follow_fab',
                    backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                    onPressed: () {
                      setState(() {
                        _isTrackingMode = true;
                        _hasUserManuallyToggledTracking = true;
                      });
                    },
                    icon: const Icon(Icons.my_location_rounded, color: AppTheme.primary),
                    label: const Text(
                      'Seguir ubicación',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primary,
                      ),
                    ),
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
                          : _isAtStopMode
                              ? _buildAtStopModePanel(context, tour, stop, l10n)
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
    if (!_progressLoaded) {
      _progressLoaded = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _loadSavedProgressAndLodging(tour);
      });
    }
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

    // Start live high-accuracy satellite stream immediately
    final stream = await service.positionStream(distanceFilterMeters: 0);
    if (mounted && stream != null) {
      await _positionSubscription?.cancel();
      _positionSubscription = stream.listen(_handlePositionUpdate);
    }

    final initialPosition = await service.currentPosition();
    if (!mounted) return;
    if (initialPosition != null) {
      setState(() {
        _currentPoint = _pointFromPosition(initialPosition);
        if (initialPosition.heading >= 0) {
          _currentHeading = initialPosition.heading;
        }
      });
      final tour = _navigationTour;
      if (tour != null) {
        // Pre-cache upcoming stops in the background for 0 ms playback
        ref.read(voiceGuideProvider).precacheTourStops(
          tour.stops,
          startIndex: _activeStop,
          maxCount: 3,
          lang: tour.language,
        );
        await _recalculateRoute(tour, force: true);
      }
    }
  }

  void _handlePositionUpdate(Position position) {
    final point = _pointFromPosition(position);
    if (!mounted) return;

    _currentPoint = point;
    if (position.heading >= 0) {
      _currentHeading = position.heading;
    }

    // Auto-transition from overview to tracking mode when user starts moving
    if (!_isTrackingMode && !_hasUserManuallyToggledTracking) {
      _initialOverviewPoint ??= point;
      final movedDist = Geolocator.distanceBetween(
        _initialOverviewPoint!.latitude,
        _initialOverviewPoint!.longitude,
        point.latitude,
        point.longitude,
      );
      if (position.speed > 0.8 || movedDist > 12.0) {
        _isTrackingMode = true;
      }
    }

    setState(() {});
    final tour = _navigationTour;
    if (tour == null || tour.stops.isEmpty) return;

    final route = _liveRoute;
    // Auto-refine to optimal live route as soon as verified satellite fix arrives
    if (route == null || (!_hasInitialAccurateRoute && position.accuracy <= 25.0)) {
      _hasInitialAccurateRoute = true;
      unawaited(_recalculateRoute(tour, force: true));
      return;
    }

    final activeStopPoint = _activeStop < tour.stops.length ? tour.stops[_activeStop].location : null;
    final distanceToActiveStop = activeStopPoint != null
        ? Geolocator.distanceBetween(point.latitude, point.longitude, activeStopPoint.latitude, activeStopPoint.longitude)
        : double.infinity;

    // Audioguía automática y activación de Modo En Parada por proximidad adaptable
    if (_activeStop < tour.stops.length) {
      final currentStop = tour.stops[_activeStop];
      final proximityRadius = _getStopProximityRadius(currentStop);
      if (distanceToActiveStop <= proximityRadius && !_autoTriggeredStopIds.contains(currentStop.id)) {
        _autoTriggeredStopIds.add(currentStop.id);
        debugPrint('[ProximityTTS] Disparando llegada a parada ${currentStop.name} (distancia: ${distanceToActiveStop.toStringAsFixed(1)}m <= ${proximityRadius.toStringAsFixed(0)}m)');
        _enterAtStopMode(currentStop);
      }
    }
    final distanceToRoute = _distanceToRouteMeters(point, route.geometry);
    final now = DateTime.now();
    final refreshTraffic =
        _routeService.hasLiveTrafficProvider &&
        now.difference(
              _lastTrafficRefreshAt ?? DateTime.fromMillisecondsSinceEpoch(0),
            ) >
            const Duration(minutes: 2);
    // Real deviation threshold: 65m to accommodate wide multi-lane boulevards and service roads
    final deviated = distanceToRoute > 65;
    if (deviated || refreshTraffic) {
      if (_canReroute(now, isOffRoute: deviated)) {
        if (deviated) {
          setState(() {
            _isOffRoute = true;
          });
        }
        unawaited(
          _recalculateRoute(
            tour,
            force: refreshTraffic || deviated,
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
    if (_navigatingToHotel && hotelStop == null && _selectedVoicePlace == null) return;
    
    final GeoPoint destination;
    if (_selectedVoicePlace != null) {
      destination = _selectedVoicePlace!.toGeoPoint();
    } else if (_navigatingToHotel && hotelStop != null && hotelStop.location.latitude != 0.0) {
      destination = hotelStop.location;
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
      originHeading: _currentHeading,
    );
    if (!mounted) return;
    
    // Validate non-zero coordinates and distance bounds before navigation
    final isZeroOrigin = origin.latitude == 0 && origin.longitude == 0;
    final isZeroDest = destination.latitude == 0 && destination.longitude == 0;

    if (isZeroOrigin || isZeroDest) {
      if (!mounted) return;
      setState(() {
        _isRouting = false;
        _noLandRouteAvailable = true;
      });
      return;
    }

    final directDist = Geolocator.distanceBetween(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude,
    );

    // Intra-city anomaly check: block jumps over 100km unless explicitly multimodal / flight transfer
    final isFlightOrMaritime = route.usesFlightTransfer || route.usesMaritimeTransfer;
    bool isUnreachable = !isFlightOrMaritime && ((route.usedFallback && directDist > 20000) || (directDist > 100000));
    
    if (route.geometry.isNotEmpty && !isFlightOrMaritime) {
      final snapStart = Geolocator.distanceBetween(
        origin.latitude, origin.longitude,
        route.geometry.first.latitude, route.geometry.first.longitude,
      );
      if (snapStart > 50000) {
        isUnreachable = true;
      }
    }
    
    if (route.usesMaritimeTransfer && directDist > 300000) {
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

  Future<void> _handleTransitBannerTap(RoadRouteResult liveRoute) async {
    RoutePortWaypoint? hub = liveRoute.airports.isNotEmpty
        ? liveRoute.airports.first
        : liveRoute.ports.isNotEmpty
            ? liveRoute.ports.first
            : null;

    if (hub == null && _currentPoint != null) {
      final nearby = await _routeService.findAirportsNear(_currentPoint!, role: 'Aeropuerto salida');
      if (nearby.isNotEmpty) {
        hub = nearby.first;
      }
    }

    if (hub != null) {
      _navigateToTransferHub(hub);
    }
  }

  void _navigateToTransferHub(RoutePortWaypoint hub) {
    final place = _NearbyFoodPlace(
      name: hub.name,
      type: hub.role,
      latitude: hub.location.latitude,
      longitude: hub.location.longitude,
    );
    setState(() {
      _selectedVoicePlace = place;
      _isTrackingMode = false;
    });
    final tour = _navigationTour;
    if (tour != null) {
      unawaited(_recalculateRoute(tour, force: true));
    }
  }

  Widget _buildRestaurantNavigationPanel(BuildContext context, Tour tour) {
    final isAirport = _selectedVoicePlace?.type == 'aeropuerto' ||
        (_selectedVoicePlace?.type?.contains('Aeropuerto') ?? false) ||
        (_selectedVoicePlace?.name.contains('Aeropuerto') ?? false);
    final isPort = _selectedVoicePlace?.type == 'puerto' ||
        _selectedVoicePlace?.type?.contains('Embarque') == true ||
        (_selectedVoicePlace?.type?.contains('Puerto') ?? false) ||
        (_selectedVoicePlace?.name.contains('Muelle') ?? false) ||
        (_selectedVoicePlace?.name.contains('Puerto') ?? false);
    final nameLower = (_selectedVoicePlace?.name ?? '').toLowerCase();
    final typeLower = (_selectedVoicePlace?.type ?? '').toLowerCase();
    final isHotel = typeLower == 'hotel' ||
        nameLower.contains('hotel') ||
        nameLower.contains('hostal') ||
        nameLower.contains('resort') ||
        nameLower.contains('alojamiento') ||
        nameLower.contains('hospedaje') ||
        nameLower.contains('estelar') ||
        nameLower.contains('boutique') ||
        nameLower.contains('posada');
    final isAttraction = typeLower == 'attraction' ||
        typeLower == 'tourism' ||
        typeLower == 'monument' ||
        typeLower == 'viewpoint' ||
        typeLower == 'park' ||
        typeLower == 'museo' ||
        nameLower.contains('parque') ||
        nameLower.contains('museo') ||
        nameLower.contains('mirador') ||
        nameLower.contains('castillo') ||
        nameLower.contains('plaza');

    final destinationTitle = isAirport
        ? 'Ruta al Aeropuerto'
        : isPort
            ? 'Ruta al Muelle'
            : isHotel
                ? 'Ruta a tu Alojamiento'
                : isAttraction
                    ? 'Ruta al Punto de Interés'
                    : 'Ruta al Restaurante';

    final destinationIcon = isAirport
        ? Icons.flight_takeoff_rounded
        : isPort
            ? Icons.directions_boat_rounded
            : isHotel
                ? Icons.hotel_rounded
                : isAttraction
                    ? Icons.place_rounded
                    : Icons.restaurant_rounded;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                destinationTitle,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
            Icon(
              destinationIcon,
              color: Theme.of(context).colorScheme.primary,
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          _selectedVoicePlace?.name ?? 'Destino',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
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
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  setState(() {
                    _selectedVoicePlace = null;
                  });
                  final navTour = _navigationTour;
                  if (navTour != null) {
                    unawaited(_recalculateRoute(navTour, force: true));
                  }
                },
                icon: const Icon(Icons.arrow_back_rounded),
                label: const Text('Volver al Tour'),
              ),
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
    final int maxDays = _calculateMaxDays(tour);
    final dayStops = tour.stops.where((s) => s.day == _selectedDay).toList();
    final stopIdxInDay = dayStops.indexWhere((s) => s.id == stop.id);
    final stopCounterText = maxDays > 1 && stopIdxInDay != -1
        ? 'Día $_selectedDay • Parada ${stopIdxInDay + 1}/${dayStops.length}'
        : '${_activeStop + 1}/${tour.stops.length}';
    final isVoicePlaying = ref.watch(liveTourPlaybackProvider).isPlaying;
    final isLastStop = _activeStop == tour.stops.length - 1;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Row 1: Header (Stop Name & Badge)
        Row(
          children: [
            Expanded(
              child: Text(
                stop.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.8),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                stopCounterText,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        // Row 1 Subtitle: Integrated Telemetry Strip
        Row(
          children: [
            Icon(Icons.directions_walk_rounded, size: 14, color: AppTheme.primary),
            const SizedBox(width: 3),
            Text(
              _distanceLabel(tour, progress, liveRoute),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
            const SizedBox(width: 6),
            Text('•', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3))),
            const SizedBox(width: 6),
            Icon(Icons.schedule_rounded, size: 14, color: AppTheme.primary),
            const SizedBox(width: 3),
            Text(
              _timeLabel(tour, progress, liveRoute),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
            if (_trafficLabel(liveRoute).isNotEmpty) ...[
              const SizedBox(width: 6),
              Text('•', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3))),
              const SizedBox(width: 6),
              Icon(Icons.traffic_rounded, size: 14, color: Colors.orange.shade700),
              const SizedBox(width: 3),
              Flexible(
                child: Text(
                  _trafficLabel(liveRoute),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.orange.shade700,
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 6),
        LinearProgressIndicator(
          value: progress,
          minHeight: 3,
          borderRadius: BorderRadius.circular(999),
        ),
        const SizedBox(height: 10),
        // Row 2: Action Controls (Ya llegué + Audioguía + Asistente IA + Siguiente/Finalizar)
        Row(
          children: [
            Expanded(
              child: LiquidButton(
                label: 'Ya llegué',
                icon: Icons.pin_drop_rounded,
                isPrimary: true,
                onPressed: () => _enterAtStopMode(stop),
              ),
            ),
            const SizedBox(width: 8),
            KeyedSubtree(
              key: _audioGuideKey,
              child: IconButton.filledTonal(
                tooltip: isVoicePlaying ? 'Pausar audioguía' : 'Escuchar audioguía',
                style: IconButton.styleFrom(
                  minimumSize: const Size(48, 48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  backgroundColor: isVoicePlaying ? AppTheme.primary : null,
                  foregroundColor: isVoicePlaying ? Colors.white : null,
                ),
                onPressed: () async {
                  final voiceGuide = ref.read(voiceGuideProvider);
                  if (isVoicePlaying) {
                    await voiceGuide.stop();
                    ref.read(liveTourPlaybackProvider.notifier).setPlaying(false);
                  } else {
                    ref.read(liveTourPlaybackProvider.notifier).setPlaying(true);
                    await voiceGuide.narrateStop(
                      stop,
                      stopIndex: _activeStop,
                      totalStops: tour.stops.length,
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
                  }
                },
                icon: Icon(
                  isVoicePlaying ? Icons.pause_rounded : Icons.record_voice_over_rounded,
                  size: 20,
                ),
              ),
            ),
            const SizedBox(width: 8),
            KeyedSubtree(
              key: _aiAssistantKey,
              child: _buildMicButton(context),
            ),
            const SizedBox(width: 8),
            KeyedSubtree(
              key: _nextStopKey,
              child: IconButton.filledTonal(
                tooltip: isLastStop ? 'Terminar tour' : l10n.nextStop,
                style: IconButton.styleFrom(
                  minimumSize: const Size(48, 48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () => _advanceToNextStop(tour),
                icon: Icon(
                  isLastStop ? Icons.flag_rounded : Icons.skip_next_rounded,
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAtStopModePanel(
    BuildContext context,
    Tour tour,
    TourStop stop,
    AppLocalizations l10n,
  ) {
    final int maxDays = _calculateMaxDays(tour);
    final dayStops = tour.stops.where((s) => s.day == _selectedDay).toList();
    final stopIdxInDay = dayStops.indexWhere((s) => s.id == stop.id);
    final stopCounterText = maxDays > 1 && stopIdxInDay != -1
        ? 'Día $_selectedDay • Parada ${stopIdxInDay + 1}/${dayStops.length}'
        : '${_activeStop + 1}/${tour.stops.length}';

    final isLastStop = _activeStop == tour.stops.length - 1;
    final isVoicePlaying = ref.watch(liveTourPlaybackProvider).isPlaying;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: Colors.green.withValues(alpha: 0.4)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle_rounded, size: 14, color: Colors.green),
                  SizedBox(width: 4),
                  Text(
                    'En la parada',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.8),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                stopCounterText,
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
        Text(
          stop.name,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        if (stop.activities.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            'Actividades recomendadas aquí:',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          const SizedBox(height: 4),
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: stop.activities.take(3).map((act) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  act,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
                ),
              );
            }).toList(),
          ),
        ],
        if (stop.tips.isNotEmpty || stop.curiousFacts.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  stop.tips.isNotEmpty ? Icons.lightbulb_outline_rounded : Icons.auto_awesome_rounded,
                  size: 16,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    stop.tips.isNotEmpty ? stop.tips.first : stop.curiousFacts.first,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.85),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: LiquidButton(
                label: isVoicePlaying ? 'Pausar audio' : 'Repetir audioguía',
                icon: isVoicePlaying ? Icons.pause_rounded : Icons.record_voice_over_rounded,
                onPressed: () async {
                  final voiceGuide = ref.read(voiceGuideProvider);
                  if (isVoicePlaying) {
                    await voiceGuide.stop();
                    ref.read(liveTourPlaybackProvider.notifier).setPlaying(false);
                  } else {
                    ref.read(liveTourPlaybackProvider.notifier).setPlaying(true);
                    await voiceGuide.narrateStop(
                      stop,
                      stopIndex: _activeStop,
                      totalStops: tour.stops.length,
                      lang: tour.language,
                    );
                  }
                },
              ),
            ),
            const SizedBox(width: 8),
            _buildMicButton(context),
            const SizedBox(width: 8),
            IconButton.filledTonal(
              tooltip: 'Ver ruta en mapa',
              onPressed: () {
                setState(() {
                  _isAtStopMode = false;
                });
              },
              icon: const Icon(Icons.map_rounded, size: 18),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: LiquidButton(
            label: isLastStop ? 'Terminar tour' : l10n.nextStop,
            icon: isLastStop ? Icons.flag_rounded : Icons.arrow_forward_rounded,
            isPrimary: true,
            onPressed: () => _advanceToNextStop(tour),
          ),
        ),
      ],
    );
  }

  void _advanceToNextStop(Tour tour) {
    if (_activeStop == tour.stops.length - 1) {
      _finishTour(tour);
      return;
    }

    final currentStop = tour.stops[_activeStop];
    final nextIndex = _activeStop + 1;
    final nextStop = tour.stops[nextIndex];

    if (nextStop.day > currentStop.day) {
      _showEndOfDayDialog(tour, currentStop.day, nextStop.day, nextIndex);
    } else {
      _onAdvanceToStop(tour, nextIndex, currentStop.day);
    }
  }

  void _onAdvanceToStop(Tour tour, int nextIndex, int day) {
    setState(() {
      _activeStop = nextIndex;
      _selectedDay = day;
      _isAtStopMode = false;
      _liveRoute = null;
      _liveRouteStopIndex = null;
      _isOffRoute = false;
      _noLandRouteAvailable = false;
      _isTrackingMode = false;
      _initialOverviewPoint = null;
      _hasUserManuallyToggledTracking = false;
      _voiceFoodPlaces = [];
      _selectedVoicePlace = null;
    });
    _saveProgress(nextIndex);
    ref.read(voiceGuideProvider).precacheTourStops(
      tour.stops,
      startIndex: _activeStop,
      maxCount: 2,
      lang: tour.language,
    );
    _recalculateRoute(tour, force: true);
  }

  Future<void> _showEndOfDayDialog(
    Tour tour,
    int finishedDay,
    int nextDay,
    int nextStopIndex,
  ) async {
    await showModalBottomSheet<void>(
      context: context,
      isDismissible: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Icon(Icons.wb_sunny_rounded, size: 48, color: Colors.amber),
              const SizedBox(height: 12),
              Text(
                '¡Completaste el Día $finishedDay! 🎉',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Has recorrido todas las paradas programadas para hoy. ¿Qué deseas hacer ahora?',
                style: TextStyle(
                  fontSize: 14,
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.hotel_rounded),
                      label: const Text('Ir a mi hotel'),
                      onPressed: () {
                        Navigator.of(modalContext).pop();
                        setState(() {
                          _activeStop = nextStopIndex;
                          _selectedDay = nextDay;
                          _isAtStopMode = false;
                        });
                        _saveProgress(nextStopIndex);
                        _startHotelNavigation();
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      icon: const Icon(Icons.arrow_forward_rounded),
                      label: Text('Iniciar Día $nextDay'),
                      onPressed: () {
                        Navigator.of(modalContext).pop();
                        _onAdvanceToStop(tour, nextStopIndex, nextDay);
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _finishTour(Tour tour) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('tour_progress_${widget.tourId}');

    final currentUser = ref.read(authServiceProvider).currentUser;
    if (currentUser == null) {
      if (mounted) context.pop();
      return;
    }

    final canRate = tour.canBeRatedBy(currentUser.id);
    if (!canRate) {
      if (mounted) context.pop();
    } else {
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => TourRatingDialog(
            tour: tour,
            popScreenOnComplete: true,
          ),
        );
      }
    }
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
        style: IconButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          backgroundColor: _isProcessingVoice
              ? theme.colorScheme.primary.withValues(alpha: 0.6)
              : null,
        ),
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

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/config/app_config.dart';
import '../../state/app_state.dart';

class AiBuilderState {
  const AiBuilderState({
    this.isLoading = false,
    this.isTyping = false,
    this.error,
    this.request,
    this.recommendations = const [],
    this.removedRecommendations = const [],
    this.plannerContext,
    this.isBuilding = false,
    this.builtTour,
    this.needsDestination = false,
    this.destinationMessage,
    this.destinationSuggestions = const [],
    this.messages = const [],
    this.hotels = const [],
    this.needsBudget = false,
    this.needsDuration = false,
    this.selectedHotel,
    this.preferences = const {},
    this.webSearchDone = false,
  });

  final bool isLoading;
  final bool isTyping;
  final String? error;
  final AiTourRequest? request;
  final List<AiRecommendation> recommendations;
  final List<AiRecommendation> removedRecommendations;
  final Map<String, dynamic>? plannerContext;
  final bool isBuilding;
  final Tour? builtTour;
  final bool needsDestination;
  final String? destinationMessage;
  final List<dynamic> destinationSuggestions;
  final List<ChatMessage> messages;
  final List<dynamic> hotels;
  final bool needsBudget;
  final bool needsDuration;
  final Map<String, dynamic>? selectedHotel;
  final Map<String, dynamic> preferences;
  final bool webSearchDone;

  AiBuilderState copyWith({
    bool? isLoading,
    bool? isTyping,
    String? error,
    AiTourRequest? request,
    List<AiRecommendation>? recommendations,
    List<AiRecommendation>? removedRecommendations,
    Map<String, dynamic>? plannerContext,
    bool? isBuilding,
    Tour? builtTour,
    bool? needsDestination,
    String? destinationMessage,
    List<dynamic>? destinationSuggestions,
    List<ChatMessage>? messages,
    List<dynamic>? hotels,
    bool? needsBudget,
    bool? needsDuration,
    Map<String, dynamic>? selectedHotel,
    Map<String, dynamic>? preferences,
    bool? webSearchDone,
  }) {
    return AiBuilderState(
      isLoading: isLoading ?? this.isLoading,
      isTyping: isTyping ?? this.isTyping,
      error: error,
      request: request ?? this.request,
      recommendations: recommendations ?? this.recommendations,
      removedRecommendations: removedRecommendations ?? this.removedRecommendations,
      plannerContext: plannerContext ?? this.plannerContext,
      isBuilding: isBuilding ?? this.isBuilding,
      builtTour: builtTour ?? this.builtTour,
      needsDestination: needsDestination ?? this.needsDestination,
      destinationMessage: destinationMessage ?? this.destinationMessage,
      destinationSuggestions: destinationSuggestions ?? this.destinationSuggestions,
      messages: messages ?? this.messages,
      hotels: hotels ?? this.hotels,
      needsBudget: needsBudget ?? this.needsBudget,
      needsDuration: needsDuration ?? this.needsDuration,
      selectedHotel: selectedHotel ?? this.selectedHotel,
      preferences: preferences ?? this.preferences,
      webSearchDone: webSearchDone ?? this.webSearchDone,
    );
  }

  AiBuilderState copyWithHotel(Map<String, dynamic>? hotel) {
    return AiBuilderState(
      isLoading: isLoading,
      isTyping: isTyping,
      error: error,
      request: request,
      recommendations: recommendations,
      removedRecommendations: removedRecommendations,
      plannerContext: plannerContext,
      isBuilding: isBuilding,
      builtTour: builtTour,
      needsDestination: needsDestination,
      destinationMessage: destinationMessage,
      destinationSuggestions: destinationSuggestions,
      messages: messages,
      hotels: hotels,
      needsBudget: needsBudget,
      needsDuration: needsDuration,
      selectedHotel: hotel,
      preferences: preferences,
      webSearchDone: webSearchDone,
    );
  }
}


class AiBuilderController extends StateNotifier<AiBuilderState> {
  AiBuilderController(this.ref) : super(const AiBuilderState());
  final Ref ref;

  String? _workingBaseUrl;

  Future<String> _findWorkingBaseUrl() async {
    if (_workingBaseUrl != null) return _workingBaseUrl!;
    
    Exception? lastError;
    for (final baseUrl in AppConfig.apiBaseUrls) {
      try {
        final healthUrl = baseUrl.replaceAll('/api', '/health');
        final response = await http.get(Uri.parse(healthUrl)).timeout(const Duration(seconds: 3));
        if (response.statusCode == 200) {
          _workingBaseUrl = baseUrl;
          return baseUrl;
        }
      } catch (e) {
        lastError = e is Exception ? e : Exception(e.toString());
      }
    }
    throw lastError ?? Exception('No se pudo encontrar el servidor local. Revisa que el backend esté corriendo.');
  }

  Future<http.Response> _postJson(String path, Map<String, dynamic> body) async {
    final baseUrl = await _findWorkingBaseUrl();
    return await http.post(
      Uri.parse('$baseUrl$path'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    ).timeout(const Duration(minutes: 3));
  }
  
  Future<http.Response> _getJson(String path) async {
    final baseUrl = await _findWorkingBaseUrl();
    return await http.get(Uri.parse('$baseUrl$path')).timeout(const Duration(minutes: 1));
  }

  void setInitialData(AiTourRequest request, List<AiRecommendation> initialRecs, Map<String, dynamic> context) {
    state = state.copyWith(
      request: request,
      recommendations: initialRecs,
      plannerContext: context,
    );
  }

  Future<void> sendMessage(String text, {String? imagePath, double? lat, double? lon, String? displayLabel}) async {
    final now = DateTime.now();
    final messageText = displayLabel ?? text;

    // Prevent duplicate submission if the last user message is identical and sent within 1.5 seconds
    if (state.messages.isNotEmpty) {
      final lastMsg = state.messages.last;
      if (lastMsg.isUser && lastMsg.text == messageText && now.difference(lastMsg.timestamp).inMilliseconds < 1500) {
        return;
      }
    }

    final userMsg = ChatMessage(
      id: now.millisecondsSinceEpoch.toString(),
      text: messageText,
      type: ChatMessageType.user,
      timestamp: now,
      localImagePath: imagePath,
    );
    state = state.copyWith(
      messages: [...state.messages, userMsg],
      isTyping: true,
      error: null,
    );

    // Preparar historial reciente para el backend
    final history = state.messages.map((m) => {
      'role': m.isUser ? 'user' : 'assistant',
      'content': m.text,
    }).toList();

    try {
      final response = await _postJson('/ai/chat', {
        'message': text,
        'history': history,
        'currentPreferences': state.preferences,
        // ignore: use_null_aware_elements
        if (lat != null) 'latitude': lat,
        // ignore: use_null_aware_elements
        if (lon != null) 'longitude': lon,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final rawMsg = data['responseMessage'] ?? data['message'] ?? data['botMessage'];
        final responseMessage = (rawMsg != null && rawMsg.toString().trim().isNotEmpty)
            ? rawMsg.toString()
            : '¡Excelente!';
        final rawPrefs = (data['preferences'] ?? data['updatedPreferences']) as Map<String, dynamic>? ?? {};
        final updatedPreferences = Map<String, dynamic>.from(state.preferences)..addAll(rawPrefs);
        final readyToBuild = data['readyToBuild'] == true;
        final webSearchDone = data['webSearchDone'] == true;

        final aiMsg = ChatMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          text: responseMessage,
          type: ChatMessageType.ai,
          timestamp: DateTime.now(),
        );

        state = state.copyWith(
          isTyping: false,
          messages: [...state.messages, aiMsg],
          preferences: updatedPreferences,
          webSearchDone: webSearchDone,
        );

        // Construir el tour ÚNICAMENTE si el backend confirmó que tenemos todos los datos necesarios (readyToBuild == true)
        if (readyToBuild) {
          final rawDest = (updatedPreferences['city'] ?? updatedPreferences['destination'] ?? '').toString();
          final dest = rawDest.replaceFirst(RegExp(r'^(destino|lugar|ciudad|ubicación|ubicacion|location|destination|pais|país)\s*:\s*', caseSensitive: false), '').trim();
          if (dest.isNotEmpty) {
            final profile = ref.read(touristProfileProvider).valueOrNull ?? TouristProfileV2.empty;
            final summary = TouristProfileV2.generateSummary(
              travelerType: profile.travelerType,
              budget: profile.budget,
              companionType: profile.companionType,
              hasChildren: profile.hasChildren,
              interests: profile.interests,
              preferredPace: profile.preferredPace,
            );

            final numDays = (updatedPreferences['durationDays'] as num?)?.toDouble() ?? 1.0;
            final durHours = (updatedPreferences['durationHours'] as num?)?.toDouble() ?? (numDays >= 2 ? numDays * 24 : 8.0);
            final specPlaces = (updatedPreferences['specificPlaces'] as List?)?.map((e) => e.toString()).toList() ?? [];

            CanonicalDestination? canonical;
            if (updatedPreferences['canonicalDestination'] != null) {
              try {
                canonical = CanonicalDestination.fromJson(Map<String, dynamic>.from(updatedPreferences['canonicalDestination'] as Map));
              } catch (_) {}
            }

            final request = AiTourRequest(
              prompt: text,
              destination: canonical?.displayName ?? dest.toString(),
              country: canonical?.country ?? updatedPreferences['country']?.toString() ?? '',
              city: canonical?.city ?? dest.toString(),
              canonicalDestination: canonical,
              type: TourType.custom,
              durationHours: durHours,
              language: 'es',
              touristProfileSummary: summary,
              touristInterests: profile.interests.map((e) => e.translationKey).toList(),
              touristPace: profile.preferredPace,
              latitude: canonical?.latitude ?? lat,
              longitude: canonical?.longitude ?? lon,
              budget: updatedPreferences['budget']?.toString(),
              selectedPlaces: specPlaces,
            );

            await startPlanning(request);
          }
        }
      } else {
        state = state.copyWith(
          isTyping: false,
          error: 'Error ${response.statusCode} al conectar con el asistente.',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isTyping: false,
        error: _friendlyError(e),
      );
    }
  }

  Future<void> startPlanning(AiTourRequest request) async {
    state = state.copyWith(
      isLoading: true,
      error: null,
      request: request,
      recommendations: [],
      needsDestination: false,
      needsDuration: false,
      destinationMessage: null,
      destinationSuggestions: [],
    );
    try {
      final response = await _postJson('/ai/tours/recommend', request.toJson());

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['isUnrelated'] == true) {
          final aiMsg = ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            text: data['message'] ?? 'Lo siento, soy un asistente diseñado exclusivamente para planificar tours y viajes. No estoy hecho para ese propósito.',
            type: ChatMessageType.ai,
            timestamp: DateTime.now(),
          );
          state = state.copyWith(
            isLoading: false,
            isTyping: false,
            messages: [...state.messages, aiMsg],
          );
          return;
        }

        AiTourRequest updatedReq = request;
        if (data['destination'] != null && (data['destination'] as String).isNotEmpty) {
          updatedReq = updatedReq.copyWith(
            destination: data['destination'] as String,
            city: data['city'] as String? ?? updatedReq.city,
            country: data['country'] as String? ?? updatedReq.country,
          );
        }

        if (data['needsDestination'] == true) {
          final suggs = data['suggestions'] as List? ?? [];
          final suggestions = suggs.map((e) {
            return DestinationSuggestion.fromJson(Map<String, dynamic>.from(e as Map));
          }).toList();
          final actionChips = suggestions.map((e) => e.city).where((e) => e.isNotEmpty).toList();
          
          final aiMsg = ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            text: data['message'] ?? '¿A qué lugar te gustaría ir?',
            type: ChatMessageType.ai,
            timestamp: DateTime.now(),
            actionChips: actionChips.isNotEmpty ? actionChips : null,
            destinationSuggestions: suggestions,
          );
          
          state = state.copyWith(
            isLoading: false,
            isTyping: false,
            needsDestination: true,
            request: updatedReq,
            destinationMessage: data['message'],
            destinationSuggestions: suggs,
            messages: [...state.messages, aiMsg],
          );
          return;
        }

        if (data['needsDuration'] == true) {
          final suggs = data['suggestions'] as List? ?? [];
          final actionChips = suggs.map((e) => (e['label'] ?? '').toString()).where((e) => e.isNotEmpty).toList();
          
          final aiMsg = ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            text: data['message'] ?? '¿Cuánto tiempo te gustaría que dure tu viaje?',
            type: ChatMessageType.ai,
            timestamp: DateTime.now(),
            actionChips: actionChips.isNotEmpty ? actionChips : null,
          );
          
          state = state.copyWith(
            isLoading: false,
            isTyping: false,
            needsDuration: true,
            request: updatedReq,
            messages: [...state.messages, aiMsg],
          );
          return;
        }
        
        final recs = (data['recommendations'] as List).map((e) => AiRecommendation.fromJson(e)).toList();
        final context = data['plannerContext'] as Map<String, dynamic>;

        AiTourRequest finalRequest = state.request!;
        if (data['durationHours'] != null) {
          finalRequest = finalRequest.copyWith(
            destination: data['destination'] as String? ?? finalRequest.destination,
            country: data['country'] as String? ?? finalRequest.country,
            city: data['city'] as String? ?? finalRequest.city,
            originPlace: data['originPlace'] as String? ?? finalRequest.originPlace,
            destinationPlace: data['destinationPlace'] as String? ?? finalRequest.destinationPlace,
            cities: (data['cities'] as List?)?.map((e) => e.toString()).toList() ?? finalRequest.cities,
            isMultiCity: data['isMultiCity'] as bool? ?? finalRequest.isMultiCity,
            durationHours: (data['durationHours'] as num).toDouble(),
            budget: data['budget'] as String? ?? finalRequest.budget,
          );
        }
        
        state = state.copyWith(request: finalRequest);

        if (recs.isNotEmpty) {
          state = state.copyWith(
            isLoading: false, 
            plannerContext: context,
            recommendations: recs,
          );
        }

        final aiMsg = ChatMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          text: '¡Excelente elección! He diseñado este tour para ti:',
          type: ChatMessageType.ai,
          timestamp: DateTime.now(),
          actionChips: ['Quiero cambiar lugares'],
        );

        state = state.copyWith(
          isLoading: false, 
          isTyping: false,
          plannerContext: context,
          messages: [...state.messages, aiMsg],
          needsBudget: false,
        );
      } else {
        String errorMsg = 'Error: ${response.statusCode}';
        try {
          final errData = jsonDecode(response.body);
          if (errData['error'] != null) {
            errorMsg = errData['error'].toString();
          }
        } catch (_) {}
        state = state.copyWith(isLoading: false, isTyping: false, error: errorMsg);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, isTyping: false, error: _friendlyError(e));
    }
  }
  
  Future<void> fetchHotelsDirectly() async {
    if (state.request == null || state.recommendations.isEmpty) return;

    final durHours = state.request?.durationHours ?? 4.0;
    if (durHours <= 24.0) {
      // Si el tour es de 1 día (<= 24h), no se recomiendan hoteles y se genera el tour directamente
      await buildTour();
      return;
    }

    state = state.copyWith(isLoading: true, needsBudget: false);

    try {
      final centerLat = state.recommendations.first.latitude;
      final centerLon = state.recommendations.first.longitude;
      
      final response = await _postJson('/ai/tours/hotels', {
        'latitude': centerLat,
        'longitude': centerLon,
        'budget': 'moderate',
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final hotels = data['hotels'] ?? [];
        
        final aiMsg = ChatMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          text: 'He encontrado estos hoteles ideales en la zona para tu alojamiento. ¡Selecciona uno y luego presiona "Generar Tour Final"!',
          type: ChatMessageType.ai,
          timestamp: DateTime.now(),
          actionChips: ['Generar Tour Final'],
        );

        state = state.copyWith(
          isLoading: false,
          hotels: hotels,
          messages: [...state.messages, aiMsg],
        );
      } else {
        state = state.copyWith(isLoading: false, error: '¡Ups! No pudimos buscar hoteles en este momento. Intenta nuevamente.');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _friendlyError(e));
    }
  }

  Future<List<AiRecommendation>> getAlternatives() async {
    final firstRec = state.recommendations.isNotEmpty ? state.recommendations.first : null;
    final city = (firstRec?.locationInfo.ciudad.isNotEmpty == true)
        ? firstRec!.locationInfo.ciudad
        : ((firstRec?.name.isNotEmpty == true) ? firstRec!.name : 'Barranquilla');
    final country = firstRec?.locationInfo.pais.isNotEmpty == true ? firstRec!.locationInfo.pais : 'Colombia';
    final baseLat = firstRec?.latitude ?? 10.9878;
    final baseLon = firstRec?.longitude ?? -74.7889;

    final request = state.request ?? AiTourRequest(
      destination: city,
      country: country,
      city: city,
      type: TourType.cultural,
      language: 'es',
      prompt: 'Alternativas de tour',
      touristProfileSummary: '',
      touristInterests: const [],
      touristPace: 'balanced',
      latitude: baseLat,
      longitude: baseLon,
    );

    final currentNamesAndIds = <String>{};
    for (final e in state.recommendations) {
      currentNamesAndIds.add(e.name.toLowerCase().trim());
      currentNamesAndIds.add(e.id.toLowerCase().trim());
    }
    for (final e in state.removedRecommendations) {
      currentNamesAndIds.add(e.name.toLowerCase().trim());
      currentNamesAndIds.add(e.id.toLowerCase().trim());
    }

    final excludeIds = <String>[
      ...state.recommendations.map((e) => e.id),
      ...state.recommendations.map((e) => e.name),
      ...state.removedRecommendations.map((e) => e.id),
      ...state.removedRecommendations.map((e) => e.name),
    ];

    bool isDuplicatePlace(String name, String id, Set<String> currentNamesAndIds) {
      final normName = name.toLowerCase().trim().replaceAll(RegExp(r'^(el|la|los|las|del)\s+'), '');
      final normId = id.toLowerCase().trim();

      if (normName.isEmpty && normId.isEmpty) return true;
      if (normId.isNotEmpty && currentNamesAndIds.contains(normId)) return true;
      if (normName.isNotEmpty && currentNamesAndIds.contains(normName)) return true;

      final words = normName.split(RegExp(r'\s+')).where((w) => w.length > 3).toList();
      for (final existing in currentNamesAndIds) {
        final normExisting = existing.replaceAll(RegExp(r'^(el|la|los|las|del)\s+'), '');
        if (normExisting.length > 3 && normName.length > 3) {
          if (normExisting == normName || normExisting.contains(normName) || normName.contains(normExisting)) {
            return true;
          }
          if (words.length >= 2) {
            final matchingWords = words.where((w) => normExisting.contains(w)).toList();
            if (matchingWords.length >= 2) {
              return true;
            }
          }
        }
      }
      return false;
    }

    try {
      final response = await _postJson('/ai/tours/alternatives', {
        'request': request.toJson(),
        'currentPlaces': state.recommendations.map((e) => e.toJson()).toList(),
        'excludeIds': excludeIds,
      }).timeout(const Duration(seconds: 25));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = (data['alternatives'] as List)
            .map((e) => AiRecommendation.fromJson(e))
            .where((rec) => !isDuplicatePlace(rec.name, rec.id, currentNamesAndIds))
            .toList();
        if (list.isNotEmpty) return list;
      }
    } catch (e) {
      debugPrint('Error finding alternatives from API: $e');
    }

    return [];
  }

  void replaceStopWithRecommendation(int index, AiRecommendation newRec) {
    final newRecs = List<AiRecommendation>.from(state.recommendations);
    if (index >= 0 && index < newRecs.length) {
      final replaced = newRecs[index];
      newRecs[index] = newRec;
      final newRemovedRecs = List<AiRecommendation>.from(state.removedRecommendations)..add(replaced);
      state = state.copyWith(
        recommendations: newRecs,
        removedRecommendations: newRemovedRecs,
      );
    }
  }

  void addStopWithRecommendation(AiRecommendation newRec) {
    final newRecs = List<AiRecommendation>.from(state.recommendations);
    newRecs.add(newRec);
    final newRemovedRecs = state.removedRecommendations
        .where((r) => r.id != newRec.id && r.name.toLowerCase().trim() != newRec.name.toLowerCase().trim())
        .toList();
    state = state.copyWith(
      recommendations: newRecs,
      removedRecommendations: newRemovedRecs,
    );
  }

  Future<void> removeStop(int index) async {
    final newRecs = List<AiRecommendation>.from(state.recommendations);
    if (index >= 0 && index < newRecs.length) {
      final removed = newRecs.removeAt(index);
      final newRemovedRecs = List<AiRecommendation>.from(state.removedRecommendations)..add(removed);
      state = state.copyWith(
        recommendations: newRecs,
        removedRecommendations: newRemovedRecs,
      );
    }
  }

  Future<void> replaceStop(int index) async {
    final alts = await getAlternatives();
    if (alts.isNotEmpty) {
      replaceStopWithRecommendation(index, alts.first);
    }
  }

  Future<void> addStop() async {
    final alts = await getAlternatives();
    if (alts.isNotEmpty) {
      final newRecs = List<AiRecommendation>.from(state.recommendations);
      newRecs.add(alts.first);
      state = state.copyWith(recommendations: newRecs);
    }
  }

  void selectHotel(Map<String, dynamic>? hotel) {
    state = state.copyWithHotel(hotel);
  }

  Future<void> buildTour() async {
    if (state.isBuilding || state.request == null || state.recommendations.isEmpty) return;
    state = state.copyWith(isBuilding: true, error: null);

    try {
      final response = await _postJson('/ai/tours/build', {
        'request': state.request!.toJson(),
        'places': state.recommendations.map((e) => e.toJson()).toList(),
        'plannerContext': {
          ...?state.plannerContext,
          ...state.preferences,
          if (state.selectedHotel != null) 'selectedHotel': state.selectedHotel,
        },
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final jobId = data['jobId'];
        await _pollBuildJob(jobId);
      } else {
        state = state.copyWith(isBuilding: false, error: '¡Ups! Hubo un problema al iniciar la creación del tour. Intenta de nuevo.');
      }
    } catch (e) {
      state = state.copyWith(isBuilding: false, error: _friendlyError(e));
    }
  }

  Future<void> _pollBuildJob(String jobId) async {
    while (state.isBuilding) {
      await Future.delayed(const Duration(seconds: 2));
      try {
        final response = await _getJson('/ai/tours/status/$jobId');
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          if (data['status'] == 'completed') {
            final tourData = data['tour'];
            tourData['isPublished'] = false;
            tourData['isAiGenerated'] = true;
            
            final List<TourStop> stops = [];
            final rawStops = (tourData['itinerario'] as List).asMap().entries.map((entry) {
              final s = entry.value;
              return TourStop(
                id: 'stop_${entry.key}',
                name: s['nombre'],
                location: GeoPoint(
                  latitude: s['ubicacion']['latitud'] ?? 0,
                  longitude: s['ubicacion']['longitud'] ?? 0,
                ),
                imageUrl: (s['imagenes'] as List?)?.first ?? '',
                description: s['descripcion'],
                activities: List<String>.from(s['actividades'] ?? []),
                tips: List<String>.from(s['consejos'] ?? []),
                suggestedMinutes: int.tryParse(s['duracion_estimada'].toString().replaceAll(RegExp(r'[^0-9]'), '')) ?? 25,
                order: entry.key,
                day: int.tryParse(s['dia']?.toString() ?? '1') ?? 1,
                curiousFacts: List<String>.from(s['datos_curiosos'] ?? []),
                isFallbackImage: s['isFallbackImage'] == true,
              );
            }).toList();

            stops.addAll(rawStops);

            final currentUser = ref.read(authServiceProvider).currentUser;
            final tour = Tour(
              id: tourData['id'] ?? 'ai-${DateTime.now().millisecondsSinceEpoch}',
              ownerId: currentUser?.id,
              isPublished: false,
              isAiGenerated: true,
              title: tourData['nombre_tour'] ?? 'Tour VibeTours',
              country: tourData['country']?.toString() ?? state.request?.country ?? '',
              city: tourData['city']?.toString() ?? state.request?.city ?? '',
              type: TourType.values.firstWhere(
                (e) => e.name == tourData['tipo_tour'] || tourTypeLabel(e).toLowerCase() == tourData['tipo_tour'].toString().toLowerCase(),
                orElse: () => TourType.custom,
              ),
              description: tourData['descripcion_tour'] ?? '',
              coverUrl: tourData['imagen_portada'] ?? '',
              gallery: List<String>.from(tourData['galeria_tour'] ?? []),
              durationHours: () {
                final maxDay = stops.isEmpty ? 1 : stops.map((s) => s.day).reduce((a, b) => a > b ? a : b);
                final rawDurationStr = tourData['duracion_estimada']?.toString().toLowerCase() ?? '';
                final parsedNum = double.tryParse(rawDurationStr.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 4.0;
                final isDays = rawDurationStr.contains('día') || rawDurationStr.contains('dia') || rawDurationStr.contains('day') || maxDay > 1;
                final days = maxDay > 1 ? maxDay : (isDays ? parsedNum.toInt() : 1);
                return (isDays || maxDay > 1) ? (days * 24.0) : parsedNum;
              }(),
              distanceKm: double.tryParse(tourData['distancia_total'].toString().replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0,
              rating: 5.0,
              reviewCount: 0,
              likes: 0,
              difficulty: TourDifficulty.moderate,
              language: (tourData['idiomas_disponibles'] as List?)?.first ?? 'es',
              tags: List<String>.from(tourData['etiquetas'] ?? []),
              stops: stops,
              shortSummary: tourData['resumen_corto']?.toString() ?? '',
              subcategories: List<String>.from(tourData['subcategorias'] ?? []),
              featuredExperience: tourData['experiencia_destacada']?.toString() ?? '',
              placeHistory: tourData['historia_del_lugar']?.toString() ?? '',
              culturalContext: tourData['contexto_cultural']?.toString() ?? '',
              availableLanguages: List<String>.from(tourData['idiomas_disponibles'] ?? []),
              recommendedAudience: List<String>.from(tourData['publico_recomendado'] ?? []),
              bestSeason: tourData['mejor_epoca']?.toString() ?? '',
              recommendedSchedule: tourData['horario_recomendado']?.toString() ?? '',
              meetingPoint: tourData['punto_encuentro'] is Map
                  ? (tourData['punto_encuentro']['nombre_lugar']?.toString() ?? '')
                  : (tourData['punto_encuentro']?.toString() ?? ''),
              includes: List<String>.from(tourData['incluye'] ?? []),
              excludes: List<String>.from(tourData['no_incluye'] ?? []),
              recommendations: List<String>.from(tourData['recomendaciones'] ?? []),
              whatToBring: List<String>.from(tourData['que_llevar'] ?? []),
              tourRules: List<String>.from(tourData['normas_del_tour'] ?? []),
              keywords: List<String>.from(tourData['palabras_clave'] ?? []),
              mainCategory: tourData['categoria_principal']?.toString() ?? '',
              additionalInfo: tourData['informacion_adicional'] != null && tourData['informacion_adicional'] is Map
                  ? TourAdditionalInfo(
                      accesibilidad: tourData['informacion_adicional']['accesibilidad']?.toString() ?? 'Consultar condiciones de accesibilidad.',
                      mascotasPermitidas: tourData['informacion_adicional']['mascotas_permitidas'] == true,
                      aptoParaNinos: tourData['informacion_adicional']['apto_para_ninos'] == true,
                      aptoParaAdultosMayores: tourData['informacion_adicional']['apto_para_adultos_mayores'] == true,
                    )
                  : TourAdditionalInfo.standard,
            );
            final aiMsg = ChatMessage(
              id: DateTime.now().millisecondsSinceEpoch.toString(),
              text: '¡Tu tour personalizado está listo! Aquí tienes el itinerario detallado:',
              type: ChatMessageType.ai,
              timestamp: DateTime.now(),
              embeddedTour: tour,
            );
            
            state = state.copyWith(
              isBuilding: false, 
              builtTour: tour,
              messages: [...state.messages, aiMsg],
            );
            return;
          } else if (data['status'] == 'failed') {
            state = state.copyWith(isBuilding: false, error: data['message']);
            return;
          }
        }
      } catch (e) {
        state = state.copyWith(isBuilding: false, error: _friendlyError(e));
        return;
      }
    }
  }

  // Converts technical exceptions into friendly user-facing messages.
  static String _friendlyError(Object e) {
    final raw = e.toString().toLowerCase();
    if (raw.contains('socketexception') ||
        raw.contains('connection refused') ||
        raw.contains('connection reset') ||
        raw.contains('network') ||
        raw.contains('host lookup') ||
        raw.contains('errno = 111') ||
        raw.contains('errno = 7')) {
      return '😕 Parece que el asistente no está disponible en este momento.\n\nPor favor verifica tu conexión a internet o intenta más tarde.';
    }
    if (raw.contains('timeout') || raw.contains('timed out')) {
      return '⏳ La respuesta tardó demasiado. Por favor intenta de nuevo en unos segundos.';
    }
    if (raw.contains('500') || raw.contains('internal server')) {
      return '🔧 Ocurrió un error en el servidor. Estamos trabajando para solucionarlo.';
    }
    if (raw.contains('401') || raw.contains('unauthorized')) {
      return '🔒 No tienes permiso para realizar esta acción. Por favor inicia sesión nuevamente.';
    }
    return '😕 Algo salió mal. Por favor intenta de nuevo.';
  }

  void resetChat() {
    state = const AiBuilderState();
  }
}

final aiBuilderProvider = StateNotifierProvider<AiBuilderController, AiBuilderState>((ref) {
  return AiBuilderController(ref);
});

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
  });

  final bool isLoading;
  final bool isTyping;
  final String? error;
  final AiTourRequest? request;
  final List<AiRecommendation> recommendations;
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

  AiBuilderState copyWith({
    bool? isLoading,
    bool? isTyping,
    String? error,
    AiTourRequest? request,
    List<AiRecommendation>? recommendations,
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
  }) {
    return AiBuilderState(
      isLoading: isLoading ?? this.isLoading,
      isTyping: isTyping ?? this.isTyping,
      error: error,
      request: request ?? this.request,
      recommendations: recommendations ?? this.recommendations,
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
    );
  }

  AiBuilderState copyWithHotel(Map<String, dynamic>? hotel) {
    return AiBuilderState(
      isLoading: isLoading,
      isTyping: isTyping,
      error: error,
      request: request,
      recommendations: recommendations,
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
    final userMsg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: displayLabel ?? text,
      type: ChatMessageType.user,
      timestamp: DateTime.now(),
      localImagePath: imagePath,
    );
    state = state.copyWith(
      messages: [...state.messages, userMsg],
      isTyping: true,
    );

    AiTourRequest request;
    if (state.needsDestination && state.request != null) {
      request = AiTourRequest(
        prompt: '${state.request!.prompt}\n$text',
        destination: text, // Use the user's message as destination
        country: state.request!.country,
        city: state.request!.city,
        type: state.request!.type,
        durationHours: state.request!.durationHours,
        language: state.request!.language,
        touristProfileSummary: state.request!.touristProfileSummary,
        touristInterests: state.request!.touristInterests,
        touristPace: state.request!.touristPace,
        latitude: lat ?? state.request!.latitude,
        longitude: lon ?? state.request!.longitude,
      );
    } else if (state.needsDuration && state.request != null) {
      request = AiTourRequest(
        prompt: '${state.request!.prompt}\n$text',
        destination: state.request!.destination,
        country: state.request!.country,
        city: state.request!.city,
        type: state.request!.type,
        durationHours: null, // will be parsed on backend
        language: state.request!.language,
        touristProfileSummary: state.request!.touristProfileSummary,
        touristInterests: state.request!.touristInterests,
        touristPace: state.request!.touristPace,
        latitude: lat ?? state.request!.latitude,
        longitude: lon ?? state.request!.longitude,
      );
    } else {
      final profile = ref.read(touristProfileProvider).valueOrNull ?? TouristProfileV2.empty;
      final summary = TouristProfileV2.generateSummary(
        travelerType: profile.travelerType,
        budget: profile.budget,
        companionType: profile.companionType,
        hasChildren: profile.hasChildren,
        interests: profile.interests,
        preferredPace: profile.preferredPace,
      );

      request = AiTourRequest(
        prompt: text,
        destination: '',
        country: '',
        city: '',
        type: TourType.custom,
        durationHours: null, // default to null to trigger prompt if absent
        language: 'es',
        touristProfileSummary: summary,
        touristInterests: profile.interests.map((e) => e.translationKey).toList(),
        touristPace: profile.preferredPace,
        latitude: lat,
        longitude: lon,
      );
    }
    
    await startPlanning(request);
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
            messages: [...state.messages, aiMsg],
          );
          return;
        }
        
        final recs = (data['recommendations'] as List).map((e) => AiRecommendation.fromJson(e)).toList();
        final context = data['plannerContext'] as Map<String, dynamic>;

        AiTourRequest finalRequest = state.request!;
        if (data['durationHours'] != null) {
          finalRequest = AiTourRequest(
            prompt: finalRequest.prompt,
            destination: data['destination'] as String? ?? finalRequest.destination,
            country: data['country'] as String? ?? finalRequest.country,
            city: data['city'] as String? ?? finalRequest.city,
            type: finalRequest.type,
            durationHours: (data['durationHours'] as num).toDouble(),
            language: finalRequest.language,
            touristProfileSummary: finalRequest.touristProfileSummary,
            touristInterests: finalRequest.touristInterests,
            touristPace: finalRequest.touristPace,
            latitude: finalRequest.latitude,
            longitude: finalRequest.longitude,
            budget: data['budget'] as String? ?? finalRequest.budget,
          );
        }
        
        state = state.copyWith(request: finalRequest);

        if (recs.isNotEmpty) {
          state = state.copyWith(
            isLoading: false, 
            plannerContext: context,
            recommendations: [recs.first],
          );
          
          // Animación progresiva
          for (int i = 1; i < recs.length; i++) {
            await Future.delayed(const Duration(milliseconds: 800));
            if (!mounted) return;
            state = state.copyWith(
              recommendations: [...state.recommendations, recs[i]],
            );
          }
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

        await fetchHotelsDirectly();
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

    final currentNamesAndIds = state.recommendations.map((e) => e.name.toLowerCase().trim()).toSet();
    for (var e in state.recommendations) {
      currentNamesAndIds.add(e.id.toLowerCase().trim());
    }

    try {
      final response = await _postJson('/ai/tours/alternatives', {
        'request': request.toJson(),
        'currentPlaces': state.recommendations.map((e) => e.toJson()).toList(),
        'excludeIds': state.recommendations.map((e) => e.id).toList(),
      }).timeout(const Duration(seconds: 25));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = (data['alternatives'] as List)
            .map((e) => AiRecommendation.fromJson(e))
            .where((rec) => !currentNamesAndIds.contains(rec.name.toLowerCase().trim()))
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
      newRecs[index] = newRec;
      state = state.copyWith(recommendations: newRecs);
    }
  }

  void addStopWithRecommendation(AiRecommendation newRec) {
    final newRecs = List<AiRecommendation>.from(state.recommendations);
    newRecs.add(newRec);
    state = state.copyWith(recommendations: newRecs);
  }

  Future<void> removeStop(int index) async {
    final newRecs = List<AiRecommendation>.from(state.recommendations);
    if (index >= 0 && index < newRecs.length) {
      newRecs.removeAt(index);
      state = state.copyWith(recommendations: newRecs);
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
    if (state.request == null || state.recommendations.isEmpty) return;
    state = state.copyWith(isBuilding: true, error: null);

    try {
      final response = await _postJson('/ai/tours/build', {
        'request': state.request!.toJson(),
        'places': state.recommendations.map((e) => e.toJson()).toList(),
        'plannerContext': {
          ...?state.plannerContext,
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
                order: state.selectedHotel != null ? entry.key + 1 : entry.key,
                day: int.tryParse(s['dia']?.toString() ?? '1') ?? 1,
                curiousFacts: List<String>.from(s['datos_curiosos'] ?? []),
                isFallbackImage: s['isFallbackImage'] == true,
              );
            }).toList();

            if (state.selectedHotel != null) {
              final hotelName = state.selectedHotel!['name']?.toString() ?? 'Hotel';
              final hotelLat = double.tryParse(state.selectedHotel!['latitude']?.toString() ?? '') ?? 0.0;
              final hotelLon = double.tryParse(state.selectedHotel!['longitude']?.toString() ?? '') ?? 0.0;
              final hotelAddress = state.selectedHotel!['address']?.toString() ?? state.selectedHotel!['direccion']?.toString() ?? '';

              final hotelStart = TourStop(
                id: 'hotel_start',
                name: '$hotelName (Salida)',
                location: GeoPoint(latitude: hotelLat, longitude: hotelLon),
                imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
                description: 'Punto de partida y alojamiento en $hotelName.',
                activities: const ['Check-in', 'Salida del tour'],
                tips: const ['Llevar agua y calzado cómodo'],
                suggestedMinutes: 15,
                order: 0,
                day: 1,
                locationInfo: TourLocationInfo(
                  nombreLugar: hotelName,
                  direccion: hotelAddress,
                  ciudad: tourData['city']?.toString() ?? state.request?.city ?? '',
                  region: '',
                  pais: tourData['country']?.toString() ?? state.request?.country ?? '',
                  placeId: state.selectedHotel!['id']?.toString() ?? 'hotel-start',
                  urlMapa: 'https://maps.google.com/?q=$hotelLat,$hotelLon',
                ),
              );

              final maxDay = rawStops.isEmpty ? 1 : rawStops.map((s) => s.day).reduce((a, b) => a > b ? a : b);
              final hotelEnd = TourStop(
                id: 'hotel_end',
                name: '$hotelName (Retorno)',
                location: GeoPoint(latitude: hotelLat, longitude: hotelLon),
                imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
                description: 'Fin del recorrido y retorno a tu alojamiento en $hotelName.',
                activities: const ['Retorno', 'Descanso'],
                tips: const ['Planifica tu cena y descanso'],
                suggestedMinutes: 15,
                order: rawStops.length + 1,
                day: maxDay,
                locationInfo: TourLocationInfo(
                  nombreLugar: hotelName,
                  direccion: hotelAddress,
                  ciudad: tourData['city']?.toString() ?? state.request?.city ?? '',
                  region: '',
                  pais: tourData['country']?.toString() ?? state.request?.country ?? '',
                  placeId: state.selectedHotel!['id']?.toString() ?? 'hotel-end',
                  urlMapa: 'https://maps.google.com/?q=$hotelLat,$hotelLon',
                ),
              );

              stops.add(hotelStart);
              stops.addAll(rawStops);
              stops.add(hotelEnd);
            } else {
              stops.addAll(rawStops);
            }

            final tour = Tour(
              id: tourData['id'] ?? 'ai-${DateTime.now().millisecondsSinceEpoch}',
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
              durationHours: double.tryParse(tourData['duracion_estimada'].toString().replaceAll(RegExp(r'[^0-9.]'), '')) ?? 4,
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
}

final aiBuilderProvider = StateNotifierProvider<AiBuilderController, AiBuilderState>((ref) {
  return AiBuilderController(ref);
});

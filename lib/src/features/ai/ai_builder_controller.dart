import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

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
    );
  }
}


class AiBuilderController extends StateNotifier<AiBuilderState> {
  AiBuilderController() : super(const AiBuilderState());

  static const _baseUrl = 'http://192.168.1.110:3000/api';

  void setInitialData(AiTourRequest request, List<AiRecommendation> initialRecs, Map<String, dynamic> context) {
    state = state.copyWith(
      request: request,
      recommendations: initialRecs,
      plannerContext: context,
    );
  }

  Future<void> sendMessage(String text, {String? imagePath}) async {
    final userMsg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: text,
      type: ChatMessageType.user,
      timestamp: DateTime.now(),
      localImagePath: imagePath,
    );
    state = state.copyWith(
      messages: [...state.messages, userMsg],
      isTyping: true,
    );

    // Call the backend with a synthesized request
    final request = AiTourRequest(
      prompt: text,
      destination: '',
      country: '',
      city: '',
      type: TourType.custom,
      durationHours: 4, // default 4 hours
      language: 'es',
      touristProfileSummary: '',
      touristInterests: [],
      touristPace: 'Medium',
    );
    await startPlanning(request);
  }

  Future<void> startPlanning(AiTourRequest request) async {
    state = state.copyWith(
      isLoading: true,
      error: null,
      request: request,
      recommendations: [],
      needsDestination: false,
      destinationMessage: null,
      destinationSuggestions: [],
    );
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/ai/tours/recommend'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(request.toJson()),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['needsDestination'] == true) {
          state = state.copyWith(
            isLoading: false,
            needsDestination: true,
            destinationMessage: data['message'],
            destinationSuggestions: data['suggestions'] ?? [],
          );
          return;
        }
        
        final recs = (data['recommendations'] as List).map((e) => AiRecommendation.fromJson(e)).toList();
        final context = data['plannerContext'] as Map<String, dynamic>;
        final aiMsg = ChatMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          text: '¡Excelente elección! He diseñado este tour para ti:',
          type: ChatMessageType.ai,
          timestamp: DateTime.now(),
          actionChips: ['Si, personalizar', 'Ver en mapa', 'Cambiar duración'],
          // For now, we embed a dummy tour or use the first recommendation data
          embeddedTour: Tour(
            id: 'mock-1',
            title: request.prompt.isNotEmpty ? request.prompt : 'Tour Generado',
            description: 'Un tour increíble basado en tus preferencias.',
            country: request.country,
            city: request.city,
            type: request.type,
            coverUrl: 'https://images.unsplash.com/photo-1583511666407-5f06533f2113?auto=format&fit=crop&q=80',
            gallery: [],
            durationHours: request.durationHours,
            distanceKm: 0,
            rating: 5.0,
            reviewCount: 0,
            likes: 0,
            difficulty: TourDifficulty.easy,
            language: request.language,
            tags: [],
            stops: [],
          ),
        );

        state = state.copyWith(
          isLoading: false, 
          isTyping: false,
          recommendations: recs, 
          plannerContext: context,
          messages: [...state.messages, aiMsg],
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
      state = state.copyWith(isLoading: false, isTyping: false, error: e.toString());
    }
  }
  Future<void> removeStop(int index) async {
    final newRecs = List<AiRecommendation>.from(state.recommendations);
    newRecs.removeAt(index);
    state = state.copyWith(recommendations: newRecs);
  }

  Future<void> replaceStop(int index) async {
    if (state.request == null) return;
    try {
      final currentIds = state.recommendations.map((e) => e.id).toList();
      
      final response = await http.post(
        Uri.parse('$_baseUrl/ai/tours/alternatives'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'request': state.request!.toJson(),
          'currentPlaces': state.recommendations.map((e) => e.toJson()).toList(),
          'excludeIds': currentIds,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final alts = (data['alternatives'] as List)
            .map((e) => AiRecommendation.fromJson(e))
            .toList();
        
        if (alts.isNotEmpty) {
          final newRecs = List<AiRecommendation>.from(state.recommendations);
          newRecs[index] = alts.first; // Simply take the best alternative for now
          state = state.copyWith(recommendations: newRecs);
        }
      }
    } catch (e) {
      debugPrint('Error finding alternative: $e');
    }
  }

  Future<void> addStop() async {
    if (state.request == null) return;
    try {
      final currentIds = state.recommendations.map((e) => e.id).toList();
      
      final response = await http.post(
        Uri.parse('$_baseUrl/ai/tours/alternatives'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'request': state.request!.toJson(),
          'currentPlaces': state.recommendations.map((e) => e.toJson()).toList(),
          'excludeIds': currentIds,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final alts = (data['alternatives'] as List)
            .map((e) => AiRecommendation.fromJson(e))
            .toList();
        
        if (alts.isNotEmpty) {
          final newRecs = List<AiRecommendation>.from(state.recommendations);
          newRecs.add(alts.first);
          state = state.copyWith(recommendations: newRecs);
        }
      }
    } catch (e) {
      debugPrint('Error adding stop: $e');
    }
  }

  Future<void> buildTour() async {
    if (state.request == null || state.recommendations.isEmpty) return;
    state = state.copyWith(isBuilding: true, error: null);

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/ai/tours/build'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'request': state.request!.toJson(),
          'places': state.recommendations.map((e) => e.toJson()).toList(),
          'plannerContext': state.plannerContext,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final jobId = data['jobId'];
        await _pollBuildJob(jobId);
      } else {
        state = state.copyWith(isBuilding: false, error: 'Error iniciando construcción');
      }
    } catch (e) {
      state = state.copyWith(isBuilding: false, error: e.toString());
    }
  }

  Future<void> _pollBuildJob(String jobId) async {
    while (state.isBuilding) {
      await Future.delayed(const Duration(seconds: 2));
      try {
        final response = await http.get(Uri.parse('$_baseUrl/ai/tours/status/$jobId'));
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          if (data['status'] == 'completed') {
            final tourData = data['tour'];
            tourData['isPublished'] = false;
            tourData['isAiGenerated'] = true;
            
            final tour = Tour(
              id: tourData['id'],
              title: tourData['nombre_tour'],
              country: '', // populate from somewhere
              city: '',
              type: TourType.values.firstWhere(
                (e) => e.name == tourData['tipo_tour'] || tourTypeLabel(e).toLowerCase() == tourData['tipo_tour'].toString().toLowerCase(),
                orElse: () => TourType.custom,
              ),
              description: tourData['descripcion_tour'],
              coverUrl: tourData['imagen_portada'],
              gallery: List<String>.from(tourData['galeria_tour'] ?? []),
              durationHours: double.tryParse(tourData['duracion_estimada'].toString().replaceAll(RegExp(r'[^0-9.]'), '')) ?? 4,
              distanceKm: double.tryParse(tourData['distancia_total'].toString().replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0,
              rating: 5.0,
              reviewCount: 0,
              likes: 0,
              difficulty: TourDifficulty.moderate,
              language: (tourData['idiomas_disponibles'] as List?)?.first ?? 'es',
              tags: List<String>.from(tourData['etiquetas'] ?? []),
              stops: (tourData['itinerario'] as List).asMap().entries.map((entry) {
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
                  curiousFacts: List<String>.from(s['datos_curiosos'] ?? []),
                );
              }).toList(),
            );
            
            state = state.copyWith(isBuilding: false, builtTour: tour);
            return;
          } else if (data['status'] == 'failed') {
            state = state.copyWith(isBuilding: false, error: data['message']);
            return;
          }
        }
      } catch (e) {
        state = state.copyWith(isBuilding: false, error: e.toString());
        return;
      }
    }
  }
}

final aiBuilderProvider = StateNotifierProvider<AiBuilderController, AiBuilderState>((ref) {
  return AiBuilderController();
});

import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lottie/lottie.dart';
import 'package:speech_to_text/speech_recognition_error.dart';
import 'package:speech_to_text/speech_to_text.dart';

import 'package:geolocator/geolocator.dart';


import '../../core/design/openfree_route_map.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';
import '../shared/location_disclosure_dialog.dart';
import 'ai_builder_controller.dart';

class AiPlannerScreen extends ConsumerStatefulWidget {
  const AiPlannerScreen({super.key});

  @override
  ConsumerState<AiPlannerScreen> createState() => _AiPlannerScreenState();
}

class _AiPlannerScreenState extends ConsumerState<AiPlannerScreen>
    with WidgetsBindingObserver {
  final _prompt = TextEditingController();
  final _scrollController = ScrollController();
  final _voicePrompt = _VoicePromptSession();
  
  bool _isRecording = false;
  bool _isStartingVoice = false;
  String? _voiceFeedback;
  bool _voiceFeedbackIsError = false;
  String _baselinePrompt = '';
  String _accumulatedVoiceText = '';
  String _lastRecognizedSegment = '';
  bool _ignoreVoiceResults = false;
  String? _selectedImagePath;
  bool _isProcessingAction = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollToBottom();
      
      final initialPrompt = ref.read(aiPromptProvider);
      if (initialPrompt != null && initialPrompt.isNotEmpty) {
        _prompt.text = initialPrompt;
        ref.read(aiPromptProvider.notifier).state = null; // Clear it so it doesn't persist
        
        final autoStart = ref.read(aiPromptAutoStartProvider);
        if (autoStart) {
          ref.read(aiPromptAutoStartProvider.notifier).state = false;
          _sendMessage();
        }
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    unawaited(_voicePrompt.dispose());
    _prompt.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if ((state == AppLifecycleState.inactive ||
            state == AppLifecycleState.paused ||
            state == AppLifecycleState.detached) &&
        (_isRecording || _isStartingVoice)) {
      unawaited(_voicePrompt.stop());
      if (mounted) {
        setState(() {
          _isRecording = false;
          _isStartingVoice = false;
          _voiceFeedback = AppLocalizations.of(context).voicePromptStopped;
          _voiceFeedbackIsError = false;
        });
      }
    }
  }

  Future<void> _sendMessage() async {
    if (_isProcessingAction) return;
    final builderState = ref.read(aiBuilderProvider);
    if (builderState.isLoading || builderState.isBuilding) return;

    final text = _prompt.text.trim();
    if (text.isEmpty && _selectedImagePath == null) return;
    
    final imagePath = _selectedImagePath;
    
    // Limpiar inmediatamente para evitar múltiples envíos mientras se obtiene la ubicación
    _prompt.clear();
    setState(() {
      _selectedImagePath = null;
      _isProcessingAction = true;
      _voiceFeedback = null;
      _accumulatedVoiceText = '';
      _lastRecognizedSegment = '';
      _baselinePrompt = '';
      _ignoreVoiceResults = true;
    });
    
    // Grab location
    double? lat;
    double? lon;
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!mounted) return;
      final granted = await checkAndRequestLocationPermission(context, ref);
      if (serviceEnabled && granted) {
        var position = await Geolocator.getLastKnownPosition();
        position ??= await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.medium,
            timeLimit: Duration(seconds: 8),
          ),
        );
        lat = position.latitude;
        lon = position.longitude;
      }
    } catch (_) {
      // Ignorar error de ubicación
    }

    await ref.read(aiBuilderProvider.notifier).sendMessage(text, imagePath: imagePath, lat: lat, lon: lon);
    if (mounted) {
      setState(() {
        _isProcessingAction = false;
      });
    }
    Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _selectedImagePath = pickedFile.path;
      });
    }
  }

  void _sendChipMessage({
    required String displayPrompt,
    required String aiPrompt,
  }) async {
    if (_isProcessingAction) return;
    final builderState = ref.read(aiBuilderProvider);
    if (builderState.isLoading || builderState.isBuilding) return;
    
    setState(() {
      _isProcessingAction = true;
    });

    double? lat;
    double? lon;
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!mounted) return;
      final granted = await checkAndRequestLocationPermission(context, ref);
      if (serviceEnabled && granted) {
        var position = await Geolocator.getLastKnownPosition();
        position ??= await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.medium,
            timeLimit: Duration(seconds: 8),
          ),
        );
        lat = position.latitude;
        lon = position.longitude;
      }
    } catch (_) {
      // Ignore location error
    }

    await ref.read(aiBuilderProvider.notifier).sendMessage(
      aiPrompt,
      lat: lat,
      lon: lon,
      displayLabel: displayPrompt,
    );
    if (mounted) {
      setState(() {
        _isProcessingAction = false;
      });
    }
    Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
  }

  String? _lastUserId;

  @override
  Widget build(BuildContext context) {
    final currentUser = ref.watch(authUserProvider).valueOrNull;
    final currentUserId = currentUser?.id ?? 'guest';

    if (_lastUserId != null && _lastUserId != currentUserId) {
      _lastUserId = currentUserId;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(aiBuilderProvider.notifier).resetChat();
      });
    } else {
      _lastUserId = currentUserId;
    }

    final builderState = ref.watch(aiBuilderProvider);
    
    ref.listen<AiBuilderState>(
      aiBuilderProvider,
      (previous, next) {
        if (next.messages.length > (previous?.messages.length ?? 0)) {
          Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
        }
      },
    );

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        elevation: 0,
        centerTitle: true,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              backgroundColor: Colors.blue.shade100,
              radius: 16,
              child: const Icon(Icons.smart_toy_rounded, color: Colors.blue, size: 20),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text('Tour Planner AI', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 4),
                    Icon(Icons.auto_awesome, size: 14, color: Colors.blue.shade700),
                  ],
                ),
                Text('Tu asistente de viajes', style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: AppLocalizations.of(context).aiNewChat,
            onPressed: () {
              ref.read(aiBuilderProvider.notifier).resetChat();
            },
            icon: const Icon(Icons.refresh_rounded),
          ),
          IconButton(
            tooltip: 'Crear Tour Manual',
            onPressed: () => context.push('/creator/manual'),
            icon: const Icon(Icons.add_circle_outline_rounded),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildPreferencesSummaryBar(builderState),
          Expanded(
            child: ListView(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              children: [
                _buildInitialAiMessage(),
                const SizedBox(height: 16),
                for (final msg in builderState.messages) ...[
                  _buildMessageBubble(msg, builderState.isLoading || builderState.isBuilding),
                  const SizedBox(height: 16),
                ],
                if (builderState.recommendations.isNotEmpty ||
                    (builderState.builtTour != null && builderState.builtTour!.stops.isNotEmpty)) ...[
                  _buildMapCard(builderState),
                  const SizedBox(height: 16),
                ],

                if (builderState.error != null) ...[
                  _buildErrorBanner(builderState.error!),
                  const SizedBox(height: 16),
                ],
                if (builderState.isTyping || builderState.isLoading || builderState.isBuilding)
                  _buildTypingIndicator(),
              ],
            ),
          ),
          _buildInputArea(builderState.isLoading || builderState.isBuilding),
        ],
      ),
    );
  }

  Widget _buildPreferencesSummaryBar(AiBuilderState state) {
    final prefs = state.preferences;
    if (prefs.isEmpty && !state.webSearchDone) return const SizedBox.shrink();

    final city = prefs['city'] ?? prefs['destination'];
    final datesSeason = prefs['datesSeason'];
    final durationDays = prefs['durationDays'] ?? (prefs['durationHours'] != null ? (prefs['durationHours'] / 24.0).toStringAsFixed(0) : null);
    final companions = prefs['companions'];
    final budget = prefs['budget'];
    final transport = prefs['transport'];
    final accommodation = prefs['accommodationStatus'];
    final specificPlaces = prefs['specificPlaces'] is List ? (prefs['specificPlaces'] as List).join(', ') : prefs['specificPlaces'];

    final items = <Map<String, dynamic>>[];
    if (city != null && city.toString().isNotEmpty) items.add({'icon': Icons.location_on_rounded, 'label': 'Destino: $city', 'color': Colors.blue});
    if (datesSeason != null && datesSeason.toString().isNotEmpty) items.add({'icon': Icons.calendar_month_rounded, 'label': '$datesSeason', 'color': Colors.purple});
    if (durationDays != null && durationDays.toString().isNotEmpty) items.add({'icon': Icons.timer_rounded, 'label': '$durationDays día(s)', 'color': Colors.amber.shade800});
    if (companions != null && companions.toString().isNotEmpty) items.add({'icon': Icons.people_rounded, 'label': '$companions', 'color': Colors.teal});
    if (budget != null && budget.toString().isNotEmpty) items.add({'icon': Icons.account_balance_wallet_rounded, 'label': 'Presupuesto: $budget', 'color': Colors.green});
    if (transport != null && transport.toString().isNotEmpty) items.add({'icon': Icons.directions_car_rounded, 'label': '$transport', 'color': Colors.indigo});
    if (accommodation != null && accommodation.toString().isNotEmpty) items.add({'icon': Icons.hotel_rounded, 'label': '$accommodation', 'color': Colors.deepOrange});
    if (specificPlaces != null && specificPlaces.toString().isNotEmpty) items.add({'icon': Icons.star_rounded, 'label': 'Paradas: $specificPlaces', 'color': Colors.pink});

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Resumen de tu viaje',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blue.shade700),
              ),
              const Spacer(),
              if (state.webSearchDone) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.language_rounded, size: 12, color: Colors.green.shade700),
                      const SizedBox(width: 4),
                      Text(
                        'Web Search Activa',
                        style: TextStyle(fontSize: 10, color: Colors.green.shade800, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 6),
          if (items.isEmpty)
            Text(
              'La IA adaptará el tour a medida que respondas...',
              style: TextStyle(fontSize: 11, color: Colors.grey.shade600, fontStyle: FontStyle.italic),
            )
          else
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: items.map((item) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: (item['color'] as Color).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: (item['color'] as Color).withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(item['icon'] as IconData, size: 14, color: item['color'] as Color),
                          const SizedBox(width: 6),
                          Text(
                            item['label'] as String,
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: item['color'] as Color),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMapCard(AiBuilderState builderState) {
    // Si ya existe un tour construido, el mapa se muestra de forma limpia y única dentro de la tarjeta embebida del chat
    if (builderState.builtTour != null) {
      return const SizedBox.shrink();
    }

    List<GeoPoint> points = [];
    List<String> labels = [];

    if (builderState.recommendations.isNotEmpty) {
      points = builderState.recommendations
          .map((r) => GeoPoint(latitude: r.latitude, longitude: r.longitude))
          .toList();
      labels = builderState.recommendations.map((r) => r.name).toList();
    }

    if (points.isEmpty) return const SizedBox.shrink();

    return Container(
      key: const ValueKey('ai_planner_map_card_stable'),
      height: 250,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          )
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: OpenFreeRouteMap(
          key: const ValueKey('ai_planner_openfree_map_stable'),
          points: points,
          labels: labels,
          styleUrl: ref.watch(mapStyleProvider),
          activeIndex: -1,
          height: 250,
          borderRadius: 0,
          showNumbers: true,
          useRoadRouting: true,
        ),
      ),
    );
  }



  Widget _buildErrorBanner(String errorMsg) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.orange.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.orange.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.wifi_off_rounded, color: Colors.orange.shade700, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              errorMsg,
              style: TextStyle(color: Colors.orange.shade900, fontSize: 14, height: 1.4),
            ),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.05);
  }

  Widget _buildInitialAiMessage() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: Colors.blue.shade50,
              radius: 16,
              child: const Icon(Icons.smart_toy_rounded, color: Colors.blue, size: 20),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    )
                  ],
                ),
                child: const Text(
                  '¡Hola! Qué gusto saludarte. Soy Tour Planner AI 🤖, tu asistente personal de viajes en VibeTours.\n\nEstoy aquí para diseñar un tour increíble adaptado a tus fechas, acompañantes, presupuesto y gustos. Cuéntame: ¿a qué ciudad o lugar te gustaría viajar hoy?',
                  style: TextStyle(fontSize: 15, height: 1.4),
                ),
              ),
            ),
          ],
        ).animate().fadeIn().slideX(begin: -0.1),
        const SizedBox(height: 16),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildSuggestionChip(
                label: 'Explorar ciudades',
                displayPrompt: 'Busco un recorrido de arquitectura y diseño urbano por joyas y monumentos icónicos. Deseo apreciar fachadas históricas, transitar por avenidas principales y acceder a miradores urbanos.',
                aiPrompt: 'Busco un recorrido de arquitectura y diseño urbano por joyas y monumentos icónicos. Deseo apreciar fachadas históricas, transitar por avenidas principales y acceder a miradores urbanos.\n\n[INSTRUCCIONES CRÍTICAS PARA LA IA]:\n1. Selección de Lugares: Prioriza monumentos reales con arquitectura imponente o valor histórico verificado. Evita paradas menores.\n2. Narración Premium: Describe cada parada de forma entusiasta, como un guía experto. Destaca detalles de diseño, historia y secretos locales.\n3. Formato Enriquecido: En la descripción de cada parada, utiliza listas con viñetas claras (-) para recomendar actividades concretas de contemplación o fotografía, y sugerencias de cafeterías tradicionales cercanas.',
                icon: Icons.public,
              ),
              _buildSuggestionChip(
                label: 'Aventura y naturaleza',
                displayPrompt: 'Busco una ruta de naturaleza por parques ecológicos, senderos y miradores. Deseo tranquilidad, bosques y reservas que me conecten con el entorno natural.',
                aiPrompt: 'Busco una ruta de naturaleza por parques ecológicos, senderos y miradores. Deseo tranquilidad, bosques y reservas que me conecten con el entorno natural.\n\n[INSTRUCCIONES CRÍTICAS PARA LA IA]:\n1. Selección de Lugares: Prioriza áreas naturales reales, parques amplios y miradores con vistas auténticas. Evita paradas en zonas muy urbanizadas.\n2. Narración Premium: Describe la flora, fauna, vistas y la atmósfera pacífica de cada parada.\n3. Formato Enriquecido: En la descripción de cada parada, incluye una lista con viñetas (-) indicando el equipo necesario (calzado, hidratación), nivel de dificultad y actividades al aire libre recomendadas.',
                icon: Icons.landscape,
              ),
              _buildSuggestionChip(
                label: 'Cultura e historia',
                displayPrompt: 'Deseo sumergirme en el patrimonio histórico, recorriendo museos relevantes, galerías de arte, templos y sitios que narren la identidad local.',
                aiPrompt: 'Deseo sumergirme en el patrimonio histórico, recorriendo museos relevantes, galerías de arte, templos y sitios que narren la identidad local.\n\n[INSTRUCCIONES CRÍTICAS PARA LA IA]:\n1. Selección de Lugares: Enfócate en centros culturales reales, museos de renombre e iglesias o catedrales históricas de gran valor patrimonial.\n2. Narración Premium: Explica detalladamente el contexto histórico, anécdotas fundacionales y el legado artístico de cada parada.\n3. Formato Enriquecido: En la descripción de cada parada, incluye una lista con viñetas (-) recomendando exhibiciones específicas imperdibles, detalles artísticos ocultos a buscar, y opciones gastronómicas tradicionales para descansar.',
                icon: Icons.account_balance,
              ),
              _buildSuggestionChip(
                label: 'Playa y relax',
                displayPrompt: 'Necesito un itinerario relajante cerca al agua, incluyendo playas, malecones, miradores costeros o rutas peatonales junto al mar.',
                aiPrompt: 'Necesito un itinerario relajante cerca al agua, incluyendo playas, malecones, miradores costeros o rutas peatonales junto al mar.\n\n[INSTRUCCIONES CRÍTICAS PARA LA IA]:\n1. Selección de Lugares: Prioriza playas reales, malecones escénicos y miradores con vistas espectaculares al agua.\n2. Narración Premium: Describe la atmósfera marina, el sonido de las olas y las sensaciones de paz de cada parada.\n3. Formato Enriquecido: En la descripción de cada parada, incluye una lista con viñetas (-) con recomendaciones de seguridad solar, mejores horas para evitar multitudes, y lugares de gastronomía local o chiringuitos de comida marina cercanos.',
                icon: Icons.beach_access,
              ),
            ],
          ),
        ).animate().fadeIn(delay: 200.ms),
      ],
    );
  }

  Widget _buildSuggestionChip({
    required String label,
    required String displayPrompt,
    required String aiPrompt,
    required IconData icon,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 8.0, left: 2.0),
      child: GestureDetector(
        onTap: () => _sendChipMessage(displayPrompt: displayPrompt, aiPrompt: aiPrompt),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.blue.shade200),
          ),
          child: Column(
            children: [
              Icon(icon, color: Colors.blue.shade700),
              const SizedBox(height: 8),
              Text(
                label,
                style: TextStyle(color: Colors.blue.shade700, fontWeight: FontWeight.w600, fontSize: 12),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message, bool isBusy) {
    final isUser = message.isUser;
    return Column(
      crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isUser) ...[
              CircleAvatar(
                backgroundColor: Colors.blue.shade50,
                radius: 16,
                child: const Icon(Icons.smart_toy_rounded, color: Colors.blue, size: 20),
              ),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isUser ? Colors.blue.shade600 : Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(16).copyWith(
                    bottomRight: isUser ? const Radius.circular(4) : const Radius.circular(16),
                    bottomLeft: !isUser ? const Radius.circular(4) : const Radius.circular(16),
                  ),
                  boxShadow: !isUser
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          )
                        ]
                      : null,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (message.localImagePath != null) ...[
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.file(
                          File(message.localImagePath!),
                          width: 200,
                          fit: BoxFit.cover,
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                    if (message.text.isNotEmpty)
                      FormattedMessageText(
                        text: message.text,
                        isUser: isUser,
                        textColor: isUser ? Colors.white : Theme.of(context).colorScheme.onSurface,
                      ),
                    if (message.embeddedTour != null) ...[
                      const SizedBox(height: 12),
                      _buildEmbeddedTourCard(message.embeddedTour!),
                    ],
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          '${message.timestamp.hour}:${message.timestamp.minute.toString().padLeft(2, '0')} ${message.timestamp.hour < 12 ? 'AM' : 'PM'}',
                          style: TextStyle(
                            fontSize: 10,
                            color: isUser ? Colors.white70 : Colors.grey.shade500,
                          ),
                        ),
                        if (isUser) ...[
                          const SizedBox(width: 4),
                          const Icon(Icons.done_all, size: 12, color: Colors.white70),
                        ]
                      ],
                    ),
                  ],
                ),
              ),
            ),
            if (isUser) const SizedBox(width: 32),
          ],
        ).animate().fadeIn().slideY(begin: 0.05),
      ],
    );
  }

  Widget _buildEmbeddedTourCard(Tour tour) {
    final points = tour.stops.map((s) => s.location).toList();
    final labels = tour.stops.map((s) => s.name).toList();
    final mapStyle = ref.watch(mapStyleProvider);

    return Container(
      key: ValueKey('embedded_tour_card_${tour.id}'),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.only(topLeft: Radius.circular(12), bottomLeft: Radius.circular(12)),
                child: Image.network(
                  tour.coverUrl,
                  width: 100,
                  height: 130,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    width: 100,
                    height: 130,
                    color: Colors.grey.shade200,
                    child: const Icon(Icons.image_not_supported, color: Colors.grey),
                  ),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tour.title,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.schedule, size: 12, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text('Duración: ${tour.durationHours.toInt()} horas', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.place, size: 12, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text('${tour.stops.length} paradas', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: () {
                          ref.read(selectedTourProvider.notifier).state = tour;
                          context.push('/tours/${tour.id}', extra: tour);
                        },
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Text('Ver itinerario completo', style: TextStyle(color: Colors.blue.shade700, fontSize: 12, fontWeight: FontWeight.bold)),
                            const SizedBox(width: 4),
                            Icon(Icons.arrow_forward_ios, size: 10, color: Colors.blue.shade700),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              )
            ],
          ),
          if (points.isNotEmpty) ...[
            ClipRRect(
              borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(12), bottomRight: Radius.circular(12)),
              child: SizedBox(
                height: 160,
                width: double.infinity,
                child: RepaintBoundary(
                  key: ValueKey('embedded_map_boundary_${tour.id}'),
                  child: OpenFreeRouteMap(
                    key: ValueKey('embedded_openfree_map_${tour.id}'),
                    points: points,
                    labels: labels,
                    styleUrl: mapStyle,
                    height: 160,
                    borderRadius: 0,
                    showNumbers: true,
                    useRoadRouting: true,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(left: 40, top: 8),
      child: Row(
        children: [
          SizedBox(
            height: 24,
            width: 40,
            child: Lottie.asset('assets/lottie/ai_pulse.json'),
          ),
          const SizedBox(width: 8),
          Text(
            'Analizando...',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea(bool isBusy) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8).copyWith(
        bottom: MediaQuery.of(context).padding.bottom + 8,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Column(
        children: [
          if (_voiceFeedback != null)
             Padding(
               padding: const EdgeInsets.only(bottom: 8.0, left: 16),
               child: Row(
                 children: [
                   Icon(
                     _voiceFeedbackIsError ? Icons.error_outline : Icons.mic,
                     size: 14,
                     color: _voiceFeedbackIsError ? Colors.red : Colors.blue,
                   ),
                   const SizedBox(width: 8),
                   Expanded(
                     child: Text(
                       _voiceFeedback!,
                       style: TextStyle(
                         fontSize: 12,
                         color: _voiceFeedbackIsError ? Colors.red : Colors.grey.shade600,
                       ),
                     ),
                   ),
                 ],
               ),
             ),
          if (_selectedImagePath != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8.0, left: 16),
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(
                      File(_selectedImagePath!),
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    right: 0,
                    top: 0,
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedImagePath = null),
                      child: Container(
                        decoration: const BoxDecoration(
                          color: Colors.black54,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.close, color: Colors.white, size: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4.0, left: 4.0),
                        child: IconButton(
                          icon: const Icon(Icons.image, color: Colors.grey, size: 22),
                          onPressed: _pickImage,
                          constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                          padding: EdgeInsets.zero,
                        ),
                      ),
                      Expanded(
                        child: TextField(
                          controller: _prompt,
                          minLines: 1,
                          maxLines: 5,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _sendMessage(),
                          decoration: const InputDecoration(
                            hintText: 'Describe tu tour ideal...',
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            disabledBorder: InputBorder.none,
                            errorBorder: InputBorder.none,
                            filled: false,
                            fillColor: Colors.transparent,
                            contentPadding: EdgeInsets.symmetric(vertical: 12),
                            isDense: true,
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4.0, right: 4.0, left: 4.0),
                        child: IconButton(
                          icon: const Icon(Icons.send, color: Colors.white, size: 18),
                          style: IconButton.styleFrom(
                            backgroundColor: Colors.blue.shade600,
                            padding: const EdgeInsets.all(8),
                            minimumSize: const Size(36, 36),
                          ),
                          onPressed: isBusy ? null : _sendMessage,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(bottom: 4.0),
                child: _VoicePromptButton(
                  isRecording: _isRecording,
                  isBusy: _isStartingVoice || isBusy,
                  onPressed: _toggleVoiceInput,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // === Voice Processing Logic ===

  Future<void> _toggleVoiceInput() async {
    if (_isStartingVoice) return;
    if (_isRecording || _voicePrompt.isListening) {
      await _stopVoiceInput(autoSend: true);
      return;
    }
    await _startVoiceInput();
  }

  Future<void> _startVoiceInput() async {
    final l10n = AppLocalizations.of(context);
    setState(() {
      _isStartingVoice = true;
      _voiceFeedback = l10n.voicePromptPreparing;
      _voiceFeedbackIsError = false;
      _baselinePrompt = _prompt.text.trim();
      _accumulatedVoiceText = '';
      _lastRecognizedSegment = '';
      _ignoreVoiceResults = false;
    });

    try {
      await _voicePrompt.start(
        localeCode: 'es', 
        onResult: (words, isFinal) {
          if (!mounted || _ignoreVoiceResults) return;
          
          final currentPartial = words.trim();
          if (currentPartial.isEmpty) return;

          // Si el reconocedor comenzó un nuevo segmento tras una pausa (currentPartial no continúa a _lastRecognizedSegment)
          if (_lastRecognizedSegment.isNotEmpty && !currentPartial.startsWith(_lastRecognizedSegment)) {
            if (_accumulatedVoiceText.isNotEmpty) {
              _accumulatedVoiceText = '$_accumulatedVoiceText $_lastRecognizedSegment';
            } else {
              _accumulatedVoiceText = _lastRecognizedSegment;
            }
            _lastRecognizedSegment = currentPartial;
          } else {
            _lastRecognizedSegment = currentPartial;
          }

          if (isFinal) {
            if (_accumulatedVoiceText.isNotEmpty) {
              _accumulatedVoiceText = '$_accumulatedVoiceText $_lastRecognizedSegment';
            } else {
              _accumulatedVoiceText = _lastRecognizedSegment;
            }
            _lastRecognizedSegment = '';
          }

          final fullSpeech = _accumulatedVoiceText.isNotEmpty
              ? (_lastRecognizedSegment.isNotEmpty
                  ? '$_accumulatedVoiceText $_lastRecognizedSegment'
                  : _accumulatedVoiceText)
              : _lastRecognizedSegment;

          _setPromptText(_mergePromptText(_baselinePrompt, fullSpeech));
        },
        onStatus: (status) {
          if (!mounted || _ignoreVoiceResults) return;
          setState(() {
            if (status == 'listening') {
              _isRecording = true;
              _isStartingVoice = false;
              _voiceFeedback = '🎙️ Escuchando... Toca el micrófono cuando termines de hablar.';
              _voiceFeedbackIsError = false;
            } else if (status == 'done' || status == 'notListening') {
              if (_isRecording && !_voiceFeedbackIsError) {
                _voiceFeedback = '🎙️ Escuchando... Toca el micrófono para enviar.';
              }
            }
          });
        },
        onError: (error) {
          if (!mounted || _ignoreVoiceResults) return;
          final message = _voiceErrorMessage(l10n, error);
          setState(() {
            _isRecording = false;
            _isStartingVoice = false;
            _voiceFeedback = message;
            _voiceFeedbackIsError = true;
          });
        },
      );
    } on _VoicePromptException catch (error) {
      if (!mounted) return;
      final message = switch (error.reason) {
        _VoicePromptFailure.permissionDenied =>
          l10n.voicePromptPermissionDenied,
        _VoicePromptFailure.unavailable => l10n.voicePromptUnavailable,
      };
      setState(() {
        _isRecording = false;
        _isStartingVoice = false;
        _voiceFeedback = message;
        _voiceFeedbackIsError = true;
      });
    } catch (_) {
      if (!mounted) return;
      final message = l10n.voicePromptError;
      setState(() {
        _isRecording = false;
        _isStartingVoice = false;
        _voiceFeedback = message;
        _voiceFeedbackIsError = true;
      });
    }
  }

  Future<void> _stopVoiceInput({bool autoSend = false}) async {
    final l10n = AppLocalizations.of(context);
    setState(() {
      _ignoreVoiceResults = true;
      _isRecording = false;
      _isStartingVoice = false;
      _voiceFeedback = l10n.voicePromptStopped;
      _voiceFeedbackIsError = false;
    });

    try {
      await _voicePrompt.stop();
    } catch (_) {
      await _voicePrompt.cancel();
    }

    if (!mounted) return;

    if (autoSend && _prompt.text.trim().isNotEmpty) {
      await _sendMessage();
    }
  }

  void _setPromptText(String value) {
    final nextValue = value.trimRight();
    _prompt.value = TextEditingValue(
      text: nextValue,
      selection: TextSelection.collapsed(offset: nextValue.length),
    );
  }

  String _mergePromptText(String baseline, String words) {
    final base = baseline.trim();
    final transcript = words.trim();
    if (base.isEmpty) return transcript;
    if (transcript.isEmpty) return base;
    return '$base $transcript';
  }

  String _voiceErrorMessage(AppLocalizations l10n, SpeechRecognitionError error) {
    final code = error.errorMsg.toLowerCase();
    if (code.contains('permission')) return l10n.voicePromptPermissionDenied;
    if (code.contains('speech_recognizer_disabled') || code.contains('not_available')) {
      return l10n.voicePromptUnavailable;
    }
    if (code.contains('busy')) return l10n.voicePromptBusy;
    if (code.contains('network') || code.contains('timeout')) {
      return l10n.voicePromptNetworkError;
    }
    if (code.contains('no_match')) return l10n.voicePromptNoMatch;
    return l10n.voicePromptError;
  }


}

class _VoicePromptButton extends StatefulWidget {
  const _VoicePromptButton({
    required this.isRecording,
    required this.isBusy,
    required this.onPressed,
  });

  final bool isRecording;
  final bool isBusy;
  final VoidCallback onPressed;

  @override
  State<_VoicePromptButton> createState() => _VoicePromptButtonState();
}

class _VoicePromptButtonState extends State<_VoicePromptButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1150),
  );

  @override
  void initState() {
    super.initState();
    _syncAnimation();
  }

  @override
  void didUpdateWidget(covariant _VoicePromptButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncAnimation();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _syncAnimation() {
    if (widget.isRecording) {
      if (!_controller.isAnimating) {
        _controller.repeat(reverse: true);
      }
    } else {
      _controller.stop();
      _controller.value = 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final active = widget.isRecording;
    final busy = widget.isBusy;
    final background = active
        ? Colors.blue.shade100
        : Colors.blue.shade600;
    final foreground = active ? Colors.blue.shade700 : Colors.white;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final pulse = active ? 1 + (_controller.value * 0.08) : 1.0;
        return Transform.scale(
          scale: pulse,
          child: Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: background,
              shape: BoxShape.circle,
              boxShadow: active
                  ? [
                      BoxShadow(
                        color: Colors.blue.withValues(alpha: 0.22),
                        blurRadius: 18,
                        spreadRadius: 1,
                      ),
                    ]
                  : null,
            ),
            child: IconButton(
              onPressed: busy ? null : widget.onPressed,
              icon: AnimatedSwitcher(
                duration: 180.ms,
                child: Icon(
                  active ? Icons.stop_rounded : Icons.mic_rounded,
                  key: ValueKey<bool>(active),
                  color: foreground,
                  size: 20,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

enum _VoicePromptFailure { permissionDenied, unavailable }

class _VoicePromptException implements Exception {
  const _VoicePromptException(this.reason);
  final _VoicePromptFailure reason;
}

class _VoicePromptSession {
  final SpeechToText _speech = SpeechToText();
  bool _initialized = false;
  bool _disposed = false;

  bool get isListening => _speech.isListening;

  Future<void> start({
    required String localeCode,
    required void Function(String words, bool isFinal) onResult,
    required void Function(String status) onStatus,
    required void Function(SpeechRecognitionError error) onError,
  }) async {
    if (_disposed) {
      throw StateError('Voice session already disposed.');
    }
    if (_speech.isListening) {
      await stop();
    }

    final hasPermission = await _speech.hasPermission;
    final ready = await _initialize(onStatus: onStatus, onError: onError);
    if (!ready) {
      if (!hasPermission) {
        throw const _VoicePromptException(_VoicePromptFailure.permissionDenied);
      }
      throw const _VoicePromptException(_VoicePromptFailure.unavailable);
    }

    final localeId = await _preferredLocaleId(localeCode);
    await _speech.listen(
      onResult: (result) => onResult(result.recognizedWords, result.finalResult),
      listenOptions: SpeechListenOptions(
        partialResults: true,
        cancelOnError: false,
        listenMode: ListenMode.dictation,
        localeId: localeId,
        listenFor: const Duration(minutes: 10),
        pauseFor: const Duration(minutes: 5),
      ),
    );
  }

  Future<void> stop() async {
    if (_speech.isListening) {
      await _speech.stop();
    }
  }

  Future<void> cancel() async {
    if (_speech.isListening) {
      await _speech.cancel();
    }
  }

  Future<void> dispose() async {
    if (_disposed) return;
    _disposed = true;
    try {
      await stop();
    } catch (_) {
      try {
        await cancel();
      } catch (_) {
        // Nothing else to release.
      }
    }
  }

  Future<bool> _initialize({
    required void Function(String status) onStatus,
    required void Function(SpeechRecognitionError error) onError,
  }) async {
    if (_initialized) return _speech.isAvailable;
    _initialized = true;
    return _speech.initialize(
      onStatus: onStatus,
      onError: onError,
      options: [SpeechToText.androidNoBluetooth, SpeechToText.iosNoBluetooth],
    );
  }

  Future<String?> _preferredLocaleId(String languageCode) async {
    try {
      final locales = await _speech.locales();
      final normalized = languageCode.toLowerCase();
      for (final locale in locales) {
        final value = locale.localeId.toLowerCase();
        if (value == normalized ||
            value.startsWith('${normalized}_') ||
            value.startsWith('$normalized-')) {
          return locale.localeId;
        }
      }
      final systemLocale = await _speech.systemLocale();
      if (systemLocale != null) {
        return systemLocale.localeId;
      }
    } catch (_) {
      // Fall back
    }
    return languageCode == 'en' ? 'en_US' : 'es_ES';
  }
}

class FormattedMessageText extends StatelessWidget {
  const FormattedMessageText({
    super.key,
    required this.text,
    required this.isUser,
    required this.textColor,
  });

  final String text;
  final bool isUser;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    if (text.isEmpty) return const SizedBox.shrink();

    final lines = text.split('\n');
    final List<Widget> children = [];

    for (final rawLine in lines) {
      final line = rawLine.trimRight();
      if (line.isEmpty) {
        children.add(const SizedBox(height: 6));
        continue;
      }

      // Headers (### Header)
      if (line.startsWith('#')) {
        final cleanHeader = line.replaceAll(RegExp(r'^#+\s*'), '').replaceAll(RegExp(r'\*\*|\*'), '');
        children.add(
          Padding(
            padding: const EdgeInsets.only(top: 6, bottom: 4),
            child: Text(
              cleanHeader,
              style: TextStyle(
                color: textColor,
                fontSize: 16,
                fontWeight: FontWeight.bold,
                height: 1.3,
              ),
            ),
          ),
        );
        continue;
      }

      // Bullet points (- or *)
      if (line.startsWith('- ') || line.startsWith('* ')) {
        final bulletText = line.substring(2).trim();
        children.add(
          Padding(
            padding: const EdgeInsets.only(left: 4, top: 2, bottom: 2),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('• ', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14)),
                Expanded(
                  child: RichText(
                    text: _buildTextSpan(bulletText, textColor),
                  ),
                ),
              ],
            ),
          ),
        );
        continue;
      }

      // Regular paragraph line with **bold** parsing
      children.add(
        Padding(
          padding: const EdgeInsets.only(top: 1, bottom: 1),
          child: RichText(
            text: _buildTextSpan(line, textColor),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: children,
    );
  }

  TextSpan _buildTextSpan(String input, Color baseColor) {
    final List<InlineSpan> spans = [];
    final regExp = RegExp(r'\*\*(.*?)\*\*');
    int lastMatchEnd = 0;

    for (final match in regExp.allMatches(input)) {
      if (match.start > lastMatchEnd) {
        spans.add(TextSpan(
          text: input.substring(lastMatchEnd, match.start),
          style: TextStyle(color: baseColor, fontSize: 15, height: 1.4),
        ));
      }
      spans.add(TextSpan(
        text: match.group(1),
        style: TextStyle(color: baseColor, fontSize: 15, fontWeight: FontWeight.bold, height: 1.4),
      ));
      lastMatchEnd = match.end;
    }

    if (lastMatchEnd < input.length) {
      spans.add(TextSpan(
        text: input.substring(lastMatchEnd),
        style: TextStyle(color: baseColor, fontSize: 15, height: 1.4),
      ));
    }

    return TextSpan(children: spans);
  }
}


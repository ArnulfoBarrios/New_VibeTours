import 'dart:async';
import 'dart:io';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lottie/lottie.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'package:speech_to_text/speech_to_text.dart';

import 'package:geolocator/geolocator.dart';


import '../../core/design/openfree_route_map.dart';
import '../../core/services/audio_transcription_service.dart';
import '../../core/utils/transport_utils.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';
import '../shared/location_disclosure_dialog.dart';
import 'ai_builder_controller.dart';
import 'widgets/animated_route_preview_card.dart';

class AiPlannerScreen extends ConsumerStatefulWidget {
  const AiPlannerScreen({super.key});

  @override
  ConsumerState<AiPlannerScreen> createState() => _AiPlannerScreenState();
}

class _AiPlannerScreenState extends ConsumerState<AiPlannerScreen>
    with WidgetsBindingObserver {
  final _prompt = TextEditingController();
  final _scrollController = ScrollController();
  
  final _voiceRecorder = _AudioVoiceRecorderSession();
  final _liveSpeech = _LiveSpeechRecognizerSession();
  bool _isVoiceActive = false;
  bool _isVoicePaused = false;
  bool _isVoiceTranscribing = false;
  double _voiceSoundLevel = 0.0;
  String _baselinePrompt = '';
  String? _voiceFeedback;
  bool _voiceFeedbackIsError = false;
  String? _selectedImagePath;
  bool _isProcessingAction = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Pre-inicializar el motor de dictado en segundo plano para respuesta instantánea
    unawaited(_liveSpeech.initialize());
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
    _voiceRecorder.dispose();
    _liveSpeech.dispose();
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
        _isVoiceActive) {
      unawaited(_cancelVoiceInput());
    }
  }

  Future<void> _sendMessage() async {
    if (_isProcessingAction) return;
    final builderState = ref.read(aiBuilderProvider);
    if (builderState.isTyping || builderState.isLoading || builderState.isBuilding) return;

    if (_isVoiceActive) {
      unawaited(_voiceRecorder.cancel());
      unawaited(_liveSpeech.cancel());
      _isVoiceActive = false;
      _isVoicePaused = false;
      _isVoiceTranscribing = false;
    }

    final text = _prompt.text.trim();
    if (text.isEmpty && _selectedImagePath == null) return;
    
    final imagePath = _selectedImagePath;
    
    // Limpiar inmediatamente para evitar múltiples envíos mientras se obtiene la ubicación
    _prompt.clear();
    setState(() {
      _selectedImagePath = null;
      _isProcessingAction = true;
      _voiceFeedback = null;
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
      final wasGuest = _lastUserId == 'guest';
      _lastUserId = currentUserId;
      if (!wasGuest && currentUserId == 'guest') {
        // User logged out
        WidgetsBinding.instance.addPostFrameCallback((_) {
          ref.read(aiBuilderProvider.notifier).resetChat();
        });
      } else if (!wasGuest && currentUserId != 'guest') {
        // Switched between two different accounts
        WidgetsBinding.instance.addPostFrameCallback((_) {
          ref.read(aiBuilderProvider.notifier).resetChat();
        });
      }
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
            Container(
              width: 32,
              height: 32,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
              ),
              child: ClipOval(
                child: Image.asset(
                  'assets/images/tour_planner_ai.png',
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => CircleAvatar(
                    backgroundColor: Colors.blue.shade100,
                    radius: 16,
                    child: const Icon(Icons.smart_toy_rounded, color: Colors.blue, size: 20),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Tour Planner AI', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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
                if (builderState.isLoading && builderState.recommendations.isEmpty) ...[
                  _buildTourBuildingProgressCard(),
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
                if (builderState.isTyping && !builderState.isLoading && !builderState.isBuilding)
                  _buildTypingIndicator(builderState),
              ],
            ),
          ),
          _buildInputArea(builderState.isTyping || builderState.isLoading || builderState.isBuilding),
        ],
      ),
    );
  }

  Widget _buildPreferencesSummaryBar(AiBuilderState state) {
    final prefs = state.preferences;
    if (prefs.isEmpty && !state.webSearchDone) return const SizedBox.shrink();

    final city = prefs['destination'] ?? prefs['city'];
    final isMultiCity = prefs['isMultiCity'] == true || (prefs['originPlace'] != null && prefs['destinationPlace'] != null);
    final destinationLabel = isMultiCity && prefs['originPlace'] != null && prefs['destinationPlace'] != null
        ? 'Ruta: ${prefs['originPlace']} ➔ ${prefs['destinationPlace']}'
        : 'Destino: $city';
    final datesSeason = prefs['datesSeason'];
    final durationDays = prefs['durationDays'] ?? (prefs['durationHours'] != null ? (prefs['durationHours'] / 24.0).toStringAsFixed(0) : null);
    final companions = prefs['companions'];
    final budget = prefs['budget'];
    final transport = prefs['transport'];
    final accommodation = prefs['accommodationStatus'];
    final rawSpecPlaces = prefs['specificPlaces'];
    final specificPlaces = rawSpecPlaces is List
        ? rawSpecPlaces.map((e) => e is Map ? (e['name'] ?? '').toString() : e.toString()).where((s) => s.isNotEmpty).join(', ')
        : (rawSpecPlaces?.toString() ?? '');

    final items = <Map<String, dynamic>>[];
    if (city != null && city.toString().isNotEmpty) {
      items.add({
        'icon': isMultiCity ? Icons.alt_route_rounded : Icons.location_on_rounded,
        'label': destinationLabel,
        'color': Colors.blue
      });
    }
    if (datesSeason != null && datesSeason.toString().isNotEmpty) items.add({'icon': Icons.calendar_month_rounded, 'label': '$datesSeason', 'color': Colors.purple});
    if (durationDays != null && durationDays.toString().isNotEmpty) items.add({'icon': Icons.timer_rounded, 'label': '$durationDays día(s)', 'color': Colors.amber.shade800});
    if (companions != null && companions.toString().isNotEmpty) items.add({'icon': Icons.people_rounded, 'label': '$companions', 'color': Colors.teal});
    if (budget != null && budget.toString().isNotEmpty) items.add({'icon': Icons.account_balance_wallet_rounded, 'label': 'Presupuesto: $budget', 'color': Colors.green});
    if (transport != null && transport.toString().isNotEmpty) {
      items.add({
        'icon': transportIconFor(transport),
        'label': '$transport',
        'color': Colors.indigo,
      });
    }
    if (accommodation != null && accommodation.toString().isNotEmpty) items.add({'icon': Icons.hotel_rounded, 'label': '$accommodation', 'color': Colors.deepOrange});
    if (specificPlaces.isNotEmpty) items.add({'icon': Icons.star_rounded, 'label': 'Paradas: $specificPlaces', 'color': Colors.pink});

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

  Widget _buildTourBuildingProgressCard() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(top: 4, bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2638) : const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF2E4068) : const Color(0xFFCCE4FD),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.blue.withValues(alpha: 0.08),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    isDark ? Colors.blue.shade300 : Colors.blue.shade600,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Diseñando tu tour personalizado...',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: isDark ? Colors.blue.shade200 : Colors.blue.shade900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _buildProgressStep(
            icon: Icons.location_on_rounded,
            title: 'Identificando paradas y atractivos emblemáticos',
            subtitle: 'Ubicando monumentos, miradores y museos...',
            isDark: isDark,
          ),
          const SizedBox(height: 8),
          _buildProgressStep(
            icon: Icons.alt_route_rounded,
            title: 'Estructurando itinerario y tiempos de traslado',
            subtitle: 'Optimizando traslados para cada día de viaje...',
            isDark: isDark,
          ),
          const SizedBox(height: 8),
          _buildProgressStep(
            icon: Icons.record_voice_over_rounded,
            title: 'Redactando guías de voz y notas culturales',
            subtitle: 'Personalizando historias y recomendaciones para ti...',
            isDark: isDark,
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: isDark ? Colors.black26 : Colors.white.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  size: 14,
                  color: isDark ? Colors.blue.shade300 : Colors.blue.shade700,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Estamos preparando todo en el mapa. Esto tomará solo unos segundos.',
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.05, end: 0);
  }

  Widget _buildProgressStep({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool isDark,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF19325C) : Colors.blue.shade100,
            shape: BoxShape.circle,
          ),
          child: Icon(
            icon,
            size: 14,
            color: isDark ? Colors.blue.shade300 : Colors.blue.shade700,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.grey.shade200 : Colors.grey.shade900,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 11,
                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMapCard(AiBuilderState builderState) {
    // Si ya existe un tour construido, el mapa se muestra de forma limpia y única dentro de la tarjeta embebida del chat
    if (builderState.builtTour != null || builderState.recommendations.isEmpty) {
      return const SizedBox.shrink();
    }

    final isBusy = builderState.isLoading || builderState.isBuilding;

    return AnimatedRoutePreviewCard(
      key: const ValueKey('ai_planner_animated_route_card_stable'),
      stops: builderState.recommendations,
      mapStyleUrl: ref.watch(mapStyleProvider),
      isBuilding: isBusy,
      onModifyStops: () {
        ref.read(aiBuilderProvider.notifier).prepareForEditing();
        context.push('/ai/builder');
      },
      onCreateTour: () => ref.read(aiBuilderProvider.notifier).buildTour(),
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
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(16).copyWith(
              bottomLeft: const Radius.circular(4),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              )
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                    ),
                    child: ClipOval(
                      child: Image.asset(
                        'assets/images/tour_planner_ai.png',
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => const Icon(
                          Icons.smart_toy_rounded,
                          color: Colors.blue,
                          size: 18,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Tour Planner AI',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Text(
                '¡Hola! Qué gusto saludarte. Soy Tour Planner AI 🤖, tu asistente personal de viajes en VibeTours.\n\nEstoy aquí para diseñar un tour increíble adaptado a tus fechas, acompañantes, presupuesto y gustos. Cuéntame: ¿a qué ciudad o lugar te gustaría viajar hoy?',
                style: TextStyle(fontSize: 15, height: 1.4),
              ),
            ],
          ),
        ).animate().fadeIn().slideX(begin: -0.05),
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

  String _formatTime(DateTime timestamp) {
    final hour = timestamp.hour;
    final displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    final minute = timestamp.minute.toString().padLeft(2, '0');
    final period = hour < 12 ? 'AM' : 'PM';
    return '$displayHour:$minute $period';
  }

  Widget _buildMessageBubble(ChatMessage message, bool isBusy) {
    final screenWidth = MediaQuery.of(context).size.width;
    if (message.isUser) {
      return _buildUserMessageBubble(message, screenWidth);
    } else {
      return _buildAiMessageBubble(message, screenWidth, isBusy);
    }
  }

  Widget _buildUserMessageBubble(ChatMessage message, double screenWidth) {
    final timeStr = _formatTime(message.timestamp);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Flexible(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: screenWidth * 0.76,
                ),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade600,
                    borderRadius: BorderRadius.circular(16).copyWith(
                      bottomRight: const Radius.circular(4),
                    ),
                  ),
                  child: _buildUserBubbleContent(message, timeStr, screenWidth * 0.76 - 28),
                ),
              ),
            ),
          ],
        ).animate().fadeIn().slideY(begin: 0.05),
      ],
    );
  }

  Widget _buildUserBubbleContent(ChatMessage message, String timeStr, double maxInnerWidth) {
    const textStyle = TextStyle(
      fontSize: 15,
      color: Colors.white,
      height: 1.35,
    );

    final timestampWidget = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          timeStr,
          style: const TextStyle(
            fontSize: 10,
            color: Colors.white70,
            fontWeight: FontWeight.w400,
          ),
        ),
        const SizedBox(width: 4),
        const Icon(Icons.done_all, size: 12, color: Colors.white70),
      ],
    );

    if (message.localImagePath != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisSize: MainAxisSize.min,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.file(
              File(message.localImagePath!),
              width: 200,
              fit: BoxFit.cover,
            ),
          ),
          if (message.text.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(message.text, style: textStyle),
          ],
          const SizedBox(height: 4),
          timestampWidget,
        ],
      );
    }

    final textPainter = TextPainter(
      text: TextSpan(text: message.text, style: textStyle),
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: maxInnerWidth);

    final lineMetrics = textPainter.computeLineMetrics();
    const timeApproxWidth = 64.0;
    const spacing = 8.0;

    final isSingleLineFits = lineMetrics.length == 1 &&
        (lineMetrics.first.width + spacing + timeApproxWidth <= maxInnerWidth);

    if (isSingleLineFits) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Flexible(
            child: Text(message.text, style: textStyle),
          ),
          const SizedBox(width: spacing),
          Padding(
            padding: const EdgeInsets.only(bottom: 1.0),
            child: timestampWidget,
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(message.text, style: textStyle),
        const SizedBox(height: 4),
        timestampWidget,
      ],
    );
  }

  Widget _buildAiMessageBubble(ChatMessage message, double screenWidth, bool isBusy) {
    final timeStr = _formatTime(message.timestamp);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Flexible(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: screenWidth * 0.85,
                ),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(16).copyWith(
                      bottomLeft: const Radius.circular(4),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      )
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 24,
                            height: 24,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                            ),
                            child: ClipOval(
                              child: Image.asset(
                                'assets/images/tour_planner_ai.png',
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => const Icon(
                                  Icons.smart_toy_rounded,
                                  color: Colors.blue,
                                  size: 18,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Tour Planner AI',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      if (message.text.isNotEmpty)
                        FormattedMessageText(
                          text: message.text,
                          isUser: false,
                          textColor: Theme.of(context).colorScheme.onSurface,
                        ),
                      if (message.embeddedTour != null) ...[
                        const SizedBox(height: 12),
                        _buildEmbeddedTourCard(
                          message.embeddedTour!,
                          hideModifyStops: isBusy,
                        ),
                      ],
                      const SizedBox(height: 6),
                      Align(
                        alignment: Alignment.bottomRight,
                        child: Text(
                          timeStr,
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ).animate().fadeIn().slideY(begin: 0.05),
      ],
    );
  }

  Widget _buildEmbeddedTourCard(
    Tour tour, {
    bool hideModifyStops = false,
  }) {
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
              borderRadius: BorderRadius.circular(0),
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
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                if (!hideModifyStops) ...[
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        side: BorderSide(color: Colors.blue.shade300),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      icon: Icon(Icons.edit_location_alt_outlined, size: 16, color: Colors.blue.shade700),
                      label: Text(
                        'Modificar paradas',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blue.shade700),
                      ),
                      onPressed: () {
                        ref.read(aiBuilderProvider.notifier).prepareForEditing(tour);
                        context.push('/ai/builder');
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.blue.shade600,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.map_outlined, size: 16, color: Colors.white),
                    label: const Text(
                      'Ver tour completo',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    onPressed: () {
                      ref.read(selectedTourProvider.notifier).state = tour;
                      context.push('/tours/${tour.id}', extra: tour);
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator([AiBuilderState? state]) {
    String indicatorText = 'Analizando...';
    if (state != null && state.messages.isNotEmpty) {
      final lastUserMsg = state.messages.reversed.firstWhere(
        (m) => m.isUser,
        orElse: () => state.messages.last,
      );
      final text = lastUserMsg.text.toLowerCase();
      if (text.contains('hotel') || text.contains('hospedaj') || text.contains('alojam') || text.contains('dormir')) {
        indicatorText = 'Buscando las mejores opciones de hospedaje...';
      } else if (text.contains('itinerar') || text.contains('tour') || text.contains('plan') || text.contains('ruta')) {
        indicatorText = 'Diseñando tu viaje personalizado...';
      } else if (text.contains('restaurante') || text.contains('comer') || text.contains('comida') || text.contains('gastronom')) {
        indicatorText = 'Buscando recomendaciones gastronómicas...';
      } else if (text.contains('presupuesto') || text.contains('precio') || text.contains('cuanto') || text.contains('cuánto')) {
        indicatorText = 'Estimando costos y presupuestos...';
      } else if (text.contains('foto') || text.contains('lugar') || text.contains('visitar') || text.contains('atractiv')) {
        indicatorText = 'Explorando atractivos y lugares de interés...';
      }
    }

    return Padding(
      padding: const EdgeInsets.only(left: 4, top: 8),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: 24,
            width: 40,
            child: Lottie.asset('assets/lottie/ai_pulse.json'),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              indicatorText,
              style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
              overflow: TextOverflow.ellipsis,
            ),
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
          if (_isVoiceActive)
            Container(
              margin: const EdgeInsets.only(bottom: 8, left: 4, right: 4),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: _isVoiceTranscribing
                    ? Colors.purple.shade50
                    : (_isVoicePaused ? Colors.amber.shade50 : Colors.blue.shade50),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _isVoiceTranscribing
                      ? Colors.purple.shade300
                      : (_isVoicePaused ? Colors.amber.shade300 : Colors.blue.shade300),
                  width: 1.2,
                ),
              ),
              child: Row(
                children: [
                  if (_isVoiceTranscribing)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.purple),
                      ),
                    )
                  else
                    Icon(
                      _isVoicePaused ? Icons.pause_circle_filled_rounded : Icons.mic_rounded,
                      color: _isVoicePaused ? Colors.amber.shade800 : Colors.blue.shade700,
                      size: 18,
                    ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _isVoiceTranscribing
                          ? 'Transcribiendo voz con IA (Groq Whisper)...'
                          : (_isVoicePaused
                              ? 'En pausa. Toca ▶ para continuar'
                              : 'Grabando tu voz... Habla con tranquilidad y toca ✔ al terminar'),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: _isVoiceTranscribing
                            ? Colors.purple.shade900
                            : (_isVoicePaused ? Colors.amber.shade900 : Colors.blue.shade900),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (!_isVoiceTranscribing) ...[
                    const SizedBox(width: 6),
                    InkWell(
                      onTap: _toggleVoicePause,
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _isVoicePaused ? Colors.green.shade600 : Colors.amber.shade700,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              _isVoicePaused ? Icons.play_arrow_rounded : Icons.pause_rounded,
                              color: Colors.white,
                              size: 14,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _isVoicePaused ? 'Reanudar' : 'Pausar',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    IconButton(
                      icon: const Icon(Icons.delete_outline_rounded, color: Colors.grey, size: 20),
                      tooltip: 'Descartar dictado',
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                      onPressed: _cancelVoiceInput,
                    ),
                  ],
                ],
              ),
            ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Container(
                  constraints: const BoxConstraints(minHeight: 46),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    border: Border.all(
                      color: _isVoiceActive
                          ? (_isVoicePaused ? Colors.amber.shade400 : Colors.blue.shade400)
                          : Colors.grey.shade300,
                      width: _isVoiceActive ? 1.5 : 1.0,
                    ),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(left: 4.0),
                        child: IconButton(
                          icon: const Icon(Icons.image_outlined, color: Colors.grey, size: 22),
                          onPressed: _pickImage,
                          constraints: const BoxConstraints(minWidth: 38, minHeight: 38),
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
                          decoration: InputDecoration(
                            hintText: _isVoiceActive
                                ? (_isVoiceTranscribing
                                    ? 'Transcribiendo audio...'
                                    : (_isVoicePaused ? 'Voz en pausa...' : 'Escuchando tu voz...'))
                                : 'Describe tu tour ideal...',
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            disabledBorder: InputBorder.none,
                            errorBorder: InputBorder.none,
                            filled: false,
                            fillColor: Colors.transparent,
                            contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                            isDense: true,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ListenableBuilder(
                listenable: _prompt,
                builder: (context, _) {
                  final hasText = _prompt.text.trim().isNotEmpty || _selectedImagePath != null;

                  if (_isVoiceActive) {
                    return _VoicePromptButton(
                      key: const ValueKey('voice_active_button'),
                      isRecording: true,
                      isPaused: _isVoicePaused,
                      isTranscribing: _isVoiceTranscribing,
                      isBusy: _isVoiceTranscribing,
                      soundLevel: _voiceSoundLevel,
                      onPressed: () => _finishVoiceInput(autoSend: false),
                    );
                  }

                  return SizedBox(
                    width: 44,
                    height: 44,
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      transitionBuilder: (child, animation) => ScaleTransition(scale: animation, child: child),
                      child: hasText
                          ? Container(
                              key: const ValueKey('send_button'),
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: Colors.blue.shade600,
                                shape: BoxShape.circle,
                              ),
                              child: IconButton(
                                icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                                padding: EdgeInsets.zero,
                                onPressed: isBusy ? null : _sendMessage,
                              ),
                            )
                          : _VoicePromptButton(
                              key: const ValueKey('mic_button'),
                              isRecording: false,
                              isPaused: false,
                              isBusy: isBusy,
                              soundLevel: 0.0,
                              onPressed: _toggleVoiceInput,
                            ),
                    ),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  // === Continuous Voice Input & Smart Normalizer ===

  Future<void> _toggleVoiceInput() async {
    if (_isVoiceActive) {
      await _finishVoiceInput();
    } else {
      await _startVoiceInput();
    }
  }

  Future<void> _startVoiceInput() async {
    _baselinePrompt = _prompt.text.trim();
    setState(() {
      _isVoiceActive = true;
      _isVoicePaused = false;
      _isVoiceTranscribing = false;
      _voiceSoundLevel = 0.0;
      _voiceFeedback = null;
      _voiceFeedbackIsError = false;
    });

    // 1. Iniciar grabador de audio físico (.m4a para Whisper)
    final started = await _voiceRecorder.start(
      onSoundLevel: (level) {
        if (!mounted || !_isVoiceActive || _isVoicePaused || _isVoiceTranscribing) return;
        setState(() {
          _voiceSoundLevel = level;
        });
      },
      onError: (errorMsg) {
        debugPrint('[AudioVoiceRecorder] Error: $errorMsg');
      },
    );

    if (!started && mounted) {
      setState(() {
        _isVoiceActive = false;
        _isVoicePaused = false;
        _isVoiceTranscribing = false;
        _voiceFeedback = 'No se pudo acceder al micrófono.';
        _voiceFeedbackIsError = true;
      });
      return;
    }

    // 2. Iniciar dictado en vivo en tiempo real (las palabras fluyen inmediatamente)
    unawaited(
      _liveSpeech.startListening(
        onLiveText: (liveText) {
          if (!mounted || !_isVoiceActive || _isVoicePaused || _isVoiceTranscribing) return;
          final combined = _baselinePrompt.isEmpty
              ? liveText
              : '$_baselinePrompt $liveText';
          _setPromptText(combined);
        },
      ),
    );
  }

  Future<void> _toggleVoicePause() async {
    if (!_isVoiceActive || _isVoiceTranscribing) return;
    if (_isVoicePaused) {
      await _voiceRecorder.resume();
      await _liveSpeech.resume();
      setState(() {
        _isVoicePaused = false;
        _voiceFeedback = null;
      });
    } else {
      await _voiceRecorder.pause();
      await _liveSpeech.pause();
      setState(() {
        _isVoicePaused = true;
        _voiceSoundLevel = 0.0;
        _voiceFeedback = null;
      });
    }
  }

  Future<void> _finishVoiceInput({bool autoSend = false}) async {
    if (!_isVoiceActive || _isVoiceTranscribing) return;

    setState(() {
      _isVoiceTranscribing = true;
      _voiceSoundLevel = 0.0;
      _voiceFeedback = null;
    });

    // Detener la escucha en vivo
    await _liveSpeech.stop();

    try {
      final recordedPath = await _voiceRecorder.stop();
      if (recordedPath == null || !File(recordedPath).existsSync()) {
        throw Exception('No se encontró el archivo de audio grabado.');
      }

      final recordedFile = File(recordedPath);
      final rawText = await AudioTranscriptionService.transcribeAudioFile(recordedFile);
      final cleanedText = SmartVoiceNormalizer.normalize(rawText);

      try {
        if (recordedFile.existsSync()) recordedFile.deleteSync();
      } catch (_) {}

      if (!mounted) return;

      if (cleanedText.isNotEmpty) {
        final combined = _baselinePrompt.isEmpty
            ? cleanedText
            : '$_baselinePrompt $cleanedText';
        _setPromptText(combined);
      }

      setState(() {
        _isVoiceActive = false;
        _isVoicePaused = false;
        _isVoiceTranscribing = false;
        _voiceSoundLevel = 0.0;
        _voiceFeedback = null;
        _voiceFeedbackIsError = false;
      });

      if (autoSend && _prompt.text.trim().isNotEmpty) {
        await _sendMessage();
      }
    } catch (e) {
      debugPrint('[Voice] Error al transcribir con IA: $e');
      if (!mounted) return;
      // Si la IA remota falla, preservamos intacto el texto reconocido en vivo
      setState(() {
        _isVoiceActive = false;
        _isVoicePaused = false;
        _isVoiceTranscribing = false;
        _voiceSoundLevel = 0.0;
        _voiceFeedback = null;
        _voiceFeedbackIsError = false;
      });
      if (autoSend && _prompt.text.trim().isNotEmpty) {
        await _sendMessage();
      }
    }
  }

  Future<void> _cancelVoiceInput() async {
    await _voiceRecorder.cancel();
    await _liveSpeech.cancel();
    if (!mounted) return;
    _setPromptText(_baselinePrompt);
    setState(() {
      _isVoiceActive = false;
      _isVoicePaused = false;
      _isVoiceTranscribing = false;
      _voiceSoundLevel = 0.0;
      _voiceFeedback = null;
      _voiceFeedbackIsError = false;
    });
  }

  void _setPromptText(String value) {
    final nextValue = value.trimRight();
    _prompt.value = TextEditingValue(
      text: nextValue,
      selection: TextSelection.collapsed(offset: nextValue.length),
    );
  }
}

class _VoicePromptButton extends StatefulWidget {
  const _VoicePromptButton({
    super.key,
    required this.isRecording,
    this.isPaused = false,
    this.isTranscribing = false,
    required this.isBusy,
    required this.onPressed,
    this.soundLevel = 0.0,
  });

  final bool isRecording;
  final bool isPaused;
  final bool isTranscribing;
  final bool isBusy;
  final VoidCallback onPressed;
  final double soundLevel;

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
    if (widget.isRecording && !widget.isPaused && !widget.isTranscribing) {
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
    final paused = widget.isPaused;
    final transcribing = widget.isTranscribing;
    final busy = widget.isBusy;
    final background = transcribing
        ? Colors.purple.shade700
        : (active
            ? (paused ? Colors.amber.shade700 : Colors.blue.shade700)
            : Colors.blue.shade600);
    const foreground = Colors.white;

    final soundBoost = (active && !paused && !transcribing)
        ? widget.soundLevel * 0.22
        : 0.0;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final pulse = (active && !paused && !transcribing)
            ? 1 + (_controller.value * 0.08) + soundBoost
            : 1.0;
        return Transform.scale(
          scale: pulse,
          child: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: background,
              shape: BoxShape.circle,
              boxShadow: active
                  ? [
                      BoxShadow(
                        color: (transcribing
                                ? Colors.purple
                                : (paused ? Colors.amber : Colors.blue))
                            .withValues(alpha: (0.35 + soundBoost * 0.4).clamp(0.0, 0.85)),
                        blurRadius: 16 + (soundBoost * 20),
                        spreadRadius: 2 + (soundBoost * 6),
                      ),
                    ]
                  : null,
            ),
            child: IconButton(
              padding: EdgeInsets.zero,
              tooltip: transcribing
                  ? 'Transcribiendo audio...'
                  : (active ? 'Listo / Finalizar dictado' : 'Hablar por micrófono'),
              onPressed: busy ? null : widget.onPressed,
              icon: AnimatedSwitcher(
                duration: 180.ms,
                child: transcribing
                    ? const SizedBox(
                        key: ValueKey('transcribing_spinner'),
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Icon(
                        active ? Icons.check_rounded : Icons.mic_rounded,
                        key: ValueKey<String>('${active}_$paused'),
                        color: foreground,
                        size: active ? 22 : 20,
                      ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Normalizador inteligente de voz que corrige palabras poco claras,
/// tartamudeos y destinos turísticos comunes de Colombia.
class SmartVoiceNormalizer {
  const SmartVoiceNormalizer._();

  static final Map<RegExp, String> _replacements = {
    RegExp(r'\b(ir a|voy a|quiero ir a)\s+(?:procrear|crear)\b', caseSensitive: false): r'$1 pasear',
    RegExp(r'\b(pa crear)\b', caseSensitive: false): 'para crear',
    RegExp(r'\b(bogota|bogotta)\b', caseSensitive: false): 'Bogotá',
    RegExp(r'\b(medellin|medeyin)\b', caseSensitive: false): 'Medellín',
    RegExp(r'\b(cartajena|cartagena)\b', caseSensitive: false): 'Cartagena',
    RegExp(r'\b(santa marta|santamarta)\b', caseSensitive: false): 'Santa Marta',
    RegExp(r'\b(san andres|sanandres)\b', caseSensitive: false): 'San Andrés',
    RegExp(r'\b(marranquilla|barranqulla|barranquillla)\b', caseSensitive: false): 'Barranquilla',
    RegExp(r'\b(barranquilla|quilla)\b', caseSensitive: false): 'Barranquilla',
    RegExp(r'\b(cali)\b', caseSensitive: false): 'Cali',
    RegExp(r'\b(bucaramanga)\b', caseSensitive: false): 'Bucaramanga',
    RegExp(r'\b(eje cafetero)\b', caseSensitive: false): 'Eje Cafetero',
    RegExp(r'\b(villa de leyva|villadeleyva)\b', caseSensitive: false): 'Villa de Leyva',
    RegExp(r'\b(guatavita)\b', caseSensitive: false): 'Guatavita',
    RegExp(r'\b(guatape|guatapé)\b', caseSensitive: false): 'Guatapé',
    RegExp(r'\b(monserrate|montserrate)\b', caseSensitive: false): 'Monserrate',
    RegExp(r'\b(zipaquira|zipaquirá)\b', caseSensitive: false): 'Zipaquirá',
    RegExp(r'\b(comuna trece|comuna 13)\b', caseSensitive: false): 'Comuna 13',
    RegExp(r'\b(tayrona|tairona)\b', caseSensitive: false): 'Tayrona',
    RegExp(r'\b(tatacoa)\b', caseSensitive: false): 'la Tatacoa',
    RegExp(r'\b(salento)\b', caseSensitive: false): 'Salento',
    RegExp(r'\b(barichara)\b', caseSensitive: false): 'Barichara',
    RegExp(r'\b(cabo de la vela)\b', caseSensitive: false): 'Cabo de la Vela',
    RegExp(r'\b(palomino)\b', caseSensitive: false): 'Palomino',
    RegExp(r'\b(mompox|mompos)\b', caseSensitive: false): 'Mompox',
    RegExp(r'\b(el malecon|gran malecon|malecon del rio)\b', caseSensitive: false): 'el Gran Malecón',
    RegExp(r'\b(los valores m[aá]s importantes)\b', caseSensitive: false): 'los lugares más importantes',
    RegExp(r'\b(valores m[aá]s importantes)\b', caseSensitive: false): 'lugares más importantes',
    RegExp(r'\b(dar el carro)\b', caseSensitive: false): 'usar el carro',
    RegExp(r'\b(en todo el mercado)\b', caseSensitive: false): 'en todo el recorrido',
  };

  static String normalize(String input) {
    var text = input.trim();
    if (text.isEmpty) return '';

    // 1. Eliminar palabras consecutivas duplicadas (tartamudeo: "quiero quiero")
    final words = text.split(RegExp(r'\s+'));
    if (words.isNotEmpty) {
      final deduplicated = <String>[];
      for (int i = 0; i < words.length; i++) {
        if (i == 0 || words[i].toLowerCase() != words[i - 1].toLowerCase()) {
          deduplicated.add(words[i]);
        }
      }
      text = deduplicated.join(' ');
    }

    // 2. Corregir destinos y lugares turísticos frecuentes
    for (final entry in _replacements.entries) {
      text = text.replaceAll(entry.key, entry.value);
    }

    // 3. Mayúscula al inicio
    if (text.isNotEmpty) {
      text = text[0].toUpperCase() + text.substring(1);
    }

    return text;
  }
}

/// Sesión de grabación de audio con micrófono de alta fidelidad.
/// Permite pausar/reanudar manualmente y nunca corta la grabación por silencios.
class _AudioVoiceRecorderSession {
  final AudioRecorder _recorder = AudioRecorder();
  StreamSubscription<Amplitude>? _ampSub;
  String? _currentRecordingPath;
  bool _isRecording = false;
  bool _isPaused = false;

  bool get isRecording => _isRecording;
  bool get isPaused => _isPaused;

  Future<bool> start({
    required void Function(double soundLevel) onSoundLevel,
    required void Function(String error) onError,
  }) async {
    try {
      final hasPerm = await _recorder.hasPermission();
      if (!hasPerm) {
        onError('Permiso de micrófono no otorgado.');
        return false;
      }

      final tempDir = await getTemporaryDirectory();
      final filePath = '${tempDir.path}/vibe_voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
      _currentRecordingPath = filePath;

      await _recorder.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,
          bitRate: 128000,
          sampleRate: 44100,
        ),
        path: filePath,
      );

      _isRecording = true;
      _isPaused = false;

      _ampSub?.cancel();
      _ampSub = _recorder.onAmplitudeChanged(const Duration(milliseconds: 90)).listen((amp) {
        final normalized = ((amp.current + 50.0) / 45.0).clamp(0.0, 1.0);
        onSoundLevel(normalized);
      });

      return true;
    } catch (e) {
      debugPrint('[AudioVoiceRecorder] Start error: $e');
      onError('No se pudo iniciar la grabación: $e');
      return false;
    }
  }

  Future<void> pause() async {
    if (!_isRecording || _isPaused) return;
    try {
      await _recorder.pause();
      _isPaused = true;
    } catch (e) {
      debugPrint('[AudioVoiceRecorder] Pause error: $e');
    }
  }

  Future<void> resume() async {
    if (!_isRecording || !_isPaused) return;
    try {
      await _recorder.resume();
      _isPaused = false;
    } catch (e) {
      debugPrint('[AudioVoiceRecorder] Resume error: $e');
    }
  }

  Future<String?> stop() async {
    _ampSub?.cancel();
    _ampSub = null;
    _isRecording = false;
    _isPaused = false;

    try {
      final path = await _recorder.stop();
      return path ?? _currentRecordingPath;
    } catch (e) {
      debugPrint('[AudioVoiceRecorder] Stop error: $e');
      return _currentRecordingPath;
    }
  }

  Future<void> cancel() async {
    _ampSub?.cancel();
    _ampSub = null;
    _isRecording = false;
    _isPaused = false;

    try {
      await _recorder.cancel();
      if (_currentRecordingPath != null) {
        final f = File(_currentRecordingPath!);
        if (f.existsSync()) f.deleteSync();
      }
    } catch (_) {}
    _currentRecordingPath = null;
  }

  Future<void> dispose() async {
    await cancel();
    await _recorder.dispose();
  }
}

/// Sesión de reconocimiento de voz en vivo en el dispositivo.
/// Muestra las palabras en tiempo real mientras el usuario habla (latencia 0 ms).
/// Si el reconocedor nativo se detiene por silencio, se reconecta automáticamente
/// para no perder las siguientes frases.
class _LiveSpeechRecognizerSession {
  final SpeechToText _speech = SpeechToText();
  bool _initialized = false;
  bool _isAvailable = false;
  bool _isListening = false;
  bool _shouldBeListening = false;
  Timer? _restartDebounce;
  String? _resolvedLocaleId;

  final List<String> _finalizedUtterances = [];
  String _currentUtterance = '';
  void Function(String fullLiveText)? _onLiveTextUpdated;

  bool get isListening => _isListening;
  bool get isAvailable => _isAvailable;

  Future<bool> initialize() async {
    if (_initialized) return _isAvailable;
    try {
      _isAvailable = await _speech.initialize(
        onError: (err) {
          debugPrint('[LiveSpeech] Error: ${err.errorMsg} (permanent: ${err.permanent})');
          _isListening = false;
          if (_shouldBeListening) {
            final msg = err.errorMsg.toLowerCase();
            if (msg.contains('timeout') || msg.contains('no_match') || msg.contains('busy')) {
              _scheduleRestart();
            }
          }
        },
        onStatus: (status) {
          debugPrint('[LiveSpeech] Status: $status');
          if (status == 'listening') {
            _isListening = true;
          } else if (status == 'notListening' || status == 'done') {
            _isListening = false;
            if (_shouldBeListening) {
              _scheduleRestart();
            }
          }
        },
      );
      _initialized = true;
      if (_isAvailable) {
        _resolvedLocaleId = await _resolveLocale();
      }
      return _isAvailable;
    } catch (e) {
      debugPrint('[LiveSpeech] Init exception: $e');
      _initialized = true;
      _isAvailable = false;
      return false;
    }
  }

  Future<String?> _resolveLocale() async {
    try {
      final locales = await _speech.locales();
      const preferred = [
        'es_co', 'es-co', 'es_419', 'es-419', 'es_mx', 'es-mx', 'es_us', 'es-us', 'es_es', 'es-es'
      ];
      for (final p in preferred) {
        for (final l in locales) {
          if (l.localeId.toLowerCase().replaceAll('-', '_') == p.replaceAll('-', '_')) {
            return l.localeId;
          }
        }
      }
      final sys = await _speech.systemLocale();
      if (sys != null && sys.localeId.toLowerCase().startsWith('es')) {
        return sys.localeId;
      }
      for (final l in locales) {
        if (l.localeId.toLowerCase().startsWith('es')) {
          return l.localeId;
        }
      }
    } catch (_) {}
    return 'es_CO';
  }

  Future<void> startListening({
    required void Function(String fullLiveText) onLiveText,
  }) async {
    _onLiveTextUpdated = onLiveText;
    _shouldBeListening = true;
    _finalizedUtterances.clear();
    _currentUtterance = '';
    _restartDebounce?.cancel();

    if (!_initialized) {
      await initialize();
    }
    if (!_isAvailable) {
      debugPrint('[LiveSpeech] Speech to text no disponible en este dispositivo');
      return;
    }

    await _listenInternal();
  }

  Future<void> _listenInternal() async {
    if (!_shouldBeListening) return;
    try {
      if (_speech.isListening) {
        await _speech.stop();
      }
      await _speech.listen(
        onResult: (result) {
          if (!_shouldBeListening) return;
          final words = result.recognizedWords.trim();
          if (words.isEmpty) return;

          // Si el reconocedor comenzó un nuevo segmento tras una pausa breve
          if (_currentUtterance.isNotEmpty &&
              !words.toLowerCase().startsWith(_currentUtterance.toLowerCase().substring(0, math.min(8, _currentUtterance.length)))) {
            _finalizedUtterances.add(_currentUtterance);
            _currentUtterance = words;
          } else {
            _currentUtterance = words;
          }

          if (result.finalResult) {
            _finalizedUtterances.add(_currentUtterance);
            _currentUtterance = '';
          }

          final all = [..._finalizedUtterances];
          if (_currentUtterance.isNotEmpty) {
            all.add(_currentUtterance);
          }
          final combined = all.join(' ').trim();
          if (combined.isNotEmpty) {
            _onLiveTextUpdated?.call(combined);
          }
        },
        listenOptions: SpeechListenOptions(
          partialResults: true,
          cancelOnError: false,
          listenMode: ListenMode.dictation,
          localeId: _resolvedLocaleId ?? 'es_CO',
          listenFor: const Duration(minutes: 10),
          pauseFor: const Duration(seconds: 8),
        ),
      );
      _isListening = true;
    } catch (e) {
      debugPrint('[LiveSpeech] Listen error: $e');
      if (_shouldBeListening) {
        _scheduleRestart();
      }
    }
  }

  void _scheduleRestart() {
    _restartDebounce?.cancel();
    if (!_shouldBeListening) return;
    _restartDebounce = Timer(const Duration(milliseconds: 300), () {
      if (_shouldBeListening) {
        _listenInternal();
      }
    });
  }

  Future<void> pause() async {
    _shouldBeListening = false;
    _restartDebounce?.cancel();
    if (_isListening || _speech.isListening) {
      try {
        await _speech.stop();
      } catch (_) {}
    }
    _isListening = false;
  }

  Future<void> resume() async {
    _shouldBeListening = true;
    await _listenInternal();
  }

  Future<void> stop() async {
    _shouldBeListening = false;
    _restartDebounce?.cancel();
    if (_isListening || _speech.isListening) {
      try {
        await _speech.stop();
      } catch (_) {}
    }
    _isListening = false;
    _currentUtterance = '';
    _finalizedUtterances.clear();
  }

  Future<void> cancel() async {
    _shouldBeListening = false;
    _restartDebounce?.cancel();
    if (_isListening || _speech.isListening) {
      try {
        await _speech.cancel();
      } catch (_) {}
    }
    _isListening = false;
    _currentUtterance = '';
    _finalizedUtterances.clear();
  }

  void dispose() {
    _shouldBeListening = false;
    _restartDebounce?.cancel();
    cancel();
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

    final normalizedText = text
        .replaceAll(r'\r\n', '\n')
        .replaceAll(r'\n', '\n')
        .replaceAll(r'\r', '\n')
        .replaceAll('\\r\\n', '\n')
        .replaceAll('\\n', '\n')
        .replaceAll('\\r', '\n');

    final lines = normalizedText.split('\n');
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

      // Bullet points (•, -, or *)
      if (line.startsWith('• ') || line.startsWith('•') || line.startsWith('- ') || line.startsWith('* ')) {
        final bulletText = line.startsWith('• ')
            ? line.substring(2).trim()
            : line.startsWith('•')
                ? line.substring(1).trim()
                : line.substring(2).trim();
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

      // Itinerary / Day headers (e.g., Día 1: Barranquilla, Itinerario de Viaje...)
      final isDayOrItineraryHeader = RegExp(r'^(?:D[íi]a\s*\d+|Itinerario(?:\s+de\s+Viaje)?)\b', caseSensitive: false).hasMatch(line);
      if (isDayOrItineraryHeader) {
        children.add(
          Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 4),
            child: RichText(
              text: _buildTextSpan(
                line.startsWith('**') ? line : '**$line**',
                textColor,
              ),
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


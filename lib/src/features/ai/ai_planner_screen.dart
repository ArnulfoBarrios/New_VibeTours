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

import '../../core/design/app_theme.dart';
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
    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
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

    ref.read(aiBuilderProvider.notifier).sendMessage(text, imagePath: imagePath, lat: lat, lon: lon);
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

    ref.read(aiBuilderProvider.notifier).sendMessage(
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
                if (builderState.recommendations.isNotEmpty) ...[
                  _buildMapCard(builderState),
                  const SizedBox(height: 16),
                ],

                if (builderState.hotels.isNotEmpty && !builderState.isBuilding && builderState.builtTour == null) ...[
                  _buildHotelsList(builderState.hotels, builderState.selectedHotel),
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

  Widget _buildMapCard(AiBuilderState builderState) {
    final points = builderState.recommendations
        .map((r) => GeoPoint(latitude: r.latitude, longitude: r.longitude))
        .toList();
    final labels = builderState.recommendations.map((r) => r.name).toList();

    return Container(
      key: const ValueKey('ai_planner_map_card'),
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
          key: const ValueKey('ai_planner_openfree_map'),
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
    ).animate().fadeIn().slideY(begin: 0.05);
  }

  Widget _buildHotelsList(List<dynamic> hotels, Map<String, dynamic>? selectedHotel) {
    final isNoneSelected = selectedHotel == null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8.0),
          child: InkWell(
            onTap: () {
              ref.read(aiBuilderProvider.notifier).selectHotel(null);
            },
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isNoneSelected 
                    ? AppTheme.primary.withValues(alpha: 0.08)
                    : Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isNoneSelected 
                      ? AppTheme.primary 
                      : Colors.grey.shade200,
                  width: isNoneSelected ? 2 : 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isNoneSelected ? Icons.check_circle_rounded : Icons.block_rounded,
                    color: isNoneSelected ? AppTheme.primary : Colors.grey,
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('No hospedarme en hotel / Tengo otro alojamiento', style: TextStyle(fontWeight: FontWeight.bold)),
                        SizedBox(height: 4),
                        Text(
                          'Tengo otro lugar para quedarme o iniciaré el recorrido directamente desde la primera parada.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        ...hotels.map((h) {
          final isSelected = selectedHotel?['name'] == h['name'];
          return Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: InkWell(
              onTap: () {
                ref.read(aiBuilderProvider.notifier).selectHotel(Map<String, dynamic>.from(h));
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isSelected 
                      ? AppTheme.primary.withValues(alpha: 0.08)
                      : Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected 
                        ? AppTheme.primary 
                        : Colors.grey.shade200,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      isSelected ? Icons.check_circle_rounded : Icons.hotel,
                      color: isSelected ? AppTheme.primary : Colors.blue,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(h['name'] ?? 'Hotel', style: const TextStyle(fontWeight: FontWeight.bold)),
                          if (h['address'] != null || h['direccion'] != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              h['address']?.toString() ?? h['direccion']?.toString() ?? '',
                              style: TextStyle(
                                fontSize: 12,
                                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ],
    ).animate().fadeIn();
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
                  '¡Hola! Soy Tour Planner AI 🤖\n\nCuéntame qué tipo de tour tienes en mente y crearé una experiencia única para ti.',
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
                      Text(
                        message.text,
                        style: TextStyle(
                          color: isUser ? Colors.white : Theme.of(context).colorScheme.onSurface,
                          fontSize: 15,
                          height: 1.4,
                        ),
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
        if (message.destinationSuggestions != null && message.destinationSuggestions!.isNotEmpty) ...[
          _buildDestinationSuggestionsCarousel(message, isBusy),
        ] else if (message.actionChips != null && message.actionChips!.isNotEmpty) ...[
          const SizedBox(height: 12),
          Padding(
            padding: EdgeInsets.only(left: isUser ? 0 : 40),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: message.actionChips!.map((action) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: Colors.blue.shade200),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                      onPressed: isBusy ? null : () {
                        if (action == 'Ver paradas sugeridas') {
                          context.push('/ai/builder');
                        } else if (action == 'Quiero cambiar lugares') {
                          context.push('/ai/builder');
                        } else if (action == 'Generar Tour Final') {
                          if (_isProcessingAction) return;
                          setState(() => _isProcessingAction = true);
                          ref.read(aiBuilderProvider.notifier).buildTour();
                          if (mounted) setState(() => _isProcessingAction = false);
                        } else {
                          _prompt.text = action;
                          _sendMessage();
                        }
                      },
                      child: Row(
                        children: [
                          Text(action, style: TextStyle(color: Colors.blue.shade700)),
                          const SizedBox(width: 4),
                          Icon(
                            action.contains('Generar') ? Icons.check_circle : 
                            action.contains('cambiar') ? Icons.edit : Icons.map,
                            size: 14,
                            color: Colors.blue.shade700,
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ).animate().fadeIn(delay: 200.ms),
        ]
      ],
    );
  }

  Widget _buildEmbeddedTourCard(Tour tour) {
    return Container(
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
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.bar_chart, size: 12, color: Colors.grey),
                          const SizedBox(width: 4),
                          const Text('Dificultad: Baja', style: TextStyle(fontSize: 12, color: Colors.grey)), 
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
    if (_voicePrompt.isListening) {
      await _stopVoiceInput();
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
    });

    try {
      await _voicePrompt.start(
        localeCode: 'es', 
        onResult: (words) {
          if (!mounted) return;
          _setPromptText(_mergePromptText(_baselinePrompt, words));
        },
        onStatus: (status) {
          if (!mounted) return;
          setState(() {
            if (status == 'listening') {
              _isRecording = true;
              _isStartingVoice = false;
              _voiceFeedback = l10n.voicePromptListening;
              _voiceFeedbackIsError = false;
            } else if (status == 'done' || status == 'notListening') {
              _isRecording = false;
              _isStartingVoice = false;
              if (!_voiceFeedbackIsError) {
                _voiceFeedback = l10n.voicePromptStopped;
              }
            }
          });
        },
        onError: (error) {
          if (!mounted) return;
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

  Future<void> _stopVoiceInput() async {
    final l10n = AppLocalizations.of(context);
    try {
      await _voicePrompt.stop();
    } catch (_) {
      await _voicePrompt.cancel();
    }
    if (!mounted) return;
    setState(() {
      _isRecording = false;
      _isStartingVoice = false;
      _voiceFeedback = l10n.voicePromptStopped;
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

  Widget _buildDestinationSuggestionsCarousel(ChatMessage message, bool isBusy) {
    final suggestions = message.destinationSuggestions!;
    return Padding(
      padding: const EdgeInsets.only(left: 40, top: 12),
      child: SizedBox(
        height: 280,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: suggestions.length,
          itemBuilder: (context, index) {
            final suggestion = suggestions[index];
            final city = suggestion.city;
            final country = suggestion.country;
            final reason = suggestion.reason;
            final imageUrl = suggestion.imageUrl;
            
            final temp = _getDeterministicTemp(city);
            final days = _getDeterministicDays(city);
            final flag = _getCountryFlag(country);

            return Padding(
              padding: const EdgeInsets.only(right: 12.0),
              child: GestureDetector(
                onTap: isBusy ? null : () => _sendChipMessage(displayPrompt: city, aiPrompt: city),
                child: Container(
                  width: 180,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.15),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: Image.network(
                            imageUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Image.network(
                                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80',
                                fit: BoxFit.cover,
                              );
                            },
                          ),
                        ),
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.black.withValues(alpha: 0.1),
                                  Colors.black.withValues(alpha: 0.4),
                                  Colors.black.withValues(alpha: 0.85),
                                ],
                                stops: const [0.0, 0.5, 1.0],
                              ),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Expanded(
                                child: Container(
                                  alignment: Alignment.topLeft,
                                  child: Text(
                                    reason,
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w400,
                                      height: 1.3,
                                      shadows: [
                                        Shadow(
                                          color: Colors.black45,
                                          blurRadius: 4,
                                        ),
                                      ],
                                    ),
                                    maxLines: 4,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '$flag $city',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'Outfit',
                                  shadows: [
                                    Shadow(
                                      color: Colors.black,
                                      blurRadius: 6,
                                    ),
                                  ],
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                country,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.7),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 4,
                                runSpacing: 4,
                                children: [
                                  _buildTag(Icons.calendar_month, '$days días'),
                                  _buildTag(Icons.thermostat, '$temp°'),
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
            );
          },
        ),
      ),
    ).animate().fadeIn(duration: 400.ms).slideX(begin: 0.05, duration: 400.ms);
  }

  Widget _buildTag(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.15),
          width: 0.5,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 9),
          const SizedBox(width: 3),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 9,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  int _getDeterministicTemp(String city) {
    final name = city.toLowerCase();
    if (name.contains('cartagena') || name.contains('santamarta') || name.contains('santa marta') || name.contains('san andres')) return 30;
    if (name.contains('bogota') || name.contains('bogotá')) return 14;
    if (name.contains('medellin') || name.contains('medellín') || name.contains('cali')) return 22;
    final hash = name.codeUnits.fold(0, (prev, element) => prev + element);
    return 15 + (hash % 18);
  }


  int _getDeterministicDays(String city) {
    final name = city.toLowerCase();
    final hash = name.codeUnits.fold(0, (prev, element) => prev + element);
    return 3 + (hash % 4);
  }

  String _getCountryFlag(String country) {
    final name = country.toLowerCase().trim();
    if (name.contains('colombia')) return '🇨🇴';
    if (name.contains('costa rica')) return '🇨🇷';
    if (name.contains('brasil') || name.contains('brazil')) return '🇧🇷';
    if (name.contains('portugal')) return '🇵🇹';
    if (name.contains('españa') || name.contains('spain')) return '🇪🇸';
    if (name.contains('méxico') || name.contains('mexico')) return '🇲🇽';
    if (name.contains('estados unidos') || name.contains('usa') || name.contains('united states')) return '🇺🇸';
    if (name.contains('francia') || name.contains('france')) return '🇫🇷';
    if (name.contains('italia') || name.contains('italy')) return '🇮🇹';
    if (name.contains('japón') || name.contains('japan')) return '🇯🇵';
    if (name.contains('argentina')) return '🇦🇷';
    if (name.contains('perú') || name.contains('peru')) return '🇵🇪';
    return '📍';
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
    required void Function(String words) onResult,
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
      onResult: (result) => onResult(result.recognizedWords),
      listenOptions: SpeechListenOptions(
        partialResults: true,
        cancelOnError: true,
        listenMode: ListenMode.dictation,
        localeId: localeId,
        listenFor: const Duration(seconds: 45),
        pauseFor: const Duration(seconds: 3),
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

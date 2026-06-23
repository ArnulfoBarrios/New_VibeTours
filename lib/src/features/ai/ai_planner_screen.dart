import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lottie/lottie.dart';
import 'package:speech_to_text/speech_recognition_error.dart';
import 'package:speech_to_text/speech_to_text.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';

class AiPlannerScreen extends ConsumerStatefulWidget {
  const AiPlannerScreen({super.key});

  @override
  ConsumerState<AiPlannerScreen> createState() => _AiPlannerScreenState();
}

class _AiPlannerScreenState extends ConsumerState<AiPlannerScreen>
    with WidgetsBindingObserver {
  final _destination = TextEditingController(text: 'Centro historico');
  final _country = TextEditingController(text: 'Colombia');
  final _city = TextEditingController(text: 'Cartagena');
  final _prompt = TextEditingController();
  final _voicePrompt = _VoicePromptSession();
  double _duration = 4;
  bool _isDays = false;
  double _hoursPerDay = 8;
  TourType _type = TourType.cultural;
  String _language = 'es';
  bool _isRecording = false;
  bool _isStartingVoice = false;
  String? _voiceFeedback;
  bool _voiceFeedbackIsError = false;
  String _baselinePrompt = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    unawaited(_voicePrompt.dispose());
    _destination.dispose();
    _country.dispose();
    _city.dispose();
    _prompt.dispose();
    super.dispose();
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

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final aiState = ref.watch(aiPlannerControllerProvider);
    final remaining = ref.watch(guestAiRemainingProvider);
    final user = ref.watch(authUserProvider).valueOrNull;
    final name = user?.userMetadata?['full_name']?.toString().split(' ').first ?? 'Arnulfo';

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          children: [
            const _HeaderCollage(),
            const SizedBox(height: 24),
            Text(
              'Hola $name,\n¿qué quieres\nexperimentar?',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.displayLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    fontSize: 36,
                  ),
            ).animate().fadeIn().slideY(begin: 0.1),
            if (user == null) ...[
              const SizedBox(height: 8),
              Text(
                l10n.guestLimit(remaining),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
              ),
            ],
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _country,
                    decoration: InputDecoration(
                      labelText: l10n.country,
                      prefixIcon: const Icon(Icons.public_rounded),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _city,
                    decoration: InputDecoration(
                      labelText: l10n.city,
                      prefixIcon: const Icon(Icons.location_city_rounded),
                    ),
                  ),
                ),
              ],
            ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: _prompt,
                    minLines: 3,
                    maxLines: 5,
                    textInputAction: TextInputAction.newline,
                    decoration: InputDecoration(
                      hintText: l10n.freePrompt,
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      filled: false,
                    ),
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Theme.of(context).colorScheme.onSurface,
                          height: 1.4,
                        ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _VoicePromptButton(
                        isRecording: _isRecording,
                        isBusy: _isStartingVoice,
                        onPressed: _toggleVoiceInput,
                      ),
                      GestureDetector(
                        onTap: aiState.isLoading ? null : _generate,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.3),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Row(
                            children: [
                              Text(
                                'Comenzar',
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.onSurface,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Icon(
                                Icons.arrow_forward_rounded,
                                size: 18,
                                color: Theme.of(context).colorScheme.onSurface,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ).animate().fadeIn(delay: 150.ms).slideY(begin: 0.1),
            AnimatedSwitcher(
              duration: 220.ms,
              child: _voiceFeedback == null
                  ? const SizedBox(height: 8)
                  : Padding(
                      key: ValueKey(_voiceFeedback),
                      padding: const EdgeInsets.only(top: 10),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            _voiceFeedbackIsError
                                ? Icons.error_outline_rounded
                                : _isRecording
                                    ? Icons.graphic_eq_rounded
                                    : Icons.info_outline_rounded,
                            size: 18,
                            color: _voiceFeedbackIsError
                                ? Theme.of(context).colorScheme.error
                                : _isRecording
                                    ? AppTheme.primary
                                    : Theme.of(context).colorScheme.outline,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _voiceFeedback!,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: _voiceFeedbackIsError
                                        ? Theme.of(context).colorScheme.error
                                        : _isRecording
                                            ? AppTheme.primary
                                            : Theme.of(context).colorScheme.outline,
                                  ),
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
            const SizedBox(height: 16),
            ExpansionTile(
              title: const Text('Opciones avanzadas', style: TextStyle(fontWeight: FontWeight.w600)),
              collapsedShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              backgroundColor: Theme.of(context).colorScheme.surface,
              collapsedBackgroundColor: Theme.of(context).colorScheme.surface,
              childrenPadding: const EdgeInsets.all(16),
              children: [
                DropdownMenu<TourType>(
                  width: double.infinity,
                  initialSelection: _type,
                  label: Text(l10n.type),
                  onSelected: (value) => setState(() => _type = value!),
                  dropdownMenuEntries: [
                    for (final type in TourType.values) DropdownMenuEntry(value: type, label: tourTypeLabel(type)),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Slider(
                        value: _duration,
                        min: _isDays ? 1 : 2,
                        max: _isDays ? 14 : 12,
                        divisions: _isDays ? 13 : 10,
                        label: '${_duration.toStringAsFixed(0)} ${_isDays ? 'dias' : 'h'}',
                        onChanged: (value) => setState(() => _duration = value),
                      ),
                    ),
                    Text('${_duration.toStringAsFixed(0)} ${_isDays ? 'd' : 'h'}'),
                    const SizedBox(width: 12),
                    SegmentedButton<bool>(
                      selected: {_isDays},
                      onSelectionChanged: (value) => setState(() {
                        _isDays = value.first;
                        _duration = _isDays ? 2 : 4;
                      }),
                      segments: const [
                        ButtonSegment(value: false, label: Text('h')),
                        ButtonSegment(value: true, label: Text('d')),
                      ],
                    ),
                  ],
                ),
                if (_isDays) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Slider(
                          value: _hoursPerDay,
                          min: 2,
                          max: 16,
                          divisions: 14,
                          label: '${_hoursPerDay.toStringAsFixed(0)} h/dia',
                          onChanged: (value) => setState(() => _hoursPerDay = value),
                        ),
                      ),
                      Text('${_hoursPerDay.toStringAsFixed(0)} h/dia'),
                    ],
                  ),
                ],
                const SizedBox(height: 12),
                SegmentedButton<String>(
                  selected: {_language},
                  onSelectionChanged: (value) => setState(() => _language = value.first),
                  segments: const [
                    ButtonSegment(value: 'es', label: Text('ES')),
                    ButtonSegment(value: 'en', label: Text('EN')),
                  ],
                ),
              ],
            ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),
            const SizedBox(height: 24),
            GlassPanel(
              child: Row(
                children: [
                  const Icon(Icons.radar_rounded, color: AppTheme.violet),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Detectamos: ${_city.text}, ${_country.text} · ${tourTypeLabel(_type)} · ${_duration.toStringAsFixed(0)} ${_isDays ? 'dias (${_hoursPerDay.toStringAsFixed(0)}h/d)' : 'h'}',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (aiState.isLoading) _GenerationProgress(l10n: l10n),
            aiState.when(
              data: (tour) => tour == null
                  ? const SizedBox.shrink()
                  : Padding(
                      padding: const EdgeInsets.only(top: 18),
                      child: Column(
                        children: [
                          TourCard(
                            tour: tour,
                            onTap: () {
                              ref.read(selectedTourProvider.notifier).state = tour;
                              context.push('/tours/${tour.id}');
                            },
                          ),
                          const SizedBox(height: 12),
                          _AiJsonPreview(tour: tour),
                          const SizedBox(height: 12),
                          LiquidButton(
                            label: 'Guardar tour',
                            icon: Icons.save_rounded,
                            onPressed: () async {
                              try {
                                await ref.read(userToursProvider.notifier).saveTour(tour);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Tour guardado exitosamente')),
                                  );
                                }
                              } catch (e) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Error al guardar: $e')),
                                  );
                                }
                              }
                            },
                          ),
                          const SizedBox(height: 12),
                          LiquidButton(
                            label: 'Previsualizar tour',
                            icon: Icons.visibility_rounded,
                            onPressed: () {
                              ref.read(selectedTourProvider.notifier).state = tour;
                              context.push('/tours/${tour.id}');
                            },
                          ),
                          const SizedBox(height: 12),
                          LiquidButton(
                            label: 'Editar tour',
                            icon: Icons.edit_rounded,
                            onPressed: () {
                              ref.read(selectedTourProvider.notifier).state = tour;
                              context.push('/creator/manual');
                            },
                          ),
                        ],
                      ),
                    ),
              loading: () => const SizedBox.shrink(),
              error: (error, stackTrace) => Padding(
                padding: const EdgeInsets.only(top: 16),
                child: EmptyState(
                  icon: Icons.lock_clock_rounded,
                  title: 'Demo agotada',
                  body: error.toString(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _generate() {
    final profile = ref.read(touristProfileProvider);
    final finalPrompt = _isDays
        ? 'El tour durara ${_duration.toInt()} dias, considerando ${_hoursPerDay.toInt()} horas habiles de actividad por dia. ${_prompt.text}'.trim()
        : _prompt.text;
    ref
        .read(aiPlannerControllerProvider.notifier)
        .generate(
          AiTourRequest(
            destination: _destination.text,
            country: _country.text,
            city: _city.text,
            durationHours: _isDays ? _duration * 24 : _duration,
            type: _type,
            language: _language,
            prompt: finalPrompt,
            touristProfileSummary: profile.aiSummary,
            touristInterests: profile.interests,
            touristPace: profile.preferredPace,
          ),
        );
  }

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
        localeCode: _language,
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
          ScaffoldMessenger.of(context)
            ..clearSnackBars()
            ..showSnackBar(SnackBar(content: Text(message)));
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
      ScaffoldMessenger.of(context)
        ..clearSnackBars()
        ..showSnackBar(SnackBar(content: Text(message)));
    } catch (_) {
      if (!mounted) return;
      final message = l10n.voicePromptError;
      setState(() {
        _isRecording = false;
        _isStartingVoice = false;
        _voiceFeedback = message;
        _voiceFeedbackIsError = true;
      });
      ScaffoldMessenger.of(context)
        ..clearSnackBars()
        ..showSnackBar(SnackBar(content: Text(message)));
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

  String _voiceErrorMessage(
    AppLocalizations l10n,
    SpeechRecognitionError error,
  ) {
    final code = error.errorMsg.toLowerCase();
    if (code.contains('permission')) return l10n.voicePromptPermissionDenied;
    if (code.contains('speech_recognizer_disabled') ||
        code.contains('not_available')) {
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
    final colorScheme = Theme.of(context).colorScheme;
    final active = widget.isRecording;
    final busy = widget.isBusy;
    final background = active
        ? AppTheme.primary.withValues(alpha: 0.18)
        : colorScheme.surfaceContainerHighest.withValues(alpha: 0.92);
    final foreground = active ? AppTheme.primary : colorScheme.onSurfaceVariant;

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
              border: Border.all(
                color: active
                    ? AppTheme.primary.withValues(alpha: 0.45)
                    : colorScheme.outlineVariant.withValues(alpha: 0.7),
              ),
              boxShadow: active
                  ? [
                      BoxShadow(
                        color: AppTheme.primary.withValues(alpha: 0.22),
                        blurRadius: 18,
                        spreadRadius: 1,
                      ),
                    ]
                  : null,
            ),
            child: IconButton(
              tooltip: active ? 'Detener grabacion' : 'Activar voz',
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
      options: [
        SpeechToText.androidNoBluetooth,
        SpeechToText.iosNoBluetooth,
      ],
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
      // Fall back to a common locale below.
    }
    return languageCode == 'en' ? 'en_US' : 'es_ES';
  }
}

class _AiJsonPreview extends StatelessWidget {
  const _AiJsonPreview({required this.tour});

  final Tour tour;

  @override
  Widget build(BuildContext context) {
    final jsonPreview = const JsonEncoder.withIndent(
      '  ',
    ).convert(tour.toCreationJson());
    return GlassPanel(
      padding: const EdgeInsets.all(14),
      child: ExpansionTile(
        tilePadding: EdgeInsets.zero,
        childrenPadding: EdgeInsets.zero,
        title: const Text('JSON de creacion IA'),
        leading: const Icon(Icons.data_object_rounded),
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.28),
              borderRadius: BorderRadius.circular(16),
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
    );
  }
}

class _GenerationProgress extends StatelessWidget {
  const _GenerationProgress({required this.l10n});

  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final steps = [
      l10n.generatingDestination,
      l10n.generatingPlaces,
      l10n.generatingRoute,
      l10n.generatingImages,
      l10n.generatingExperience,
    ];
    return GlassPanel(
      margin: const EdgeInsets.only(top: 18),
      child: Column(
        children: [
          SizedBox(
            height: 130,
            child: Lottie.asset('assets/lottie/ai_pulse.json'),
          ),
          Text(
            l10n.generatingTitle,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          for (final step in steps)
            ListTile(
                  dense: true,
                  leading: const Icon(
                    Icons.blur_circular_rounded,
                    color: AppTheme.primary,
                  ),
                  title: Text(step),
                )
                .animate(onPlay: (controller) => controller.repeat())
                .shimmer(
                  duration: 1300.ms,
                  color: AppTheme.primary.withValues(alpha: 0.25),
                ),
        ],
      ),
    );
  }
}

class _HeaderCollage extends StatelessWidget {
  const _HeaderCollage();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 120,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            left: MediaQuery.of(context).size.width / 2 - 110,
            top: 20,
            child: Transform.rotate(
              angle: -0.2,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: 80,
                  height: 80,
                  color: Colors.grey.shade300,
                  child: Image.network(
                    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=300&q=80',
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          ).animate().fadeIn().slideX(begin: 0.2),
          Positioned(
            right: MediaQuery.of(context).size.width / 2 - 110,
            top: 20,
            child: Transform.rotate(
              angle: 0.2,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: 80,
                  height: 80,
                  color: Colors.grey.shade300,
                  child: Image.network(
                    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=300&q=80',
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          ).animate().fadeIn().slideX(begin: -0.2),
          Positioned(
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 4),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipOval(
                child: Image.network(
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ).animate().fadeIn().scale(begin: const Offset(0.8, 0.8)),
        ],
      ),
    );
  }
}

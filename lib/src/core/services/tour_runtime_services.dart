import 'dart:async';
import 'dart:convert';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:speech_to_text/speech_to_text.dart';

import '../config/app_config.dart';
import '../utils/tour_guide_formatter.dart';
import '../../domain/models.dart';
import 'sqlite-service.dart';

enum LocationSamplingMode {
  walking,
  stationary,
  batterySaver,
}

class LocationService {
  LocationService(this._prefs);
  final SharedPreferences _prefs;
  
  static const String _disclosureKey = 'vibetours_location_disclosure_accepted';

  bool get hasAcceptedDisclosure => _prefs.getBool(_disclosureKey) ?? false;

  Future<void> acceptDisclosure() async {
    await _prefs.setBool(_disclosureKey, true);
  }

  Future<Position?> currentPosition() async {
    final ready = await _ensureLocationReady();
    if (!ready) {
      return null;
    }
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.best),
    );
  }

  Future<Stream<Position>?> positionStream({
    int distanceFilterMeters = 0,
    LocationSamplingMode mode = LocationSamplingMode.walking,
  }) async {
    final ready = await _ensureLocationReady();
    if (!ready) return null;

    final LocationSettings settings;
    if (defaultTargetPlatform == TargetPlatform.android) {
      settings = AndroidSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: distanceFilterMeters,
        intervalDuration: const Duration(milliseconds: 500),
        forceLocationManager: false,
      );
    } else if (defaultTargetPlatform == TargetPlatform.iOS || defaultTargetPlatform == TargetPlatform.macOS) {
      settings = AppleSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: distanceFilterMeters,
        activityType: ActivityType.fitness,
        pauseLocationUpdatesAutomatically: false,
        showBackgroundLocationIndicator: false,
      );
    } else {
      settings = LocationSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: distanceFilterMeters,
      );
    }

    return Geolocator.getPositionStream(locationSettings: settings);
  }

  double distanceBetween(GeoPoint a, GeoPoint b) => Geolocator.distanceBetween(
    a.latitude,
    a.longitude,
    b.latitude,
    b.longitude,
  );

  Future<bool> _ensureLocationReady() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) return false;
    
    // Ya NO solicitamos permisos automáticamente aquí. 
    // Solo comprobamos si existen. Si no, devolvemos false.
    final permission = await Geolocator.checkPermission();
    return permission == LocationPermission.always || 
           permission == LocationPermission.whileInUse;
  }

  Future<bool> requestPermissionExplicitly() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission == LocationPermission.always || 
           permission == LocationPermission.whileInUse;
  }
}

class VoiceGuideService {
  VoiceGuideService(this._sqliteService) {
    _initTts();
  }

  final SqliteService _sqliteService;
  final FlutterTts _tts = FlutterTts();
  final AudioPlayer _audioPlayer = AudioPlayer();
  final SpeechToText _speech = SpeechToText();
  double _currentMultiplier = 1.0;
  String _selectedOpenAiVoice = 'nova';

  // In-memory cache for synthesized speech MP3 bytes
  static final Map<String, Uint8List> _speechMemoryCache = {};

  double get currentMultiplier => _currentMultiplier;
  String get selectedOpenAiVoice => _selectedOpenAiVoice;

  void setOpenAiVoice(String voice) {
    final lower = voice.toLowerCase();
    if (['nova', 'shimmer', 'alloy', 'onyx', 'echo', 'fable'].contains(lower)) {
      _selectedOpenAiVoice = lower;
    }
  }

  Future<void> _initTts() async {
    try {
      if (defaultTargetPlatform == TargetPlatform.android) {
        final engines = await _tts.getEngines;
        if (engines is List && engines.contains("com.google.android.tts")) {
          await _tts.setEngine("com.google.android.tts");
        }
      }
    } catch (e) {
      debugPrint('TTS engine setting note: $e');
    }
    await setLanguage('es');
    await setSpeedMultiplier(1.0);
    await _tts.setPitch(1.0); // Natural human pitch
  }

  Future<void> setLanguage(String lang) async {
    final ttsLang = (lang.toLowerCase() == 'en' || lang.toLowerCase().startsWith('en'))
        ? 'en-US'
        : 'es-ES';
    await _tts.setLanguage(ttsLang);
    try {
      final voices = await _tts.getVoices;
      if (voices is List && voices.isNotEmpty) {
        Map<String, String>? bestVoice;
        int bestScore = -1;

        for (final voice in voices) {
          if (voice is Map) {
            final name = voice['name']?.toString().toLowerCase() ?? '';
            final locale = voice['locale']?.toString().toLowerCase().replaceAll('_', '-') ?? '';

            final targetLangPrefix = ttsLang.split('-').first.toLowerCase();
            if (!locale.startsWith(targetLangPrefix)) continue;

            int score = 0;
            if (locale == ttsLang.toLowerCase()) score += 10;
            if (name.contains('network') || name.contains('neural') || name.contains('wavenet') || name.contains('natural') || name.contains('premium')) {
              score += 20;
            }
            if (name.contains('female') || name.contains('fem') || name.contains('ana') || name.contains('elvira') || name.contains('conchita') || name.contains('marta') || name.contains('sfb') || name.contains('es-es-x-ana') || name.contains('es-us-x-sfb')) {
              score += 25;
            }
            if (name.contains('google')) score += 5;
            if (name.contains('es-es') || name.contains('es_es')) score += 5;

            if (score > bestScore) {
              bestScore = score;
              bestVoice = {
                "name": voice['name'].toString(),
                "locale": voice['locale'].toString(),
              };
            }
          }
        }

        if (bestVoice != null) {
          debugPrint('[VoiceGuide] Voz TTS de alta calidad seleccionada: ${bestVoice['name']} (${bestVoice['locale']}) score: $bestScore');
          await _tts.setVoice(bestVoice);
        }
      }
    } catch (e) {
      debugPrint('TTS voice setting note: $e');
    }
  }

  Future<void> setSpeedMultiplier(double multiplier) async {
    _currentMultiplier = multiplier;
    try {
      await _audioPlayer.setPlaybackRate(multiplier);
    } catch (_) {}
    // Natural speech rate for mobile FlutterTts
    final rawRate = (0.48 * multiplier).clamp(0.2, 1.0);
    await _tts.setSpeechRate(rawRate);
  }

  /// Checks if the audio for a given stop has already been pre-cached.
  bool isStopAudioCached(
    TourStop stop, {
    int stopIndex = 0,
    int totalStops = 1,
    String lang = 'es',
    String? voice,
  }) {
    final script = TourGuideFormatter.formatStopNarration(
      stop,
      stopIndex: stopIndex,
      totalStops: totalStops,
      lang: lang,
    );
    final v = voice ?? _selectedOpenAiVoice;
    final s = _currentMultiplier;
    final cacheKey = 'tts-1_${v}_${s.toStringAsFixed(2)}_$script';
    final elevenKey = 'eleven_${AppConfig.elevenLabsVoiceId}_${s.toStringAsFixed(2)}_$script';
    return _speechMemoryCache.containsKey(cacheKey) || _speechMemoryCache.containsKey(elevenKey);
  }

  /// Pre-caches stop narration audio in the background so it plays with 0 ms latency when reached.
  Future<void> precacheStopAudio(
    TourStop stop, {
    int stopIndex = 0,
    int totalStops = 1,
    String lang = 'es',
    String? voice,
  }) async {
    final script = TourGuideFormatter.formatStopNarration(
      stop,
      stopIndex: stopIndex,
      totalStops: totalStops,
      lang: lang,
    );
    await _fetchSpeechAudio(script, voice: voice, model: 'tts-1');
  }

  /// Pre-caches upcoming tour stops in background (typically the first 2-3 stops).
  Future<void> precacheTourStops(
    List<TourStop> stops, {
    int startIndex = 0,
    int maxCount = 3,
    String lang = 'es',
  }) async {
    if (stops.isEmpty || startIndex >= stops.length) return;
    final end = (startIndex + maxCount).clamp(0, stops.length);
    for (int i = startIndex; i < end; i++) {
      unawaited(
        precacheStopAudio(
          stops[i],
          stopIndex: i,
          totalStops: stops.length,
          lang: lang,
        ),
      );
    }
  }

  Future<Map<String, String>?> fetchWikipediaAndGeocodingDetails(
    double lat,
    double lon, {
    String lang = 'es',
  }) async {
    // 1. Intentar obtener desde la caché local de SQLite
    final cached = await _sqliteService.getWikipediaCache(lat, lon);
    if (cached != null) {
      debugPrint('Retrieved Wikipedia & Nominatim details from local SQLite cache for ($lat, $lon)');
      return cached;
    }

    try {
      String? resolvedName;
      String? resolvedDesc;

      // 1. Photon Reverse Geocoding (Sustituye a Nominatim para evitar 429 Rate Limit)
      final reverseUrl = Uri.parse(
        'https://photon.komoot.io/reverse?lat=$lat&lon=$lon&lang=$lang'
      );
      final reverseRes = await http.get(reverseUrl).timeout(const Duration(seconds: 4));

      if (reverseRes.statusCode == 200) {
        final data = jsonDecode(reverseRes.body) as Map<String, dynamic>;
        final features = data['features'] as List<dynamic>?;
        if (features != null && features.isNotEmpty) {
          final props = (features.first as Map<String, dynamic>)['properties'] as Map<String, dynamic>?;
          if (props != null) {
            resolvedName = props['name']?.toString() ??
                           props['street']?.toString() ??
                           props['district']?.toString() ??
                           props['city']?.toString();
          }
        }
      }

      // 2. Wikipedia Geosearch
      final wikiUrl = Uri.parse(
        'https://$lang.wikipedia.org/w/api.php?action=query&format=json&generator=geosearch'
        '&prop=extracts&exintro=1&explaintext=1&ggscoord=$lat|$lon&ggsradius=1000&ggslimit=1&origin=*'
      );
      final wikiRes = await http.get(wikiUrl).timeout(const Duration(seconds: 4));

      if (wikiRes.statusCode == 200) {
        final wikiData = jsonDecode(wikiRes.body) as Map<String, dynamic>;
        final query = wikiData['query'] as Map<String, dynamic>?;
        final pages = query?['pages'] as Map<String, dynamic>?;
        if (pages != null && pages.isNotEmpty) {
          final page = pages.values.first as Map<String, dynamic>;
          final wikiTitle = page['title']?.toString() ?? '';
          final wikiExtract = page['extract']?.toString() ?? '';

          if (wikiTitle.isNotEmpty) {
            resolvedName = wikiTitle.trim();
          }
          if (wikiExtract.isNotEmpty) {
            resolvedDesc = wikiExtract.trim();
          }
        }
      }

      if ((resolvedName != null && resolvedName.isNotEmpty) || (resolvedDesc != null && resolvedDesc.isNotEmpty)) {
        final name = resolvedName ?? 'Punto de interés';
        final description = resolvedDesc ?? 'Disfruta de esta parada en tu recorrido.';

        // Guardar en la caché de SQLite para futuras consultas
        await _sqliteService.saveWikipediaCache(lat, lon, name, description);

        return {
          'name': name,
          'description': description,
        };
      }
    } catch (e) {
      debugPrint('Error en fetchWikipediaAndGeocodingDetails: $e');
    }
    return null;
  }

  /// Narrates a tour stop with human tour guide storytelling and instant audio start.
  Future<void> narrateStop(
    TourStop stop, {
    int stopIndex = 0,
    int totalStops = 1,
    String lang = 'es',
    void Function(String name, String description)? onResolved,
  }) async {
    // Generate warm, human storytelling script immediately (zero blocking delays)
    final script = TourGuideFormatter.formatStopNarration(
      stop,
      stopIndex: stopIndex,
      totalStops: totalStops,
      lang: lang,
    );

    // If description was empty, resolve Wikipedia metadata asynchronously in the background
    if (onResolved != null && (stop.description.isEmpty || stop.description.length < 20)) {
      unawaited(
        fetchWikipediaAndGeocodingDetails(
          stop.location.latitude,
          stop.location.longitude,
          lang: lang,
        ).then((details) {
          if (details != null && details['description'] != null && details['description']!.length > 20) {
            onResolved(details['name'] ?? stop.name, details['description']!);
          }
        }),
      );
    }

    await speak(script, lang: lang);
  }

  Future<Uint8List?> _fetchSpeechAudio(String text, {String? voice, double? speed, String model = 'tts-1'}) async {
    final v = voice ?? _selectedOpenAiVoice;
    final s = speed ?? _currentMultiplier;
    final cacheKey = '${model}_${v}_${s.toStringAsFixed(2)}_$text';

    if (_speechMemoryCache.containsKey(cacheKey)) {
      return _speechMemoryCache[cacheKey];
    }

    final trimmed = text.trim();
    if (trimmed.isEmpty) return null;

    // 1. Intentar llamada directa a ElevenLabs si API Key está configurada en la app
    final elevenLabsKey = AppConfig.elevenLabsApiKey;
    if (elevenLabsKey.isNotEmpty) {
      try {
        final voiceId = AppConfig.elevenLabsVoiceId;
        final uri = Uri.parse('https://api.elevenlabs.io/v1/text-to-speech/$voiceId');
        final response = await http.post(
          uri,
          headers: {
            'xi-api-key': elevenLabsKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: jsonEncode({
            'text': trimmed,
            'model_id': 'eleven_multilingual_v2',
            'voice_settings': {
              'stability': 0.5,
              'similarity_boost': 0.75,
              'style': 0.3,
              'use_speaker_boost': true,
            },
          }),
        ).timeout(const Duration(seconds: 4));

        if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
          _speechMemoryCache[cacheKey] = response.bodyBytes;
          return response.bodyBytes;
        } else {
          debugPrint('[VoiceGuide] ElevenLabs HTTP ${response.statusCode}: ${response.body}');
        }
      } catch (e) {
        debugPrint('[VoiceGuide] ElevenLabs note: $e');
      }
    }

    // 2. Intentar llamada directa ultra-rápida si OpenAI API Key está configurada en la app
    final openAiKey = AppConfig.openAiApiKey;
    if (openAiKey.isNotEmpty) {
      try {
        final uri = Uri.parse('https://api.openai.com/v1/audio/speech');
        final response = await http.post(
          uri,
          headers: {
            'Authorization': 'Bearer $openAiKey',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({
            'model': model,
            'input': trimmed,
            'voice': v,
            'speed': s.clamp(0.25, 4.0),
            'response_format': 'mp3',
          }),
        ).timeout(const Duration(seconds: 4));

        if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
          _speechMemoryCache[cacheKey] = response.bodyBytes;
          return response.bodyBytes;
        } else {
          debugPrint('[VoiceGuide] OpenAI TTS HTTP ${response.statusCode}: ${response.body}');
        }
      } catch (e) {
        debugPrint('[VoiceGuide] Error en llamada directa a OpenAI TTS: $e');
      }
    }

    // 3. Intentar con la URL base principal configurada en backend
    final mainApiUrl = AppConfig.apiBaseUrl;
    if (mainApiUrl.isNotEmpty) {
      try {
        final uri = Uri.parse('$mainApiUrl/ai/speech');
        final response = await http.post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'text': trimmed,
            'voice': v,
            'speed': s.clamp(0.25, 4.0),
            'model': model,
          }),
        ).timeout(const Duration(seconds: 3));

        if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
          _speechMemoryCache[cacheKey] = response.bodyBytes;
          return response.bodyBytes;
        }
      } catch (e) {
        debugPrint('[VoiceGuide] Backend speech note ($mainApiUrl): $e');
      }
    }

    return null;
  }

  Future<void> speak(String text, {String lang = 'es', String? voice}) async {
    final value = text.trim();
    if (value.isEmpty) return;

    await stop();

    // 1. Intentar reproducir con voz hiperrealista (ElevenLabs / OpenAI TTS)
    try {
      final audioBytes = await _fetchSpeechAudio(value, voice: voice, model: 'tts-1');
      if (audioBytes != null && audioBytes.isNotEmpty) {
        await _audioPlayer.setPlaybackRate(_currentMultiplier);
        await _audioPlayer.play(BytesSource(audioBytes));
        debugPrint('[VoiceGuide] Reproduciendo narración con voz humana de alta fidelidad');
        return;
      }
    } catch (e) {
      debugPrint('[VoiceGuide] Excepción al procesar síntesis de voz en la nube: $e');
    }

    // 2. Fallback offline: motor nativo del dispositivo con FlutterTts optimizado
    try {
      await setLanguage(lang);
      await _tts.speak(value);
      debugPrint('[VoiceGuide] Reproduciendo narración con TTS nativo optimizado (fallback offline)');
    } catch (e) {
      debugPrint('[VoiceGuide] Error al reproducir síntesis de voz nativa: $e');
    }
  }

  Future<void> stop() async {
    try {
      await _audioPlayer.stop();
    } catch (e) {
      debugPrint('[VoiceGuide] Error al detener AudioPlayer: $e');
    }
    try {
      await _tts.stop();
    } catch (e) {
      debugPrint('[VoiceGuide] Error al detener TTS: $e');
    }
  }

  Future<String?> listenCommand({
    void Function(String)? onPartialResult,
    void Function(String)? onError,
  }) async {
    final completer = Completer<String?>();
    String? recognizedWords;

    final ready = await _speech.initialize(
      onError: (errorNotification) {
        debugPrint('Speech STT Error: ${errorNotification.errorMsg} - ${errorNotification.permanent}');
        if (onError != null) onError(errorNotification.errorMsg);
        if (!completer.isCompleted) {
          completer.complete(recognizedWords);
        }
      },
      onStatus: (status) {
        debugPrint('Speech STT Status: $status');
        if (status == 'notListening' || status == 'done') {
          if (!completer.isCompleted) {
            completer.complete(recognizedWords);
          }
        }
      },
    );

    if (!ready) {
      debugPrint('Speech STT could not be initialized.');
      if (onError != null) onError('No se pudo inicializar el micrófono o falta permiso.');
      return null;
    }

    try {
      await _speech.listen(
        onResult: (result) {
          recognizedWords = result.recognizedWords;
          debugPrint('Speech STT onResult: $recognizedWords (final: ${result.finalResult})');
          if (onPartialResult != null) {
            onPartialResult(result.recognizedWords);
          }
          if (result.finalResult && !completer.isCompleted) {
            completer.complete(result.recognizedWords);
          }
        },
        listenOptions: SpeechListenOptions(
          partialResults: true,
          cancelOnError: true,
          listenFor: const Duration(seconds: 8),
          pauseFor: const Duration(seconds: 3),
          localeId: 'es-CO',
        ),
      );
    } catch (e) {
      debugPrint('Speech STT listen call failed: $e');
      if (onError != null) onError('Error al iniciar la escucha.');
      return null;
    }

    // Timeout fallback just in case
    Future.delayed(const Duration(seconds: 9), () {
      if (!completer.isCompleted) {
        _speech.stop();
        completer.complete(recognizedWords);
      }
    });

    return completer.future;
  }
}








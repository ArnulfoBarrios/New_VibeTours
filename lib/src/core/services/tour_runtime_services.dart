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
    int distanceFilterMeters = 12,
    LocationSamplingMode mode = LocationSamplingMode.walking,
  }) async {
    final ready = await _ensureLocationReady();
    if (!ready) return null;

    final LocationSettings settings;
    switch (mode) {
      case LocationSamplingMode.walking:
        settings = LocationSettings(
          accuracy: LocationAccuracy.bestForNavigation,
          distanceFilter: distanceFilterMeters,
        );
        break;
      case LocationSamplingMode.stationary:
        settings = const LocationSettings(
          accuracy: LocationAccuracy.medium,
          distanceFilter: 35,
        );
        break;
      case LocationSamplingMode.batterySaver:
        settings = const LocationSettings(
          accuracy: LocationAccuracy.low,
          distanceFilter: 75,
        );
        break;
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
    await _tts.setPitch(1.04);
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
    // Baseline speech rate for 1.0x is 0.46 on mobile FlutterTts (coincide con el ritmo de la landing page)
    final rawRate = (0.46 * multiplier).clamp(0.2, 1.0);
    await _tts.setSpeechRate(rawRate);
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

  Future<void> narrateStop(
    TourStop stop, {
    String lang = 'es',
    void Function(String name, String description)? onResolved,
  }) async {
    String title = stop.name.replaceAll(RegExp(r'^(Atracci[oó]n(\s*/\s*Restaurante)?|Restaurante|Atracci[oó]n|Lugar|Destino|Punto)\s*:\s*', caseSensitive: false), '').trim();
    String description = stop.description.replaceAll(RegExp(r'^(Atracci[oó]n(\s*/\s*Restaurante)?|Restaurante|Atracci[oó]n|Lugar|Destino|Punto)\s*:\s*', caseSensitive: false), '').trim();

    final isGenericName = title.isEmpty ||
                          title.toLowerCase() == 'parada' ||
                          title.toLowerCase().startsWith('parada ') ||
                          title.toLowerCase().startsWith('atracción del recorrido');

    final isDescriptionEmpty = description.isEmpty ||
                               description.length < 20 ||
                               description.toLowerCase() == 'parada' ||
                               description.toLowerCase() == 'parada turistica' ||
                               description.toLowerCase() == title.toLowerCase();

    if (isGenericName || isDescriptionEmpty) {
      final details = await fetchWikipediaAndGeocodingDetails(
        stop.location.latitude,
        stop.location.longitude,
        lang: lang,
      );

      if (details != null && details['description'] != null && details['description']!.length > 20) {
        title = details['name'] ?? title;
        description = details['description'] ?? description;
        if (onResolved != null) {
          onResolved(title, description);
        }
      }
    }

    if (title.isEmpty || title.toLowerCase() == 'parada') {
      title = 'Atracción del recorrido ${stop.order + 1}';
    }
    if (description.isEmpty || description.toLowerCase() == 'parada' || description.length < 20) {
      description = '$title es uno de los atractivos más emblemáticos y destacados para disfrutar en esta ruta. Tómate un momento para apreciar su historia, ambiente y detalles visuales.';
    }

    await speak('$title. $description', lang: lang);
  }

  Future<Uint8List?> _fetchSpeechAudio(String text, {String? voice, double? speed, String model = 'tts-1-hd'}) async {
    final v = voice ?? _selectedOpenAiVoice;
    final s = speed ?? _currentMultiplier;
    final cacheKey = '${model}_${v}_${s.toStringAsFixed(2)}_$text';

    if (_speechMemoryCache.containsKey(cacheKey)) {
      return _speechMemoryCache[cacheKey];
    }

    final trimmed = text.trim();
    if (trimmed.isEmpty) return null;

    // 1. Intentar llamada directa con OpenAI API Key si está configurada en la app
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
        ).timeout(const Duration(seconds: 12));

        if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
          _speechMemoryCache[cacheKey] = response.bodyBytes;
          return response.bodyBytes;
        }
      } catch (e) {
        debugPrint('[VoiceGuide] Nota en llamada directa a OpenAI TTS: $e');
      }
    }

    // 2. Intentar a través de las rutas del backend (/ai/speech o /ai/tts)
    for (final baseUrl in AppConfig.apiBaseUrls) {
      try {
        final uri = Uri.parse('$baseUrl/ai/speech');
        final response = await http.post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'text': trimmed,
            'voice': v,
            'speed': s.clamp(0.25, 4.0),
            'model': model,
          }),
        ).timeout(const Duration(seconds: 12));

        if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
          _speechMemoryCache[cacheKey] = response.bodyBytes;
          return response.bodyBytes;
        }
      } catch (e) {
        debugPrint('[VoiceGuide] Nota al solicitar audio TTS a $baseUrl: $e');
      }
    }

    return null;
  }

  Future<void> speak(String text, {String lang = 'es', String? voice}) async {
    final value = text.trim();
    if (value.isEmpty) return;

    await stop();

    // 1. Intentar reproducir con voz humana femenina de alta definición (OpenAI TTS HD - Nova)
    try {
      final audioBytes = await _fetchSpeechAudio(value, voice: voice, model: 'tts-1-hd');
      if (audioBytes != null && audioBytes.isNotEmpty) {
        await _audioPlayer.setPlaybackRate(_currentMultiplier);
        await _audioPlayer.play(BytesSource(audioBytes));
        debugPrint('[VoiceGuide] Reproduciendo narración con voz humana femenina OpenAI TTS HD ($selectedOpenAiVoice)');
        return;
      }
    } catch (e) {
      debugPrint('[VoiceGuide] Excepción al procesar OpenAI TTS: $e');
    }

    // 2. Fallback offline: motor nativo del dispositivo con FlutterTts
    try {
      await setLanguage(lang);
      await _tts.speak(value);
      debugPrint('[VoiceGuide] Reproduciendo narración con TTS nativo (fallback)');
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








import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:speech_to_text/speech_to_text.dart';

import '../../domain/models.dart';

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
  }) async {
    final ready = await _ensureLocationReady();
    if (!ready) return null;
    return Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: distanceFilterMeters,
      ),
    );
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
  VoiceGuideService() {
    _tts.setSpeechRate(0.46);
    _tts.setPitch(1.0);
  }

  final FlutterTts _tts = FlutterTts();
  final SpeechToText _speech = SpeechToText();

  Future<Map<String, String>?> fetchWikipediaAndGeocodingDetails(
    double lat,
    double lon, {
    String lang = 'es',
  }) async {
    try {
      String? resolvedName;
      String? resolvedDesc;

      // 1. Nominatim Reverse Geocoding
      final reverseUrl = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=$lat&lon=$lon&zoom=18&accept-language=$lang'
      );
      final reverseRes = await http.get(reverseUrl, headers: {
        'User-Agent': 'VIBETOURS/1.0 contact=ops@vibetours.app'
      }).timeout(const Duration(seconds: 4));

      if (reverseRes.statusCode == 200) {
        final data = jsonDecode(reverseRes.body) as Map<String, dynamic>;
        final address = data['address'] as Map<String, dynamic>?;
        if (address != null) {
          resolvedName = address['attraction']?.toString() ??
                         address['museum']?.toString() ??
                         address['monument']?.toString() ??
                         address['castle']?.toString() ??
                         address['heritage']?.toString() ??
                         address['historic']?.toString() ??
                         address['tourism']?.toString() ??
                         address['amenity']?.toString() ??
                         address['place']?.toString() ??
                         address['shop']?.toString() ??
                         address['hotel']?.toString() ??
                         address['village']?.toString() ??
                         address['suburb']?.toString() ??
                         data['name']?.toString();
        }
        if (resolvedName == null || resolvedName.trim().isEmpty) {
          final displayName = data['display_name']?.toString() ?? '';
          if (displayName.isNotEmpty) {
            resolvedName = displayName.split(',').first.trim();
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
        return {
          'name': resolvedName ?? 'Punto de interés',
          'description': resolvedDesc ?? 'Disfruta de esta parada en tu recorrido.',
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
    String title = stop.name.trim();
    String description = stop.description.trim();

    final isGenericName = title.isEmpty ||
                          title.toLowerCase() == 'parada' ||
                          title.toLowerCase().startsWith('parada ') ||
                          title.toLowerCase().startsWith('atracción del recorrido');

    final isDescriptionEmpty = description.isEmpty ||
                               description.toLowerCase() == 'parada' ||
                               description.toLowerCase() == 'parada turistica';

    if (isGenericName || isDescriptionEmpty) {
      final details = await fetchWikipediaAndGeocodingDetails(
        stop.location.latitude,
        stop.location.longitude,
        lang: lang,
      );

      if (details != null) {
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
    if (description.isEmpty || description.toLowerCase() == 'parada') {
      description = 'Hemos llegado a un punto de interés especial en nuestra ruta. Disfruta de esta parada en el camino.';
    }

    await speak('$title. $description');
  }

  Future<void> speak(String text) async {
    final value = text.trim();
    if (value.isEmpty) return;
    await _tts.stop();
    await _tts.speak(value);
  }

  Future<void> stop() => _tts.stop();

  Future<String?> listenCommand() async {
    final ready = await _speech.initialize();
    if (!ready) return null;
    String? words;
    await _speech.listen(
      listenOptions: SpeechListenOptions(partialResults: false),
      onResult: (result) => words = result.recognizedWords,
    );
    await Future<void>.delayed(const Duration(seconds: 4));
    await _speech.stop();
    return words;
  }
}








import 'package:flutter_tts/flutter_tts.dart';
import 'package:geolocator/geolocator.dart';
import 'package:speech_to_text/speech_to_text.dart';

import '../../domain/models.dart';

class LocationService {
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
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission != LocationPermission.denied &&
        permission != LocationPermission.deniedForever;
  }
}

class VoiceGuideService {
  VoiceGuideService() {
    _tts.setSpeechRate(0.46);
    _tts.setPitch(1.0);
  }

  final FlutterTts _tts = FlutterTts();
  final SpeechToText _speech = SpeechToText();

  Future<void> narrateStop(TourStop stop) async {
    await _tts.speak('${stop.name}. ${stop.description}');
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

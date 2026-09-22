import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Manages native Android Foreground Service execution during long-running background tasks.
class ForegroundService {
  ForegroundService._();
  static final ForegroundService instance = ForegroundService._();

  static const MethodChannel _channel = MethodChannel('com.vibetours.app/foreground_service');
  bool _isRunning = false;

  bool get isRunning => _isRunning;

  /// Starts the Android Foreground Service to prevent OS suspension and network throttling.
  Future<void> startTourGeneration({
    String title = '✨ Creando tu tour personalizado',
    String message = 'Tour Planner AI está diseñando tu itinerario. Te avisaremos al terminar.',
  }) async {
    if (kIsWeb || !Platform.isAndroid) return;
    try {
      await _channel.invokeMethod('startService', {
        'title': title,
        'message': message,
      });
      _isRunning = true;
      debugPrint('[ForegroundService] Foreground service started successfully.');
    } catch (e) {
      debugPrint('[ForegroundService] Error starting foreground service: $e');
    }
  }

  /// Stops the Android Foreground Service and removes the ongoing notification.
  Future<void> stopTourGeneration() async {
    if (kIsWeb || !Platform.isAndroid) return;
    try {
      await _channel.invokeMethod('stopService');
      _isRunning = false;
      debugPrint('[ForegroundService] Foreground service stopped successfully.');
    } catch (e) {
      debugPrint('[ForegroundService] Error stopping foreground service: $e');
    }
  }
}

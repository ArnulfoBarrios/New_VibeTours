import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AnalyticsService {
  const AnalyticsService();

  FirebaseAnalytics? get _analytics {
    if (Firebase.apps.isEmpty) return null;
    try {
      return FirebaseAnalytics.instance;
    } catch (error) {
      debugPrint('Firebase Analytics instance not available: $error');
      return null;
    }
  }

  Future<void> logEvent({
    required String name,
    Map<String, Object>? parameters,
  }) async {
    final instance = _analytics;
    if (instance == null) return;
    try {
      await instance.logEvent(name: name, parameters: parameters);
    } catch (error) {
      debugPrint('Failed to log event to Firebase Analytics: $error');
    }
  }

  Future<void> logLogin({String? loginMethod}) async {
    final instance = _analytics;
    if (instance == null) return;
    try {
      await instance.logLogin(loginMethod: loginMethod);
    } catch (error) {
      debugPrint('Failed to log login to Firebase Analytics: $error');
    }
  }

  Future<void> logSignUp({required String signUpMethod}) async {
    final instance = _analytics;
    if (instance == null) return;
    try {
      await instance.logSignUp(signUpMethod: signUpMethod);
    } catch (error) {
      debugPrint('Failed to log signup to Firebase Analytics: $error');
    }
  }

  Future<void> logScreenView({required String screenName}) async {
    final instance = _analytics;
    if (instance == null) return;
    try {
      await instance.logScreenView(screenName: screenName);
    } catch (error) {
      debugPrint('Failed to log screen view to Firebase Analytics: $error');
    }
  }
}

final analyticsServiceProvider = Provider<AnalyticsService>((ref) {
  return const AnalyticsService();
});

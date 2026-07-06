import 'dart:ui';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'firebase_options.dart';
import 'src/app.dart';
import 'src/core/config/app_config.dart';
import 'src/core/providers/provider_observer.dart';
import 'src/state/app_state.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  bool isFirebaseInitialized = false;
  try {
    // Initialize Firebase using the generated configurations
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    // Force Crashlytics data collection (useful in debug mode)
    await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(true);
    isFirebaseInitialized = true;
  } catch (error) {
    // Fail gracefully if Firebase cannot be initialized (e.g., config error, service outage)
    debugPrint('Firebase initialization failed: $error');
  }

  if (isFirebaseInitialized) {
    // Setup Crashlytics error recorders for Flutter UI errors
    FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;

    // Setup Crashlytics error recorders for platform/async errors
    final originalOnError = PlatformDispatcher.instance.onError;
    PlatformDispatcher.instance.onError = (error, stack) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      if (originalOnError != null) {
        return originalOnError(error, stack);
      }
      return true;
    };
  }

  await AppConfig.load();
  if (AppConfig.hasSupabase) {
    await Supabase.initialize(
      url: AppConfig.supabaseUrl,
      publishableKey: AppConfig.supabaseAnonKey,
    );
  }

  final prefs = await SharedPreferences.getInstance();
  runApp(
    ProviderScope(
      observers: const [AppProviderObserver()],
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
      ],
      child: const VibeToursApp(),
    ),
  );
}

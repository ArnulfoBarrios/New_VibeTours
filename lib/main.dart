import 'dart:io';
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

/// Custom HttpOverrides to inject a descriptive User-Agent header globally
/// for all HTTP requests, avoiding HTTP 429 / 403 errors from CDNs like Wikimedia.
class AppHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..userAgent = 'VibeTours/1.0.0 (https://vibetours.com; contact@vibetours.com) DartHttpOverrides';
  }
}

Future<void> main() async {
  HttpOverrides.global = AppHttpOverrides();
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
    // Setup Crashlytics error recorders for Flutter UI errors.
    // We filter out common network and image loading exceptions to prevent
    // bloating the Crashlytics dashboard with non-actionable connection errors.
    FlutterError.onError = (FlutterErrorDetails details) {
      final exception = details.exception;
      final exceptionStr = exception.toString();
      if (exception is HttpException ||
          exception is SocketException ||
          exception is HandshakeException ||
          exceptionStr.contains('HttpException') ||
          exceptionStr.contains('SocketException') ||
          exceptionStr.contains('HandshakeException') ||
          exceptionStr.contains('NetworkImage') ||
          details.silent) {
        debugPrint('Ignored network/image error for Crashlytics: $exception');
        return;
      }
      FirebaseCrashlytics.instance.recordFlutterFatalError(details);
    };

    // Setup Crashlytics error recorders for platform/async errors.
    // Similarly, filter out common network and image exceptions.
    final originalOnError = PlatformDispatcher.instance.onError;
    PlatformDispatcher.instance.onError = (error, stack) {
      final errorStr = error.toString();
      if (error is HttpException ||
          error is SocketException ||
          error is HandshakeException ||
          errorStr.contains('HttpException') ||
          errorStr.contains('SocketException') ||
          errorStr.contains('HandshakeException') ||
          errorStr.contains('NetworkImage')) {
        debugPrint('Ignored network/image async error for Crashlytics: $error');
        return true;
      }
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

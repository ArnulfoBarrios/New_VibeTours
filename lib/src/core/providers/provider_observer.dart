import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AppProviderObserver extends ProviderObserver {
  const AppProviderObserver();

  @override
  void didUpdateProvider(
    ProviderBase<Object?> provider,
    Object? previousValue,
    Object? newValue,
    ProviderContainer container,
  ) {
    if (newValue is AsyncError) {
      try {
        if (Firebase.apps.isNotEmpty) {
          FirebaseCrashlytics.instance.recordError(
            newValue.error,
            newValue.stackTrace,
            reason: 'Provider ${provider.name ?? provider.runtimeType} threw an error',
          );
        }
      } catch (error) {
        debugPrint('Failed to log provider error to Crashlytics: $error');
      }
    }
  }
}

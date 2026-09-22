import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/design/app_theme.dart';
import 'core/services/notification_service.dart';
import 'l10n/generated/app_localizations.dart';
import 'router.dart';
import 'state/app_state.dart';

class VibeToursApp extends ConsumerStatefulWidget {
  const VibeToursApp({super.key});

  @override
  ConsumerState<VibeToursApp> createState() => _VibeToursAppState();
}

class _VibeToursAppState extends ConsumerState<VibeToursApp> {
  StreamSubscription<String>? _notificationSubscription;

  @override
  void initState() {
    super.initState();
    _notificationSubscription = NotificationService.instance.onNotificationTap.listen(_handleNotificationTap);
  }

  @override
  void dispose() {
    _notificationSubscription?.cancel();
    super.dispose();
  }

  void _handleNotificationTap(String payload) {
    debugPrint('[VibeToursApp] Interacción con notificación: $payload');
    try {
      final router = ref.read(routerProvider);
      if (payload.startsWith('tour:')) {
        final tourId = payload.replaceFirst('tour:', '');
        if (tourId.isNotEmpty) {
          router.push('/tours/$tourId');
        }
      } else if (payload.startsWith('screen:')) {
        final screen = payload.replaceFirst('screen:', '');
        if (screen.isNotEmpty) {
          router.go(screen);
        }
      } else if (payload.startsWith('live:')) {
        final tourId = payload.replaceFirst('live:', '');
        if (tourId.isNotEmpty) {
          router.push('/live/$tourId');
        }
      }
    } catch (e) {
      debugPrint('[VibeToursApp] Error navegando desde notificación: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'VIBETOURS',
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ref.watch(themeModeProvider),
      locale: ref.watch(localeProvider) ?? const Locale('es'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      routerConfig: ref.watch(routerProvider),
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            boldText: false,
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}

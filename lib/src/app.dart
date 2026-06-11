import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/design/app_theme.dart';
import 'l10n/generated/app_localizations.dart';
import 'router.dart';
import 'state/app_state.dart';

class VibeToursApp extends ConsumerWidget {
  const VibeToursApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'VIBETOURS',
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ref.watch(themeModeProvider),
      locale: ref.watch(localeProvider),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      routerConfig: ref.watch(routerProvider),
      builder: (context, child) {
        final highRefresh = ref.watch(highRefreshRateProvider);
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            boldText: false,
            navigationMode: highRefresh
                ? NavigationMode.directional
                : NavigationMode.traditional,
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}

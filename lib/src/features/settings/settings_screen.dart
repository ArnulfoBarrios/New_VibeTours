import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/design/premium_components.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final themeMode = ref.watch(themeModeProvider);
    final locale = ref.watch(localeProvider);
    final highRefresh = ref.watch(highRefreshRateProvider);
    final notifications = ref.watch(notificationsEnabledProvider);
    final mapStyle = ref.watch(mapStyleProvider);
    final auth = ref.watch(authServiceProvider);
    final currentUser = ref.watch(authUserProvider).valueOrNull;
    final isAdmin = ref.watch(isAdminProvider);
    final content = ListView(
      padding: EdgeInsets.fromLTRB(20, 10, 20, embedded ? 120 : 30),
      children: [
        Row(
          children: [
            if (!embedded) ...[
              IconButton.filledTonal(
                onPressed: () =>
                    context.canPop() ? context.pop() : context.go('/home'),
                icon: const Icon(Icons.arrow_back_rounded),
              ),
              const SizedBox(width: 10),
            ],
            Text(
              l10n.settings,
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
        const SizedBox(height: 18),
        GlassPanel(
          child: Column(
            children: [
              _SettingsTile(
                title: l10n.language,
                subtitle: locale?.languageCode.toUpperCase() ?? 'Sistema',
                trailing: SegmentedButton<String>(
                  selected: {locale?.languageCode ?? 'system'},
                  onSelectionChanged: (value) {
                    final selected = value.first;
                    ref.read(localeProvider.notifier).state =
                        selected == 'system' ? null : Locale(selected);
                  },
                  segments: const [
                    ButtonSegment(value: 'system', label: Text('Auto')),
                    ButtonSegment(value: 'es', label: Text('ES')),
                    ButtonSegment(value: 'en', label: Text('EN')),
                  ],
                ),
              ),
              _SettingsTile(
                title: l10n.appearance,
                subtitle: themeMode.name,
                trailing: DropdownButton<ThemeMode>(
                  value: themeMode,
                  onChanged: (value) {
                    if (value == null) return;
                    ref.read(themeModeProvider.notifier).state = value;
                  },
                  items: const [
                    DropdownMenuItem(
                      value: ThemeMode.system,
                      child: Text('Sistema'),
                    ),
                    DropdownMenuItem(
                      value: ThemeMode.light,
                      child: Text('Claro'),
                    ),
                    DropdownMenuItem(
                      value: ThemeMode.dark,
                      child: Text('Oscuro'),
                    ),
                  ],
                ),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('60Hz / 120Hz'),
                subtitle: Text(highRefresh ? '120Hz preferido' : '60Hz ahorro'),
                value: highRefresh,
                onChanged: (value) =>
                    ref.read(highRefreshRateProvider.notifier).state = value,
              ),
              _SettingsTile(
                title: l10n.mapPreference,
                subtitle: _mapStyleLabel(mapStyle),
                trailing: const Icon(Icons.map_rounded),
                onTap: () => _showMapStyleSheet(context, ref),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.notifications),
                subtitle: const Text('Tours, eventos, recomendaciones'),
                value: notifications,
                onChanged: (value) =>
                    ref.read(notificationsEnabledProvider.notifier).state =
                        value,
                secondary: const Icon(Icons.notifications_active_rounded),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        GlassPanel(
          child: Column(
            children: [
              _SettingsTile(
                title: l10n.helpCenter,
                subtitle: 'FAQ, soporte y guias',
                trailing: const Icon(Icons.help_rounded),
                onTap: () => context.push('/help'),
              ),
              _SettingsTile(
                title: 'PQRS',
                subtitle: 'Peticiones, quejas, reclamos y sugerencias',
                trailing: const Icon(Icons.support_agent_rounded),
                onTap: () => context.push('/pqrs'),
              ),
              if (isAdmin)
                _SettingsTile(
                  title: 'Administrador',
                  subtitle: 'Aprobar tours y responder PQRS',
                  trailing: const Icon(Icons.admin_panel_settings_rounded),
                  onTap: () => context.push('/admin'),
                ),
              _SettingsTile(
                title: l10n.privacy,
                subtitle: 'Datos, ubicacion y recomendaciones',
                trailing: const Icon(Icons.privacy_tip_rounded),
                onTap: () => context.push('/legal/privacy'),
              ),
              _SettingsTile(
                title: l10n.terms,
                subtitle: 'Uso responsable de rutas e IA',
                trailing: const Icon(Icons.description_rounded),
                onTap: () => context.push('/legal/terms'),
              ),
              _SettingsTile(
                title: l10n.rateApp,
                subtitle: 'Comparte tu experiencia',
                trailing: const Icon(Icons.star_rate_rounded),
                onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Gracias por ayudar a mejorar VIBETOURS.'),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        LiquidButton(
          label: currentUser == null ? l10n.login : l10n.logout,
          icon: currentUser == null
              ? Icons.login_rounded
              : Icons.logout_rounded,
          onPressed: () async {
            try {
              if (currentUser == null) {
                context.push('/login');
              } else {
                await auth.signOut();
              }
            } catch (error) {
              if (!context.mounted) return;
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(SnackBar(content: Text(_authErrorMessage(error))));
            }
          },
        ),
      ],
    );

    if (embedded) return content;
    return PremiumScaffold(safeBottom: true, child: content);
  }

  String _authErrorMessage(Object error) {
    if (!AppConfig.hasSupabase) {
      return 'Falta configurar SUPABASE_URL y SUPABASE_ANON_KEY para login real.';
    }
    return error.toString();
  }

  String _mapStyleLabel(String value) {
    if (value.contains('openfreemap')) return 'OpenFreeMap';
    return 'Estandar';
  }

  void _showMapStyleSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.map_rounded),
              title: const Text('OpenFreeMap Liberty'),
              onTap: () {
                ref.read(mapStyleProvider.notifier).state =
                    'https://tiles.openfreemap.org/styles/liberty';
                Navigator.of(context).pop();
              },
            ),
          ],
        ),
      ),
    );
  }


}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.title,
    required this.subtitle,
    required this.trailing,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final Widget trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: trailing,
      onTap: onTap,
    );
  }
}

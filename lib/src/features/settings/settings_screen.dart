import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final highRefresh = ref.watch(highRefreshRateProvider);
    final notifications = ref.watch(notificationsEnabledProvider);
    final mapStyleOption = ref.watch(mapStyleOptionProvider);
    final isAdmin = ref.watch(isAdminProvider);
    
    final content = ListView(
      padding: EdgeInsets.fromLTRB(16, 16, 16, embedded ? 120 : 30),
      children: [
        Row(
          children: [
            if (!embedded) ...[
              IconButton.filledTonal(
                onPressed: () => context.canPop() ? context.pop() : context.go('/profile'),
                icon: const Icon(Icons.arrow_back_rounded),
              ),
              const SizedBox(width: 10),
            ],
            Text(
              l10n.settings,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        if (isAdmin) ...[
          GlassPanel(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionTitle(l10n.adminSectionAdministration),
                _SettingsListTile(
                  icon: Icons.admin_panel_settings_rounded,
                  iconColor: Colors.redAccent,
                  title: l10n.adminControlPanelTitle,
                  subtitle: l10n.adminControlPanelSubtitle,
                  trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                  onTap: () => context.push('/admin'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
        GlassPanel(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SectionTitle(l10n.adminSectionPerformance),
              _SettingsListTile(
                icon: Icons.speed_rounded,
                iconColor: Colors.deepOrange,
                title: '60Hz / 120Hz',
                subtitle: highRefresh ? l10n.admin120HzPreferred : l10n.admin60HzSaving,
                trailing: Switch(
                  value: highRefresh,
                  onChanged: (value) => ref.read(highRefreshRateProvider.notifier).state = value,
                ),
                onTap: () => ref.read(highRefreshRateProvider.notifier).state = !highRefresh,
              ),
              _SettingsListTile(
                icon: Icons.map_rounded,
                iconColor: Colors.green,
                title: l10n.mapPreference,
                subtitle: _mapStyleLabel(context, mapStyleOption),
                trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                onTap: () => _showMapStyleSheet(context, ref),
              ),
              _SettingsListTile(
                icon: Icons.notifications_active_rounded,
                iconColor: Colors.blueAccent,
                title: l10n.notifications,
                subtitle: l10n.adminToursEventsRecs,
                trailing: Switch(
                  value: notifications,
                  onChanged: (value) => ref.read(notificationsEnabledProvider.notifier).state = value,
                ),
                onTap: () => ref.read(notificationsEnabledProvider.notifier).state = !notifications,
              ),
            ],
          ),
        ),
      ],
    );

    if (embedded) return content;
    return PremiumScaffold(safeBottom: true, child: content);
  }

  String _mapStyleLabel(BuildContext context, MapStyleOption value) {
    final l10n = AppLocalizations.of(context);
    switch (value) {
      case MapStyleOption.auto: return l10n.adminMapAuto;
      case MapStyleOption.day: return l10n.adminMapDay;
      case MapStyleOption.night: return l10n.adminMapNight;
      case MapStyleOption.satellite: return l10n.adminMapSatellite;
    }
  }

  void _showMapStyleSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        final l10n = AppLocalizations.of(context);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 5,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                Text(
                  l10n.adminMapPrefTitle,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 16),
                _buildStyleTile(context, ref, MapStyleOption.auto, l10n.adminMapAuto2, l10n.adminMapAutoSubtitle, Icons.hdr_auto_rounded, Colors.blue),
                _buildStyleTile(context, ref, MapStyleOption.day, l10n.adminMapDay2, l10n.adminMapDaySubtitle, Icons.light_mode_rounded, Colors.orange),
                _buildStyleTile(context, ref, MapStyleOption.night, l10n.adminMapNight2, l10n.adminMapNightSubtitle, Icons.dark_mode_rounded, Colors.indigo),
                _buildStyleTile(context, ref, MapStyleOption.satellite, l10n.adminMapSatellite2, l10n.adminMapSatelliteSubtitle, Icons.satellite_alt_rounded, Colors.teal),
                const SizedBox(height: 12),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStyleTile(
    BuildContext context,
    WidgetRef ref,
    MapStyleOption option,
    String title,
    String subtitle,
    IconData icon,
    Color color,
  ) {
    final current = ref.watch(mapStyleOptionProvider);
    final isSelected = current == option;
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
      trailing: isSelected ? Icon(Icons.check_circle_rounded, color: AppTheme.primary) : null,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: () {
        ref.read(mapStyleOptionProvider.notifier).setOption(option);
        Navigator.of(context).pop();
      },
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
      ),
    );
  }
}

class _SettingsListTile extends StatelessWidget {
  const _SettingsListTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    this.subtitle,
    this.trailing,
    required this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 20, color: iconColor),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ],
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: 8),
              trailing!,
            ],
          ],
        ),
      ),
    );
  }
}

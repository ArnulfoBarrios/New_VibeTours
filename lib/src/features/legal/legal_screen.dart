import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../l10n/generated/app_localizations.dart';

class LegalScreen extends StatelessWidget {
  const LegalScreen({super.key, required this.kind});

  final String kind;

  static const _legalWebBaseUrl = 'https://new-vibe-tours-d2vy.vercel.app/legal';

  bool get _isPrivacy => kind == 'privacy';

  Future<void> _openLegalWeb(BuildContext context) async {
    final tab = _isPrivacy ? 'privacy' : 'terms';
    final uri = Uri.parse('$_legalWebBaseUrl?tab=$tab');
    final l10n = AppLocalizations.of(context);
    try {
      final launched = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.errorOpeningWeb),
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.errorOpeningWeb),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    
    final privacySections = [
      _LegalSection(l10n.privSec1Title, l10n.privSec1Body),
      _LegalSection(l10n.privSec2Title, l10n.privSec2Body),
      _LegalSection(l10n.privSec3Title, l10n.privSec3Body),
      _LegalSection(l10n.privSec4Title, l10n.privSec4Body),
      _LegalSection(l10n.privSec5Title, l10n.privSec5Body),
      _LegalSection(l10n.privSec6Title, l10n.privSec6Body),
      _LegalSection(l10n.privSec7Title, l10n.privSec7Body),
    ];

    final termsSections = [
      _LegalSection(l10n.termsSec1Title, l10n.termsSec1Body),
      _LegalSection(l10n.termsSec2Title, l10n.termsSec2Body),
      _LegalSection(l10n.termsSec3Title, l10n.termsSec3Body),
      _LegalSection(l10n.termsSec4Title, l10n.termsSec4Body),
      _LegalSection(l10n.termsSec5Title, l10n.termsSec5Body),
      _LegalSection(l10n.termsSec6Title, l10n.termsSec6Body),
      _LegalSection(l10n.termsSec7Title, l10n.termsSec7Body),
    ];

    final sections = _isPrivacy ? privacySections : termsSections;
    return PremiumScaffold(
      safeTop: true,
      safeBottom: true,
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                children: [
                  IconButton.filledTonal(
                    onPressed: () => context.canPop()
                        ? context.pop()
                        : context.go('/settings'),
                    icon: const Icon(Icons.arrow_back_rounded),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _isPrivacy
                          ? l10n.legalPrivacyPolicy
                          : l10n.legalTermsConditions,
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: GlassPanel(
              margin: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              radius: 28,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(
                          Icons.verified_user_rounded,
                          color: AppTheme.primary,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isPrivacy
                                  ? l10n.legalPrivacyDesc
                                  : l10n.legalTermsDesc,
                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              l10n.legalWebNotice,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurface
                                        .withValues(alpha: 0.72),
                                    height: 1.35,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.tonalIcon(
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      onPressed: () => _openLegalWeb(context),
                      icon: const Icon(Icons.open_in_new_rounded, size: 18),
                      label: Text(
                        l10n.legalOpenFullWeb,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
            sliver: SliverList.separated(
              itemCount: sections.length,
              separatorBuilder: (context, index) => const SizedBox(height: 14),
              itemBuilder: (context, index) {
                final section = sections[index];
                return GlassPanel(
                  radius: 24,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        section.title,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        section.body,
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
              child: GlassPanel(
                radius: 24,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.info_outline_rounded,
                          color: AppTheme.primary,
                          size: 22,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Atribuciones y Datos Abiertos',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      '• Datos geoespaciales y mapas vectoriales provistos por © OpenStreetMap contributors bajo licencia Open Database License (ODbL).\n'
                      '• Síntesis y datos históricos referenciales provistos por Wikipedia bajo licencia Creative Commons Attribution-ShareAlike (CC BY-SA 4.0).\n'
                      '• Optimización de rutas asistida por TomTom API y OSRM.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                            height: 1.45,
                          ),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () => context.push('/legal/licenses'),
                          icon: const Icon(Icons.code_rounded, size: 18),
                          label: Text(l10n.licensesOpenSourceSection),
                        ),
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () => _openLegalWeb(context),
                          icon: const Icon(Icons.open_in_new_rounded, size: 18),
                          label: Text(l10n.legalOpenFullWeb),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LegalSection {
  const _LegalSection(this.title, this.body);

  final String title;
  final String body;
}

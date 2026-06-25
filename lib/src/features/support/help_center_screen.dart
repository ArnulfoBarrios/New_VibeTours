import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../l10n/generated/app_localizations.dart';

class HelpCenterScreen extends StatefulWidget {
  const HelpCenterScreen({super.key});

  @override
  State<HelpCenterScreen> createState() => _HelpCenterScreenState();
}

class _HelpCenterScreenState extends State<HelpCenterScreen> {
  final ScrollController _scrollController = ScrollController();
  
  // Create GlobalKeys for each section
  final _key1 = GlobalKey();
  final _key2 = GlobalKey();
  final _key3 = GlobalKey();
  final _key4 = GlobalKey();
  final _key5 = GlobalKey();
  final _key6 = GlobalKey();
  final _key7 = GlobalKey();
  final _key8 = GlobalKey();
  final _key9 = GlobalKey();

  void _scrollTo(GlobalKey key) {
    if (key.currentContext != null) {
      Scrollable.ensureVisible(
        key.currentContext!,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
        alignment: 0.0,
      );
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return PremiumScaffold(
      safeBottom: true,
      child: Stack(
        children: [
          Positioned.fill(child: CustomPaint(painter: _SupportGlowPainter(context))),
          Column(
            children: [
              Container(
                padding: const EdgeInsets.fromLTRB(26, 28, 26, 16),
                child: Row(
                  children: [
                    IconButton.filledTonal(
                      onPressed: () => context.canPop() ? context.pop() : context.go('/settings'),
                      icon: const Icon(Icons.arrow_back_rounded),
                    ),
                    const SizedBox(width: 14),
                    Text(
                      l10n.helpGuides,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 16),
                  child: Column(
                    children: [
                      _HeaderCard(l10n: l10n),
                      const SizedBox(height: 24),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _SectionChip(l10n.helpSec1, onTap: () => _scrollTo(_key1)),
                            _SectionChip(l10n.helpSec2, onTap: () => _scrollTo(_key2)),
                            _SectionChip(l10n.helpSec3, onTap: () => _scrollTo(_key3)),
                            _SectionChip(l10n.helpSec4, onTap: () => _scrollTo(_key4)),
                            _SectionChip(l10n.helpSec5, onTap: () => _scrollTo(_key5)),
                            _SectionChip(l10n.helpSec6, onTap: () => _scrollTo(_key6)),
                            _SectionChip(l10n.helpSec7, onTap: () => _scrollTo(_key7)),
                            _SectionChip(l10n.helpSec8, onTap: () => _scrollTo(_key8)),
                            _SectionChip(l10n.helpSec9, onTap: () => _scrollTo(_key9)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      // Sections
                      _InfoCard(
                        key: _key1,
                        title: l10n.helpTitle1,
                        icon: Icons.login_rounded,
                        items: [
                          l10n.helpBody1a,
                          l10n.helpBody1b,
                          l10n.helpBody1c,
                          l10n.helpBody1d,
                        ],
                      ),
                      const SizedBox(height: 20),
                      
                      _InfoCard(
                        key: _key2,
                        title: l10n.helpTitle2,
                        icon: Icons.explore_rounded,
                        items: [
                          l10n.helpBody2a,
                          l10n.helpBody2b,
                          l10n.helpBody2c,
                          l10n.helpBody2d,
                        ],
                      ),
                      const SizedBox(height: 20),
                      
                      _InfoCard(
                        key: _key3,
                        title: l10n.helpTitle3,
                        icon: Icons.tour_rounded,
                        items: [
                          l10n.helpBody3a,
                          l10n.helpBody3b,
                          l10n.helpBody3c,
                        ],
                      ),
                      const SizedBox(height: 20),

                      _InfoCard(
                        key: _key4,
                        title: l10n.helpTitle4,
                        icon: Icons.map_rounded,
                        items: [
                          l10n.helpBody4a,
                          l10n.helpBody4b,
                          l10n.helpBody4c,
                          l10n.helpBody4d,
                        ],
                      ),
                      const SizedBox(height: 20),
                      
                      _InfoCard(
                        key: _key5,
                        title: l10n.helpTitle5,
                        icon: Icons.add_location_alt_rounded,
                        items: [
                          l10n.helpBody5a,
                          l10n.helpBody5b,
                          l10n.helpBody5c,
                        ],
                      ),
                      const SizedBox(height: 20),
                      
                      _InfoCard(
                        key: _key6,
                        title: l10n.helpTitle6,
                        icon: Icons.auto_awesome_rounded,
                        items: [
                          l10n.helpBody6a,
                          l10n.helpBody6b,
                          l10n.helpBody6c,
                        ],
                      ),
                      const SizedBox(height: 20),

                      _InfoCard(
                        key: _key7,
                        title: l10n.helpTitle7,
                        icon: Icons.edit_document,
                        items: [
                          l10n.helpBody7a,
                          l10n.helpBody7b,
                          l10n.helpBody7c,
                        ],
                      ),
                      const SizedBox(height: 20),

                      _InfoCard(
                        key: _key8,
                        title: l10n.helpTitle8,
                        icon: Icons.person_outline_rounded,
                        items: [
                          l10n.helpBody8a,
                          l10n.helpBody8b,
                          l10n.helpBody8c,
                        ],
                      ),
                      const SizedBox(height: 20),

                      _InfoCard(
                        key: _key9,
                        title: l10n.helpTitle9,
                        icon: Icons.support_agent_rounded,
                        items: [
                          l10n.helpBody9a,
                          l10n.helpBody9b,
                          l10n.helpBody9c,
                        ],
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.l10n});
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 28,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primary,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.menu_book_rounded, color: Colors.white, size: 32),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.helpDetailed,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  l10n.helpDetailedSub,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionChip extends StatelessWidget {
  const _SectionChip(this.label, {required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: Material(
        color: Theme.of(context).colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(24),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(24),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Text(
              label,
              style: TextStyle(
                color: Theme.of(context).colorScheme.onPrimaryContainer,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({super.key, required this.title, required this.icon, required this.items});
  
  final String title;
  final IconData icon;
  final List<String> items;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 28,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppTheme.primary, size: 28),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...items.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.check_circle_rounded, color: AppTheme.primary, size: 20),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    item,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.5),
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }
}

class _SupportGlowPainter extends CustomPainter {
  _SupportGlowPainter(this.context);
  final BuildContext context;

  @override
  void paint(Canvas canvas, Size size) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = isDark ? AppTheme.primary.withValues(alpha: 0.15) : AppTheme.primary.withValues(alpha: 0.05);
    final paint = Paint()
      ..shader = RadialGradient(
        colors: [color, Colors.transparent],
      ).createShader(
        Rect.fromCircle(
          center: Offset(size.width * 0.5, size.height * 0.2),
          radius: size.width * 0.9,
        ),
      );
    canvas.drawRect(Offset.zero & size, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

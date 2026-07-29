import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../l10n/generated/app_localizations.dart';

enum HelpCategory {
  all,
  ai,
  live,
  explore,
  creator,
  profile,
  support,
}

class HelpCenterScreen extends StatefulWidget {
  const HelpCenterScreen({super.key});

  @override
  State<HelpCenterScreen> createState() => _HelpCenterScreenState();
}

class _HelpCenterScreenState extends State<HelpCenterScreen> {
  final TextEditingController _searchController = TextEditingController();
  HelpCategory _selectedCategory = HelpCategory.all;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    setState(() {
      _searchQuery = _searchController.text.trim().toLowerCase();
    });
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final List<_GuideSectionData> sections = _buildSections(l10n);

    // Filter sections based on category and search query
    final filteredSections = sections.where((section) {
      if (_selectedCategory != HelpCategory.all && section.category != _selectedCategory) {
        return false;
      }
      if (_searchQuery.isEmpty) return true;

      final titleMatch = section.title.toLowerCase().contains(_searchQuery);
      final subMatch = section.subtitle.toLowerCase().contains(_searchQuery);
      final itemMatch = section.items.any((item) =>
          item.title.toLowerCase().contains(_searchQuery) ||
          item.body.toLowerCase().contains(_searchQuery) ||
          (item.tip != null && item.tip!.toLowerCase().contains(_searchQuery)));

      return titleMatch || subMatch || itemMatch;
    }).toList();

    return PremiumScaffold(
      safeBottom: true,
      child: Stack(
        children: [
          Positioned.fill(child: CustomPaint(painter: _SupportGlowPainter(context))),
          Column(
            children: [
              // Top Bar
              Container(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
                child: Row(
                  children: [
                    IconButton.filledTonal(
                      onPressed: () => context.canPop() ? context.pop() : context.go('/settings'),
                      icon: const Icon(Icons.arrow_back_rounded),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        l10n.helpGuides,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ),
                  ],
                ),
              ),

              // Search Bar & Filter Chips
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  children: [
                    _SearchBar(
                      controller: _searchController,
                      placeholder: l10n.helpSearchPlaceholder,
                      isDark: isDark,
                      onClear: () {
                        _searchController.clear();
                        FocusScope.of(context).unfocus();
                      },
                    ),
                    const SizedBox(height: 12),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _CategoryChip(
                            label: l10n.helpChipAll,
                            icon: Icons.apps_rounded,
                            isSelected: _selectedCategory == HelpCategory.all,
                            onTap: () => setState(() => _selectedCategory = HelpCategory.all),
                          ),
                          _CategoryChip(
                            label: l10n.helpChipAI,
                            icon: Icons.auto_awesome_rounded,
                            isSelected: _selectedCategory == HelpCategory.ai,
                            onTap: () => setState(() => _selectedCategory = HelpCategory.ai),
                          ),
                          _CategoryChip(
                            label: l10n.helpChipLive,
                            icon: Icons.navigation_rounded,
                            isSelected: _selectedCategory == HelpCategory.live,
                            onTap: () => setState(() => _selectedCategory = HelpCategory.live),
                          ),
                          _CategoryChip(
                            label: l10n.helpChipExplore,
                            icon: Icons.explore_rounded,
                            isSelected: _selectedCategory == HelpCategory.explore,
                            onTap: () => setState(() => _selectedCategory = HelpCategory.explore),
                          ),
                          _CategoryChip(
                            label: l10n.helpChipCreator,
                            icon: Icons.add_location_alt_rounded,
                            isSelected: _selectedCategory == HelpCategory.creator,
                            onTap: () => setState(() => _selectedCategory = HelpCategory.creator),
                          ),
                          _CategoryChip(
                            label: l10n.helpChipProfile,
                            icon: Icons.person_rounded,
                            isSelected: _selectedCategory == HelpCategory.profile,
                            onTap: () => setState(() => _selectedCategory = HelpCategory.profile),
                          ),
                          _CategoryChip(
                            label: l10n.helpChipSupport,
                            icon: Icons.support_agent_rounded,
                            isSelected: _selectedCategory == HelpCategory.support,
                            onTap: () => setState(() => _selectedCategory = HelpCategory.support),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Guide Sections Content
              Expanded(
                child: filteredSections.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.search_off_rounded,
                                size: 64,
                                color: isDark ? Colors.white38 : Colors.black38,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                l10n.helpNoResults,
                                textAlign: TextAlign.center,
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      color: isDark ? Colors.white70 : Colors.black.withValues(alpha: 0.7),
                                    ),
                              ),
                            ],
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                        itemCount: filteredSections.length,
                        itemBuilder: (context, index) {
                          final section = filteredSections[index];
                          return _GuideSectionCard(
                            section: section,
                            isDark: isDark,
                            l10n: l10n,
                          );
                        },
                      ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<_GuideSectionData> _buildSections(AppLocalizations l10n) {
    return [
      _GuideSectionData(
        category: HelpCategory.ai,
        icon: Icons.auto_awesome_rounded,
        color: const Color(0xFF8E44AD),
        title: l10n.helpSectionAITitle,
        subtitle: l10n.helpSectionAISub,
        items: [
          _GuideItemData(
            stepNumber: '1',
            title: l10n.helpAI1Title,
            body: l10n.helpAI1Body,
          ),
          _GuideItemData(
            stepNumber: '2',
            title: l10n.helpAI2Title,
            body: l10n.helpAI2Body,
            tip: l10n.helpAI2Tip,
          ),
          _GuideItemData(
            stepNumber: '3',
            title: l10n.helpAI3Title,
            body: l10n.helpAI3Body,
          ),
          _GuideItemData(
            stepNumber: '4',
            title: l10n.helpAI4Title,
            body: l10n.helpAI4Body,
          ),
        ],
      ),
      _GuideSectionData(
        category: HelpCategory.live,
        icon: Icons.navigation_rounded,
        color: const Color(0xFF2ECC71),
        title: l10n.helpSectionLiveTitle,
        subtitle: l10n.helpSectionLiveSub,
        items: [
          _GuideItemData(
            stepNumber: '1',
            title: l10n.helpLive1Title,
            body: l10n.helpLive1Body,
          ),
          _GuideItemData(
            stepNumber: '2',
            title: l10n.helpLive2Title,
            body: l10n.helpLive2Body,
            tip: l10n.helpLive2Tip,
          ),
          _GuideItemData(
            stepNumber: '3',
            title: l10n.helpLive3Title,
            body: l10n.helpLive3Body,
          ),
        ],
      ),
      _GuideSectionData(
        category: HelpCategory.explore,
        icon: Icons.explore_rounded,
        color: const Color(0xFF3498DB),
        title: l10n.helpSectionExploreTitle,
        subtitle: l10n.helpSectionExploreSub,
        items: [
          _GuideItemData(
            stepNumber: '1',
            title: l10n.helpExplore1Title,
            body: l10n.helpExplore1Body,
            tip: l10n.helpExplore1Tip,
          ),
          _GuideItemData(
            stepNumber: '2',
            title: l10n.helpExplore2Title,
            body: l10n.helpExplore2Body,
          ),
          _GuideItemData(
            stepNumber: '3',
            title: l10n.helpExplore3Title,
            body: l10n.helpExplore3Body,
          ),
        ],
      ),
      _GuideSectionData(
        category: HelpCategory.creator,
        icon: Icons.add_location_alt_rounded,
        color: const Color(0xFFE67E22),
        title: l10n.helpSectionCreatorTitle,
        subtitle: l10n.helpSectionCreatorSub,
        items: [
          _GuideItemData(
            stepNumber: '1',
            title: l10n.helpCreator1Title,
            body: l10n.helpCreator1Body,
          ),
          _GuideItemData(
            stepNumber: '2',
            title: l10n.helpCreator2Title,
            body: l10n.helpCreator2Body,
          ),
          _GuideItemData(
            stepNumber: '3',
            title: l10n.helpCreator3Title,
            body: l10n.helpCreator3Body,
          ),
        ],
      ),
      _GuideSectionData(
        category: HelpCategory.profile,
        icon: Icons.person_rounded,
        color: const Color(0xFF1ABC9C),
        title: l10n.helpSectionProfileTitle,
        subtitle: l10n.helpSectionProfileSub,
        items: [
          _GuideItemData(
            stepNumber: '1',
            title: l10n.helpProfile1Title,
            body: l10n.helpProfile1Body,
          ),
          _GuideItemData(
            stepNumber: '2',
            title: l10n.helpProfile2Title,
            body: l10n.helpProfile2Body,
          ),
          _GuideItemData(
            stepNumber: '3',
            title: l10n.helpProfile3Title,
            body: l10n.helpProfile3Body,
          ),
        ],
      ),
      _GuideSectionData(
        category: HelpCategory.support,
        icon: Icons.support_agent_rounded,
        color: const Color(0xFFE74C3C),
        title: l10n.helpSectionSupportTitle,
        subtitle: l10n.helpSectionSupportSub,
        items: [
          _GuideItemData(
            stepNumber: '1',
            title: l10n.helpSupport1Title,
            body: l10n.helpSupport1Body,
          ),
          _GuideItemData(
            stepNumber: '2',
            title: l10n.helpSupport2Title,
            body: l10n.helpSupport2Body,
          ),
        ],
      ),
    ];
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar({
    required this.controller,
    required this.placeholder,
    required this.isDark,
    required this.onClear,
  });

  final TextEditingController controller;
  final String placeholder;
  final bool isDark;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.12) : Colors.black.withValues(alpha: 0.08),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextField(
        controller: controller,
        style: TextStyle(color: isDark ? Colors.white : Colors.black),
        decoration: InputDecoration(
          hintText: placeholder,
          hintStyle: TextStyle(
            color: isDark ? Colors.white38 : Colors.black38,
            fontSize: 14,
          ),
          prefixIcon: Icon(
            Icons.search_rounded,
            color: isDark ? Colors.white54 : Colors.black54,
          ),
          suffixIcon: controller.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, size: 20),
                  color: isDark ? Colors.white54 : Colors.black54,
                  onPressed: onClear,
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final selectedBg = AppTheme.primary;
    final unselectedBg = isDark ? const Color(0xFF1C1C1E) : Colors.white;

    final selectedFg = Colors.white;
    final unselectedFg = isDark ? Colors.white70 : Colors.black87;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: isSelected ? selectedBg : unselectedBg,
        borderRadius: BorderRadius.circular(20),
        elevation: isSelected ? 2 : 0,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected
                    ? AppTheme.primary
                    : isDark
                        ? Colors.white.withValues(alpha: 0.12)
                        : Colors.black.withValues(alpha: 0.08),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 16, color: selectedFg.withValues(alpha: isSelected ? 1.0 : 0.8)),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: TextStyle(
                    color: isSelected ? selectedFg : unselectedFg,
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _GuideSectionCard extends StatefulWidget {
  const _GuideSectionCard({
    required this.section,
    required this.isDark,
    required this.l10n,
  });

  final _GuideSectionData section;
  final bool isDark;
  final AppLocalizations l10n;

  @override
  State<_GuideSectionCard> createState() => _GuideSectionCardState();
}

class _GuideSectionCardState extends State<_GuideSectionCard> {
  bool _isExpanded = true;

  @override
  Widget build(BuildContext context) {
    final section = widget.section;
    final isDark = widget.isDark;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.12) : Colors.black.withValues(alpha: 0.08),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          InkWell(
            onTap: () => setState(() => _isExpanded = !_isExpanded),
            borderRadius: BorderRadius.vertical(
              top: const Radius.circular(24),
              bottom: Radius.circular(_isExpanded ? 0 : 24),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: section.color.withValues(alpha: isDark ? 0.2 : 0.12),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(section.icon, color: section.color, size: 28),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          section.title,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white : Colors.black87,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          section.subtitle,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: isDark ? Colors.white60 : Colors.black54,
                                height: 1.3,
                              ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    _isExpanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                    color: isDark ? Colors.white54 : Colors.black54,
                  ),
                ],
              ),
            ),
          ),

          // Collapsible Content
          if (_isExpanded) ...[
            Divider(
              height: 1,
              thickness: 1,
              color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.06),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: section.items
                    .map((item) => _GuideItemWidget(
                          item: item,
                          accentColor: section.color,
                          isDark: isDark,
                          l10n: widget.l10n,
                        ))
                    .toList(),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _GuideItemWidget extends StatelessWidget {
  const _GuideItemWidget({
    required this.item,
    required this.accentColor,
    required this.isDark,
    required this.l10n,
  });

  final _GuideItemData item;
  final Color accentColor;
  final bool isDark;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step Circle Badge
          Container(
            width: 28,
            height: 28,
            margin: const EdgeInsets.only(top: 2),
            decoration: BoxDecoration(
              color: accentColor.withValues(alpha: isDark ? 0.25 : 0.15),
              shape: BoxShape.circle,
              border: Border.all(color: accentColor, width: 1.5),
            ),
            child: Center(
              child: Text(
                item.stepNumber,
                style: TextStyle(
                  color: accentColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),

          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  item.body,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: isDark ? Colors.white70 : Colors.black.withValues(alpha: 0.7),
                        height: 1.45,
                      ),
                ),
                if (item.tip != null) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: isDark ? 0.15 : 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppTheme.primary.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.lightbulb_rounded, color: AppTheme.primary, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            item.tip!,
                            style: TextStyle(
                              fontSize: 12.5,
                              color: isDark ? Colors.white.withValues(alpha: 0.9) : const Color(0xFF0056B3),
                              fontWeight: FontWeight.w500,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GuideSectionData {
  _GuideSectionData({
    required this.category,
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.items,
  });

  final HelpCategory category;
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final List<_GuideItemData> items;
}

class _GuideItemData {
  _GuideItemData({
    required this.stepNumber,
    required this.title,
    required this.body,
    this.tip,
  });

  final String stepNumber;
  final String title;
  final String body;
  final String? tip;
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
          center: Offset(size.width * 0.5, size.height * 0.15),
          radius: size.width * 0.9,
        ),
      );
    canvas.drawRect(Offset.zero & size, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

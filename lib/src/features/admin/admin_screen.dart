import 'dart:async';
import 'dart:convert';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../core/design/vibe_logo.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';

class AdminScreen extends ConsumerStatefulWidget {
  const AdminScreen({super.key});

  @override
  ConsumerState<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends ConsumerState<AdminScreen> {
  final _response = TextEditingController();
  final _search = TextEditingController();
  var _tab = 0;
  var _didBootstrapAdminData = false;
  var _loadingTickets = true;
  String? _toursError;
  List<_AdminTicket> _tickets = const [];
  List<Tour> _pendingTours = const [];
  _AdminTicket? _selectedTicket;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    Future.microtask(_loadTickets);
    Future.microtask(_loadTours);
    _refreshTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (mounted) {
        _refreshAdminTours();
      }
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _response.dispose();
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isAdmin = ref.watch(isAdminProvider);
    if (!isAdmin) {
      _didBootstrapAdminData = false;
      return PremiumScaffold(
        safeBottom: true,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              EmptyState(
                icon: Icons.lock_rounded,
                title: l10n.adminAccessRestricted,
                body: l10n.adminAccessRestrictedBody,
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 36),
                child: LiquidButton(
                  label: l10n.adminBackToSettings,
                  icon: Icons.arrow_back_rounded,
                  onPressed: () => context.go('/settings'),
                ),
              ),
            ],
          ),
        ),
      );
    }
    _scheduleAdminBootstrap();
    final filteredTickets = _filteredTickets();
    final pendingToursAsync = ref.watch(adminPendingToursProvider);
    return Scaffold(
      backgroundColor: const Color(0xFF090E18),
      body: SafeArea(
        child: Column(
          children: [
            _AdminTopBar(
              onClose: () => context.go('/settings'),
              onRefresh: _refreshAdminTours,
            ),
            Expanded(
              child: IndexedStack(
                index: _tab,
                children: [
                  _DashboardTab(
                    pendingToursAsync: pendingToursAsync,
                    localPendingTours: _pendingTours,
                    localToursError: _toursError,
                    onApproveTour: _approveTour,
                    onRejectTour: _rejectTour,
                    onRefreshTours: _refreshAdminTours,
                  ),
                  _PqrsTab(
                    loading: _loadingTickets,
                    tickets: filteredTickets,
                    selectedTicket: _selectedTicket,
                    responseController: _response,
                    searchController: _search,
                    onSearchChanged: (_) => setState(() {}),
                    onSelectTicket: (ticket) => setState(() {
                      _selectedTicket = ticket;
                      _response.text = ticket.adminResponse;
                    }),
                    onSaveResponse: _saveResponse,
                    onPostpone: () => setState(() => _selectedTicket = null),
                    onRefresh: _loadTickets,
                  ),
                  const _AdminSettingsTab(),
                ],
              ),
            ),
            _AdminBottomNav(
              currentIndex: _tab,
              onChanged: (index) => setState(() => _tab = index),
            ),
          ],
        ),
      ),
    );
  }

  List<_AdminTicket> _filteredTickets() {
    final query = _search.text.trim().toLowerCase();
    if (query.isEmpty) return _tickets;
    return _tickets
        .where(
          (ticket) =>
              ticket.subject.toLowerCase().contains(query) ||
              ticket.body.toLowerCase().contains(query) ||
              ticket.kind.toLowerCase().contains(query),
        )
        .toList();
  }

  void _scheduleAdminBootstrap() {
    if (_didBootstrapAdminData) return;
    _didBootstrapAdminData = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _loadTickets();
      _refreshAdminTours();
    });
  }

  void _refreshAdminTours() {
    ref.invalidate(adminPendingToursProvider);
    unawaited(_loadTours());
  }

  Future<void> _loadTickets() async {
    if (!ref.read(isAdminProvider)) {
      if (!mounted) return;
      setState(() {
        _tickets = const [];
        _selectedTicket = null;
        _loadingTickets = false;
      });
      return;
    }
    setState(() => _loadingTickets = true);
    final client = ref.read(supabaseClientProvider);
    if (client == null) {
      final demoTickets = _buildDemoTickets(context);
      setState(() {
        _tickets = demoTickets;
        _selectedTicket = demoTickets.first;
        _loadingTickets = false;
      });
      return;
    }
    try {
      final data = await client
          .from('pqrs')
          .select()
          .order('created_at', ascending: false)
          .limit(30);
      final tickets = [
        for (final row in data)
          _AdminTicket.fromJson(Map<String, dynamic>.from(row)),
      ];
      if (!mounted) return;
      final demoTickets = _buildDemoTickets(context);
      setState(() {
        _tickets = tickets.isEmpty ? demoTickets : tickets;
        _selectedTicket = _tickets.isEmpty ? null : _tickets.first;
        _loadingTickets = false;
      });
    } catch (_) {
      if (!mounted) return;
      final demoTickets = _buildDemoTickets(context);
      setState(() {
        _tickets = demoTickets;
        _selectedTicket = demoTickets.first;
        _loadingTickets = false;
      });
    }
  }

  Future<void> _loadTours() async {
    final l10n = AppLocalizations.of(context);
    if (!ref.read(isAdminProvider)) {
      if (!mounted) return;
      setState(() {
        _pendingTours = const [];
        _toursError = null;
      });
      return;
    }
    final client = ref.read(supabaseClientProvider);
    if (client == null) {
      if (!mounted) return;
      setState(() {
        _pendingTours = const [];
        _toursError = l10n.adminSupabaseNotConfigured;
      });
      return;
    }
    try {
      final tours = await ref.read(tourRepositoryProvider).getPendingModerationTours();
      if (!mounted) return;
      setState(() {
        _pendingTours = tours;
        _toursError = null;
      });
    } catch (_) {
      try {
        final data = await client.rpc('admin_pending_tours') as List<dynamic>;
        final tours = [
          for (final item in data)
            if (item is Map)
              ref
                  .read(tourRepositoryProvider)
                  .parseDatabaseJson(Map<String, dynamic>.from(item)),
        ];
        if (!mounted) return;
        setState(() {
          _pendingTours = tours;
          _toursError = null;
        });
      } catch (_) {
        if (!mounted) return;
        setState(() {
          _pendingTours = const [];
          _toursError = l10n.adminCouldNotLoadPending;
        });
      }
    }
  }

  Future<void> _saveResponse() async {
    final l10n = AppLocalizations.of(context);
    final ticket = _selectedTicket;
    final response = _response.text.trim();
    if (ticket == null || response.length < 8) {
      _snack(l10n.adminWriteOfficialResponse);
      return;
    }
    final client = ref.read(supabaseClientProvider);
    if (client != null && !ticket.isDemo) {
      try {
        await client
            .from('pqrs')
            .update({
              'status': 'answered',
              'admin_response': response,
              'responded_at': DateTime.now().toIso8601String(),
            })
            .eq('id', ticket.id);
      } catch (_) {
        await client
            .from('pqrs')
            .update({'status': 'answered'})
            .eq('id', ticket.id);
      }
    }
    setState(() {
      _tickets = [
        for (final item in _tickets)
          item.id == ticket.id
              ? item.copyWith(status: 'answered', adminResponse: response)
              : item,
      ];
      _selectedTicket = _selectedTicket?.copyWith(
        status: 'answered',
        adminResponse: response,
      );
    });
    _snack(l10n.adminResponseSaved);
  }

  Future<void> _approveTour(Tour tour) async {
    final l10n = AppLocalizations.of(context);
    try {
      await ref
          .read(tourRepositoryProvider)
          .moderateTour(tour.id, approved: true);
      await _loadTours();
      ref.invalidate(toursProvider);
      _snack(l10n.adminTourApproved(tour.title));
    } catch (_) {
      _snack(l10n.adminCouldNotApproveTour);
    }
  }

  Future<void> _rejectTour(Tour tour) async {
    final l10n = AppLocalizations.of(context);
    try {
      await ref
          .read(tourRepositoryProvider)
          .moderateTour(tour.id, approved: false);
      await _loadTours();
      _snack(l10n.adminTourRejected(tour.title));
    } catch (_) {
      _snack(l10n.adminCouldNotRejectTour);
    }
  }

  void _snack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(SnackBar(content: Text(message)));
  }
}

// ---------------------------------------------------------------------------
// Helper: build demo tickets with localized strings
// ---------------------------------------------------------------------------

List<_AdminTicket> _buildDemoTickets(BuildContext context) {
  final l10n = AppLocalizations.of(context);
  return [
    _AdminTicket(
      id: 'demo-1',
      kind: 'petition',
      subject: l10n.adminDemoTicket1Subject,
      body: l10n.adminDemoTicket1Body,
      status: 'open',
      createdAt: DateTime(2026, 6, 10),
      isDemo: true,
    ),
    _AdminTicket(
      id: 'demo-2',
      kind: 'claim',
      subject: l10n.adminDemoTicket2Subject,
      body: l10n.adminDemoTicket2Body,
      status: 'open',
      createdAt: DateTime(2026, 6, 10),
      isDemo: true,
    ),
  ];
}

// ---------------------------------------------------------------------------
// Top bar
// ---------------------------------------------------------------------------

class _AdminTopBar extends StatelessWidget {
  const _AdminTopBar({required this.onClose, required this.onRefresh});

  final VoidCallback onClose;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Container(
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF111821),
        border: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
      child: Row(
        children: [
          const VibeLogoMark(size: 28, admin: true),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'VibeTours Admin',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: const Color(0xFFC8DAFF),
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          IconButton(
            tooltip: l10n.adminNotifications,
            onPressed: () {},
            icon: const Icon(Icons.notifications_none_rounded),
          ),
          IconButton(
            tooltip: l10n.adminRefreshTours,
            onPressed: onRefresh,
            icon: const Icon(Icons.refresh_rounded),
          ),
          IconButton(
            tooltip: l10n.adminClosePanel,
            onPressed: onClose,
            icon: const Icon(Icons.close_rounded),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Dashboard tab
// ---------------------------------------------------------------------------

class _DashboardTab extends StatelessWidget {
  const _DashboardTab({
    required this.pendingToursAsync,
    required this.localPendingTours,
    required this.localToursError,
    required this.onApproveTour,
    required this.onRejectTour,
    required this.onRefreshTours,
  });

  final AsyncValue<List<Tour>> pendingToursAsync;
  final List<Tour> localPendingTours;
  final String? localToursError;
  final ValueChanged<Tour> onApproveTour;
  final ValueChanged<Tour> onRejectTour;
  final VoidCallback onRefreshTours;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final tourCards = pendingToursAsync.when(
      loading: () {
        if (localPendingTours.isNotEmpty) {
          return _tourCards(localPendingTours);
        }
        return <Widget>[
          _AdminEmptyCard(
            icon: Icons.hourglass_empty_rounded,
            title: l10n.adminLoadingPending,
            body: l10n.adminLoadingPendingBody,
          ),
        ];
      },
      error: (error, stackTrace) {
        if (localPendingTours.isNotEmpty) {
          return _tourCards(localPendingTours);
        }
        return <Widget>[
          _AdminEmptyCard(
            icon: Icons.error_outline_rounded,
            title: l10n.adminCouldNotLoad,
            body: localToursError ?? error.toString(),
          ),
        ];
      },
      data: (pendingTours) {
        if (pendingTours.isNotEmpty) {
          return _tourCards(pendingTours);
        }
        if (localPendingTours.isNotEmpty) {
          return _tourCards(localPendingTours);
        }
        return <Widget>[
          _AdminEmptyCard(
            icon: Icons.verified_rounded,
            title: l10n.adminNoPendingTours,
            body: l10n.adminNoPendingToursBody,
          ),
        ];
      },
    );
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 28),
      children: [
        _AdminHeroCard(
          title: l10n.adminControlCenter,
          body: l10n.adminControlCenterBody,
          action: l10n.adminNewReports,
          icon: Icons.shield_outlined,
        ),
        const SizedBox(height: 24),
        _AdminSectionTitle(
          icon: Icons.support_agent_rounded,
          title: l10n.adminPqrsManagement,
        ),
        const SizedBox(height: 12),
        _AdminMetricPill(label: l10n.adminActiveTickets('12')),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: _AdminSectionTitle(
                icon: Icons.fact_check_rounded,
                title: l10n.adminToursToApprove,
              ),
            ),
            IconButton.filledTonal(
              tooltip: l10n.adminRefreshTours,
              onPressed: onRefreshTours,
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        const SizedBox(height: 14),
        ...tourCards,
      ],
    );
  }

  List<Widget> _tourCards(List<Tour> tours) {
    return [
      for (final tour in tours) ...[
        _PendingTourCard(
          tour: tour,
          onApprove: () => onApproveTour(tour),
          onReject: () => onRejectTour(tour),
        ),
        const SizedBox(height: 12),
      ],
    ];
  }
}

// ---------------------------------------------------------------------------
// PQRS tab
// ---------------------------------------------------------------------------

class _PqrsTab extends StatelessWidget {
  const _PqrsTab({
    required this.loading,
    required this.tickets,
    required this.selectedTicket,
    required this.responseController,
    required this.searchController,
    required this.onSearchChanged,
    required this.onSelectTicket,
    required this.onSaveResponse,
    required this.onPostpone,
    required this.onRefresh,
  });

  final bool loading;
  final List<_AdminTicket> tickets;
  final _AdminTicket? selectedTicket;
  final TextEditingController responseController;
  final TextEditingController searchController;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<_AdminTicket> onSelectTicket;
  final VoidCallback onSaveResponse;
  final VoidCallback onPostpone;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 28),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                l10n.adminPqrsTitle,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            IconButton.filledTonal(
              onPressed: onRefresh,
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          l10n.adminPqrsSubtitle,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: Colors.white.withValues(alpha: 0.72),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: searchController,
          onChanged: onSearchChanged,
          decoration: InputDecoration(
            hintText: l10n.adminSearchPqrs,
            prefixIcon: const Icon(Icons.search_rounded),
          ),
        ),
        const SizedBox(height: 18),
        if (loading)
          const SkeletonBox(height: 180)
        else if (tickets.isEmpty)
          _AdminEmptyCard(
            icon: Icons.inbox_rounded,
            title: l10n.adminNoPqrs,
            body: l10n.adminNoPqrsBody,
          )
        else
          for (final ticket in tickets) ...[
            _TicketCard(
              ticket: ticket,
              selected: selectedTicket?.id == ticket.id,
              onTap: () => onSelectTicket(ticket),
            ),
            const SizedBox(height: 12),
          ],
        const SizedBox(height: 18),
        _ResponsePanel(
          ticket: selectedTicket,
          controller: responseController,
          onSave: onSaveResponse,
          onPostpone: onPostpone,
        ),
        const SizedBox(height: 18),
        _AdminInsightCard(tickets: tickets),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Admin Settings tab
// ---------------------------------------------------------------------------

class _AdminSettingsTab extends ConsumerWidget {
  const _AdminSettingsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authUserProvider).valueOrNull;
    final metadata = user?.userMetadata ?? {};
    final avatarUrl = metadata['custom_avatar_url']?.toString() ?? metadata['avatar_url']?.toString();
    final name = metadata['full_name']?.toString() ?? metadata['name']?.toString() ?? 'Administrator';

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 28),
      children: [
        GlassPanel(
          padding: const EdgeInsets.all(28),
          radius: 24,
          child: Column(
            children: [
              Transform.rotate(
                angle: 0.04,
                child: Container(
                  width: 116,
                  height: 116,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.20),
                      width: 4,
                    ),
                  ),
                  clipBehavior: Clip.hardEdge,
                  child: avatarUrl != null && avatarUrl.isNotEmpty
                      ? (avatarUrl.startsWith('data:image')
                          ? Image.memory(base64Decode(avatarUrl.split(',').last), fit: BoxFit.cover)
                          : Image.network(avatarUrl, fit: BoxFit.cover))
                      : const Icon(
                          Icons.admin_panel_settings_rounded,
                          color: Color(0xFFAFCBFF),
                          size: 48,
                        ),
                ),
              ),
              const SizedBox(height: 22),
              Text(
                name,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                l10n.adminSystemRole,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.white.withValues(alpha: 0.62),
                ),
              ),
              const SizedBox(height: 18),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text(
          l10n.adminAdministrativeActions,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 14),
        GlassPanel(
          child: Column(
            children: [
              _AdminActionRow(
                icon: Icons.map_outlined,
                title: l10n.adminModeratedToursHistory,
                subtitle: l10n.adminModeratedToursHistorySubtitle,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const _AcceptedToursHistoryScreen()),
                  );
                },
              ),
              _AdminActionRow(
                icon: Icons.payments_outlined,
                title: l10n.adminPaymentHistory,
                subtitle: l10n.adminPaymentHistorySubtitle,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const _PaymentHistoryScreen()),
                  );
                },
              ),
              _AdminActionRow(
                icon: Icons.support_agent_rounded,
                title: l10n.adminPqrsHistory,
                subtitle: l10n.adminPqrsHistorySubtitle,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const _PqrsHistoryScreen()),
                  );
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        const _PlatformPulseCard(),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Hero card
// ---------------------------------------------------------------------------

class _AdminHeroCard extends StatelessWidget {
  const _AdminHeroCard({
    required this.title,
    required this.body,
    required this.action,
    required this.icon,
  });

  final String title;
  final String body;
  final String action;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      padding: const EdgeInsets.all(28),
      radius: 24,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 280),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: AppTheme.primary,
              child: Icon(icon, color: Colors.white),
            ),
            const SizedBox(height: 18),
            Text(
              title,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              body,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Colors.white.withValues(alpha: 0.72),
              ),
            ),
            const SizedBox(height: 28),
            FilledButton(onPressed: () {}, child: Text(action)),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Section title
// ---------------------------------------------------------------------------

class _AdminSectionTitle extends StatelessWidget {
  const _AdminSectionTitle({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFFAFCBFF), size: 20),
        const SizedBox(width: 10),
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Metric pill
// ---------------------------------------------------------------------------

class _AdminMetricPill extends StatelessWidget {
  const _AdminMetricPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelLarge?.copyWith(color: AppTheme.primary),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Pending tour card
// ---------------------------------------------------------------------------

class _PendingTourCard extends StatelessWidget {
  const _PendingTourCard({
    required this.tour,
    required this.onApprove,
    required this.onReject,
  });

  final Tour tour;
  final VoidCallback onApprove;
  final VoidCallback onReject;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return GlassPanel(
      padding: const EdgeInsets.all(16),
      radius: 16,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tour.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${tour.city}, ${tour.country} - ${tour.durationHours.toStringAsFixed(1)}h - ${tour.stops.length} ${l10n.stops}',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.white60),
                ),
                const SizedBox(height: 4),
                Text(
                  tour.isAiGenerated ? l10n.adminCreatedWithAI : l10n.adminCreatedManually,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: const Color(0xFFAFCBFF),
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          IconButton.filledTonal(
            tooltip: l10n.adminApprove,
            onPressed: onApprove,
            icon: const Icon(Icons.check_rounded),
          ),
          IconButton(
            tooltip: l10n.adminReject,
            onPressed: onReject,
            icon: const Icon(Icons.close_rounded),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Ticket card
// ---------------------------------------------------------------------------

class _TicketCard extends StatelessWidget {
  const _TicketCard({
    required this.ticket,
    required this.selected,
    required this.onTap,
  });

  final _AdminTicket ticket;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: GlassPanel(
        padding: const EdgeInsets.all(16),
        radius: 18,
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: selected
                  ? AppTheme.primary
                  : Colors.white.withValues(alpha: 0.08),
              child: const Icon(Icons.question_mark_rounded),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          ticket.subject,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                              ),
                        ),
                      ),
                      _StatusTag(status: ticket.status),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${ticket.kindLabel(context)} - ${ticket.createdAt.day.toString().padLeft(2, '0')}/${ticket.createdAt.month.toString().padLeft(2, '0')}',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: const Color(0xFFAFCBFF),
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    ticket.body,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.62),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Response panel
// ---------------------------------------------------------------------------

class _ResponsePanel extends StatelessWidget {
  const _ResponsePanel({
    required this.ticket,
    required this.controller,
    required this.onSave,
    required this.onPostpone,
  });

  final _AdminTicket? ticket;
  final TextEditingController controller;
  final VoidCallback onSave;
  final VoidCallback onPostpone;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    if (ticket == null) {
      return _AdminEmptyCard(
        icon: Icons.reply_rounded,
        title: l10n.adminSelectCase,
        body: l10n.adminSelectCaseBody,
      );
    }
    return GlassPanel(
      padding: const EdgeInsets.all(22),
      radius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.reply_rounded, color: Color(0xFFAFCBFF)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  l10n.adminResponseTitle,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: const Color(0xFFAFCBFF),
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Text(
                l10n.adminDraftSaved,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.52),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          TextField(
            controller: controller,
            minLines: 4,
            maxLines: 7,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: l10n.adminResponseHint,
              suffixIcon: const Icon(Icons.sentiment_satisfied_alt_rounded),
              filled: true,
              fillColor: const Color(0xFF090E18),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(
                  color: Colors.white.withValues(alpha: 0.14),
                ),
              ),
            ),
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: LiquidButton(
              label: l10n.adminSaveResponse,
              icon: Icons.send_rounded,
              onPressed: onSave,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onPostpone,
              child: Text(l10n.adminPostpone),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Status tag
// ---------------------------------------------------------------------------

class _StatusTag extends StatelessWidget {
  const _StatusTag({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final answered = status == 'answered' || status == 'closed';
    return DecoratedBox(
      decoration: BoxDecoration(
        color: answered
            ? AppTheme.primary.withValues(alpha: 0.16)
            : const Color(0xFFFFB020).withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
        child: Text(
          answered ? l10n.adminStatusAnswered : l10n.adminStatusPending,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: answered ? const Color(0xFFAFCBFF) : const Color(0xFFFFC875),
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Insight card
// ---------------------------------------------------------------------------

class _AdminInsightCard extends StatelessWidget {
  const _AdminInsightCard({required this.tickets});
  final List<_AdminTicket> tickets;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    
    int petitions = 0;
    int complaints = 0;
    int claims = 0;
    int suggestions = 0;
    
    for (final t in tickets) {
      switch (t.kind) {
        case 'petition':
          petitions++;
          break;
        case 'complaint':
          complaints++;
          break;
        case 'claim':
          claims++;
          break;
        default:
          suggestions++;
          break;
      }
    }
    
    final total = tickets.length;
    final double pctPetition = total > 0 ? petitions / total : 0.0;
    final double pctComplaint = total > 0 ? complaints / total : 0.0;
    final double pctClaim = total > 0 ? claims / total : 0.0;
    final double pctSuggestion = total > 0 ? suggestions / total : 0.0;

    final items = [
      (label: l10n.adminKindPetition, value: pctPetition, count: petitions),
      (label: l10n.adminKindComplaint, value: pctComplaint, count: complaints),
      (label: l10n.adminKindClaim, value: pctClaim, count: claims),
      (label: l10n.adminKindSuggestion, value: pctSuggestion, count: suggestions),
    ]..sort((a, b) => b.value.compareTo(a.value));

    return GlassPanel(
      radius: 18,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.adminPopularTopics,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 12),
          for (final item in items)
            if (item.count > 0 || total == 0)
              _TopicBar(
                label: item.label,
                value: item.value,
              ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Topic bar
// ---------------------------------------------------------------------------

class _TopicBar extends StatelessWidget {
  const _TopicBar({required this.label, required this.value});

  final String label;
  final double value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: const TextStyle(color: Colors.white)),
          ),
          Text(
            '${(value * 100).round()}%',
            style: const TextStyle(color: Colors.white),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Empty card
// ---------------------------------------------------------------------------

class _AdminEmptyCard extends StatelessWidget {
  const _AdminEmptyCard({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 18,
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFFAFCBFF)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white)),
                Text(
                  body,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.62)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Action row
// ---------------------------------------------------------------------------

class _AdminActionRow extends StatelessWidget {
  const _AdminActionRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: CircleAvatar(
        backgroundColor: Colors.white.withValues(alpha: 0.08),
        child: Icon(icon, color: const Color(0xFFAFCBFF)),
      ),
      title: Text(title, style: const TextStyle(color: Colors.white)),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right_rounded),
    );
  }
}

// ---------------------------------------------------------------------------
// Platform Pulse card
// ---------------------------------------------------------------------------

class _PlatformPulseCard extends ConsumerStatefulWidget {
  const _PlatformPulseCard();

  @override
  ConsumerState<_PlatformPulseCard> createState() => _PlatformPulseCardState();
}

class _PlatformPulseCardState extends ConsumerState<_PlatformPulseCard> {
  int? _weeklyUserCount;
  bool _loading = true;
  List<double> _weeklyActivityChart = [0, 0, 0, 0, 0, 0, 0];

  @override
  void initState() {
    super.initState();
    _loadWeeklyUserCount();
  }

  Future<void> _loadWeeklyUserCount() async {
    final client = ref.read(supabaseClientProvider);
    if (client == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    try {
      final now = DateTime.now();
      final sevenDaysAgo = now.subtract(const Duration(days: 7));
      final response = await client
          .from('users')
          .select('updated_at')
          .gte('updated_at', sevenDaysAgo.toIso8601String());

      final List<dynamic> data = response as List;
      final List<int> counts = List.filled(7, 0);

      for (final row in data) {
        final date = DateTime.tryParse(row['updated_at']?.toString() ?? '');
        if (date != null) {
          final diff = now.difference(date).inDays;
          if (diff >= 0 && diff < 7) {
            counts[6 - diff]++;
          }
        }
      }

      int maxCount = 0;
      for (final c in counts) {
        if (c > maxCount) maxCount = c;
      }
      
      final chart = counts.map((c) => maxCount == 0 ? 0.05 : (c / maxCount).clamp(0.05, 1.0)).toList();

      if (mounted) {
        setState(() {
          _weeklyUserCount = data.length;
          _weeklyActivityChart = chart;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return GlassPanel(
      radius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Platform Pulse',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            l10n.adminPlatformPulseSubtitle,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.62)),
          ),
          const SizedBox(height: 16),
          Text(
            _loading
                ? l10n.adminLoadingActiveUsers
                : l10n.adminConnectedUsersThisWeek(_weeklyUserCount ?? 0),
            style: const TextStyle(
              color: Color(0xFFAFCBFF),
              fontWeight: FontWeight.w800,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 92,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                for (final value in _weeklyActivityChart)
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 5),
                      child: FractionallySizedBox(
                        heightFactor: value,
                        alignment: Alignment.bottomCenter,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            color: const Color(
                              0xFFAFCBFF,
                            ).withValues(alpha: value.clamp(0.2, 1.0)),
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          Text(
            l10n.adminSystemIntegrity,
            style: const TextStyle(
              color: Colors.white60,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
            ),
          ),
          const Text(
            '99.98%',
            style: TextStyle(
              color: Colors.white,
              fontSize: 30,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          const LinearProgressIndicator(value: 0.9998),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Bottom nav
// ---------------------------------------------------------------------------

class _AdminBottomNav extends StatelessWidget {
  const _AdminBottomNav({required this.currentIndex, required this.onChanged});

  final int currentIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    // Labels stay as-is (Admin / PQRS / Settings are proper names)
    const items = [
      (icon: Icons.admin_panel_settings_outlined, label: 'Admin'),
      (icon: Icons.support_agent_rounded, label: 'PQRS'),
      (icon: Icons.settings_rounded, label: 'Settings'),
    ];
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 8, 10, 12),
      decoration: BoxDecoration(
        color: const Color(0xFF151A23),
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
      child: Row(
        children: [
          for (var index = 0; index < items.length; index++)
            Expanded(
              child: InkWell(
                borderRadius: BorderRadius.circular(999),
                onTap: () => onChanged(index),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: currentIndex == index
                        ? AppTheme.primary
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        items[index].icon,
                        color: currentIndex == index
                            ? const Color(0xFF06172C)
                            : Colors.white54,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        items[index].label,
                        style: TextStyle(
                          color: currentIndex == index
                              ? const Color(0xFF06172C)
                              : Colors.white54,
                          fontWeight: FontWeight.w800,
                        ),
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

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

class _AdminTicket {
  const _AdminTicket({
    required this.id,
    required this.kind,
    required this.subject,
    required this.body,
    required this.status,
    required this.createdAt,
    this.adminResponse = '',
    this.isDemo = false,
  });

  factory _AdminTicket.fromJson(Map<String, dynamic> json) {
    return _AdminTicket(
      id: json['id']?.toString() ?? 'pqrs-demo',
      kind: json['kind']?.toString() ?? 'suggestion',
      subject: json['subject']?.toString() ?? '',
      body: json['body']?.toString() ?? '',
      status: json['status']?.toString() ?? 'open',
      adminResponse: json['admin_response']?.toString() ?? '',
      createdAt:
          DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  final String id;
  final String kind;
  final String subject;
  final String body;
  final String status;
  final String adminResponse;
  final DateTime createdAt;
  final bool isDemo;

  // Uses context to return a localized kind label
  String kindLabel(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return switch (kind) {
      'petition' => l10n.adminKindPetition,
      'complaint' => l10n.adminKindComplaint,
      'claim' => l10n.adminKindClaim,
      _ => l10n.adminKindSuggestion,
    };
  }

  _AdminTicket copyWith({String? status, String? adminResponse}) {
    return _AdminTicket(
      id: id,
      kind: kind,
      subject: subject,
      body: body,
      status: status ?? this.status,
      adminResponse: adminResponse ?? this.adminResponse,
      createdAt: createdAt,
      isDemo: isDemo,
    );
  }
}

// ---------------------------------------------------------------------------
// History screens
// ---------------------------------------------------------------------------

class _AcceptedToursHistoryScreen extends ConsumerStatefulWidget {
  const _AcceptedToursHistoryScreen();

  @override
  ConsumerState<_AcceptedToursHistoryScreen> createState() => _AcceptedToursHistoryScreenState();
}

class _AcceptedToursHistoryScreenState extends ConsumerState<_AcceptedToursHistoryScreen> {
  List<Map<String, dynamic>> _historyItems = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => _loadHistory());
  }

  Future<void> _loadHistory() async {
    final client = ref.read(supabaseClientProvider);
    if (client == null) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'supabase_not_configured';
        });
      }
      return;
    }
    try {
      final data = await client
          .from('tours')
          .select('*, tour_stops(*)')
          .inFilter('moderation_status', ['approved', 'rejected'])
          .order('reviewed_at', ascending: false);

      final List<Map<String, dynamic>> items = [];
      for (final row in data) {
        final parsedTour = ref.read(tourRepositoryProvider).parseDatabaseJson(Map<String, dynamic>.from(row as Map));
        items.add({
          'tour': parsedTour,
          'status': row['moderation_status']?.toString() ?? 'unknown',
          'reviewedAt': DateTime.tryParse(row['reviewed_at']?.toString() ?? '') ?? DateTime.now(),
        });
      }

      if (mounted) {
        setState(() {
          _historyItems = items;
          _loading = false;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return PremiumScaffold(
      safeBottom: true,
      appBar: AppBar(
        title: Text(l10n.adminHistoryScreenTitle, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF090E18),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      child: Container(
        color: const Color(0xFF090E18),
        child: _buildBody(context, l10n),
      ),
    );
  }

  Widget _buildBody(BuildContext context, AppLocalizations l10n) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      final errorMessage = _error == 'supabase_not_configured'
          ? l10n.adminSupabaseNotConfigured
          : l10n.adminHistoryErrorLoading(_error!);
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 48),
              const SizedBox(height: 16),
              Text(errorMessage, style: const TextStyle(color: Colors.white70), textAlign: TextAlign.center),
            ],
          ),
        ),
      );
    }
    if (_historyItems.isEmpty) {
      return Center(
        child: EmptyState(
          icon: Icons.map_outlined,
          title: l10n.adminHistoryEmpty,
          body: l10n.adminHistoryEmptyBody,
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _historyItems.length,
      itemBuilder: (context, index) {
        final item = _historyItems[index];
        final Tour tour = item['tour'] as Tour;
        final String status = item['status'] as String;
        final DateTime reviewedAt = item['reviewedAt'] as DateTime;
        final isApproved = status == 'approved';
        final reviewedDate =
            '${reviewedAt.day.toString().padLeft(2, '0')}/${reviewedAt.month.toString().padLeft(2, '0')}/${reviewedAt.year}';

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: GlassPanel(
            radius: 18,
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CachedNetworkImage(
                    imageUrl: tour.coverUrl,
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                    placeholder: (_, _) => const SkeletonBox(width: 60, height: 60),
                    errorWidget: (_, _, _) => TravelImageFallback(title: tour.title),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tour.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${tour.city}, ${tour.country}',
                        style: const TextStyle(color: Colors.white60, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        l10n.adminHistoryReviewed(reviewedDate),
                        style: const TextStyle(color: Colors.white38, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: isApproved ? Colors.green.withValues(alpha: 0.16) : Colors.redAccent.withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    isApproved ? l10n.adminHistoryApproved : l10n.adminHistoryRejected,
                    style: TextStyle(
                      color: isApproved ? Colors.greenAccent : Colors.redAccent,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------

class _PaymentHistoryScreen extends StatelessWidget {
  const _PaymentHistoryScreen();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return PremiumScaffold(
      safeBottom: true,
      appBar: AppBar(
        title: Text(l10n.adminPaymentTitle, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF090E18),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      child: Container(
        color: const Color(0xFF090E18),
        alignment: Alignment.center,
        child: EmptyState(
          icon: Icons.payments_outlined,
          title: l10n.adminPaymentComingSoon,
          body: l10n.adminPaymentComingSoonBody,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------

class _PqrsHistoryScreen extends ConsumerStatefulWidget {
  const _PqrsHistoryScreen();

  @override
  ConsumerState<_PqrsHistoryScreen> createState() => _PqrsHistoryScreenState();
}

class _PqrsHistoryScreenState extends ConsumerState<_PqrsHistoryScreen> {
  List<_AdminTicket> _tickets = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => _loadPqrsHistory());
  }

  Future<void> _loadPqrsHistory() async {
    final client = ref.read(supabaseClientProvider);
    if (client == null) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'supabase_not_configured';
        });
      }
      return;
    }
    try {
      final response = await client
          .from('pqrs')
          .select()
          .eq('status', 'answered')
          .order('created_at', ascending: false);

      final data = response as List;
      final tickets = [
        for (final row in data)
          _AdminTicket.fromJson(Map<String, dynamic>.from(row as Map)),
      ];

      if (mounted) {
        setState(() {
          _tickets = tickets;
          _loading = false;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return PremiumScaffold(
      safeBottom: true,
      appBar: AppBar(
        title: Text(l10n.adminPqrsHistoryScreenTitle, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF090E18),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      child: Container(
        color: const Color(0xFF090E18),
        child: _buildBody(context, l10n),
      ),
    );
  }

  Widget _buildBody(BuildContext context, AppLocalizations l10n) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      final errorMessage = _error == 'supabase_not_configured'
          ? l10n.adminSupabaseNotConfigured
          : l10n.adminPqrsErrorLoading(_error!);
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 48),
              const SizedBox(height: 16),
              Text(errorMessage, style: const TextStyle(color: Colors.white70), textAlign: TextAlign.center),
            ],
          ),
        ),
      );
    }
    if (_tickets.isEmpty) {
      return Center(
        child: EmptyState(
          icon: Icons.support_agent_rounded,
          title: l10n.adminPqrsHistoryEmpty,
          body: l10n.adminPqrsHistoryEmptyBody,
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _tickets.length,
      itemBuilder: (context, index) {
        final ticket = _tickets[index];
        final createdDate =
            '${ticket.createdAt.day.toString().padLeft(2, '0')}/${ticket.createdAt.month.toString().padLeft(2, '0')}/${ticket.createdAt.year}';
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: GlassPanel(
            radius: 18,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        ticket.subject,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.blue.withValues(alpha: 0.16),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        ticket.kindLabel(context).toUpperCase(),
                        style: const TextStyle(color: Colors.blueAccent, fontSize: 9, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.adminPqrsUser(ticket.id.substring(0, ticket.id.length.clamp(0, 8)), createdDate),
                  style: const TextStyle(color: Colors.white38, fontSize: 12),
                ),
                const SizedBox(height: 10),
                Text(
                  l10n.adminOriginalQuery,
                  style: const TextStyle(color: Color(0xFFAFCBFF), fontWeight: FontWeight.w700, fontSize: 12),
                ),
                const SizedBox(height: 4),
                Text(
                  ticket.body,
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                ),
                if (ticket.adminResponse.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.04)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.reply_rounded, color: Colors.greenAccent, size: 16),
                            const SizedBox(width: 6),
                            Text(
                              l10n.adminOfficialResponse,
                              style: const TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          ticket.adminResponse,
                          style: const TextStyle(color: Colors.white, fontSize: 14, fontStyle: FontStyle.italic),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

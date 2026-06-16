import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../core/design/vibe_logo.dart';
import '../../domain/models.dart';
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
  var _loadingTickets = true;
  var _loadingTours = true;
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
        _loadTours();
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
    final isAdmin = ref.watch(isAdminProvider);
    if (!isAdmin) {
      return PremiumScaffold(
        safeBottom: true,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const EmptyState(
                icon: Icons.lock_rounded,
                title: 'Acceso restringido',
                body: 'El administrador de VIBETOURS usa una cuenta unica.',
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 36),
                child: LiquidButton(
                  label: 'Volver a ajustes',
                  icon: Icons.arrow_back_rounded,
                  onPressed: () => context.go('/settings'),
                ),
              ),
            ],
          ),
        ),
      );
    }
    final filteredTickets = _filteredTickets();
    return Scaffold(
      backgroundColor: const Color(0xFF090E18),
      body: SafeArea(
        child: Column(
          children: [
            _AdminTopBar(
              onClose: () => context.go('/settings'),
              onRefresh: _loadTours,
            ),
            Expanded(
              child: IndexedStack(
                index: _tab,
                children: [
                  _DashboardTab(
                    loadingTours: _loadingTours,
                    pendingTours: _pendingTours,
                    toursError: _toursError,
                    onApproveTour: _approveTour,
                    onRejectTour: _rejectTour,
                    onRefreshTours: _loadTours,
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
      setState(() {
        _tickets = _demoTickets;
        _selectedTicket = _demoTickets.first;
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
      setState(() {
        _tickets = tickets.isEmpty ? _demoTickets : tickets;
        _selectedTicket = _tickets.isEmpty ? null : _tickets.first;
        _loadingTickets = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _tickets = _demoTickets;
        _selectedTicket = _demoTickets.first;
        _loadingTickets = false;
      });
    }
  }

  Future<void> _loadTours() async {
    if (!ref.read(isAdminProvider)) {
      if (!mounted) return;
      setState(() {
        _pendingTours = const [];
        _loadingTours = false;
        _toursError = null;
      });
      return;
    }
    setState(() => _loadingTours = true);
    final client = ref.read(supabaseClientProvider);
    if (client == null) {
      if (!mounted) return;
      setState(() {
        _pendingTours = const [];
        _loadingTours = false;
        _toursError = 'Supabase no esta configurado.';
      });
      return;
    }
    try {
      final tours = await ref.read(tourRepositoryProvider).getPendingModerationTours();
      if (!mounted) return;
      setState(() {
        _pendingTours = tours;
        _loadingTours = false;
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
          _loadingTours = false;
          _toursError = null;
        });
      } catch (_) {
        if (!mounted) return;
        setState(() {
          _pendingTours = const [];
          _loadingTours = false;
          _toursError =
              'No se pudieron cargar los tours pendientes. Revisa permisos o migraciones.';
        });
      }
    }
  }

  Future<void> _saveResponse() async {
    final ticket = _selectedTicket;
    final response = _response.text.trim();
    if (ticket == null || response.length < 8) {
      _snack('Escribe una respuesta oficial para el usuario.');
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
    _snack('Respuesta guardada para el usuario.');
  }

  Future<void> _approveTour(Tour tour) async {
    try {
      await ref
          .read(tourRepositoryProvider)
          .moderateTour(tour.id, approved: true);
      await _loadTours();
      ref.invalidate(toursProvider);
      _snack('${tour.title} aprobado para publicacion.');
    } catch (_) {
      _snack('No se pudo aprobar el tour. Revisa permisos o conexion.');
    }
  }

  Future<void> _rejectTour(Tour tour) async {
    try {
      await ref
          .read(tourRepositoryProvider)
          .moderateTour(tour.id, approved: false);
      await _loadTours();
      _snack('${tour.title} rechazado.');
    } catch (_) {
      _snack('No se pudo rechazar el tour. Revisa permisos o conexion.');
    }
  }

  void _snack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(SnackBar(content: Text(message)));
  }
}

class _AdminTopBar extends StatelessWidget {
  const _AdminTopBar({required this.onClose, required this.onRefresh});

  final VoidCallback onClose;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
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
            tooltip: 'Notificaciones',
            onPressed: () {},
            icon: const Icon(Icons.notifications_none_rounded),
          ),
          IconButton(
            tooltip: 'Actualizar tours',
            onPressed: onRefresh,
            icon: const Icon(Icons.refresh_rounded),
          ),
          IconButton(
            tooltip: 'Cerrar administrador',
            onPressed: onClose,
            icon: const Icon(Icons.close_rounded),
          ),
        ],
      ),
    );
  }
}

class _DashboardTab extends StatelessWidget {
  const _DashboardTab({
    required this.loadingTours,
    required this.pendingTours,
    required this.toursError,
    required this.onApproveTour,
    required this.onRejectTour,
    required this.onRefreshTours,
  });

  final bool loadingTours;
  final List<Tour> pendingTours;
  final String? toursError;
  final ValueChanged<Tour> onApproveTour;
  final ValueChanged<Tour> onRejectTour;
  final VoidCallback onRefreshTours;

  @override
  Widget build(BuildContext context) {
    final tourCards = loadingTours
        ? const <Widget>[
            _AdminEmptyCard(
              icon: Icons.hourglass_empty_rounded,
              title: 'Cargando tours pendientes',
              body: 'Estamos consultando las solicitudes guardadas en Supabase.',
            ),
          ]
        : pendingTours.isEmpty
        ? <Widget>[
            if (toursError != null)
              _AdminEmptyCard(
                icon: Icons.error_outline_rounded,
                title: 'No se pudieron cargar',
                body: toursError!,
              )
            else
              const _AdminEmptyCard(
                icon: Icons.verified_rounded,
                title: 'Sin tours pendientes',
                body:
                    'Los tours manuales e IA nuevos apareceran aqui para aprobarlos o rechazarlos.',
              ),
          ]
        : [
            for (final tour in pendingTours) ...[
              _PendingTourCard(
                tour: tour,
                onApprove: () => onApproveTour(tour),
                onReject: () => onRejectTour(tour),
              ),
              const SizedBox(height: 12),
            ],
          ];
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 28),
      children: [
        _AdminHeroCard(
          title: 'Centro de control con VibeTours',
          body:
              'Gestiona aprobaciones, PQRS y metricas con permisos de administrador.',
          action: 'Nuevos reportes',
          icon: Icons.shield_outlined,
        ),
        const SizedBox(height: 24),
        _AdminSectionTitle(
          icon: Icons.support_agent_rounded,
          title: 'Gestion de PQRS',
        ),
        const SizedBox(height: 12),
        _AdminMetricPill(label: '12 Tickets Activos'),
        const SizedBox(height: 24),
        Row(
          children: [
            const Expanded(
              child: _AdminSectionTitle(
                icon: Icons.fact_check_rounded,
                title: 'Tours por aprobar',
              ),
            ),
            IconButton.filledTonal(
              tooltip: 'Actualizar tours',
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
}

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
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 28),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Gestion de PQRS',
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
          'Supervisa y responde las solicitudes de tus usuarios en tiempo real.',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: Colors.white.withValues(alpha: 0.72),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: searchController,
          onChanged: onSearchChanged,
          decoration: const InputDecoration(
            hintText: 'Buscar PQRS...',
            prefixIcon: Icon(Icons.search_rounded),
          ),
        ),
        const SizedBox(height: 18),
        if (loading)
          const SkeletonBox(height: 180)
        else if (tickets.isEmpty)
          const _AdminEmptyCard(
            icon: Icons.inbox_rounded,
            title: 'Sin PQRS',
            body: 'Cuando los usuarios escriban, sus casos apareceran aqui.',
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
        const _AdminInsightCard(),
      ],
    );
  }
}

class _AdminSettingsTab extends StatelessWidget {
  const _AdminSettingsTab();

  @override
  Widget build(BuildContext context) {
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
                  child: const Icon(
                    Icons.admin_panel_settings_rounded,
                    color: Color(0xFFAFCBFF),
                    size: 48,
                  ),
                ),
              ),
              const SizedBox(height: 22),
              Text(
                'Marcus Thorne',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Systems Administrator - Global Operations',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.white.withValues(alpha: 0.62),
                ),
              ),
              const SizedBox(height: 18),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: const [
                  _AdminBadge(label: 'Active Session'),
                  _AdminBadge(label: 'Tier: Executive'),
                ],
              ),
              const SizedBox(height: 24),
              FilledButton(onPressed: () {}, child: const Text('Edit Profile')),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Administrative Actions',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 14),
        GlassPanel(
          child: Column(
            children: const [
              _AdminActionRow(
                icon: Icons.map_outlined,
                title: 'Accepted Tours History',
                subtitle: 'Review and manage verified excursion logs',
              ),
              _AdminActionRow(
                icon: Icons.payments_outlined,
                title: 'Payment History',
                subtitle: 'Financial transactions and provider payouts',
              ),
              _AdminActionRow(
                icon: Icons.support_agent_rounded,
                title: 'PQRS History',
                subtitle: 'Customer inquiries, claims, and resolutions',
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        _PlatformPulseCard(),
      ],
    );
  }
}

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
            const Spacer(),
            FilledButton(onPressed: () {}, child: Text(action)),
          ],
        ),
      ),
    );
  }
}

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
                  '${tour.city}, ${tour.country} - ${tour.durationHours.toStringAsFixed(1)}h - ${tour.stops.length} paradas',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.white60),
                ),
                const SizedBox(height: 4),
                Text(
                  tour.isAiGenerated ? 'Creado con IA' : 'Creado manualmente',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: const Color(0xFFAFCBFF),
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          IconButton.filledTonal(
            tooltip: 'Aprobar',
            onPressed: onApprove,
            icon: const Icon(Icons.check_rounded),
          ),
          IconButton(
            tooltip: 'Rechazar',
            onPressed: onReject,
            icon: const Icon(Icons.close_rounded),
          ),
        ],
      ),
    );
  }
}

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
                    '${ticket.kindLabel} - ${ticket.createdAt.day.toString().padLeft(2, '0')}/${ticket.createdAt.month.toString().padLeft(2, '0')}',
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
    if (ticket == null) {
      return const _AdminEmptyCard(
        icon: Icons.reply_rounded,
        title: 'Selecciona un caso',
        body: 'El panel de respuesta aparece cuando eliges un PQRS.',
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
                  'Respuesta del administrador',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: const Color(0xFFAFCBFF),
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Text(
                'Borrador guardado',
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
              hintText: 'Escribe aqui la respuesta oficial para el usuario...',
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
              label: 'Guardar respuesta',
              icon: Icons.send_rounded,
              onPressed: onSave,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onPostpone,
              child: const Text('Posponer'),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusTag extends StatelessWidget {
  const _StatusTag({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
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
          answered ? 'RESPONDIDO' : 'PENDIENTE',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: answered ? const Color(0xFFAFCBFF) : const Color(0xFFFFC875),
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }
}

class _AdminInsightCard extends StatelessWidget {
  const _AdminInsightCard();

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 18,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Temas Populares',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 12),
          const _TopicBar(label: 'Reembolsos', value: 0.42),
          const _TopicBar(label: 'Horarios', value: 0.28),
          const _TopicBar(label: 'Facturacion', value: 0.15),
        ],
      ),
    );
  }
}

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

class _AdminActionRow extends StatelessWidget {
  const _AdminActionRow({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return ListTile(
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

class _AdminBadge extends StatelessWidget {
  const _AdminBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.28)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Text(
          label,
          style: const TextStyle(
            color: Color(0xFFAFCBFF),
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }
}

class _PlatformPulseCard extends StatelessWidget {
  const _PlatformPulseCard();

  @override
  Widget build(BuildContext context) {
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
            'Real-time system health and tour bookings.',
            style: TextStyle(color: Colors.white.withValues(alpha: 0.62)),
          ),
          const SizedBox(height: 28),
          SizedBox(
            height: 92,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                for (final value in const [0.55, 0.72, 0.92, 0.36, 0.64, 0.51])
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
                            ).withValues(alpha: value),
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
          const Text(
            'SYSTEM INTEGRITY',
            style: TextStyle(
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

class _AdminBottomNav extends StatelessWidget {
  const _AdminBottomNav({required this.currentIndex, required this.onChanged});

  final int currentIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final items = const [
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
      subject: json['subject']?.toString() ?? 'Sin asunto',
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

  String get kindLabel {
    return switch (kind) {
      'petition' => 'Peticion',
      'complaint' => 'Queja',
      'claim' => 'Reclamo',
      _ => 'Sugerencia',
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

final _demoTickets = [
  _AdminTicket(
    id: 'demo-1',
    kind: 'petition',
    subject: 'Duda sobre horarios en Medellin',
    body:
        'A que hora exactamente sale el transporte desde el punto de encuentro?',
    status: 'open',
    createdAt: DateTime(2026, 6, 10),
    isDemo: true,
  ),
  _AdminTicket(
    id: 'demo-2',
    kind: 'claim',
    subject: 'Imagen de tour repetida',
    body: 'Un tour aparece con una imagen que no corresponde al destino.',
    status: 'open',
    createdAt: DateTime(2026, 6, 10),
    isDemo: true,
  ),
];

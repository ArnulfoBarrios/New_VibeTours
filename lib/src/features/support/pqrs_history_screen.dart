import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';

class PqrsHistoryScreen extends ConsumerStatefulWidget {
  const PqrsHistoryScreen({super.key});

  @override
  ConsumerState<PqrsHistoryScreen> createState() => _PqrsHistoryScreenState();
}

class _PqrsHistoryScreenState extends ConsumerState<PqrsHistoryScreen> {
  bool _isLoading = true;
  List<_PqrsItem> _pqrsList = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPqrsHistory();
  }

  Future<void> _loadPqrsHistory() async {
    setState(() => _isLoading = true);
    try {
      final client = ref.read(supabaseClientProvider);
      final user = ref.read(authServiceProvider).currentUser;

      if (client == null || user == null) {
        setState(() {
          _error = 'No estás autenticado';
          _isLoading = false;
        });
        return;
      }

      final data = await client
          .from('pqrs')
          .select()
          .eq('user_id', user.id)
          .order('created_at', ascending: false)
          .limit(50);

      final items = [
        for (final row in data)
          _PqrsItem.fromJson(Map<String, dynamic>.from(row as Map)),
      ];

      setState(() {
        _pqrsList = items;
        _isLoading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = 'Error cargando historial: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 28),
      children: [
        Text(
          l10n.pqrsMyPqrs,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          l10n.pqrsHistorySub,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.72),
          ),
        ),
        const SizedBox(height: 20),
        if (_isLoading)
          const Center(
            child: CircularProgressIndicator(),
          )
        else if (_error != null)
          _ErrorCard(error: _error!)
        else if (_pqrsList.isEmpty)
          _EmptyCard(l10n: l10n)
        else
          ...[
            for (final pqrs in _pqrsList) ...[
              _PqrsHistoryCard(pqrs: pqrs, l10n: l10n),
              const SizedBox(height: 12),
            ],
          ],
      ],
    );
  }
}

class _PqrsItem {
  final String id;
  final String kind;
  final String subject;
  final String body;
  final String status;
  final String? adminResponse;
  final DateTime createdAt;
  final DateTime? respondedAt;

  _PqrsItem({
    required this.id,
    required this.kind,
    required this.subject,
    required this.body,
    required this.status,
    this.adminResponse,
    required this.createdAt,
    this.respondedAt,
  });

  factory _PqrsItem.fromJson(Map<String, dynamic> json) {
    return _PqrsItem(
      id: json['id']?.toString() ?? '',
      kind: json['kind']?.toString() ?? 'suggestion',
      subject: json['subject']?.toString() ?? '',
      body: json['body']?.toString() ?? '',
      status: json['status']?.toString() ?? 'open',
      adminResponse: json['admin_response']?.toString(),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
      respondedAt:
          DateTime.tryParse(json['responded_at']?.toString() ?? ''),
    );
  }

  String get kindLabel {
    return switch (kind) {
      'petition' => 'Petición',
      'complaint' => 'Queja',
      'claim' => 'Reclamo',
      _ => 'Sugerencia',
    };
  }

  String get statusLabel {
    return switch (status) {
      'answered' => 'RESPONDIDO',
      'open' => 'PENDIENTE',
      _ => status.toUpperCase(),
    };
  }

  Color get statusColor {
    return switch (status) {
      'answered' => AppTheme.primary,
      'open' => Colors.orange,
      _ => Colors.grey,
    };
  }
}

class _PqrsHistoryCard extends StatelessWidget {
  const _PqrsHistoryCard({required this.pqrs, required this.l10n});

  final _PqrsItem pqrs;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: pqrs.status == 'answered'
          ? () => _showResponseDialog(context)
          : null,
      child: GlassPanel(
        radius: 16,
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    pqrs.subject,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: pqrs.statusColor.withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    pqrs.status == 'answered' ? l10n.pqrsStatusAnswered : pqrs.status == 'open' ? l10n.pqrsStatusOpen : pqrs.statusLabel,
                    style: TextStyle(
                      color: pqrs.statusColor,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${pqrs.kindLabel} • ${pqrs.createdAt.day}/${pqrs.createdAt.month}/${pqrs.createdAt.year}',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: AppTheme.primary,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              pqrs.body,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.62),
              ),
            ),
            if (pqrs.status == 'answered' && pqrs.adminResponse != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppTheme.primary.withValues(alpha: 0.16),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.check_circle_rounded,
                      color: AppTheme.primary,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        l10n.pqrsTapToView,
                        style: TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.w600,
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
    );
  }

  void _showResponseDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          l10n.pqrsAdminResponse,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        content: SingleChildScrollView(
          child: Text(
            pqrs.adminResponse ?? 'Sin respuesta',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(l10n.pqrsClose),
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.error});

  final String error;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
      ),
      child: Text(
        error,
        style: const TextStyle(color: Colors.redAccent),
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({required this.l10n});
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 20),
      child: Column(
        children: [
          Icon(
            Icons.inbox_rounded,
            size: 64,
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.2),
          ),
          const SizedBox(height: 16),
          Text(
            l10n.pqrsEmpty,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          ),
        ],
      ),
    );
  }
}

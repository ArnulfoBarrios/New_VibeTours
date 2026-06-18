import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 28),
      children: [
        Text(
          'Mis PQRS',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Historial de tus solicitudes y respuestas del administrador',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: Colors.white.withValues(alpha: 0.72),
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
          _EmptyCard()
        else
          ...[
            for (final pqrs in _pqrsList) ...[
              _PqrsHistoryCard(pqrs: pqrs),
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
      'answered' => const Color(0xFFAFCBFF),
      'open' => const Color(0xFFFFC875),
      _ => Colors.grey,
    };
  }
}

class _PqrsHistoryCard extends StatelessWidget {
  const _PqrsHistoryCard({required this.pqrs});

  final _PqrsItem pqrs;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: pqrs.status == 'answered'
          ? () => _showResponseDialog(context)
          : null,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF141923).withValues(alpha: 0.82),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.11)),
        ),
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
                      color: Colors.white,
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
                    pqrs.statusLabel,
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
                color: const Color(0xFFAFCBFF),
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              pqrs.body,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.62),
              ),
            ),
            if (pqrs.status == 'answered' && pqrs.adminResponse != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFAFCBFF).withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: const Color(0xFFAFCBFF).withValues(alpha: 0.16),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.check_circle_rounded,
                      color: Color(0xFFAFCBFF),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Toca para ver la respuesta',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: const Color(0xFFAFCBFF),
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
        backgroundColor: const Color(0xFF141923),
        title: Text(
          'Respuesta del Administrador',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: Colors.white,
          ),
        ),
        content: SingleChildScrollView(
          child: Text(
            pqrs.adminResponse ?? 'Sin respuesta',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.white,
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cerrar'),
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
  const _EmptyCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: const Color(0xFF111821),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Column(
        children: [
          Icon(
            Icons.inbox_rounded,
            color: const Color(0xFFAFCBFF).withValues(alpha: 0.5),
            size: 48,
          ),
          const SizedBox(height: 16),
          Text(
            'Sin PQRS',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Cuando envíes un PQRS, aparecerá aquí',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.6),
            ),
          ),
        ],
      ),
    );
  }
}

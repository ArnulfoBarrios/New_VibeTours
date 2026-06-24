import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../state/app_state.dart';
import 'pqrs_history_screen.dart';

class PqrsScreen extends ConsumerStatefulWidget {
  const PqrsScreen({super.key});

  @override
  ConsumerState<PqrsScreen> createState() => _PqrsScreenState();
}

class _PqrsScreenState extends ConsumerState<PqrsScreen> {
  final _subject = TextEditingController();
  final _message = TextEditingController();
  String _kind = 'suggestion';
  bool _isSending = false;
  int _currentTab = 0;

  static const _kinds = {
    'petition': 'Petición',
    'complaint': 'Queja',
    'claim': 'Reclamo',
    'suggestion': 'Sugerencia',
  };

  @override
  void dispose() {
    _subject.dispose();
    _message.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
                    Text(
                      'VibeTours',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontSize: 31,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 14),
                    const _HeaderPill(),
                    const Spacer(),
                    IconButton.filledTonal(
                      onPressed: () => context.canPop() ? context.pop() : context.go('/settings'),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 26),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _currentTab = 0),
                        child: Column(
                          children: [
                            Text(
                              'Crear',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: _currentTab == 0 ? AppTheme.primary : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              height: 3,
                              color: _currentTab == 0 ? AppTheme.primary : Colors.transparent,
                            ),
                          ],
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _currentTab = 1),
                        child: Column(
                          children: [
                            Text(
                              'Historial',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: _currentTab == 1 ? AppTheme.primary : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              height: 3,
                              color: _currentTab == 1 ? AppTheme.primary : Colors.transparent,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: _currentTab == 0 ? _buildCreateForm(context) : const PqrsHistoryScreen(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCreateForm(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(26, 0, 26, 28),
      children: [
        _MainFormCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Crear PQRS',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Text(
                'Cuéntanos tu experiencia. Estamos aquí para escucharte y mejorar nuestro servicio.',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.78),
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 34),
              const _FieldTitle('Tipo de solicitud'),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                initialValue: _kind,
                items: [
                  for (final entry in _kinds.entries)
                    DropdownMenuItem(
                      value: entry.key,
                      child: Text(entry.value),
                    ),
                ],
                onChanged: _isSending ? null : (value) => setState(() => _kind = value ?? _kind),
                decoration: _inputDecoration('Selecciona una opción'),
              ),
              const SizedBox(height: 28),
              const _FieldTitle('Asunto'),
              const SizedBox(height: 10),
              TextField(
                controller: _subject,
                decoration: _inputDecoration('Resumen corto de tu solicitud'),
              ),
              const SizedBox(height: 28),
              const _FieldTitle('Mensaje'),
              const SizedBox(height: 10),
              TextField(
                controller: _message,
                minLines: 5,
                maxLines: 8,
                decoration: _inputDecoration('Describe detalladamente los hechos...'),
              ),
              const SizedBox(height: 38),
              SizedBox(
                width: double.infinity,
                height: 60,
                child: FilledButton.icon(
                  onPressed: _isSending ? null : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  label: Text(
                    _isSending ? 'Enviando...' : 'Enviar',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  icon: _isSending
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Icon(Icons.send_rounded, size: 24),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 40),
        Row(
          children: const [
            Expanded(
              child: _InfoCard(
                icon: Icons.schedule_rounded,
                title: 'Respuesta rápida',
                body: 'Menos de 24h hábiles',
              ),
            ),
            SizedBox(width: 20),
            Expanded(
              child: _InfoCard(
                icon: Icons.verified_user_rounded,
                title: 'Seguro',
                body: 'Cifrado SSL',
              ),
            ),
          ],
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String hint) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: isDark ? Colors.black26 : Colors.white60,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: BorderSide(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: BorderSide(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: const BorderSide(color: AppTheme.primary),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
    );
  }

  Future<void> _submit() async {
    final subject = _subject.text.trim();
    final body = _message.text.trim();
    if (subject.length < 4 || body.length < 12) {
      _snack('Completa asunto y mensaje con mas detalle.');
      return;
    }
    final client = ref.read(supabaseClientProvider);
    final user = ref.read(authServiceProvider).currentUser;
    if (client == null) {
      _snack('Supabase no esta configurado para enviar PQRS.');
      return;
    }
    if (user == null) {
      _snack('Inicia sesion para enviar tu PQRS.');
      context.push('/login');
      return;
    }
    setState(() => _isSending = true);
    try {
      await client.from('pqrs').insert({
        'user_id': user.id,
        'kind': _kind,
        'subject': subject,
        'body': body,
      });
      _subject.clear();
      _message.clear();
      _snack('PQRS enviada. Te responderemos en menos de 24h habiles.');
    } catch (error) {
      _snack(error.toString());
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  void _snack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(SnackBar(content: Text(message)));
  }
}

class _HeaderPill extends StatelessWidget {
  const _HeaderPill();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        child: Text(
          'Soporte',
          style: TextStyle(color: Theme.of(context).colorScheme.onPrimaryContainer, fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}

class _MainFormCard extends StatelessWidget {
  const _MainFormCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 34,
      padding: const EdgeInsets.all(32),
      child: child,
    );
  }
}

class _FieldTitle extends StatelessWidget {
  const _FieldTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.bold,
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.icon, required this.title, required this.body});

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 24,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppTheme.primary, size: 28),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            body,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7)),
          ),
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
    final color = isDark ? AppTheme.primary.withValues(alpha: 0.1) : AppTheme.primary.withValues(alpha: 0.05);
    final paint = Paint()
      ..shader = RadialGradient(
        colors: [color, Colors.transparent],
      ).createShader(
        Rect.fromCircle(
          center: Offset(size.width * 0.5, size.height * 0.48),
          radius: size.width * 0.9,
        ),
      );
    canvas.drawRect(Offset.zero & size, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

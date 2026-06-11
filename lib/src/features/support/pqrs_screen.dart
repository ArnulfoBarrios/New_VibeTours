import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../state/app_state.dart';

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

  static const _kinds = {
    'petition': 'Peticion',
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
    return Scaffold(
      backgroundColor: const Color(0xFF090E18),
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(child: CustomPaint(painter: _SupportGlowPainter())),
            ListView(
              padding: const EdgeInsets.fromLTRB(26, 28, 26, 28),
              children: [
                Row(
                  children: [
                    Text(
                      'VibeTours',
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(
                            color: const Color(0xFFC8DAFF),
                            fontSize: 31,
                          ),
                    ),
                    const SizedBox(width: 14),
                    const _HeaderPill(),
                    const Spacer(),
                    IconButton(
                      onPressed: () => context.canPop()
                          ? context.pop()
                          : context.go('/settings'),
                      icon: const Icon(Icons.close_rounded),
                      color: Colors.white70,
                    ),
                  ],
                ),
                const SizedBox(height: 26),
                _MainFormCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Crear PQRS',
                        style: Theme.of(context).textTheme.headlineMedium
                            ?.copyWith(color: Colors.white, fontSize: 28),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Cuentanos tu experiencia. Estamos aqui para escucharte y mejorar nuestro servicio.',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white.withValues(alpha: 0.78),
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
                        onChanged: _isSending
                            ? null
                            : (value) => setState(() => _kind = value ?? _kind),
                        decoration: _inputDecoration('Selecciona una opcion'),
                        dropdownColor: const Color(0xFF111821),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 28),
                      const _FieldTitle('Asunto'),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _subject,
                        style: const TextStyle(color: Colors.white),
                        decoration: _inputDecoration(
                          'Resumen corto de tu solicitud',
                        ),
                      ),
                      const SizedBox(height: 28),
                      const _FieldTitle('Mensaje'),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _message,
                        minLines: 5,
                        maxLines: 8,
                        style: const TextStyle(color: Colors.white),
                        decoration: _inputDecoration(
                          'Describe detalladamente los hechos...',
                        ),
                      ),
                      const SizedBox(height: 38),
                      SizedBox(
                        width: double.infinity,
                        height: 76,
                        child: FilledButton.icon(
                          onPressed: _isSending ? null : _submit,
                          style: FilledButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(28),
                            ),
                            elevation: 24,
                            shadowColor: AppTheme.primary.withValues(
                              alpha: 0.36,
                            ),
                          ),
                          label: Text(
                            _isSending ? 'Enviando...' : 'Enviar',
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          icon: _isSending
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.send_rounded, size: 31),
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
                        title: 'Respuesta rapida',
                        body: 'Menos de 24h habiles',
                      ),
                    ),
                    SizedBox(width: 28),
                    Expanded(
                      child: _InfoCard(
                        icon: Icons.verified_user_rounded,
                        title: 'Seguro',
                        body: 'Cifrado SSL',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 48),
                Text(
                  'NECESITAS AYUDA INMEDIATA? CONTACTAR POR WHATSAPP',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: const Color(0xFFC8DAFF),
                    letterSpacing: 1.2,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: const Color(0xFF090E18).withValues(alpha: 0.72),
      hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.28)),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(28),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.18)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(28),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.18)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(28),
        borderSide: const BorderSide(color: AppTheme.primary),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 22),
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
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
      ),
      child: const Padding(
        padding: EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        child: Text(
          'Help Center',
          style: TextStyle(
            color: Colors.white70,
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
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
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xFF141923).withValues(alpha: 0.88),
        borderRadius: BorderRadius.circular(34),
        border: Border.all(color: Colors.white.withValues(alpha: 0.13)),
      ),
      child: Padding(padding: const EdgeInsets.all(40), child: child),
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
        color: Colors.white.withValues(alpha: 0.78),
        fontWeight: FontWeight.w800,
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xFF141923).withValues(alpha: 0.82),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withValues(alpha: 0.11)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 58,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.22),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Icon(icon, color: const Color(0xFFC8DAFF)),
            ),
            const SizedBox(width: 18),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(
                      context,
                    ).textTheme.titleMedium?.copyWith(color: Colors.white),
                  ),
                  Text(
                    body,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.white.withValues(alpha: 0.72),
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

class _SupportGlowPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader =
          RadialGradient(
            colors: [
              AppTheme.primary.withValues(alpha: 0.18),
              Colors.transparent,
            ],
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

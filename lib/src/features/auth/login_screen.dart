import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../state/app_state.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _isCreatingAccount = false;
  bool _isLoading = false;
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF070D18),
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(child: CustomPaint(painter: _LoginGlowPainter())),
            ListView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: IconButton(
                    onPressed: () => context.canPop()
                        ? context.pop()
                        : context.go('/settings'),
                    icon: const Icon(Icons.close_rounded),
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 4),
                const _LoginLogo(),
                const SizedBox(height: 26),
                Text(
                  'VibeTours',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.displayLarge?.copyWith(
                    color: const Color(0xFF348BFF),
                    fontSize: 48,
                  ),
                ),
                const SizedBox(height: 96),
                _LoginCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const _FieldLabel('EMAIL ADDRESS'),
                      const SizedBox(height: 8),
                      _LoginTextField(
                        controller: _email,
                        icon: Icons.mail_outline_rounded,
                        hint: 'name@example.com',
                        keyboardType: TextInputType.emailAddress,
                        autofillHints: const [AutofillHints.email],
                      ),
                      const SizedBox(height: 26),
                      Row(
                        children: [
                          const Expanded(child: _FieldLabel('PASSWORD')),
                          TextButton(
                            onPressed: _isLoading ? null : _forgotPassword,
                            child: const Text('Forgot?'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      _LoginTextField(
                        controller: _password,
                        icon: Icons.lock_outline_rounded,
                        hint: '********',
                        obscureText: _obscure,
                        autofillHints: const [AutofillHints.password],
                        trailing: IconButton(
                          onPressed: () => setState(() => _obscure = !_obscure),
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_rounded
                                : Icons.visibility_off_rounded,
                          ),
                        ),
                      ),
                      const SizedBox(height: 48),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: FilledButton.icon(
                          onPressed: _isLoading ? null : _submitPassword,
                          style: FilledButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            foregroundColor: const Color(0xFF07101D),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(999),
                            ),
                            elevation: 18,
                            shadowColor: AppTheme.primary.withValues(
                              alpha: 0.45,
                            ),
                          ),
                          label: Text(
                            _isCreatingAccount ? 'Create' : 'Sign In',
                          ),
                          icon: _isLoading
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Icons.arrow_forward_rounded),
                        ),
                      ),
                      const SizedBox(height: 20),
                      const _OrDivider(),
                      const SizedBox(height: 18),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: OutlinedButton.icon(
                          onPressed: _isLoading ? null : _continueWithGoogle,
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white.withValues(
                              alpha: 0.86,
                            ),
                            side: BorderSide(
                              color: Colors.white.withValues(alpha: 0.14),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(999),
                            ),
                          ),
                          icon: const _GoogleMark(),
                          label: const Text('Continue with Google'),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Center(
                        child: TextButton(
                          onPressed: _isLoading
                              ? null
                              : () => setState(
                                  () =>
                                      _isCreatingAccount = !_isCreatingAccount,
                                ),
                          child: Text(
                            _isCreatingAccount
                                ? 'Already have an account? Sign in'
                                : 'Create account',
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 96),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    TextButton(
                      onPressed: () => context.push('/legal/terms'),
                      child: const Text('TERMS'),
                    ),
                    Text(
                      '/',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.36),
                      ),
                    ),
                    TextButton(
                      onPressed: () => context.push('/legal/privacy'),
                      child: const Text('PRIVACY'),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitPassword() async {
    final email = _email.text.trim();
    final password = _password.text;
    if (email.isEmpty || password.length < 6) {
      _message('Ingresa email y una contrasena de al menos 6 caracteres.');
      return;
    }
    setState(() => _isLoading = true);
    try {
      final auth = ref.read(authServiceProvider);
      if (_isCreatingAccount) {
        await auth.signUpWithPassword(email: email, password: password);
        _message('Cuenta creada. Revisa tu correo si Supabase pide confirmar.');
      } else {
        await auth.signInWithPassword(email: email, password: password);
        if (mounted) context.go('/home');
      }
    } catch (error) {
      _message(_friendlyError(error));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _continueWithGoogle() async {
    setState(() => _isLoading = true);
    try {
      await ref.read(authServiceProvider).signInWithGoogle();
      if (mounted) context.go('/home');
    } catch (error) {
      _message(_friendlyError(error));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _forgotPassword() async {
    final email = _email.text.trim();
    if (email.isEmpty) {
      _message('Escribe tu email para enviarte el enlace de recuperacion.');
      return;
    }
    setState(() => _isLoading = true);
    try {
      await ref.read(authServiceProvider).sendPasswordReset(email);
      _message('Te enviamos un enlace de recuperacion.');
    } catch (error) {
      _message(_friendlyError(error));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _friendlyError(Object error) {
    final text = error.toString();
    if (text.contains('Supabase no esta configurado')) {
      return 'Configura SUPABASE_URL y SUPABASE_ANON_KEY para iniciar sesion.';
    }
    if (text.contains('GOOGLE_WEB_CLIENT_ID')) {
      return 'Agrega GOOGLE_WEB_CLIENT_ID para usar Google nativo.';
    }
    return text.replaceFirst('Exception: ', '');
  }

  void _message(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(SnackBar(content: Text(message)));
  }
}

class _LoginLogo extends StatelessWidget {
  const _LoginLogo();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 96,
        height: 96,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
        ),
        child: const Center(
          child: Icon(Icons.public_rounded, color: AppTheme.primary, size: 42),
        ),
      ),
    );
  }
}

class _LoginCard extends StatelessWidget {
  const _LoginCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xFF111821).withValues(alpha: 0.82),
        borderRadius: BorderRadius.circular(34),
        border: Border.all(color: Colors.white.withValues(alpha: 0.13)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.34),
            blurRadius: 40,
            offset: const Offset(0, 24),
          ),
        ],
      ),
      child: Padding(padding: const EdgeInsets.all(34), child: child),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context).textTheme.labelLarge?.copyWith(
        color: Colors.white.withValues(alpha: 0.64),
        fontSize: 12,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}

class _LoginTextField extends StatelessWidget {
  const _LoginTextField({
    required this.controller,
    required this.icon,
    required this.hint,
    this.keyboardType,
    this.obscureText = false,
    this.autofillHints,
    this.trailing,
  });

  final TextEditingController controller;
  final IconData icon;
  final String hint;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Iterable<String>? autofillHints;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      autofillHints: autofillHints,
      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, color: AppTheme.primary),
        suffixIcon: trailing,
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.06),
        hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.72)),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: const BorderSide(color: AppTheme.primary, width: 1.3),
        ),
      ),
    );
  }
}

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: Divider(color: Colors.white.withValues(alpha: 0.08))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Text(
            'OR',
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Colors.white.withValues(alpha: 0.46),
            ),
          ),
        ),
        Expanded(child: Divider(color: Colors.white.withValues(alpha: 0.08))),
      ],
    );
  }
}

class _GoogleMark extends StatelessWidget {
  const _GoogleMark();

  @override
  Widget build(BuildContext context) {
    return const Text(
      'G',
      style: TextStyle(
        color: Color(0xFF4285F4),
        fontWeight: FontWeight.w900,
        fontSize: 20,
      ),
    );
  }
}

class _LoginGlowPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader =
          RadialGradient(
            colors: [
              AppTheme.primary.withValues(alpha: 0.22),
              Colors.transparent,
            ],
          ).createShader(
            Rect.fromCircle(
              center: Offset(size.width * 0.55, size.height * 0.46),
              radius: size.width * 0.75,
            ),
          );
    canvas.drawRect(Offset.zero & size, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

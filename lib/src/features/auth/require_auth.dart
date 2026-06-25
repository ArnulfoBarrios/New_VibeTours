import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';

class RequireAuth extends ConsumerWidget {
  const RequireAuth({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authUserProvider);
    return user.when(
      data: (value) {
        if (value != null) return child;
        return const _SignInRequired();
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => _SignInRequired(error: error.toString()),
    );
  }
}

class _SignInRequired extends StatelessWidget {
  const _SignInRequired({this.error});

  final String? error;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 48, 20, 120),
      children: [
        GlassPanel(
          padding: const EdgeInsets.all(24),
          radius: 30,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.14),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.lock_rounded,
                  color: AppTheme.primary,
                  size: 30,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                AppLocalizations.of(context).authRequireTitle,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                error ?? AppLocalizations.of(context).authRequireBody,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 20),
              LiquidButton(
                label: AppLocalizations.of(context).authLogin,
                icon: Icons.login_rounded,
                onPressed: () => context.push('/login'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

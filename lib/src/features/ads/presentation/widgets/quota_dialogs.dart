import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/design/app_theme.dart';
import '../../../../core/services/ad_service.dart';
import '../../../../domain/tour_quota.dart';
import '../../../../state/app_state.dart';

/// Centralized helper and UI dialogs for enforcing tour creation
/// and live voice guide query quotas with rewarded ads.
class QuotaEnforcement {
  /// Validates whether the user can create a tour right now.
  /// If the quota is exhausted, automatically displays the corresponding
  /// dialog (guest limit, rewarded ad offer, or weekly ceiling).
  ///
  /// Returns `true` if the user is allowed to proceed with creating the tour,
  /// or `false` if they are blocked / cancelled.
  static Future<bool> checkAndEnforceTourCreation(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final quota = await ref.read(tourQuotaProvider.future);

    // 1. Quota is still available -> allow creation
    if (quota.canCreate) {
      return true;
    }

    if (!context.mounted) return false;

    // 2. Unauthenticated guest exceeded 1 preview tour
    if (quota.isGuest) {
      await showDialog<bool>(
        context: context,
        barrierDismissible: true,
        builder: (ctx) => const _GuestTourQuotaDialog(),
      );
      return false;
    }

    // 3. Authenticated user exhausted base quota, but can watch a rewarded ad
    if (quota.canWatchAdForBonus) {
      final rewardGranted = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => _RewardedTourQuotaDialog(quota: quota),
      );
      return rewardGranted ?? false;
    }

    // 4. Authenticated user reached weekly ceiling (5 tours)
    await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => _TourWeeklyLimitReachedDialog(quota: quota),
    );
    return false;
  }

  /// Validates whether the user can ask another voice question in the live tour.
  /// If exhausted, prompts to watch an ad for +2 extra queries (up to 10 bonus).
  ///
  /// Returns `true` if a query is available (and consumes it), or `false` if blocked.
  static Future<bool> checkAndEnforceVoiceQuery(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final quota = ref.read(voiceTourQuotaProvider);

    // 1. Query available -> consume it and allow
    if (quota.canAskQuestion) {
      ref.read(voiceTourQuotaProvider.notifier).useQuery();
      return true;
    }

    if (!context.mounted) return false;

    // 2. Can watch a rewarded ad for +2 bonus queries
    if (quota.canWatchAdForBonus) {
      final rewardGranted = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => _RewardedVoiceQuotaDialog(quota: quota),
      );
      if (rewardGranted == true) {
        // Consume 1 query from the newly earned 2
        ref.read(voiceTourQuotaProvider.notifier).useQuery();
        return true;
      }
      return false;
    }

    // 3. Absolute ceiling reached for this tour (15 queries total)
    await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => const _VoiceTourLimitReachedDialog(),
    );
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIALOG WIDGETS
// ─────────────────────────────────────────────────────────────────────────────

class _GuestTourQuotaDialog extends StatelessWidget {
  const _GuestTourQuotaDialog();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final vibe = Theme.of(context).extension<VibeColors>();

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Container(
        decoration: BoxDecoration(
          color: vibe?.glassStrong ?? (isDark ? const Color(0xFF1E1E2E) : Colors.white),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: vibe?.luminousBorder ?? Colors.white.withValues(alpha: 0.15),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.08),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 68,
              height: 68,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [Colors.orange, AppTheme.primary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: const Icon(Icons.explore_off_rounded, color: Colors.white, size: 34),
            ),
            const SizedBox(height: 20),
            Text(
              'Límite de prueba alcanzado',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Has completado tu primer tour de prueba como invitado. Para continuar creando y disfrutar de 3 tours gratuitos cada semana, ingresa a tu cuenta.',
              style: TextStyle(
                fontSize: 14,
                height: 1.45,
                color: isDark ? Colors.white70 : Colors.black54,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('Cancelar'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: () {
                      Navigator.of(context).pop(false);
                      context.push('/login');
                    },
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: AppTheme.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('Iniciar sesión'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _RewardedTourQuotaDialog extends ConsumerStatefulWidget {
  const _RewardedTourQuotaDialog({required this.quota});
  final TourQuota quota;

  @override
  ConsumerState<_RewardedTourQuotaDialog> createState() =>
      _RewardedTourQuotaDialogState();
}

class _RewardedTourQuotaDialogState extends ConsumerState<_RewardedTourQuotaDialog> {
  bool _isLoadingAd = false;

  void _watchAd() {
    setState(() => _isLoadingAd = true);

    bool rewardEarned = false;
    AdService.instance.showRewardedAd(
      onRewardEarned: () async {
        rewardEarned = true;
        await ref.read(tourQuotaProvider.notifier).addBonusTour();
      },
      onAdClosed: () {
        if (!mounted) return;
        setState(() => _isLoadingAd = false);
        if (rewardEarned) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🎉 ¡Genial! Has desbloqueado 1 tour adicional.'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: AppTheme.primary,
            ),
          );
          Navigator.of(context).pop(true);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Debes ver el video completo para obtener el tour extra.'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final vibe = Theme.of(context).extension<VibeColors>();

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Container(
        decoration: BoxDecoration(
          color: vibe?.glassStrong ?? (isDark ? const Color(0xFF1E1E2E) : Colors.white),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: vibe?.luminousBorder ?? Colors.white.withValues(alpha: 0.15),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.08),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 68,
              height: 68,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [AppTheme.primary, AppTheme.indigo],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: const Icon(Icons.card_giftcard_rounded, color: Colors.white, size: 34),
            ),
            const SizedBox(height: 20),
            Text(
              '¡Desbloquea 1 tour extra!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Has alcanzado tus 3 tours semanales gratuitos. Mira un video corto para obtener 1 tour adicional inmediatamente.',
              style: TextStyle(
                fontSize: 14,
                height: 1.45,
                color: isDark ? Colors.white70 : Colors.black54,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.videocam_rounded, size: 18, color: AppTheme.primary),
                  const SizedBox(width: 8),
                  Text(
                    'Anuncios disponibles esta semana: ${widget.quota.remainingBonusAds} de 2',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.primary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isLoadingAd ? null : () => Navigator.of(context).pop(false),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('Ahora no'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _isLoadingAd ? null : _watchAd,
                    icon: _isLoadingAd
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.play_circle_fill_rounded, size: 18),
                    label: Text(_isLoadingAd ? 'Cargando...' : 'Ver anuncio'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: AppTheme.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TourWeeklyLimitReachedDialog extends StatelessWidget {
  const _TourWeeklyLimitReachedDialog({required this.quota});
  final TourQuota quota;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final vibe = Theme.of(context).extension<VibeColors>();

    final resetDate = quota.nextResetDate;
    final dateFormatted = resetDate != null
        ? '${resetDate.day}/${resetDate.month}/${resetDate.year}'
        : 'la próxima semana';

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Container(
        decoration: BoxDecoration(
          color: vibe?.glassStrong ?? (isDark ? const Color(0xFF1E1E2E) : Colors.white),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: vibe?.luminousBorder ?? Colors.white.withValues(alpha: 0.15),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.08),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 68,
              height: 68,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.amber.withValues(alpha: 0.15),
              ),
              child: const Icon(Icons.hourglass_top_rounded, color: Colors.amber, size: 34),
            ),
            const SizedBox(height: 20),
            Text(
              'Límite semanal alcanzado',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Has aprovechado al máximo tus 5 tours disponibles esta semana (3 base + 2 extras con anuncios).',
              style: TextStyle(
                fontSize: 14,
                height: 1.45,
                color: isDark ? Colors.white70 : Colors.black54,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  const Icon(Icons.refresh_rounded, size: 20, color: AppTheme.primary),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Tu cuota se reiniciará el $dateFormatted.',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.of(context).pop(false),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: AppTheme.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Entendido'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RewardedVoiceQuotaDialog extends ConsumerStatefulWidget {
  const _RewardedVoiceQuotaDialog({required this.quota});
  final VoiceTourQuota quota;

  @override
  ConsumerState<_RewardedVoiceQuotaDialog> createState() =>
      _RewardedVoiceQuotaDialogState();
}

class _RewardedVoiceQuotaDialogState extends ConsumerState<_RewardedVoiceQuotaDialog> {
  bool _isLoadingAd = false;

  void _watchAd() {
    setState(() => _isLoadingAd = true);

    bool rewardEarned = false;
    AdService.instance.showRewardedAd(
      onRewardEarned: () {
        rewardEarned = true;
        ref.read(voiceTourQuotaProvider.notifier).addBonusQueries(VoiceTourQuota.queriesPerAd);
      },
      onAdClosed: () {
        if (!mounted) return;
        setState(() => _isLoadingAd = false);
        if (rewardEarned) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🎙️ ¡+2 consultas de voz añadidas a tu recorrido!'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: AppTheme.primary,
            ),
          );
          Navigator.of(context).pop(true);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Debes completar el anuncio para recibir las consultas extra.'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final vibe = Theme.of(context).extension<VibeColors>();

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Container(
        decoration: BoxDecoration(
          color: vibe?.glassStrong ?? (isDark ? const Color(0xFF1E1E2E) : Colors.white),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: vibe?.luminousBorder ?? Colors.white.withValues(alpha: 0.15),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.08),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 68,
              height: 68,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [AppTheme.primary, AppTheme.indigo],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: const Icon(Icons.mic_none_rounded, color: Colors.white, size: 34),
            ),
            const SizedBox(height: 20),
            Text(
              'Consultas de voz agotadas',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Has utilizado las 5 preguntas por voz de este tour. Mira un video corto para recibir 2 consultas adicionales inmediatamente.',
              style: TextStyle(
                fontSize: 14,
                height: 1.45,
                color: isDark ? Colors.white70 : Colors.black54,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.star_rounded, size: 18, color: AppTheme.primary),
                  const SizedBox(width: 8),
                  Text(
                    'Extras desbloqueadas: ${widget.quota.bonusQueriesEarned} de 10',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.primary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isLoadingAd ? null : () => Navigator.of(context).pop(false),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('Cancelar'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _isLoadingAd ? null : _watchAd,
                    icon: _isLoadingAd
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.play_circle_fill_rounded, size: 18),
                    label: Text(_isLoadingAd ? 'Cargando...' : '+2 Consultas'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: AppTheme.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _VoiceTourLimitReachedDialog extends StatelessWidget {
  const _VoiceTourLimitReachedDialog();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final vibe = Theme.of(context).extension<VibeColors>();

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Container(
        decoration: BoxDecoration(
          color: vibe?.glassStrong ?? (isDark ? const Color(0xFF1E1E2E) : Colors.white),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: vibe?.luminousBorder ?? Colors.white.withValues(alpha: 0.15),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.08),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 68,
              height: 68,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.amber.withValues(alpha: 0.15),
              ),
              child: const Icon(Icons.mic_off_rounded, color: Colors.amber, size: 34),
            ),
            const SizedBox(height: 20),
            Text(
              'Límite de voz alcanzado',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Has alcanzado el límite máximo de 15 consultas por voz disponibles para este recorrido (5 base + 10 extras con anuncios).',
              style: TextStyle(
                fontSize: 14,
                height: 1.45,
                color: isDark ? Colors.white70 : Colors.black54,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.of(context).pop(false),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: AppTheme.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Entendido'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

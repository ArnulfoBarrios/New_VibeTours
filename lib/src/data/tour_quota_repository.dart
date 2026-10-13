import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/tour_quota.dart';

/// Repository responsible for persisting and checking tour quotas
/// for both guest users (locally) and registered users (via Supabase).
class TourQuotaRepository {
  TourQuotaRepository({
    SupabaseClient? client,
    required SharedPreferences prefs,
  })  : _client = client,
        _prefs = prefs;

  final SupabaseClient? _client;
  final SharedPreferences _prefs;

  /// SharedPreferences key tracking how many tours an unauthenticated guest has created.
  static const String guestTourCreatedKey = 'vibetours_guest_tours_created_count';

  /// Fetches the current tour quota for a user.
  /// If [userId] is null or empty, treats as an unauthenticated guest.
  Future<TourQuota> getQuota({String? userId}) async {
    if (userId == null || userId.trim().isEmpty) {
      final guestCount = _prefs.getInt(guestTourCreatedKey) ?? 0;
      return TourQuota.guest(createdCount: guestCount);
    }

    final client = _client;
    if (client == null) {
      return TourQuota.initialAuthenticated();
    }

    try {
      final res = await client
          .from('users')
          .select('weekly_tours_created, weekly_bonus_tours, weekly_tours_reset_at')
          .eq('id', userId)
          .maybeSingle();

      if (res == null) {
        return TourQuota.initialAuthenticated();
      }

      int created = (res['weekly_tours_created'] as num?)?.toInt() ?? 0;
      int bonus = (res['weekly_bonus_tours'] as num?)?.toInt() ?? 0;
      final rawResetAt = res['weekly_tours_reset_at']?.toString();
      DateTime resetAt = rawResetAt != null
          ? (DateTime.tryParse(rawResetAt) ?? DateTime.now())
          : DateTime.now();

      // Check if 7 days have passed since the cycle started to reset weekly counters
      final now = DateTime.now();
      if (now.difference(resetAt).inDays >= 7) {
        created = 0;
        bonus = 0;
        resetAt = now;

        unawaited(
          client.from('users').update({
            'weekly_tours_created': 0,
            'weekly_bonus_tours': 0,
            'weekly_tours_reset_at': now.toIso8601String(),
          }).eq('id', userId),
        );
      }

      return TourQuota.authenticated(
        createdCount: created,
        bonusCount: bonus,
        resetAt: resetAt,
      );
    } catch (e) {
      debugPrint('[TourQuotaRepository] Error fetching quota for user $userId: $e');
      return TourQuota.initialAuthenticated();
    }
  }

  /// Records that a tour has been successfully created.
  Future<TourQuota> recordTourCreated({String? userId}) async {
    if (userId == null || userId.trim().isEmpty) {
      final current = _prefs.getInt(guestTourCreatedKey) ?? 0;
      final next = current + 1;
      await _prefs.setInt(guestTourCreatedKey, next);
      return TourQuota.guest(createdCount: next);
    }

    final quota = await getQuota(userId: userId);
    final nextCreated = quota.createdCount + 1;

    final client = _client;
    if (client != null) {
      try {
        await client.from('users').update({
          'weekly_tours_created': nextCreated,
        }).eq('id', userId);
      } catch (e) {
        debugPrint('[TourQuotaRepository] Error updating created tours: $e');
      }
    }

    return quota.copyWith(createdCount: nextCreated);
  }

  /// Adds a bonus tour after successfully watching a rewarded ad.
  /// Only allowed for authenticated users up to [TourQuota.maxBonusAllowed] (max 2).
  Future<TourQuota> addBonusTour({required String userId}) async {
    final quota = await getQuota(userId: userId);
    if (quota.isGuest || quota.bonusCount >= quota.maxBonusAllowed) {
      return quota;
    }

    final nextBonus = quota.bonusCount + 1;
    final client = _client;
    if (client != null) {
      try {
        await client.from('users').update({
          'weekly_bonus_tours': nextBonus,
        }).eq('id', userId);
      } catch (e) {
        debugPrint('[TourQuotaRepository] Error adding bonus tour: $e');
      }
    }

    return quota.copyWith(bonusCount: nextBonus);
  }
}

import 'package:flutter_test/flutter_test.dart';
import 'package:vibetoursapp/src/domain/tour_quota.dart';

void main() {
  group('TourQuota Domain Model', () {
    test('should allow 1 tour and block second when user is guest', () {
      final freshGuest = TourQuota.guest(createdCount: 0);
      expect(freshGuest.baseLimit, 1);
      expect(freshGuest.maxBonusAllowed, 0);
      expect(freshGuest.totalLimit, 1);
      expect(freshGuest.remaining, 1);
      expect(freshGuest.canCreate, true);
      expect(freshGuest.canWatchAdForBonus, false);

      final usedGuest = TourQuota.guest(createdCount: 1);
      expect(usedGuest.remaining, 0);
      expect(usedGuest.canCreate, false);
      expect(usedGuest.canWatchAdForBonus, false);
      expect(usedGuest.hasReachedAbsoluteLimit, false);
    });

    test('should allow 3 base tours when user is authenticated', () {
      final userQuota = TourQuota.initialAuthenticated();
      expect(userQuota.baseLimit, 3);
      expect(userQuota.maxBonusAllowed, 2);
      expect(userQuota.totalLimit, 3);
      expect(userQuota.remaining, 3);
      expect(userQuota.canCreate, true);
      expect(userQuota.canWatchAdForBonus, false);
    });

    test('should offer rewarded ad when authenticated user exhausts 3 base tours', () {
      final userQuota = TourQuota.authenticated(
        createdCount: 3,
        bonusCount: 0,
        resetAt: DateTime.now(),
      );
      expect(userQuota.remaining, 0);
      expect(userQuota.canCreate, false);
      expect(userQuota.canWatchAdForBonus, true);
      expect(userQuota.remainingBonusAds, 2);
      expect(userQuota.hasReachedAbsoluteLimit, false);
    });

    test('should allow 4 tours when 1 bonus ad is redeemed', () {
      final userQuota = TourQuota.authenticated(
        createdCount: 3,
        bonusCount: 1,
        resetAt: DateTime.now(),
      );
      expect(userQuota.totalLimit, 4);
      expect(userQuota.remaining, 1);
      expect(userQuota.canCreate, true);
      expect(userQuota.canWatchAdForBonus, false);
      expect(userQuota.remainingBonusAds, 1);
    });

    test('should enforce weekly ceiling of 5 tours when 2 bonus ads are redeemed and 5 tours created', () {
      final userQuota = TourQuota.authenticated(
        createdCount: 5,
        bonusCount: 2,
        resetAt: DateTime.now(),
      );
      expect(userQuota.totalLimit, 5);
      expect(userQuota.remaining, 0);
      expect(userQuota.canCreate, false);
      expect(userQuota.canWatchAdForBonus, false);
      expect(userQuota.remainingBonusAds, 0);
      expect(userQuota.hasReachedAbsoluteLimit, true);
    });

    test('should calculate next reset date 7 days after resetAt', () {
      final now = DateTime(2026, 10, 13, 10, 0);
      final quota = TourQuota.authenticated(
        createdCount: 2,
        bonusCount: 0,
        resetAt: now,
      );
      expect(quota.nextResetDate, DateTime(2026, 10, 20, 10, 0));
    });
  });

  group('VoiceTourQuota Domain Model', () {
    test('should grant 5 free queries when tour session starts', () {
      const quota = VoiceTourQuota();
      expect(quota.totalLimit, 5);
      expect(quota.remaining, 5);
      expect(quota.canAskQuestion, true);
      expect(quota.canWatchAdForBonus, false);
      expect(quota.hasReachedMaxBonus, false);
    });

    test('should offer rewarded ad when 5 base queries are exhausted', () {
      const quota = VoiceTourQuota(queriesUsed: 5, bonusQueriesEarned: 0);
      expect(quota.remaining, 0);
      expect(quota.canAskQuestion, false);
      expect(quota.canWatchAdForBonus, true);
      expect(quota.remainingBonusQueriesPossible, 10);
    });

    test('should grant 2 extra queries when an ad is watched', () {
      const quota = VoiceTourQuota(queriesUsed: 5, bonusQueriesEarned: 2);
      expect(quota.totalLimit, 7);
      expect(quota.remaining, 2);
      expect(quota.canAskQuestion, true);
    });

    test('should reach maximum ceiling when 10 extra queries are earned and 15 used', () {
      const quota = VoiceTourQuota(queriesUsed: 15, bonusQueriesEarned: 10);
      expect(quota.totalLimit, 15);
      expect(quota.remaining, 0);
      expect(quota.canAskQuestion, false);
      expect(quota.canWatchAdForBonus, false);
      expect(quota.hasReachedMaxBonus, true);
    });
  });
}

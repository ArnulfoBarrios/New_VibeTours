/// Represents the tour creation quota for a user (guest or authenticated).
class TourQuota {
  const TourQuota({
    required this.createdCount,
    required this.bonusCount,
    this.resetAt,
    required this.isGuest,
  });

  /// Factory constructor for a guest user with local count.
  factory TourQuota.guest({required int createdCount}) {
    return TourQuota(
      createdCount: createdCount,
      bonusCount: 0,
      resetAt: null,
      isGuest: true,
    );
  }

  /// Factory constructor for an authenticated user.
  factory TourQuota.authenticated({
    required int createdCount,
    required int bonusCount,
    required DateTime resetAt,
  }) {
    return TourQuota(
      createdCount: createdCount,
      bonusCount: bonusCount,
      resetAt: resetAt,
      isGuest: false,
    );
  }

  /// Initial empty quota for an authenticated user.
  factory TourQuota.initialAuthenticated() {
    return TourQuota(
      createdCount: 0,
      bonusCount: 0,
      resetAt: DateTime.now(),
      isGuest: false,
    );
  }

  /// Number of tours already created in the current cycle.
  final int createdCount;

  /// Number of bonus tours unlocked by watching rewarded ads in the current cycle.
  final int bonusCount;

  /// Timestamp when the current weekly cycle started.
  final DateTime? resetAt;

  /// Whether the user is an unauthenticated guest.
  final bool isGuest;

  /// Base free tours allowed per cycle (1 for guests, 3 for registered users).
  int get baseLimit => isGuest ? 1 : 3;

  /// Maximum extra tours allowed via ads per cycle (0 for guests, 2 for registered users).
  int get maxBonusAllowed => isGuest ? 0 : 2;

  /// Total permitted tours in the current cycle (base + unlocked bonuses).
  int get totalLimit => baseLimit + bonusCount;

  /// Remaining tours available to create right now.
  int get remaining => (totalLimit - createdCount).clamp(0, totalLimit);

  /// Whether the user has at least 1 tour available to create.
  bool get canCreate => remaining > 0;

  /// Whether the user has exhausted current tours but can watch a rewarded ad to get +1.
  bool get canWatchAdForBonus =>
      !isGuest && remaining == 0 && bonusCount < maxBonusAllowed;

  /// Number of rewarded ad bonuses still available this week.
  int get remainingBonusAds => (maxBonusAllowed - bonusCount).clamp(0, maxBonusAllowed);

  /// Whether the user has reached the absolute weekly ceiling (3 base + 2 bonus = 5).
  bool get hasReachedAbsoluteLimit =>
      !isGuest && createdCount >= (baseLimit + maxBonusAllowed);

  /// Target date for the next weekly quota renewal.
  DateTime? get nextResetDate => resetAt?.add(const Duration(days: 7));

  TourQuota copyWith({
    int? createdCount,
    int? bonusCount,
    DateTime? resetAt,
    bool? isGuest,
  }) {
    return TourQuota(
      createdCount: createdCount ?? this.createdCount,
      bonusCount: bonusCount ?? this.bonusCount,
      resetAt: resetAt ?? this.resetAt,
      isGuest: isGuest ?? this.isGuest,
    );
  }
}

/// Represents the voice guide query quota for an active live tour session.
class VoiceTourQuota {
  const VoiceTourQuota({
    this.queriesUsed = 0,
    this.bonusQueriesEarned = 0,
  });

  /// Base free queries granted per tour session.
  static const int baseLimit = 5;

  /// Maximum extra queries that can be unlocked via rewarded ads in a single tour.
  static const int maxBonusLimit = 10;

  /// Number of extra queries granted per rewarded ad watched.
  static const int queriesPerAd = 2;

  /// Number of voice queries already submitted in this tour session.
  final int queriesUsed;

  /// Total extra queries earned via ads in this tour session.
  final int bonusQueriesEarned;

  /// Total allowed queries for this session (base + earned bonuses).
  int get totalLimit => baseLimit + bonusQueriesEarned;

  /// Remaining voice queries available to ask.
  int get remaining => (totalLimit - queriesUsed).clamp(0, totalLimit);

  /// Whether the user can ask another voice question right now.
  bool get canAskQuestion => remaining > 0;

  /// Whether user has 0 queries left but can watch an ad to earn +2 extra queries.
  bool get canWatchAdForBonus =>
      remaining == 0 && bonusQueriesEarned < maxBonusLimit;

  /// Whether the user has unlocked the maximum allowed bonus queries for this tour.
  bool get hasReachedMaxBonus => bonusQueriesEarned >= maxBonusLimit;

  /// Remaining bonus queries that can still be unlocked via ads (up to 10).
  int get remainingBonusQueriesPossible =>
      (maxBonusLimit - bonusQueriesEarned).clamp(0, maxBonusLimit);

  VoiceTourQuota copyWith({
    int? queriesUsed,
    int? bonusQueriesEarned,
  }) {
    return VoiceTourQuota(
      queriesUsed: queriesUsed ?? this.queriesUsed,
      bonusQueriesEarned: bonusQueriesEarned ?? this.bonusQueriesEarned,
    );
  }
}

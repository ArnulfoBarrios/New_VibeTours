enum TourPhase {
  home,
  tours,
  tourDetail,
  liveTour,
  settings,
}

extension TourPhaseExtension on TourPhase {
  String get storageKey => 'tour_completed_$name';
}

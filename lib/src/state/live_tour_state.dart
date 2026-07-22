import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/models.dart';

class LiveTourPlaybackState {
  final Tour? tour;
  final String? userId;
  final int currentStopIndex;
  final bool isPlaying;
  final bool isLiveActive;

  const LiveTourPlaybackState({
    this.tour,
    this.userId,
    this.currentStopIndex = 0,
    this.isPlaying = false,
    this.isLiveActive = false,
  });

  TourStop? get currentStop {
    if (tour == null || currentStopIndex < 0 || currentStopIndex >= tour!.stops.length) {
      return null;
    }
    return tour!.stops[currentStopIndex];
  }

  LiveTourPlaybackState copyWith({
    Tour? tour,
    String? userId,
    int? currentStopIndex,
    bool? isPlaying,
    bool? isLiveActive,
  }) {
    return LiveTourPlaybackState(
      tour: tour ?? this.tour,
      userId: userId ?? this.userId,
      currentStopIndex: currentStopIndex ?? this.currentStopIndex,
      isPlaying: isPlaying ?? this.isPlaying,
      isLiveActive: isLiveActive ?? this.isLiveActive,
    );
  }
}

class LiveTourPlaybackNotifier extends StateNotifier<LiveTourPlaybackState> {
  LiveTourPlaybackNotifier() : super(const LiveTourPlaybackState());

  void startTour(Tour tour, {int initialStopIndex = 0, String? userId}) {
    state = LiveTourPlaybackState(
      tour: tour,
      userId: userId,
      currentStopIndex: initialStopIndex,
      isPlaying: true,
      isLiveActive: true,
    );
  }

  void setPlaying(bool isPlaying) {
    state = state.copyWith(isPlaying: isPlaying);
  }

  void setCurrentStopIndex(int index) {
    if (state.tour != null && index >= 0 && index < state.tour!.stops.length) {
      state = state.copyWith(currentStopIndex: index);
    }
  }

  void stopTour() {
    state = const LiveTourPlaybackState();
  }
}

final liveTourPlaybackProvider =
    StateNotifierProvider<LiveTourPlaybackNotifier, LiveTourPlaybackState>((ref) {
  return LiveTourPlaybackNotifier();
});

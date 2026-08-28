import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tutorial_coach_mark/tutorial_coach_mark.dart';
import 'tour_builder.dart';
import 'tour_phase.dart';
import 'tour_storage_service.dart';

final tourStorageServiceProvider = Provider<TourStorageService>((ref) {
  return const TourStorageService();
});

class TourControllerState {
  const TourControllerState({
    this.completedPhases = const {},
    this.isTourActive = false,
  });

  final Map<TourPhase, bool> completedPhases;
  final bool isTourActive;

  bool isPhaseCompleted(TourPhase phase) => completedPhases[phase] ?? false;

  TourControllerState copyWith({
    Map<TourPhase, bool>? completedPhases,
    bool? isTourActive,
  }) {
    return TourControllerState(
      completedPhases: completedPhases ?? this.completedPhases,
      isTourActive: isTourActive ?? this.isTourActive,
    );
  }
}

class TourController extends StateNotifier<TourControllerState> {
  TourController(this._storageService) : super(const TourControllerState()) {
    _loadStatus();
  }

  final TourStorageService _storageService;
  TutorialCoachMark? _currentCoachMark;

  Future<void> _loadStatus() async {
    final status = await _storageService.getAllToursStatus();
    if (mounted) {
      state = state.copyWith(completedPhases: status);
    }
  }

  Future<void> showTourIfPending({
    required BuildContext context,
    required TourPhase phase,
    required List<TourStepItem> steps,
    Duration delay = const Duration(milliseconds: 500),
  }) async {
    if (!context.mounted || steps.isEmpty) return;

    final isCompleted = await _storageService.isTourCompleted(phase);
    if (isCompleted || state.isTourActive) return;

    await Future<void>.delayed(delay);
    if (!context.mounted) return;

    _launchTour(
      context: context,
      phase: phase,
      steps: steps,
    );
  }

  Future<void> forceStartTour({
    required BuildContext context,
    required TourPhase phase,
    required List<TourStepItem> steps,
  }) async {
    if (!context.mounted || steps.isEmpty) return;

    _currentCoachMark?.finish();
    _currentCoachMark = null;

    _launchTour(
      context: context,
      phase: phase,
      steps: steps,
    );
  }

  void _launchTour({
    required BuildContext context,
    required TourPhase phase,
    required List<TourStepItem> steps,
  }) {
    state = state.copyWith(isTourActive: true);

    void onComplete() {
      _storageService.markTourCompleted(phase);
      _currentCoachMark = null;
      if (mounted) {
        final updated = Map<TourPhase, bool>.from(state.completedPhases);
        updated[phase] = true;
        state = state.copyWith(
          completedPhases: updated,
          isTourActive: false,
        );
      }
    }

    _currentCoachMark = TourBuilder.createVibeTour(
      context: context,
      steps: steps,
      onFinish: onComplete,
      onSkip: onComplete,
    );

    try {
      _currentCoachMark?.show(context: context);
    } catch (_) {
      state = state.copyWith(isTourActive: false);
    }
  }

  Future<void> resetAllTours() async {
    await _storageService.resetAllTours();
    if (mounted) {
      state = state.copyWith(
        completedPhases: {for (final p in TourPhase.values) p: false},
      );
    }
  }

  Future<void> resetTour(TourPhase phase) async {
    await _storageService.resetTour(phase);
    if (mounted) {
      final updated = Map<TourPhase, bool>.from(state.completedPhases);
      updated[phase] = false;
      state = state.copyWith(completedPhases: updated);
    }
  }
}

final tourControllerProvider =
    StateNotifierProvider<TourController, TourControllerState>((ref) {
  final storage = ref.watch(tourStorageServiceProvider);
  return TourController(storage);
});

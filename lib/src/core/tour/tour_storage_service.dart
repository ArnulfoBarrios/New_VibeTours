import 'package:shared_preferences/shared_preferences.dart';
import 'tour_phase.dart';

class TourStorageService {
  const TourStorageService();

  Future<bool> isTourCompleted(TourPhase phase) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(phase.storageKey) ?? false;
    } catch (_) {
      return false;
    }
  }

  Future<void> markTourCompleted(TourPhase phase) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(phase.storageKey, true);
    } catch (_) {}
  }

  Future<void> resetTour(TourPhase phase) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(phase.storageKey);
    } catch (_) {}
  }

  Future<void> resetAllTours() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      for (final phase in TourPhase.values) {
        await prefs.remove(phase.storageKey);
      }
    } catch (_) {}
  }

  Future<Map<TourPhase, bool>> getAllToursStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final map = <TourPhase, bool>{};
      for (final phase in TourPhase.values) {
        map[phase] = prefs.getBool(phase.storageKey) ?? false;
      }
      return map;
    } catch (_) {
      return {for (final phase in TourPhase.values) phase: false};
    }
  }
}

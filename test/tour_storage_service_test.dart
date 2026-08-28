import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vibetoursapp/src/core/tour/tour_controller.dart';
import 'package:vibetoursapp/src/core/tour/tour_phase.dart';
import 'package:vibetoursapp/src/core/tour/tour_storage_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TourStorageService', () {
    late TourStorageService storageService;

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      storageService = const TourStorageService();
    });

    test('should return false when tour phase has not been completed', () async {
      final isCompleted = await storageService.isTourCompleted(TourPhase.home);
      expect(isCompleted, isFalse);
    });

    test('should return true when tour phase is marked as completed', () async {
      await storageService.markTourCompleted(TourPhase.home);
      final isCompleted = await storageService.isTourCompleted(TourPhase.home);
      expect(isCompleted, isTrue);
    });

    test('should return false when completed tour phase is reset', () async {
      await storageService.markTourCompleted(TourPhase.tours);
      expect(await storageService.isTourCompleted(TourPhase.tours), isTrue);

      await storageService.resetTour(TourPhase.tours);
      expect(await storageService.isTourCompleted(TourPhase.tours), isFalse);
    });

    test('should reset all completed phases when resetAllTours is called', () async {
      await storageService.markTourCompleted(TourPhase.home);
      await storageService.markTourCompleted(TourPhase.liveTour);
      await storageService.markTourCompleted(TourPhase.settings);

      await storageService.resetAllTours();

      for (final phase in TourPhase.values) {
        expect(await storageService.isTourCompleted(phase), isFalse);
      }
    });

    test('should return map with all phases status when getAllToursStatus is called', () async {
      await storageService.markTourCompleted(TourPhase.tourDetail);

      final statusMap = await storageService.getAllToursStatus();

      expect(statusMap[TourPhase.tourDetail], isTrue);
      expect(statusMap[TourPhase.home], isFalse);
      expect(statusMap[TourPhase.tours], isFalse);
      expect(statusMap[TourPhase.liveTour], isFalse);
      expect(statusMap[TourPhase.settings], isFalse);
    });
  });

  group('TourController', () {
    late TourStorageService storageService;
    late TourController controller;

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      storageService = const TourStorageService();
      controller = TourController(storageService);
    });

    tearDown(() {
      controller.dispose();
    });

    test('should update state when resetAllTours is invoked', () async {
      await storageService.markTourCompleted(TourPhase.home);
      await controller.resetAllTours();

      for (final phase in TourPhase.values) {
        expect(controller.state.isPhaseCompleted(phase), isFalse);
      }
    });

    test('should update state when specific tour is reset', () async {
      await storageService.markTourCompleted(TourPhase.settings);
      await controller.resetTour(TourPhase.settings);

      expect(controller.state.isPhaseCompleted(TourPhase.settings), isFalse);
    });
  });
}

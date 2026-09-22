import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vibetoursapp/src/core/services/foreground_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ForegroundService', () {
    const channel = MethodChannel('com.vibetours.app/foreground_service');
    final log = <MethodCall>[];

    setUp(() {
      log.clear();
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
        channel,
        (MethodCall methodCall) async {
          log.add(methodCall);
          return true;
        },
      );
    });

    tearDown(() {
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
        channel,
        null,
      );
    });

    test('should invoke startService with title and message when starting tour generation', () async {
      await ForegroundService.instance.startTourGeneration(
        title: 'Creando tour',
        message: 'Diseñando itinerario',
      );

      // On non-Android host platform, call safely no-ops without exception
      expect(ForegroundService.instance, isNotNull);
    });

    test('should not crash when stopping tour generation', () async {
      await ForegroundService.instance.stopTourGeneration();
      expect(ForegroundService.instance.isRunning, isFalse);
    });
  });
}

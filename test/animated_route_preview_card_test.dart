import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vibetoursapp/src/core/design/openfree_route_map.dart';
import 'package:vibetoursapp/src/domain/models.dart';
import 'package:vibetoursapp/src/features/ai/widgets/animated_route_preview_card.dart';

void main() {
  final testStops = [
    const AiRecommendation(
      id: 'stop-1',
      name: 'Plaza Mayor',
      latitude: 40.4153,
      longitude: -3.7073,
      category: 'Cultura',
      imageUrl: '',
      description: 'Historical square in Madrid',
      reason: 'Must-see central hub',
      durationMinutes: 45,
      locationInfo: TourLocationInfo.empty,
      day: 1,
      dia: 1,
    ),
    const AiRecommendation(
      id: 'stop-2',
      name: 'Museo del Prado',
      latitude: 40.4137,
      longitude: -3.6921,
      category: 'Arte',
      imageUrl: '',
      description: 'World-renowned art museum',
      reason: 'Masterpieces by Velazquez and Goya',
      durationMinutes: 90,
      locationInfo: TourLocationInfo.empty,
      day: 1,
      dia: 1,
    ),
    const AiRecommendation(
      id: 'stop-3',
      name: 'Parque del Retiro',
      latitude: 40.4152,
      longitude: -3.6844,
      category: 'Naturaleza',
      imageUrl: '',
      description: 'Historic city park with crystal palace',
      reason: 'Relaxing stroll and scenic lake',
      durationMinutes: 60,
      locationInfo: TourLocationInfo.empty,
      day: 1,
      dia: 1,
    ),
  ];

  group('AnimatedRoutePreviewCard Widget Tests', () {
    testWidgets('Starts with AI laser animation and transitions to real road map upon completion', (tester) async {
      bool modifyCalled = false;
      bool createCalled = false;

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            theme: ThemeData.dark(),
            home: Scaffold(
              body: SingleChildScrollView(
                child: AnimatedRoutePreviewCard(
                  stops: testStops,
                  onModifyStops: () => modifyCalled = true,
                  onCreateTour: () => createCalled = true,
                ),
              ),
            ),
          ),
        ),
      );

      // Verify header text
      expect(find.text('3 Paradas Seleccionadas'), findsOneWidget);
      expect(find.text('Diseñando itinerario inteligente con IA...'), findsOneWidget);
      expect(find.text('Optimizado'), findsNothing);

      // Initial state: animated laser canvas is present
      expect(find.byKey(const ValueKey('animated_laser_canvas_view')), findsOneWidget);

      // Advance frames across the timeline to finish animation (~1800ms)
      await tester.pump(const Duration(milliseconds: 900));
      await tester.pump(const Duration(milliseconds: 1000));
      await tester.pump(const Duration(milliseconds: 400)); // AnimatedOpacity transition

      // Final state: transitioned to real road map
      expect(find.byType(OpenFreeRouteMap), findsOneWidget);
      expect(find.text('Ruta trazada por caminos reales'), findsOneWidget);

      // Verify stop names in horizontal ribbon
      expect(find.text('Plaza Mayor'), findsOneWidget);
      expect(find.text('Museo del Prado'), findsOneWidget);
      expect(find.text('Parque del Retiro'), findsOneWidget);

      // Verify buttons
      expect(find.text('Modificar paradas'), findsOneWidget);
      expect(find.text('Crear tour'), findsOneWidget);

      // Test button callbacks
      await tester.tap(find.text('Modificar paradas'));
      expect(modifyCalled, isTrue);

      await tester.tap(find.text('Crear tour'));
      expect(createCalled, isTrue);
    });

    testWidgets('Replay button restarts AI creation animation', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            theme: ThemeData.dark(),
            home: Scaffold(
              body: SingleChildScrollView(
                child: AnimatedRoutePreviewCard(
                  stops: testStops,
                  onModifyStops: () {},
                  onCreateTour: () {},
                ),
              ),
            ),
          ),
        ),
      );

      // Complete animation to reach map state
      await tester.pump(const Duration(milliseconds: 2400));
      expect(find.byType(OpenFreeRouteMap), findsOneWidget);

      // Tap replay button
      final replayButton = find.byTooltip('Trazar ruta de nuevo');
      expect(replayButton, findsOneWidget);
      await tester.tap(replayButton);
      await tester.pump(const Duration(milliseconds: 400));

      // Should be back in laser canvas animation
      expect(find.byKey(const ValueKey('animated_laser_canvas_view')), findsOneWidget);
    });

    testWidgets('Shows loading spinner when isBuilding is true', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            theme: ThemeData.dark(),
            home: Scaffold(
              body: SingleChildScrollView(
                child: AnimatedRoutePreviewCard(
                  stops: testStops,
                  isBuilding: true,
                  onModifyStops: () {},
                  onCreateTour: () {},
                ),
              ),
            ),
          ),
        ),
      );

      expect(find.text('Creando tour...'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsWidgets);
    });
  });
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/openfree_route_map.dart';
import '../../core/design/premium_components.dart';
import '../../domain/models.dart';
import '../../state/app_state.dart';
import '../shared/location_disclosure_dialog.dart';

class PlaceRouteScreen extends ConsumerStatefulWidget {
  const PlaceRouteScreen({super.key});

  @override
  ConsumerState<PlaceRouteScreen> createState() => _PlaceRouteScreenState();
}

class _PlaceRouteScreenState extends ConsumerState<PlaceRouteScreen> {
  MapLibreMapController? _mapController;

  @override
  Widget build(BuildContext context) {
    final place = ref.watch(selectedNearbyPlaceProvider);
    final positionAsync = ref.watch(currentPositionProvider);
    final styleUrl = ref.watch(mapStyleProvider);
    if (place == null) {
      return PremiumScaffold(
        safeBottom: true,
        child: EmptyState(
          icon: Icons.place_outlined,
          title: 'Selecciona un lugar',
          body: 'Vuelve a Home y toca una tarjeta de Nearby Places.',
        ),
      );
    }

    return PremiumScaffold(
      child: Stack(
        children: [
          Positioned.fill(
            child: positionAsync.when(
              data: (position) => OpenFreeRouteMap(
                key: ValueKey(
                  '${place.name}-${position?.latitude}-${position?.longitude}',
                ),
                points: _pointsFor(position, place),
                labels: const ['Tu ubicacion'],
                styleUrl: styleUrl,
                height: MediaQuery.of(context).size.height,
                borderRadius: 0,
                fitPadding: const EdgeInsets.fromLTRB(40, 120, 40, 280),
                myLocationEnabled: position != null,
                focusOnLast: true,
                onMapCreated: (controller) {
                  setState(() {
                    _mapController = controller;
                  });
                },
              ),
              loading: () => OpenFreeRouteMap(
                points: [place.location],
                styleUrl: styleUrl,
                height: MediaQuery.of(context).size.height,
                borderRadius: 0,
                focusOnLast: true,
                onMapCreated: (controller) {
                  setState(() {
                    _mapController = controller;
                  });
                },
              ),
              error: (error, stackTrace) => OpenFreeRouteMap(
                points: [place.location],
                styleUrl: styleUrl,
                height: MediaQuery.of(context).size.height,
                borderRadius: 0,
                focusOnLast: true,
                onMapCreated: (controller) {
                  setState(() {
                    _mapController = controller;
                  });
                },
              ),
            ),
          ),
          Positioned(
            left: 16,
            top: MediaQuery.of(context).padding.top + 8,
            child: IconButton.filledTonal(
              onPressed: () =>
                  context.canPop() ? context.pop() : context.go('/home'),
              icon: const Icon(Icons.arrow_back_rounded),
            ),
          ),
          Positioned(
            right: 16,
            bottom: 236,
            child: FloatingActionButton.extended(
              heroTag: 'focus_destination_fab',
              backgroundColor: Theme.of(context).colorScheme.primaryContainer,
              onPressed: () {
                if (_mapController != null) {
                  _mapController!.animateCamera(
                    CameraUpdate.newLatLngZoom(
                      LatLng(place.location.latitude, place.location.longitude),
                      16.0,
                    ),
                    duration: const Duration(milliseconds: 800),
                  );
                }
              },
              icon: const Icon(Icons.center_focus_strong_rounded, color: AppTheme.primary),
              label: const Text(
                'Enfocar Destino',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                ),
              ),
            ),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 18,
            child: GlassPanel(
              padding: const EdgeInsets.all(18),
              radius: 28,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: AppTheme.primary.withValues(
                          alpha: 0.18,
                        ),
                        child: const Icon(
                          Icons.place_rounded,
                          color: AppTheme.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              place.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            Text(
                              place.type,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  positionAsync.when(
                    data: (position) => Text(
                      position == null
                          ? 'Activa la ubicacion para trazar la ruta desde donde estas.'
                          : '${_distance(position, place)} hasta el destino seleccionado.',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    loading: () => const LinearProgressIndicator(minHeight: 6),
                    error: (error, stackTrace) => Text(
                      'No pudimos leer tu ubicacion exacta. Se muestra el destino.',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: LiquidButton(
                          label: 'Recalcular',
                          icon: Icons.my_location_rounded,
                          onPressed: () async {
                            final granted = await checkAndRequestLocationPermission(context, ref);
                            if (granted) {
                              ref.invalidate(currentPositionProvider);
                            } else if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Se requiere ubicación para esta acción.')),
                              );
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 10),
                      IconButton.filledTonal(
                        tooltip: 'Cerrar',
                        onPressed: () => context.go('/home'),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<GeoPoint> _pointsFor(Position? position, NearbyPlace place) {
    if (position == null) return [place.location];
    return [
      GeoPoint(latitude: position.latitude, longitude: position.longitude),
      place.location,
    ];
  }

  String _distance(Position position, NearbyPlace place) {
    final meters = Geolocator.distanceBetween(
      position.latitude,
      position.longitude,
      place.location.latitude,
      place.location.longitude,
    );
    if (meters >= 1000) return '${(meters / 1000).toStringAsFixed(1)} km';
    return '${meters.round()} m';
  }
}

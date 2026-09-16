import 'package:flutter/material.dart';

import '../services/road_route_service.dart';

/// Returns the icon that represents a transport preference.
///
/// Preferences may come from the profile, the AI conversation, or persisted
/// data, so the matching intentionally accepts the Spanish labels used by
/// the app as well as their English equivalents.
IconData transportIconFor(Object? transport) {
  final value = transport?.toString().trim().toLowerCase() ?? '';

  if (value.contains('camin') || value.contains('peat') || value.contains('walk')) {
    return Icons.directions_walk_rounded;
  }
  if (value.contains('bicic') || value.contains('bicycl') || value.contains('bike')) {
    return Icons.directions_bike_rounded;
  }
  if (value.contains('públic') || value.contains('public') || value.contains('bus')) {
    return Icons.directions_bus_rounded;
  }
  if (value.contains('taxi') || value.contains('app')) {
    return Icons.local_taxi_rounded;
  }
  if (value.contains('moto') || value.contains('motor')) {
    return Icons.two_wheeler_rounded;
  }

  return Icons.directions_car_rounded;
}

RouteTravelMode routeTravelModeFor(Object? transport) {
  final value = transport?.toString().trim().toLowerCase() ?? '';

  if (value.contains('camin') || value.contains('peat') || value.contains('walk')) {
    return RouteTravelMode.walking;
  }
  if (value.contains('bicic') || value.contains('bicycl') || value.contains('bike')) {
    return RouteTravelMode.cycling;
  }
  if (value.contains('públic') || value.contains('public') || value.contains('bus')) {
    return RouteTravelMode.publicTransport;
  }
  if (value.contains('taxi') || value.contains('app')) {
    return RouteTravelMode.taxi;
  }

  return RouteTravelMode.driving;
}

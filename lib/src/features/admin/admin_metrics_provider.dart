import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AdminDashboardMetrics {
  final int totalTours;
  final int pendingToursCount;
  final int activeTicketsCount;
  final int totalEventsCount;
  final int totalUsersCount;
  final List<PeakHourData> peakHours;
  final List<HeatmapPointData> heatPoints;

  const AdminDashboardMetrics({
    required this.totalTours,
    required this.pendingToursCount,
    required this.activeTicketsCount,
    required this.totalEventsCount,
    required this.totalUsersCount,
    required this.peakHours,
    required this.heatPoints,
  });
}

class PeakHourData {
  final String hourLabel;
  final int count;
  final double normalizedHeight;

  const PeakHourData({
    required this.hourLabel,
    required this.count,
    required this.normalizedHeight,
  });
}

class HeatmapPointData {
  final String name;
  final String city;
  final double latitude;
  final double longitude;
  final int density;
  final int visits;
  final String timePeak;

  const HeatmapPointData({
    required this.name,
    required this.city,
    required this.latitude,
    required this.longitude,
    required this.density,
    required this.visits,
    required this.timePeak,
  });
}

final adminMetricsProvider = FutureProvider<AdminDashboardMetrics>((ref) async {
  final client = Supabase.instance.client;

  int totalTours = 0;
  int pendingToursCount = 0;
  int activeTicketsCount = 0;
  int totalEventsCount = 0;
  int totalUsersCount = 0;

  // 1. Tours count
  try {
    final toursRes = await client.from('tours').select('id, status');
    final toursList = toursRes as List;
    totalTours = toursList.length;
    pendingToursCount = toursList.where((t) => t['status'] == 'pending_approval' || t['status'] == 'pending').length;
  } catch (_) {}

  // 2. Active tickets count
  try {
    final ticketsRes = await client.from('tickets').select('id, status');
    final ticketsList = ticketsRes as List;
    activeTicketsCount = ticketsList.where((t) => t['status'] == 'open' || t['status'] == 'pending' || t['status'] == null).length;
  } catch (_) {}

  // 3. Events count
  try {
    final eventsRes = await client.from('events').select('id');
    totalEventsCount = (eventsRes as List).length;
  } catch (_) {}

  // 4. Users count
  try {
    final usersRes = await client.from('users').select('id');
    totalUsersCount = (usersRes as List).length;
  } catch (_) {}

  // 5. Peak Hours from tour_views or fallback to created_at
  final hourBuckets = <int, int>{
    6: 0, 8: 0, 10: 0, 12: 0, 14: 0, 16: 0, 18: 0, 20: 0, 22: 0
  };

  try {
    final viewsRes = await client.from('tour_views').select('viewed_at').limit(500);
    final viewsList = viewsRes as List;
    for (final item in viewsList) {
      final dt = DateTime.tryParse(item['viewed_at']?.toString() ?? '');
      if (dt != null) {
        final hour = dt.hour;
        final closestBucket = hourBuckets.keys.reduce((a, b) => (a - hour).abs() < (b - hour).abs() ? a : b);
        hourBuckets[closestBucket] = (hourBuckets[closestBucket] ?? 0) + 1;
      }
    }
  } catch (_) {}

  final maxViews = hourBuckets.values.fold<int>(0, (prev, curr) => curr > prev ? curr : prev);
  final peakHours = hourBuckets.entries.map((e) {
    final label = e.key < 12 ? '${e.key}am' : (e.key == 12 ? '12pm' : '${e.key - 12}pm');
    final norm = maxViews > 0 ? (e.value / maxViews).clamp(0.15, 1.0) : 0.2;
    return PeakHourData(hourLabel: label, count: e.value, normalizedHeight: norm);
  }).toList();

  // 6. Heatmap points from real tours data
  final heatPoints = <HeatmapPointData>[];
  try {
    final toursDataRes = await client
        .from('tours')
        .select('name, city, latitude, longitude, views_count')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(20);

    final toursData = toursDataRes as List;
    final maxViewsCount = toursData.fold<int>(1, (prev, t) => ((t['views_count'] as num?)?.toInt() ?? 0) > prev ? ((t['views_count'] as num?)?.toInt() ?? 0) : prev);

    for (final t in toursData) {
      final visits = (t['views_count'] as num?)?.toInt() ?? 0;
      final density = ((visits / maxViewsCount) * 100).clamp(30, 99).toInt();
      heatPoints.add(
        HeatmapPointData(
          name: t['name']?.toString() ?? 'Punto Turístico',
          city: t['city']?.toString() ?? 'Barranquilla',
          latitude: (t['latitude'] as num?)?.toDouble() ?? 10.96854,
          longitude: (t['longitude'] as num?)?.toDouble() ?? -74.78132,
          density: density,
          visits: visits,
          timePeak: '10:00 - 18:00',
        ),
      );
    }
  } catch (_) {}

  return AdminDashboardMetrics(
    totalTours: totalTours,
    pendingToursCount: pendingToursCount,
    activeTicketsCount: activeTicketsCount,
    totalEventsCount: totalEventsCount,
    totalUsersCount: totalUsersCount,
    peakHours: peakHours,
    heatPoints: heatPoints,
  );
});

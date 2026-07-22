import '../domain/models.dart';

List<LocalEvent> buildDemoEvents() => [
  LocalEvent(
    id: 'event-1',
    title: 'Festival cultural de la ciudad',
    city: 'Barranquilla',
    category: 'Cultura',
    startsAt: DateTime.now().add(const Duration(days: 2)),
    imageUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
    location: const GeoPoint(latitude: 11.0191, longitude: -74.8007),
  ),
  LocalEvent(
    id: 'event-2',
    title: 'Ruta gastronomica nocturna',
    city: 'Cartagena',
    category: 'Gastronomia',
    startsAt: DateTime.now().add(const Duration(days: 4)),
    imageUrl:
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
    location: const GeoPoint(latitude: 10.4236, longitude: -75.5501),
  ),
  LocalEvent(
    id: 'event-3',
    title: 'Concierto al aire libre',
    city: 'Medellin',
    category: 'Musica',
    startsAt: DateTime.now().add(const Duration(days: 6)),
    imageUrl:
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80',
    location: const GeoPoint(latitude: 6.2526, longitude: -75.5683),
  ),
];

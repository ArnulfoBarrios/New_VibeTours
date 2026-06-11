insert into public.events (title, country, city, category, starts_at, latitude, longitude, image_url, source)
values
  ('Festival cultural de Barranquilla', 'Colombia', 'Barranquilla', 'Cultural', now() + interval '2 days', 11.0191, -74.8007, 'https://source.unsplash.com/900x700/?festival,barranquilla', 'seed'),
  ('Ruta gastronomica nocturna', 'Colombia', 'Cartagena', 'Gastronomia', now() + interval '4 days', 10.4236, -75.5501, 'https://source.unsplash.com/900x700/?food,cartagena', 'seed'),
  ('Concierto al aire libre', 'Colombia', 'Medellin', 'Concierto', now() + interval '6 days', 6.2526, -75.5683, 'https://source.unsplash.com/900x700/?concert,medellin', 'seed'),
  ('Feria de fotografia urbana', 'Colombia', 'Bogota', 'Fotografia', now() + interval '8 days', 4.6019, -74.0721, 'https://source.unsplash.com/900x700/?photography,bogota', 'seed'),
  ('Noche de museos', 'Francia', 'Paris', 'Museos', now() + interval '10 days', 48.8606, 2.3376, 'https://source.unsplash.com/900x700/?museum,paris', 'seed')
on conflict do nothing;

# VibeTours - Modelos de Datos y Estructura de Base de Datos (Supabase)

## 1. Modelo de Datos Relacional (PostgreSQL en Supabase)
La persistencia de VibeTours está estructurada en un esquema relacional limpio con soporte geoespacial. Las principales tablas creadas en las migraciones de base de datos son:

### A. Tabla `public.users`
Almacena la información pública de las cuentas registradas en la aplicación. Está vinculada mediante llaves foráneas a la tabla de autenticación interna de Supabase (`auth.users`).
*   `id` (UUID, Primary Key): ID único de usuario de Supabase.
*   `email` (TEXT): Dirección de correo electrónico del usuario.
*   `full_name` (TEXT): Nombre completo del usuario.
*   `avatar_url` (TEXT): Enlace a la foto de perfil en el Storage.
*   `bio` (TEXT): Biografía corta del usuario.
*   `country` (TEXT): País de residencia.
*   `followers_count` (INTEGER): Contador de seguidores para funciones sociales.

### B. Tabla `public.tourist_profiles`
Guarda las preferencias turísticas detalladas para personalizar las recomendaciones y la generación de tours con IA.
*   `user_id` (UUID, Primary Key, FK -> `users.id`): ID de usuario asociado.
*   `interests` (TEXT[]): Arreglo de intereses del viajero (ej. *gastronomía, museos, ecoturismo*).
*   `preferred_pace` (TEXT): Ritmo de viaje (*relajado, equilibrado, intenso*).
*   `favorite_countries` (TEXT[]): Países que le interesa o ha visitado.
*   `ai_summary` (TEXT): Resumen textual sintetizado automáticamente por la IA para inyectar en los prompts.

### C. Tabla `public.tours`
La entidad principal de la aplicación. Describe un recorrido turístico general.
*   `id` (UUID, Primary Key): Identificador del tour.
*   `owner_id` (UUID, FK -> `users.id`): Creador del tour (nulo si es demo o del sistema).
*   `slug` (TEXT, Unique): Identificador amigable para URLs.
*   `title` (TEXT): Título descriptivo del recorrido.
*   `country` (TEXT) & `city` (TEXT): Ubicación geográfica del recorrido.
*   `type` (TEXT): Categoría del tour (*urban, historical, gastronomic, cultural, ecological, romantic, sports, night, family, custom*).
*   `description` (TEXT): Explicación detallada del recorrido.
*   `cover_url` (TEXT): Imagen de portada del tour.
*   `gallery` (TEXT[]): Colección de imágenes adicionales del recorrido.
*   `duration_minutes` (INTEGER): Duración total del recorrido.
*   `distance_meters` (INTEGER): Distancia total en metros.
*   `difficulty` (TEXT): Nivel de esfuerzo (*easy, moderate, intense*).
*   `language` (TEXT): Idioma del tour (*es, en*).
*   `rating` (NUMERIC): Calificación promedio de estrellas de usuarios (0.00 a 5.00).
*   `is_ai_generated` (BOOLEAN): Bandera que indica si el tour fue creado por la IA.
*   `is_published` (BOOLEAN): Estado que define si es visible públicamente en el feed.
*   `is_private` (BOOLEAN): Define si es un borrador o de consumo exclusivo del creador.

### D. Tabla `public.tour_days`
Soporta tours multi-día distribuyendo las paradas en jornadas.
*   `id` (UUID, Primary Key): Identificador del día.
*   `tour_id` (UUID, FK -> `tours.id`): Tour al que pertenece.
*   `day_number` (INTEGER): Número del día (1, 2, 3...).
*   `title` (TEXT): Título del día (ej. *"Día 1: Centro Histórico"*).
*   `notes` (TEXT): Notas o recomendaciones para la jornada.

### E. Tabla `public.tour_stops`
Las paradas o puntos de interés individuales que componen el recorrido de un tour.
*   `id` (UUID, Primary Key): Identificador de la parada.
*   `tour_id` (UUID, FK -> `tours.id`): Tour asociado.
*   `day_id` (UUID, FK -> `tour_days.id`): Jornada específica (si aplica).
*   `stop_order` (INTEGER): Posición u orden de visita dentro del itinerario (0, 1, 2...).
*   `name` (TEXT): Nombre de la parada (ej. *"Catedral Metropolitana"*).
*   `latitude` (DOUBLE PRECISION) & `longitude` (DOUBLE PRECISION): Coordenadas GPS exactas para la navegación interactiva.
*   `image_url` (TEXT): Imagen de referencia del sitio.
*   `description` (TEXT): Explicación y contexto narrado para la guía de voz.
*   `activities` (TEXT[]): Lista de actividades sugeridas en la parada.
*   `tips` (TEXT[]): Consejos específicos para esta locación.
*   `suggested_minutes` (INTEGER): Tiempo sugerido de permanencia en el lugar.

### F. Otras Tablas de Interacción y Soporte
*   `tour_likes`: Registra la relación muchos a muchos entre usuarios y tours para dar "Me gusta".
*   `tour_favorites`: Guarda los tours marcados como favoritos por los usuarios para acceso rápido.
*   `tour_comments`: Comentarios y reseñas con puntuación de estrellas (1 a 5) de los tours publicados.
*   `tour_views`: Registro analítico de visitas a tours para estadísticas de popularidad.
*   `pqrs`: Soporte técnico de Peticiones, Quejas, Reclamos y Sugerencias de los usuarios.
*   `reports`: Reportes de contenido inapropiado o problemático en tours creados por usuarios.
*   `settings`: Preferencias de la aplicación por usuario (idioma de la interfaz, modo oscuro/claro, tasa de refresco, estilo de mapa preferido).
*   `events`: Eventos culturales y locales temporales obtenidos en tiempo real.

---

## 2. Políticas de Seguridad RLS (Row Level Security)
Supabase aplica políticas a nivel de fila directamente en PostgreSQL para asegurar que las aplicaciones no accedan o modifiquen datos ajenos.

*   **Perfiles de Usuario (`public.users`)**:
    *   Cualquier visitante (anónimo o autenticado) puede leer la información de los perfiles públicos para mostrar el autor de un tour.
    *   Un usuario autenticado solo puede actualizar su propia fila de perfil (`auth.uid() = id`).
*   **Tours (`public.tours`)**:
    *   Cualquier usuario puede ver tours marcados como publicados (`is_published = true`) o tours privados de los cuales sea dueño (`owner_id = auth.uid()`).
    *   Solo usuarios autenticados pueden insertar nuevos tours, y deben ser marcados con su respectivo ID de propietario (`auth.uid() = owner_id`).
    *   Solo el dueño del tour puede modificarlo (`update`) o eliminarlo (`delete`).
*   **Paradas y Días (`public.tour_stops` / `public.tour_days`)**:
    *   La lectura está permitida si la parada pertenece a un tour que cumple con las reglas de visibilidad públicas o de propiedad de tours.
    *   La inserción, edición y eliminación de paradas o días está restringida al creador del tour correspondiente.
*   **Mensajes PQRS & Ajustes (`public.pqrs` / `public.settings`)**:
    *   Políticas estrictas: un usuario solo puede insertar y leer sus propias PQRS y configuraciones personales. Nadie más tiene acceso.

---

## 3. Storage Buckets (Almacenamiento de Archivos)
Se definen tres buckets de almacenamiento público en Supabase con políticas específicas para gestionar imágenes subidas por los usuarios desde la app:

1.  **`tour-covers`**: Almacena las imágenes de portada de los tours. Límite de tamaño: 5 MB. Formatos permitidos: JPEG, PNG y WebP.
2.  **`tour-galleries`**: Almacena imágenes asociadas a las galerías del tour o de las paradas. Límite de tamaño: 10 MB. Formatos permitidos: JPEG, PNG y WebP.
3.  **`avatars`**: Almacena las fotos de perfil de los usuarios. Límite de tamaño: 3 MB. Formatos permitidos: JPEG, PNG y WebP.

*Regla de Acceso:* Lectura abierta para todo el público (anónimo y autenticado), pero la subida e inserción está restringida a usuarios autenticados.

---

## 4. Mapeo en el Frontend (Dart Models en `models.dart`)
El archivo [models.dart](file:///c:/Users/Emotiva/Downloads/New_VibeTours-main/New_VibeTours/lib/src/domain/models.dart) contiene la representación en Flutter de este esquema. Algunas clases notables incluyen:

*   **`Tour`**: Posee todas las propiedades de la tabla `tours`. Incluye una lista anidada de objetos `TourStop` (`final List<TourStop> stops`). Mapea tipos mediante enums robustos (`TourType` e `TourDifficulty`).
*   **`TourStop`**: Contiene la información de cada parada, incluyendo latitud y longitud empaquetadas en un objeto `GeoPoint` inmutable.
*   **`TouristProfileV2`**: Representa las preferencias de la tabla `tourist_profiles`. Cuenta con una función estática utilitaria `generateSummary(...)` que compila las selecciones del usuario en un texto descriptivo listo para ser inyectado como contexto en el motor de IA.
*   **`TourLocationInfo`**: Modelo de datos auxiliar que guarda información detallada de direcciones físicas de paradas y puntos de encuentro (`nombreLugar`, `direccion`, `ciudad`, `region`, `pais`, `placeId`, `urlMapa`).

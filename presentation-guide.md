# Guía de Documentación para Presentación de VibeTours

Esta documentación ha sido estructurada de forma lógica y detallada para servir como base directa en la creación de una presentación de negocios (Pitch Deck / PowerPoint) de **VibeTours**.

---

## Índice de Contenidos
1. **¿Qué es VibeTours?** (Visión y Propuesta de Valor)
2. **¿A quién va dirigido VibeTours?** (Público Objetivo)
3. **¿Cómo se utiliza?** (Funciones de la App y Chat de IA)
4. **Modelo de Negocio** (¿Cómo podría ser rentable?)
5. **Límites de Uso y Desafíos Técnicos** (Limitaciones de IA y Mapas)
6. **Futuro del Proyecto** (Mejoras a Corto y Largo Plazo)

---

## 1. ¿Qué es VibeTours? (Visión General)
**VibeTours** es una aplicación móvil interactiva diseñada para revolucionar la forma en que los viajeros descubren, planifican y recorren destinos turísticos. Combina el poder de la Inteligencia Artificial generativa, la cartografía libre basada en mapas interactivos y la tecnología de voz para crear guías personalizadas a la medida del usuario.

### Pilares del Stack Tecnológico
*   **Frontend**: Desarrollado en **Flutter** y **Dart**, garantizando una interfaz premium, fluida, animada y multiplataforma (Android/iOS). Utiliza **Riverpod** para la gestión de estados limpia y estructurada.
*   **Backend**: Servidor **Node.js** con **Express** que centraliza la lógica de negocio y las integraciones con servicios externos.
*   **Base de Datos y Autenticación**: **Supabase** (PostgreSQL, Storage, Realtime y políticas RLS para máxima seguridad).
*   **Inteligencia Artificial**: Integración de modelos de lenguaje a través de la API de **OpenAI (GPT-4o-mini)** para la planificación, personalización de itinerarios y un asistente de voz inteligente.
*   **Geolocalización y Mapas**: Integración de **MapLibre GL**, alimentado con datos geográficos de **OpenStreetMap**, **Nominatim**, **Photon** y **Overpass API**.

---

## 2. ¿A quién va dirigido VibeTours? (Target)
VibeTours aborda las necesidades de tres perfiles fundamentales en el ecosistema del turismo:

1.  **El Turista Moderno (Viajero Autónomo)**:
    *   Viajeros que no desean depender de guías turísticos tradicionales o itinerarios rígidos de agencias.
    *   Usuarios que buscan flexibilidad de horarios y recorridos adaptados a sus gustos específicos.
    *   Subcategorías cubiertas: *viajeros solitarios*, *parejas*, *grupos de amigos* y *familias* (con o sin menores), ajustando el ritmo de caminata y las paradas según quién los acompañe.
2.  **Creadores de Contenido y Guías Locales**:
    *   Expertos locales que desean monetizar o dar visibilidad a sus conocimientos creando rutas turísticas artesanales desde la herramienta nativa de creación manual de la app.
3.  **Administradores y Operadores Turísticos**:
    *   Administradores que gestionan y moderan la calidad de las rutas publicadas y atienden incidencias de servicio al cliente (PQRS).

---

## 3. ¿Cómo se utiliza? (Funciones de la App)

El flujo de usuario de VibeTours es inmersivo y está dividido en fases claras:

### A. Onboarding y Preferencias del Viajero
Al ingresar, el usuario define su perfil turístico:
*   **Tipo de Viajero**: Solo, pareja, amigos o familia.
*   **Presupuesto**: Bajo (económico), medio (moderado) o alto (lujo).
*   **Ritmo del recorrido**: Relajado, equilibrado o acelerado.
*   **Intereses principales**: Naturaleza, historia/cultura, gastronomía, aventura, relajación, etc.
*   *Nota*: Estas preferencias se sincronizan automáticamente con la IA al iniciar un nuevo plan.

### B. El Planificador de Tours con Chat de IA (Tour Planner AI) - *Función Principal*
Esta función permite al usuario cocrear su itinerario conversando con un chatbot inteligente especializado:
1.  **Detección de Intenciones**: El usuario describe con lenguaje natural lo que desea (ej. *"Quiero pasar 3 días en Cartagena con presupuesto medio de forma relajada"*).
2.  **Sugerencias de Destinos**: Si el usuario no sabe a dónde ir, la IA sugiere tres destinos recomendados en un carrusel dinámico con imágenes reales.
3.  **Geolocalización y Búsqueda de Atracciones (POIs)**:
    *   La app geodistribuye el punto central de búsqueda del destino.
    *   Llama al backend que consulta la base de datos de **OpenStreetMap** (mediante Overpass y Photon) para extraer atracciones turísticas reales (museos, miradores, playas, monumentos) y calificarlas.
4.  **Búsqueda y Asignación de Alojamiento (Hoteles)**:
    *   El backend busca hoteles reales alrededor de la zona turística mediante Overpass API de acuerdo al presupuesto.
    *   El usuario selecciona su hotel en una lista. **Este hotel se establece automáticamente como punto de partida y de retorno de la ruta**.
5.  **Constructor de Rutas Interactivo**:
    *   Antes de finalizar el tour, el usuario visualiza los puntos de interés en un mapa interactivo y puede **añadir nuevas paradas, eliminar otras o reemplazarlas** por alternativas sugeridas en tiempo real.
6.  **Generación de la Narrativa del Tour**:
    *   Una vez confirmado el itinerario, la IA escribe historias apasionantes y vibrantes para cada parada (en lugar de descripciones robóticas), incluyendo datos curiosos, recomendaciones prácticas y estimaciones de tiempo.

### C. Navegación en Vivo y Asistencia de Voz durante el Tour
Cuando el usuario inicia el recorrido de forma física en la calle, la app entra en modo de **Navegación Activa (Live Tour)**:
*   **Mapa GPS en Tiempo Real**: Muestra la ubicación actual del usuario sobre una ruta trazada.
*   **Recálculo Automático**: Si el usuario se desvía más de **85 metros** del trayecto sugerido, la app recalcula el camino hacia la siguiente parada.
*   **Indicadores de Viaje**: Muestra distancia en kilómetros restantes, tiempo estimado y retrasos por tráfico en tiempo real.
*   **Guía de Voz (TTS)**: A medida que el usuario se acerca a una parada, la app narra automáticamente la historia y los datos curiosos del lugar.
*   **Asistente de Voz Interactivo (Micrófono)**:
    El usuario puede activar el micrófono para dar comandos de voz naturales. La app transcribe el audio (Speech-to-Text) y el asistente de voz realiza acciones programadas:
    *   *“Tengo hambre, ¿dónde puedo comer?”*: El asistente identifica la intención de búsqueda de comida (`SEARCH_RESTAURANTS`), busca establecimientos gastronómicos en un radio de 1 km mediante Overpass API, los marca en el mapa y los narra por voz para que el usuario elija.
    *   *“Quiero regresar al hotel”*: Ejecuta la acción `RETURN_TO_ACCOMMODATION`, trazando inmediatamente una ruta de regreso al alojamiento registrado.
    *   *“Cuéntame más sobre este lugar”*: Lanza la acción `DESCRIBE_CURRENT_POI` para narrar hechos históricos ampliados.

### D. Otras Funcionalidades
*   **Creador de Tours Manual**: Permite a guías y creadores diseñar rutas paso a paso seleccionando puntos en el mapa e ingresando descripciones personalizadas.
*   **Panel de Administración**: Gestión y moderación de tours generados por los usuarios, y aprobación de PQRS (Peticiones, Quejas, Reclamos y Sugerencias).
*   **Sistema de PQRS**: Formulario de soporte al cliente con historial de tickets en tiempo real.
*   **Valoración e Historial**: Diálogo de calificación de 1 a 5 estrellas al culminar un tour para nutrir el sistema de recomendaciones.

---

## 4. ¿Cómo podría ser rentable? (Monetización)
Para presentar a potenciales inversores o socios, VibeTours cuenta con un esquema de rentabilidad diversificado:

1.  **Suscripciones Premium ("Go Premium")**:
    *   Acceso a descarga de mapas sin conexión (Offline).
    *   Acceso ilimitado a la creación de tours mediante IA (el modo gratis podría limitarse a 3 tours por mes).
    *   Voces exclusivas de IA hiperrealistas y estilos de mapas premium (ej. vista nocturna avanzada o relieves 3D).
2.  **Comisión por Reserva de Alojamientos (Afiliación)**:
    *   Al integrar hoteles reales y sugerirlos durante la planificación del tour, VibeTours puede integrar APIs de reserva directa (como Booking.com o Expedia) y cobrar una comisión por cada reserva realizada desde el chat.
3.  **Publicidad Patrocinada para Negocios Locales**:
    *   Cuando un usuario utiliza el asistente de voz en el Live Tour para buscar *"restaurantes o cafeterías cercanas"*, los comercios de la zona que paguen una suscripción o tarifa de publicidad aparecerán marcados con prioridad o insignias especiales en el mapa.
4.  **Marketplace de Guías Locales (Comisión por Venta)**:
    *   Los creadores locales pueden publicar tours detallados con costo de adquisición. VibeTours retiene un porcentaje (ej. 20%) de cada compra.

---

## 5. Límites de Uso y Desafíos Técnicos
Es fundamental presentar los límites actuales del sistema con honestidad técnica:

### A. Cobertura en la Generación de Imágenes
*   **El problema**: La app no cuenta con un motor integrado de generación de imágenes por IA en tiempo real (debido a los altos costos de procesamiento de APIs como DALL-E 3).
*   **Cómo funciona**: Busca imágenes de las atracciones usando las APIs públicas de **Wikimedia Commons** y **Openverse**.
*   **El límite**: Si la atracción turística es muy pequeña, muy local o no tiene imágenes indexadas con licencias comerciales, el sistema recurre a un **fallback de categoría curada** (ej. si no encuentra foto de un restaurante específico, muestra una imagen genérica y estética de un restaurante obtenida de Unsplash).

### B. Cobertura de Mapas y Reconocimiento de Islas
*   **El problema**: A veces el sistema no reconoce islas o atracciones remotas cercanas a la zona donde se inicia el tour, o las ubica de forma incorrecta.
*   **Causa Técnica (El límite de radio)**: 
    *   En búsquedas estándar de tours, el sistema define un radio primario de búsqueda de **4.5 km** y un radio extendido de **9 km** a la redonda desde el centro del destino geocodificado.
    *   Si un tour se inicia en el centro de Tolú o Cartagena, islas hermosas y populares (como el Archipiélago de San Bernardo o Isla Tierrabomba) que se ubican a 15, 20 o 30 km de distancia quedan completamente fuera del alcance de la consulta a la base de datos Overpass API.
    *   Incluso en búsquedas catalogadas como "ecológicas, de playa o regionales", el límite máximo de cobertura extendida es de **55 km**.
*   **Causa Técnica (La falta de etiquetas en OSM)**:
    *   El motor Overpass de la app filtra por etiquetas geográficas específicas de OpenStreetMap (ej. `place=island`, `natural=beach`). Si una isla no está correctamente etiquetada por la comunidad de mapas abiertos, no será indexada por la app.
*   **Causa Técnica (Fallback de coordenadas con la IA)**:
    *   Cuando la base de datos geográfica de OSM devuelve menos de 3 atracciones en un lugar remoto, el backend le pide a OpenAI sugerir lugares de interés reales. Sin embargo, dado que los modelos de lenguaje no poseen un geocodificador preciso en tiempo real, la app ubica estas atracciones aplicando ligeros desvíos de latitud/longitud (ej. `+0.001` de offset) sobre el centro geográfico detectado. Esto puede provocar que una atracción en una isla remota sea dibujada geográficamente en medio del continente o en una ubicación inexacta en el mapa.
*   **Causa Técnica (Trazado de rutas terrestres vs marítimas)**:
    *   Los generadores de rutas de carreteras comunes fallan al intentar trazar una ruta terrestre continua hacia una isla (ya que se requiere transporte marítimo como lanchas o ferris). La app identifica la inviabilidad terrestre mediante la lógica `usesMaritimeTransfer`, pero esto limita el trazado de una ruta continua visual en el mapa.

---

## 6. Mejoras a Futuro (Roadmap de Desarrollo)
Para mitigar estas limitaciones y expandir la plataforma, se proponen las siguientes mejoras:

1.  **Geocodificación Avanzada y APIs de Pago**:
    *   Migrar de APIs públicas y libres (Nominatim/Photon) a servicios empresariales como **Google Places API** o **Mapbox** para obtener coordenadas ultraprecisas de cualquier destino, incluyendo pequeñas islas o monumentos ocultos.
2.  **Integración de Rutas Multimodales (Tierra y Agua)**:
    *   Agregar lógica de transporte marítimo para conectar muelles intermunicipales con islas, integrando horarios y trayectos de lanchas en el itinerario sugerido.
3.  **Motor de Imágenes IA Dedicado**:
    *   Implementar generación de portadas personalizadas con IA para tours únicos que no posean fotos libres de derechos.
4.  **Gamificación del Viajero**:
    *   Incluir badges, logros y medallas al completar tours (ej. *"Explorador de Playas"* o *"Historiador de Cartagena"*).
5.  **Socialización del Tour**:
    *   Permitir a los usuarios compartir su ubicación en tiempo real en el mapa con otros amigos que estén realizando el mismo recorrido.
6.  **Grabación de Audio Nativo para Creadores**:
    *   Permitir que los guías locales graben sus propias explicaciones de audio directamente en la app para sustituir la voz robótica del sintetizador TTS.

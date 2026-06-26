# VibeTours: panorama general de la app

## Que es VibeTours

VibeTours es una aplicacion movil hecha en Flutter para descubrir, crear y recorrer tours turisticos. La experiencia combina mapas, GPS, voz, autenticacion, Supabase y un backend Node.js para ofrecer rutas guiadas y tours generados con IA.

## Objetivo principal

La app busca que una persona pueda:

1. Explorar tours existentes.
2. Crear tours manualmente.
3. Generar tours con IA.
4. Seguir un tour en vivo con mapa, posicion actual y guia de voz.
5. Guardar contenido en Supabase cuando esta autenticada.

## Stack principal

- Flutter y Dart
- Riverpod para estado
- GoRouter para navegacion
- Supabase para autenticacion, persistencia y moderacion
- MapLibre GL para mapas
- Geolocator para ubicacion
- Speech to Text y Flutter TTS para voz
- Backend Node.js con Express
- Ollama para la generacion de contenido con IA
- Fuentes abiertas para geocoding y discovery como OpenStreetMap, Nominatim, Photon y Overpass

## Estructura general

La app esta separada en tres capas grandes:

- Flutter frontend en `lib/`
- Backend API en `backend/`
- Base de datos, funciones y politicas en `supabase/`

## Entrada de la app

El arranque principal esta en `lib/main.dart` y luego `lib/src/app.dart` construye `MaterialApp.router` con:

- Tema claro y oscuro
- Localizacion en es/en
- Navegacion con GoRouter
- Control de modo de tema
- Control de idioma
- Ajustes de experiencia como alta tasa de refresco

## Navegacion

Las rutas principales viven en `lib/src/router.dart`.

Algunas pantallas importantes son:

- `/` onboarding o shell principal segun estado inicial
- `/home` inicio
- `/tours` listado de tours
- `/tours/:id` detalle de tour
- `/live/:id` experiencia en vivo
- `/ai` generador IA
- `/creator` area de creacion
- `/profile` perfil
- `/settings` ajustes
- `/admin` panel administrador
- `/pqrs` soporte

## Modularidad de la UI

La app esta organizada por features:

- `auth`
- `home`
- `tours`
- `tour_live`
- `creator`
- `ai`
- `profile`
- `settings`
- `support`
- `admin`

Esto permite que cada flujo tenga su propia pantalla y logica sin mezclar responsabilidades.

## Estado global

El estado compartido esta centralizado en `lib/src/state/app_state.dart`.

Ahi se manejan cosas como:

- Usuario autenticado
- Estado de admin
- Tours disponibles
- Tour seleccionado
- Tours del usuario
- Modo de tema
- Idioma
- Mapa
- Preferencias de onboarding
- Perfil turistico
- Limite de demo para IA

## Datos y almacenamiento

La app trabaja con dos tipos de contenido:

- Tours locales o de demo
- Tours persistidos en Supabase

Cuando el backend o Supabase no estan disponibles, la app puede seguir funcionando con contenido demo.

## Autenticacion

La autenticacion esta integrada con Supabase Auth y tambien puede apoyarse en Google Sign-In.

El acceso a funciones sensibles depende del estado de sesion, por ejemplo:

- Guardar tours manuales
- Acceder a ciertas areas del creador
- Ver el panel admin

## Admin

Existe un panel `/admin` para una cuenta administradora unica.

La app valida el acceso segun:

- `ADMIN_USER_ID`
- o `ADMIN_EMAIL` si no existe `ADMIN_USER_ID`

En Supabase hay una tabla singleton para registrar esa cuenta.

## Mapa y navegacion

La experiencia de mapas usa:

- `OpenFreeRouteMap`
- `RoadRouteService`
- `RoutePreviewMap`

La vista de tour en vivo puede:

- Mostrar posicion actual
- Dibujar una ruta
- Recalcular si detecta desvio
- Considerar trafico en vivo cuando existe proveedor
- Avanzar entre paradas

## Voz

La app usa voz en dos sentidos:

- `Speech to Text` para dictar prompts en el planner de IA
- `Flutter TTS` para narrar paradas en la experiencia en vivo

## Flujo de tours

Un tour puede venir de varias fuentes:

- Tours demo
- Tours guardados por usuarios
- Tours manuales creados desde la app
- Tours generados por IA

Todos terminan en un modelo comun de `Tour` y `TourStop`, lo que permite que la UI los trate de forma uniforme.

## Experiencia de creacion

En el area de creador hay dos caminos:

- Creacion manual
- Creacion asistida por IA

El resultado puede guardarse en Supabase si el usuario tiene sesion iniciada.

## Internacionalizacion

La app ya incluye localizacion en:

- Espanol
- Ingles

La base de traducciones se genera en `lib/src/l10n/generated/`.

## Backend

El backend esta en `backend/` y expone endpoints para:

- Salud del servicio
- Tours
- Discovery de lugares cercanos
- Discovery de eventos
- Confirmacion de tours IA
- Generacion de tours IA

Tambien incluye un seeder para cargar tours iniciales.

## Supabase

Supabase se usa para:

- Auth
- Persistencia de tours
- Moderacion
- Realtime
- RLS y seguridad
- Edge Functions

Las migraciones SQL del repo incluyen arreglos para admin, PQRS y politicas de seguridad.

## Modo demo

Si no hay credenciales de Supabase, la app puede arrancar en modo demo con contenido local. Eso permite probar la experiencia sin configurar todo el backend.

## Actualizaciones Recientes

- **Sistema de Soporte (PQRS)**: Se agrego un centro de ayuda completo que permite a los usuarios crear, enviar y hacer seguimiento de Peticiones, Quejas, Reclamos y Sugerencias, guardando el historial en Supabase.
- **Rediseno Visual**: Se refino la paleta de colores, cambiando tonos morados por un esquema basado en colores azules primarios y acentos violeta, mejorando la claridad visual y el aspecto premium con elementos de *glassmorphism*.
- **Localizacion Completa**: Se implemento la traduccion integral de la aplicacion en Ingles y Espanol utilizando archivos `.arb` (`app_es.arb`, `app_en.arb`), cubriendo dinamicamente todas las pantallas de la interfaz.
- **Configuracion Dinamica y Recursos**: Se agregaron configuraciones segun el entorno mediante archivos JSON, y se generaron nuevos iconos adaptables e imagenes de logotipo (`logo_light.png`, `logo_dark.png`) por plataforma.
- **Navegacion e Infraestructura**: Se consolido el enrutamiento con `GoRouter`, asegurando guardias de autenticacion y transiciones de pantalla fluidas en todos los flujos de la aplicacion.

## Resumen corto

VibeTours es una app de turismo asistido que mezcla:

- Descubrimiento
- Creacion de tours
- Navegacion en tiempo real
- Guia por voz
- IA para planificacion
- Persistencia en Supabase


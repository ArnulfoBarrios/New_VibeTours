# Como funciona la IA de VibeTours

## Vision general

La IA de VibeTours no es solo un chat. Es un flujo de planificacion que transforma una solicitud de viaje en un tour estructurado, con lugares reales, paradas ordenadas, narrativa, presupuesto estimado y metadatos listos para la app.

## Flujo completo

1. El usuario abre el planner de IA en Flutter.
2. Completa destino, ciudad, pais, duracion, tipo de tour, idioma y un prompt libre.
3. La app agrega el perfil turistico si existe.
4. Flutter envia la solicitud al backend.
5. El backend busca lugares reales y arma candidatos.
6. Ollama genera un borrador de tour en JSON.
7. El backend valida, normaliza y corrige la respuesta.
8. Si la IA falla, se usa un fallback determinista.
9. La app recibe un `Tour` y una `route` listos para mostrar y navegar.

## La pantalla de IA

La pantalla principal esta en `lib/src/features/ai/ai_planner_screen.dart`.

Desde ahi el usuario puede:

- Escribir destino, pais y ciudad
- Elegir tipo de tour
- Ajustar duracion
- Elegir idioma entre ES y EN
- Dictar un prompt con voz
- Ver el tour generado
- Lanzar la experiencia en vivo

## Limite de demo

En modo invitado, la IA tiene un limite de dos usos.

Ese control vive en `guestAiRemainingProvider` y el controlador bloquea nuevas generaciones cuando el contador llega a cero.

## Perfil del viajero

La IA tambien recibe contexto personal del usuario desde `touristProfileProvider`.

Ese perfil guarda:

- Intereses
- Ritmo preferido
- Paises favoritos
- Un resumen corto listo para el prompt

Esto ayuda a adaptar el resultado al estilo del viajero.

## Tipo de salida

La IA no devuelve texto libre. Devuelve una estructura de tour.

Los campos principales incluyen:

- Nombre del tour
- Resumen corto
- Descripcion
- Experiencia destacada
- Contexto cultural
- Historia del lugar
- Idioma disponible
- Publico recomendado
- Mejor epoca
- Horario recomendado
- Punto de encuentro
- Imagen de portada
- Galeria
- Itinerario de paradas
- Incluye / no incluye
- Recomendaciones
- Que llevar
- Normas
- Etiquetas
- Palabras clave
- Presupuesto
- Informacion adicional

## Backend de IA

La logica principal esta en `backend/src/routes/ai.js`.

Hay dos endpoints relevantes:

- `POST /api/ai/tours/confirm`
- `POST /api/ai/tours/generate`

### `confirm`

Este endpoint valida la entrada y hace una geocodificacion basica para devolver una confirmacion del destino detectado.

Sirve como paso previo para verificar que la ubicacion tiene sentido antes de generar el tour completo.

### `generate`

Este es el flujo importante.

Primero:

- Valida la entrada con `zod`
- Busca coordenadas del destino con geocoding
- Busca candidatos reales con Overpass o Photon
- Toma un conjunto inicial de lugares

Despues:

- Ordena y puntua lugares con heuristicas
- Calcula duracion, distancia, horario recomendado y dificultad
- Construye un contexto de planificacion
- Llama a Ollama con una instruccion de sistema estricta

## Rol de Ollama

`backend/src/services/ollama.js` es quien habla con el modelo local.

La instruccion del sistema obliga a la IA a:

- Responder solo JSON
- No inventar lugares inexistentes
- Usar un idioma especifico
- Producir descripciones realistas
- Respetar el tipo de tour
- Priorizar coherencia geografica y narrativa

## Por que se usan candidatos reales

La IA no debe imaginar todo desde cero.

Primero recibe una base de lugares reales obtenidos por:

- Nominatim para geocoding
- Overpass para atracciones cercanas
- Photon como respaldo de busqueda

Eso hace que el itinerario sea mas util y menos fantasioso.

## Heuristicas internas

Antes de pedirle texto al modelo, el backend ordena los lugares con reglas propias.

Las heuristicas consideran:

- Afinidad con el tipo de tour
- Popularidad
- Proximidad
- Diversidad de categorias
- Perfil del viajero

Tambien evita:

- Repetir categorias iguales demasiado seguido
- Poner paradas muy cercanas sin valor narrativo
- Construir rutas monotemas

## Normalizacion del resultado

Aunque Ollama responda bien, el backend vuelve a pasar la salida por un proceso de normalizacion.

Ese proceso:

- Limita el numero de paradas
- Completa nombres faltantes
- Asegura que cada parada tenga ubicacion
- Genera imagenes cuando faltan
- Convierte duraciones a un formato uniforme
- Construye la ruta para navegacion

## Fallback

Si el modelo no devuelve un JSON utilizable, la app no se rompe.

El backend genera un tour alternativo con reglas internas, usando:

- Lugares seleccionados
- Descripcion basada en tipo de tour
- Horarios sugeridos
- Presupuesto estimado
- Itinerario coherente

## Persistencia opcional

Si la solicitud llega con:

- `persist = true`
- `userId`

Entonces el backend guarda el tour en Supabase como un tour IA pendiente de moderacion.

Tambien guarda las paradas en `tour_stops`.

## Relacion con la app

La app usa el resultado para:

- Pintar una tarjeta de tour
- Mostrar el JSON de vista previa
- Abrir la ruta en vivo
- Seleccionar el tour como `selectedTour`

## Guia por voz

En la experiencia en vivo, la IA del planner y la guia por voz son cosas distintas.

La narracion de cada parada usa TTS desde Flutter, no el modelo de Ollama.

## En sintesis

La IA de VibeTours funciona como una cadena:

- Entrada del usuario
- Contexto turistico
- Busqueda de lugares reales
- Planificacion heuristica
- Generacion con Ollama
- Validacion y normalizacion
- Persistencia opcional
- Uso directo en mapa y tour en vivo

Eso permite que la IA ayude a crear tours reales, ordenados y accionables, en lugar de solo generar texto bonito.


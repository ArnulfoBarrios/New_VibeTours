# VIBETOURS 🌍✨

**VIBETOURS** es una plataforma de turismo inteligente impulsada por Inteligencia Artificial y datos geográficos en tiempo real. Permite a los usuarios descubrir, planificar, crear y recorrer itinerarios turísticos inmersivos con acompañamiento por voz (Text-to-Speech), navegación GPS en vivo, integración con Supabase, backend Node.js/Express y modelos de lenguaje de última generación.

---

## 🛠️ Stack Tecnológico

### Frontend (Aplicación Móvil)
- **Flutter & Dart**: Framework multiplataforma de alto rendimiento visual.
- **Riverpod (`flutter_riverpod`)**: Gestión de estado reactivo y modular.
- **GoRouter (`go_router`)**: Enrutamiento declarativo, guías de autenticación y transiciones.
- **MapLibre GL (`maplibre_gl`)**: Motor de renderizado de mapas vectoriales interactivos.
- **Geolocator (`geolocator`)**: Captura y seguimiento de posición GPS en tiempo real.
- **Voz e Interacción**: `flutter_tts` (Narración por voz) y `speech_to_text` (Dictado de voz).
- **Firebase**: Integración con Crashlytics, Analytics, Messaging y Auth.

### Backend & Servicios API
- **Node.js & Express**: Servidor REST para la orquestación de IA y geodatos.
- **OpenAI API (`gpt-4o-mini`)**: Extracción semántica, generación de guías narrativas de voz e itinerarios.
- **OpenStreetMap (OSM)**: 
  - **Nominatim**: Geocodificación directa y reversa.
  - **Photon**: Búsqueda global de lugares con autocompletado.
  - **Overpass API**: Consulta geoespacial de Puntos de Interés (POIs) y hoteles en tiempo real.
- **Wikipedia API**: Enriquecimiento histórico y cultural de cada parada.
- **TomTom Routing API**: Optimización geográfica de rutas (Traveling Salesperson Problem).
- **Open-Meteo API**: Pronóstico del clima en tiempo real sin requerir API key.
- **Unsplash & OpenVerse**: Curación y búsqueda de imágenes de alta resolución.

### Backend as a Service (BaaS)
- **Supabase**: Base de datos PostgreSQL con soporte geoespacial, Auth (Email & Google OAuth), Storage para imágenes y avatares, y políticas de seguridad RLS (*Row Level Security*).

---

## 🚀 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
- **Flutter SDK** (`>= 3.24.0 < 4.0.0`)
- **Node.js** (`>= 18.0.0`) y **npm**
- **Git**
- Una cuenta en **Supabase** (para entorno online)
- Una API Key de **OpenAI** (para generación de tours con IA)

---

## ⚙️ Configuración del Backend (Node.js)

1. Navega a la carpeta del backend e instala las dependencias:
   ```bash
   cd backend
   npm install
   ```

2. Crea el archivo `.env` basado en la plantilla:
   ```bash
   cp .env.example .env
   ```

3. Configura las variables clave en `backend/.env`:
   ```env
   PORT=3000
   NODE_ENV=development

   # Supabase
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu-anon-key-publica
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-privada

   # Backend API Base URL (Para probar en dispositivo físico usa la IP local de tu PC)
   API_BASE_URL=http://192.168.1.110:3000/api

   # OpenAI
   OPENAI_API_KEY=sk-tu-api-key-de-openai
   OPENAI_TIMEOUT_MS=90000

   # Servicios adicionales
   TOMTOM_API_KEY=tu-tomtom-key-opcional
   OPENVERSE_CLIENT_ID=tu-client-id-opcional
   OPENVERSE_CLIENT_SECRET=tu-client-secret-opcional

   # Administrador Único
   ADMIN_EMAIL=admin@ejemplo.com
   ADMIN_USER_ID=uuid-de-tu-usuario-admin
   ```

4. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   El servidor estará disponible en `http://localhost:3000`.

---

## 📲 Configuración y Sincronización del Cliente Flutter

### 1. Sincronización Automática de Configuración Pública
Para evitar copiar credenciales manualmente a Flutter, ejecuta el script de sincronización desde la raíz del proyecto. Este script lee `backend/.env` y genera el archivo público seguro `assets/config/public_config.json`:

```bash
node scripts/sync_public_config.mjs
```

> [!NOTE]
> `public_config.json` **solo** incluye claves públicas (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `API_BASE_URL`, `ADMIN_EMAIL`, etc.). **Nunca** expone claves privadas como `SUPABASE_SERVICE_ROLE_KEY` o `OPENAI_API_KEY`.

### 2. Ejecutar la Aplicación Flutter

Puedes ejecutar Flutter de dos maneras:

#### Opción A: Usando la configuración sincronizada (`public_config.json`)
Si ejecutaste el script de sincronización anterior, simplemente corre:
```bash
flutter pub get
flutter gen-l10n
flutter run
```

#### Opción B: Pasando parámetros mediante `--dart-define`
```powershell
flutter pub get
flutter gen-l10n
flutter run `
  --dart-define=SUPABASE_URL=https://tu-proyecto.supabase.co `
  --dart-define=SUPABASE_ANON_KEY=tu-anon-key `
  --dart-define=API_BASE_URL=http://192.168.1.110:3000/api `
  --dart-define=ADMIN_EMAIL=admin@ejemplo.com
```

### 📱 Pruebas en Dispositivos Físicos y Emuladores
- **Teléfono físico en la misma red Wi-Fi**: Cambia `API_BASE_URL` en tu `.env` por la IP local de tu computador (ej. `http://192.168.1.110:3000/api`).
- **Emulador Android**: Usa `http://10.0.2.2:3000/api`.
- **Simulador iOS**: Usa `http://localhost:3000/api`.

---

## 🗄️ Base de Datos Supabase & Seeder

### 1. Aplicar Migraciones de la Base de Datos
Ejecuta las migraciones en tu proyecto Supabase a través del CLI:
```bash
supabase db push
```

### 2. Poblar la Base de Datos (Seeder con 50 Tours)
El repositorio incluye un script para sembrar 50 tours completos precargados con paradas y detalles:
```bash
cd backend
npm run seed
```
- **35 Tours en Colombia**: Barranquilla, Cartagena, Santa Marta, Bogotá, Medellín, Cali, Bucaramanga, Villa de Leyva, San Andrés, Guatapé, etc.
- **15 Tours Internacionales**: París, Roma, Londres, Nueva York, Tokio, Kioto, Seúl, Ciudad de México, Barcelona, Dubái, Praga, etc.

---

## 🔐 Configuración de Administrador Único

VIBETOURS implementa una política de **Administrador Único (Single Admin Account)**:
- El panel de administración (`/admin`) solo es accesible por el usuario cuyo `id` o `email` coincida con el registro en la tabla `public.admin_account`.
- Para autorizar a tu cuenta como administradora, ejecuta la consulta SQL en Supabase:
```sql
insert into public.admin_account (id, email)
values (true, 'admin@ejemplo.com')
on conflict (id) do update
set email = excluded.email, user_id = null, updated_at = now();
```

---

## 🌐 Autenticación con Google (OAuth)

1. Configura Google Provider en Supabase Auth.
2. Agrega la URL de redirección en Supabase Auth:
   ```text
   com.vibetours.app://login-callback
   ```
3. Si usas Google Sign-In nativo en Flutter, pasa los IDs de cliente por `--dart-define`:
   - `GOOGLE_WEB_CLIENT_ID`
   - `GOOGLE_IOS_CLIENT_ID`

---

## 📴 Modo Demo (Resiliencia Offline)

Si la app arranca sin credenciales de Supabase o sin conexión al backend Node.js:
1. La aplicación detecta la falta de conectividad de forma transparente.
2. Activa automáticamente el **Modo Demo / Invitado**.
3. Carga 50 tours locales desde los assets internos.
4. Permite la previsualización de tours y el recorrido guiado en mapa.
5. Deshabilita la escritura persistente en base de datos para garantizar estabilidad.

---

## 📄 Documentación Adicional

- [app-overview.md]: Guía detallada de la arquitectura, stack técnico y desglose completo de las funciones del sistema.
- [ai-documentation.md]:Explicación exhaustiva del motor de IA, máquina de estados conversacional, anti-alucinaciones, capacidades y límites.

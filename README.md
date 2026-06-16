# VIBETOURS

Aplicacion movil Flutter para descubrir, crear y recorrer tours turisticos con IA, mapas, voz, Supabase y backend Node.js.

## Stack

- Flutter, Dart, Riverpod, GoRouter, Supabase Flutter
- MapLibre GL, Geolocator, Google Sign-In, Speech To Text, Flutter TTS
- Cached Network Image, Flutter Animate, Lottie, Shimmer
- Node.js, Express, Supabase JS, Ollama
- OpenStreetMap, Nominatim, Photon, Overpass, Wikimedia/Openverse/Unsplash
- Supabase Auth, Postgres, Storage, Edge Functions, Realtime y RLS

## Flutter

```powershell
flutter pub get
flutter gen-l10n
flutter run `
  --dart-define=SUPABASE_URL=https://your-project.supabase.co `
  --dart-define=SUPABASE_ANON_KEY=your-anon-key `
  --dart-define=API_BASE_URL=http://192.168.1.106:3000/api `
  --dart-define=GOOGLE_WEB_CLIENT_ID=your-google-web-client-id `
  --dart-define=ADMIN_EMAIL=admin@example.com
```

Si `SUPABASE_URL` y `SUPABASE_ANON_KEY` no se envian, la app arranca en modo demo con los 50 tours locales.

La app tambien puede cargar configuracion publica desde `assets/config/public_config.json`. Para generarla desde `backend/.env` sin copiar claves privadas al cliente:

```powershell
node scripts/sync_public_config.mjs
```

Este archivo solo incluye configuracion publica del cliente: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `API_BASE_URL`, client IDs publicos de Google, `TOMTOM_API_KEY`, `ADMIN_EMAIL` y `ADMIN_USER_ID` si existen.

Para probar en un telefono fisico, `localhost` no apunta a tu PC: usa la IP Wi-Fi del computador que corre el backend. En esta maquina la IP detectada es `192.168.1.106`, por eso la URL local es `http://192.168.1.106:3000/api`. Si cambias de red, consulta la IP de nuevo con:

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object IPAddress,InterfaceAlias
```

Para Android emulator puedes usar `http://10.0.2.2:3000/api`. Para produccion usa un backend publicado con HTTPS.

## Backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

Variables principales:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`

Endpoints:

- `GET /health`
- `GET /api/tours`
- `POST /api/ai/tours/confirm`
- `POST /api/ai/tours/generate`
- `GET /api/discovery/nearby`
- `GET /api/discovery/events`

## Supabase

Migracion principal:

```powershell
supabase db push
supabase functions deploy ai-planner
```

Seed de tours:

```powershell
cd backend
npm run seed
```

El seeder crea 50 tours completos:

- 35 Colombia: Barranquilla, Cartagena, Santa Marta, Bogota, Medellin, Cali, Bucaramanga, Villa de Leyva, San Andres, Guatape.
- 15 internacionales: Paris, Roma, Londres, Nueva York, Tokio, Kioto, Seul, Ciudad de Mexico, Barcelona, Dubai, Estambul, Bangkok, Singapur, Praga, Sidney.

## Administrador unico

El panel `/admin` no se muestra a usuarios normales. La app solo habilita el acceso cuando el usuario autenticado coincide con `ADMIN_USER_ID` o, si este no existe, con `ADMIN_EMAIL`.

En Supabase, la migracion `20260611123000_single_admin_account.sql` crea `public.admin_account`, una tabla singleton que permite registrar una unica cuenta administradora. Despues de crear el usuario admin, registra una sola fila con permisos de servicio:

```sql
insert into public.admin_account (id, email)
values (true, 'admin@example.com')
on conflict (id) do update
set email = excluded.email, user_id = null, updated_at = now();
```

Tambien puedes usar `user_id` en lugar de email. No publiques `SUPABASE_SERVICE_ROLE_KEY` en Flutter ni en Trello.

## Google Login

Configura Google como proveedor OAuth en Supabase Auth y pasa los client IDs por `--dart-define`:

- `GOOGLE_WEB_CLIENT_ID`
- `GOOGLE_IOS_CLIENT_ID`

Android requiere configurar SHA-1/SHA-256 en Google Cloud. iOS requiere el URL scheme generado por Google Sign-In.

Si no usas `GOOGLE_WEB_CLIENT_ID`, VIBETOURS usa el flujo OAuth de Supabase. En Supabase Auth agrega este redirect URL:

```text
com.vibetours.app://login-callback
```

## Produccion

- Usa claves anon/publishable en Flutter, nunca `service_role`.
- Ejecuta `flutter analyze`, `flutter test`, `npm install`, `npm start` y el seeder en un proyecto Supabase preparado.
- Revisa cuotas de Nominatim/Overpass/Openverse y agrega cache si el trafico crece.

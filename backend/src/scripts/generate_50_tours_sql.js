import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { colombiaTours } from './seeds/colombiaTours.js';
import { latamTours } from './seeds/latamTours.js';
import { europeTours } from './seeds/europeTours.js';
import { worldTours } from './seeds/worldTours.js';
import { modalityTours } from './seeds/modalityTours.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREATOR_USER_ID = '7b767010-fc97-4299-9ae3-5a4985da1da3';
const CREATOR_NAME = 'Emotiva VibeTours';
const CREATOR_EMAIL = 'emotiva.vibetours@gmail.com';

function deterministicUuid(seedStr) {
  const hex = crypto.createHash('md5').update(seedStr).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function escapeSqlString(str) {
  if (str === null || str === undefined) return "''";
  return `'${String(str).replace(/'/g, "''")}'`;
}

function escapeSqlArray(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return "'{}'::text[]";
  const items = arr.map((item) => escapeSqlString(item));
  return `ARRAY[${items.join(', ')}]::text[]`;
}

function escapeSqlJsonb(obj) {
  if (obj === null || obj === undefined) return "'{}'::jsonb";
  const jsonStr = JSON.stringify(obj).replace(/'/g, "''");
  return `'${jsonStr}'::jsonb`;
}

function generateSql() {
  const allTours = [
    ...colombiaTours,
    ...latamTours,
    ...europeTours,
    ...worldTours,
    ...modalityTours
  ];

  console.log(`Loaded ${allTours.length} tours across all 5 seed modules.`);

  const sqlLines = [];

  sqlLines.push(`-- ===================================================================`);
  sqlLines.push(`-- VibeTours - Seed Data: 50 Comprehensive Curated Multi-Day Tours`);
  sqlLines.push(`-- Creator: ${CREATOR_NAME} (${CREATOR_USER_ID})`);
  sqlLines.push(`-- Generated: ${new Date().toISOString()}`);
  sqlLines.push(`-- Description: Includes 50 rich multi-day tours (3 to 15 days) covering:`);
  sqlLines.push(`--   1. Colombia Destacada (Tours 1 - 10)`);
  sqlLines.push(`--   2. Latinoamérica & Caribe (Tours 11 - 16)`);
  sqlLines.push(`--   3. Europa Monumental (Tours 17 - 23)`);
  sqlLines.push(`--   4. Asia, Medio Oriente, África & Oceanía (Tours 24 - 30)`);
  sqlLines.push(`--   5. Modalidades de Viaje: Single City, Micro-Dest, Coastal, City-to-City, Multi-City (Tours 31 - 50)`);
  sqlLines.push(`-- ===================================================================\n`);

  sqlLines.push(`BEGIN;\n`);

  // 1. Ensure User in auth.users and public.users
  sqlLines.push(`-- 1. Ensure Creator Account exists in auth.users and public.users`);
  sqlLines.push(`DO $$`);
  sqlLines.push(`BEGIN`);
  sqlLines.push(`  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN`);
  sqlLines.push(`    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '${CREATOR_USER_ID}') THEN`);
  sqlLines.push(`      INSERT INTO auth.users (`);
  sqlLines.push(`        id, aud, role, email, encrypted_password, email_confirmed_at,`);
  sqlLines.push(`        raw_app_meta_data, raw_user_meta_data, created_at, updated_at`);
  sqlLines.push(`      ) VALUES (`);
  sqlLines.push(`        '${CREATOR_USER_ID}',`);
  sqlLines.push(`        'authenticated',`);
  sqlLines.push(`        'authenticated',`);
  sqlLines.push(`        '${CREATOR_EMAIL}',`);
  sqlLines.push(`        crypt('VibeTours2025!', gen_salt('bf')),`);
  sqlLines.push(`        now(),`);
  sqlLines.push(`        '{"provider":"email","providers":["email"]}'::jsonb,`);
  sqlLines.push(`        '{"full_name":"${CREATOR_NAME}"}'::jsonb,`);
  sqlLines.push(`        now(),`);
  sqlLines.push(`        now()`);
  sqlLines.push(`      );`);
  sqlLines.push(`    END IF;`);
  sqlLines.push(`  END IF;\n`);

  sqlLines.push(`  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = '${CREATOR_USER_ID}') THEN`);
  sqlLines.push(`    INSERT INTO public.users (`);
  sqlLines.push(`      id, email, full_name, avatar_url, bio, country, role, created_at, updated_at`);
  sqlLines.push(`    ) VALUES (`);
  sqlLines.push(`      '${CREATOR_USER_ID}',`);
  sqlLines.push(`      '${CREATOR_EMAIL}',`);
  sqlLines.push(`      '${CREATOR_NAME}',`);
  sqlLines.push(`      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',`);
  sqlLines.push(`      'Creador oficial y curador de experiencias y rutas exclusivas para VibeTours.',`);
  sqlLines.push(`      'Colombia',`);
  sqlLines.push(`      'admin',`);
  sqlLines.push(`      now(),`);
  sqlLines.push(`      now()`);
  sqlLines.push(`    );`);
  sqlLines.push(`  ELSE`);
  sqlLines.push(`    UPDATE public.users`);
  sqlLines.push(`    SET full_name = '${CREATOR_NAME}',`);
  sqlLines.push(`        role = 'admin',`);
  sqlLines.push(`        updated_at = now()`);
  sqlLines.push(`    WHERE id = '${CREATOR_USER_ID}';`);
  sqlLines.push(`  END IF;`);
  sqlLines.push(`END $$;\n`);

  // 2. Clean existing tours with these slugs for idempotency
  const slugsList = allTours.map((t) => `'${t.slug}'`).join(',\n  ');
  sqlLines.push(`-- 2. Remove any previous versions of these 50 tours (cascades to days and stops)`);
  sqlLines.push(`DELETE FROM public.tours WHERE slug IN (\n  ${slugsList}\n);\n`);

  sqlLines.push(`-- Ensure required columns exist on tour_stops for metadata & days`);
  sqlLines.push(`ALTER TABLE public.tour_stops ADD COLUMN IF NOT EXISTS image_metadata jsonb DEFAULT '{}'::jsonb;`);
  sqlLines.push(`ALTER TABLE public.tour_stops ADD COLUMN IF NOT EXISTS day integer DEFAULT 1;\n`);

  // 3. Process Tours, Days, and Stops
  sqlLines.push(`-- 3. Insert 50 Tours, their Tour Days, and georeferenced Tour Stops\n`);

  let totalDays = 0;
  let totalStops = 0;

  for (let tIdx = 0; tIdx < allTours.length; tIdx++) {
    const tour = allTours[tIdx];
    const tourId = deterministicUuid(`vibetour:${tour.slug}`);

    sqlLines.push(`-- -------------------------------------------------------------`);
    sqlLines.push(`-- Tour #${tIdx + 1}: ${tour.title} (${tour.city}, ${tour.country})`);
    sqlLines.push(`-- -------------------------------------------------------------`);

    const creationJson = {
      source: 'vibetours_official_curated_seed',
      scope: tour.tourScope || 'single_city',
      curated_by: CREATOR_NAME
    };

    sqlLines.push(`INSERT INTO public.tours (`);
    sqlLines.push(`  id, owner_id, created_by, slug, title, country, city, type,`);
    sqlLines.push(`  description, cover_url, gallery, duration_minutes, distance_meters,`);
    sqlLines.push(`  difficulty, language, rating, review_count, likes_count, tags,`);
    sqlLines.push(`  is_published, moderation_status, budget, recommended_audience,`);
    sqlLines.push(`  best_season, recommended_schedule, meeting_point, includes, excludes,`);
    sqlLines.push(`  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at`);
    sqlLines.push(`) VALUES (`);
    sqlLines.push(`  '${tourId}',`);
    sqlLines.push(`  '${CREATOR_USER_ID}',`);
    sqlLines.push(`  '${CREATOR_USER_ID}',`);
    sqlLines.push(`  ${escapeSqlString(tour.slug)},`);
    sqlLines.push(`  ${escapeSqlString(tour.title)},`);
    sqlLines.push(`  ${escapeSqlString(tour.country)},`);
    sqlLines.push(`  ${escapeSqlString(tour.city)},`);
    sqlLines.push(`  ${escapeSqlString(tour.type)},`);
    sqlLines.push(`  ${escapeSqlString(tour.description)},`);
    sqlLines.push(`  ${escapeSqlString(tour.cover_url)},`);
    sqlLines.push(`  ${escapeSqlArray(tour.gallery)},`);
    sqlLines.push(`  ${tour.duration_minutes || 1440},`);
    sqlLines.push(`  ${tour.distance_meters || 10000},`);
    sqlLines.push(`  ${escapeSqlString(tour.difficulty || 'easy')},`);
    sqlLines.push(`  'es',`);
    sqlLines.push(`  ${tour.rating || 4.9},`);
    sqlLines.push(`  ${tour.review_count || 100},`);
    sqlLines.push(`  ${tour.likes_count || 250},`);
    sqlLines.push(`  ${escapeSqlArray(tour.tags || [])},`);
    sqlLines.push(`  true,`);
    sqlLines.push(`  'approved',`);
    sqlLines.push(`  ${escapeSqlJsonb(tour.budget || {})},`);
    sqlLines.push(`  ${escapeSqlArray(tour.recommended_audience || [])},`);
    sqlLines.push(`  ${escapeSqlString(tour.best_season || '')},`);
    sqlLines.push(`  ${escapeSqlString(tour.recommended_schedule || '')},`);
    sqlLines.push(`  ${escapeSqlString(tour.meeting_point || '')},`);
    sqlLines.push(`  ${escapeSqlArray(tour.includes || [])},`);
    sqlLines.push(`  ${escapeSqlArray(tour.excludes || [])},`);
    sqlLines.push(`  ${escapeSqlArray(tour.recommendations || [])},`);
    sqlLines.push(`  ${escapeSqlArray(tour.what_to_bring || [])},`);
    sqlLines.push(`  ${escapeSqlArray(tour.tour_rules || [])},`);
    sqlLines.push(`  ${escapeSqlJsonb(creationJson)},`);
    sqlLines.push(`  now(),`);
    sqlLines.push(`  now()`);
    sqlLines.push(`);\n`);

    // Days
    let tourStopIndex = 0;
    if (tour.days && Array.isArray(tour.days)) {
      for (const day of tour.days) {
        totalDays++;
        const dayId = deterministicUuid(`vibetour-day:${tour.slug}:${day.day_number}`);

        sqlLines.push(`INSERT INTO public.tour_days (`);
        sqlLines.push(`  id, tour_id, day_number, title, notes, created_at`);
        sqlLines.push(`) VALUES (`);
        sqlLines.push(`  '${dayId}',`);
        sqlLines.push(`  '${tourId}',`);
        sqlLines.push(`  ${day.day_number},`);
        sqlLines.push(`  ${escapeSqlString(day.title)},`);
        sqlLines.push(`  ${escapeSqlString(day.notes || '')},`);
        sqlLines.push(`  now()`);
        sqlLines.push(`);`);

        // Stops
        if (day.stops && Array.isArray(day.stops)) {
          for (const stop of day.stops) {
            totalStops++;
            tourStopIndex++;
            const position = tourStopIndex;
            const stopOrder = tourStopIndex;
            const stopId = deterministicUuid(
              `vibetour-stop:${tour.slug}:${tourStopIndex}`
            );

            const imageMetadata = {
              dia: day.day_number,
              day: day.day_number,
              activities: stop.activities || [],
              datos_curiosos: stop.curious_facts || [],
              consejos: stop.tips || [],
              location_info: {
                ...(stop.location_info || {}),
                dia: day.day_number,
                day: day.day_number
              }
            };

            const enrichedLocationInfo = {
              ...(stop.location_info || {}),
              dia: day.day_number,
              day: day.day_number
            };

            sqlLines.push(`INSERT INTO public.tour_stops (`);
            sqlLines.push(`  id, tour_id, day_id, stop_order, position, name, latitude, longitude,`);
            sqlLines.push(`  image_url, images, description, activities, tips, curious_facts,`);
            sqlLines.push(`  location_info, suggested_minutes, day, image_metadata, created_at`);
            sqlLines.push(`) VALUES (`);
            sqlLines.push(`  '${stopId}',`);
            sqlLines.push(`  '${tourId}',`);
            sqlLines.push(`  '${dayId}',`);
            sqlLines.push(`  ${stopOrder},`);
            sqlLines.push(`  ${position},`);
            sqlLines.push(`  ${escapeSqlString(stop.name)},`);
            sqlLines.push(`  ${stop.latitude},`);
            sqlLines.push(`  ${stop.longitude},`);
            sqlLines.push(`  ${escapeSqlString(stop.image_url || '')},`);
            sqlLines.push(`  ${escapeSqlArray(stop.images || (stop.image_url ? [stop.image_url] : []))},`);
            sqlLines.push(`  ${escapeSqlString(stop.description || '')},`);
            sqlLines.push(`  ${escapeSqlArray(stop.activities || [])},`);
            sqlLines.push(`  ${escapeSqlArray(stop.tips || [])},`);
            sqlLines.push(`  ${escapeSqlArray(stop.curious_facts || [])},`);
            sqlLines.push(`  ${escapeSqlJsonb(enrichedLocationInfo)},`);
            sqlLines.push(`  ${stop.suggested_minutes || 45},`);
            sqlLines.push(`  ${day.day_number},`);
            sqlLines.push(`  ${escapeSqlJsonb(imageMetadata)},`);
            sqlLines.push(`  now()`);
            sqlLines.push(`);`);
          }
        }
        sqlLines.push('');
      }
    }

    const commentId = deterministicUuid(`vibetour-comment:${tour.slug}`);
    sqlLines.push(`INSERT INTO public.tour_comments (`);
    sqlLines.push(`  id, tour_id, user_id, rating, body, photos, created_at, updated_at`);
    sqlLines.push(`) VALUES (`);
    sqlLines.push(`  '${commentId}',`);
    sqlLines.push(`  '${tourId}',`);
    sqlLines.push(`  '${CREATOR_USER_ID}',`);
    sqlLines.push(`  5,`);
    sqlLines.push(`  ${escapeSqlString(`Ruta oficial curada y verificada por ${CREATOR_NAME}. ¡Una experiencia inolvidable!`)},`);
    sqlLines.push(`  '{}'::text[],`);
    sqlLines.push(`  now(),`);
    sqlLines.push(`  now()`);
    sqlLines.push(`);\n`);
  }

  sqlLines.push(`COMMIT;\n`);
  sqlLines.push(`-- ===================================================================`);
  sqlLines.push(`-- End of Seed Data: 50 Tours, ${totalDays} Days, ${totalStops} Stops inserted.`);
  sqlLines.push(`-- ===================================================================`);

  const outputPath = path.resolve(__dirname, '../../../supabase/seed_50_vibetours.sql');
  const finalSql = sqlLines.join('\n');
  fs.writeFileSync(outputPath, finalSql, 'utf8');

  console.log(`Successfully generated SQL script at: ${outputPath}`);
  console.log(`Tours: ${allTours.length}`);
  console.log(`Days: ${totalDays}`);
  console.log(`Stops: ${totalStops}`);
  console.log(`File size: ${(Buffer.byteLength(finalSql, 'utf8') / 1024).toFixed(2)} KB`);
}

generateSql();

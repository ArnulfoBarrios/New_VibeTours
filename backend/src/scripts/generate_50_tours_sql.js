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

function buildSqlForTours(toursList, sectionTitle, partNumber = null, totalParts = null) {
  const sqlLines = [];

  const partHeader = partNumber
    ? ` (Parte ${partNumber} de ${totalParts})`
    : ' (Completo)';

  sqlLines.push(`-- ===================================================================`);
  sqlLines.push(`-- VibeTours - Seed Data: ${sectionTitle}${partHeader}`);
  sqlLines.push(`-- Creator: ${CREATOR_NAME} (${CREATOR_USER_ID})`);
  sqlLines.push(`-- Generated: ${new Date().toISOString()}`);
  sqlLines.push(`-- Total Tours in this script: ${toursList.length}`);
  sqlLines.push(`-- ===================================================================\n`);

  sqlLines.push(`BEGIN;\n`);

  // 1. Ensure Creator Account exists
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

  // 2. Ensure image_metadata exists on tour_stops
  sqlLines.push(`-- Ensure required image_metadata column exists on tour_stops`);
  sqlLines.push(`ALTER TABLE public.tour_stops ADD COLUMN IF NOT EXISTS image_metadata jsonb DEFAULT '{}'::jsonb;\n`);

  // 3. Remove existing versions of these tours
  const slugsList = toursList.map((t) => `'${t.slug}'`).join(',\n  ');
  sqlLines.push(`-- 2. Remove any previous versions of these tours (cascades to days, stops, comments)`);
  sqlLines.push(`DELETE FROM public.tours WHERE slug IN (\n  ${slugsList}\n);\n`);

  // 4. Insert tours, days, stops, comments
  sqlLines.push(`-- 3. Insert Tours, Tour Days, georeferenced Stops, and Verified Reviews\n`);

  let daysCount = 0;
  let stopsCount = 0;

  for (let tIdx = 0; tIdx < toursList.length; tIdx++) {
    const tour = toursList[tIdx];
    const tourId = deterministicUuid(`vibetour:${tour.slug}`);

    sqlLines.push(`-- -------------------------------------------------------------`);
    sqlLines.push(`-- Tour: ${tour.title} (${tour.city}, ${tour.country})`);
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

    // Days & Stops
    let tourStopIndex = 0;
    if (tour.days && Array.isArray(tour.days)) {
      for (const day of tour.days) {
        daysCount++;
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

        if (day.stops && Array.isArray(day.stops)) {
          for (const stop of day.stops) {
            stopsCount++;
            tourStopIndex++;
            const position = tourStopIndex;
            const stopOrder = tourStopIndex;
            const stopId = deterministicUuid(`vibetour-stop:${tour.slug}:${tourStopIndex}`);

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
            sqlLines.push(`  location_info, suggested_minutes, image_metadata, created_at`);
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
            sqlLines.push(`  ${escapeSqlJsonb(imageMetadata)},`);
            sqlLines.push(`  now()`);
            sqlLines.push(`);`);
          }
        }
        sqlLines.push('');
      }
    }

    // Comment
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
  sqlLines.push(`-- End of Seed Data: ${toursList.length} Tours, ${daysCount} Days, ${stopsCount} Stops.`);
  sqlLines.push(`-- ===================================================================`);

  return {
    sql: sqlLines.join('\n'),
    toursCount: toursList.length,
    daysCount,
    stopsCount
  };
}

function generateAll() {
  const allTours = [
    ...colombiaTours,
    ...latamTours,
    ...europeTours,
    ...worldTours,
    ...modalityTours
  ];

  const part1Tours = [...colombiaTours, ...latamTours]; // 10 + 6 = 16 tours
  const part2Tours = [...europeTours, ...worldTours];   // 7 + 7 = 14 tours
  const part3Tours = [...modalityTours];                // 20 modality tours

  console.log(`Loaded ${allTours.length} tours across all 5 seed modules.`);

  const outputDir = path.resolve(__dirname, '../../../supabase');

  // 1. Full 50 tours file
  const fullResult = buildSqlForTours(allTours, '50 Tours Completos VibeTours');
  const fullPath = path.join(outputDir, 'seed_50_vibetours.sql');
  fs.writeFileSync(fullPath, fullResult.sql, 'utf8');
  console.log(`[FULL] seed_50_vibetours.sql: ${fullResult.toursCount} tours, ${(Buffer.byteLength(fullResult.sql, 'utf8') / 1024).toFixed(2)} KB`);

  // 2. Part 1: Colombia & LATAM
  const p1Result = buildSqlForTours(part1Tours, 'Parte 1: Colombia & Latinoamérica (Tours 1 - 16)', 1, 3);
  const p1Path = path.join(outputDir, 'seed_part1_colombia_latam.sql');
  fs.writeFileSync(p1Path, p1Result.sql, 'utf8');
  console.log(`[PART 1] seed_part1_colombia_latam.sql: ${p1Result.toursCount} tours, ${(Buffer.byteLength(p1Result.sql, 'utf8') / 1024).toFixed(2)} KB`);

  // 3. Part 2: Europe & World
  const p2Result = buildSqlForTours(part2Tours, 'Parte 2: Europa, Asia, África & Oceanía (Tours 17 - 30)', 2, 3);
  const p2Path = path.join(outputDir, 'seed_part2_europe_world.sql');
  fs.writeFileSync(p2Path, p2Result.sql, 'utf8');
  console.log(`[PART 2] seed_part2_europe_world.sql: ${p2Result.toursCount} tours, ${(Buffer.byteLength(p2Result.sql, 'utf8') / 1024).toFixed(2)} KB`);

  // 4. Part 3: Modalities
  const p3Result = buildSqlForTours(part3Tours, 'Parte 3: Las 5 Modalidades de Viaje (Tours 31 - 50)', 3, 3);
  const p3Path = path.join(outputDir, 'seed_part3_modalities.sql');
  fs.writeFileSync(p3Path, p3Result.sql, 'utf8');
  console.log(`[PART 3] seed_part3_modalities.sql: ${p3Result.toursCount} tours, ${(Buffer.byteLength(p3Result.sql, 'utf8') / 1024).toFixed(2)} KB`);
}

generateAll();

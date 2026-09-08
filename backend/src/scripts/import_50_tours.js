import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import { colombiaTours } from './seeds/colombiaTours.js';
import { latamTours } from './seeds/latamTours.js';
import { europeTours } from './seeds/europeTours.js';
import { worldTours } from './seeds/worldTours.js';
import { modalityTours } from './seeds/modalityTours.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const CREATOR_USER_ID = '7b767010-fc97-4299-9ae3-5a4985da1da3';
const CREATOR_NAME = 'Emotiva VibeTours';
const CREATOR_EMAIL = 'emotiva.vibetours@gmail.com';

function deterministicUuid(seedStr) {
  const hex = crypto.createHash('md5').update(seedStr).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function runDirectImport() {
  console.log('--- VibeTours Direct Importer: 50 Tours ---');
  console.log(`Target: ${SUPABASE_URL}`);
  console.log(`Creator: ${CREATOR_NAME} (${CREATOR_USER_ID})\n`);

  // 1. Ensure User in public.users
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', CREATOR_USER_ID)
    .maybeSingle();

  if (!existingUser) {
    const { error: userErr } = await supabase.from('users').insert({
      id: CREATOR_USER_ID,
      email: CREATOR_EMAIL,
      full_name: CREATOR_NAME,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: 'Creador oficial y curador de experiencias y rutas exclusivas para VibeTours.',
      country: 'Colombia',
      role: 'admin'
    });
    if (userErr) {
      console.warn('Note on user insertion (might need auth.users entry or exists):', userErr.message);
    } else {
      console.log('✓ Creator user created in public.users.');
    }
  } else {
    await supabase.from('users').update({
      full_name: CREATOR_NAME,
      role: 'admin'
    }).eq('id', CREATOR_USER_ID);
    console.log('✓ Creator user confirmed in public.users.');
  }

  const allTours = [
    ...colombiaTours,
    ...latamTours,
    ...europeTours,
    ...worldTours,
    ...modalityTours
  ];

  console.log(`\nImporting ${allTours.length} curated tours...`);

  let importedTours = 0;
  let importedDays = 0;
  let importedStops = 0;

  for (let i = 0; i < allTours.length; i++) {
    const tour = allTours[i];
    const tourId = deterministicUuid(`vibetour:${tour.slug}`);

    // Clean previous version of this tour
    await supabase.from('tours').delete().eq('slug', tour.slug);

    const tourPayload = {
      id: tourId,
      owner_id: CREATOR_USER_ID,
      created_by: CREATOR_USER_ID,
      slug: tour.slug,
      title: tour.title,
      country: tour.country,
      city: tour.city,
      type: tour.type,
      description: tour.description,
      cover_url: tour.cover_url,
      gallery: tour.gallery || [],
      duration_minutes: tour.duration_minutes || 1440,
      distance_meters: tour.distance_meters || 10000,
      difficulty: tour.difficulty || 'easy',
      language: 'es',
      rating: tour.rating || 4.9,
      review_count: tour.review_count || 100,
      likes_count: tour.likes_count || 250,
      tags: tour.tags || [],
      is_published: true,
      moderation_status: 'approved',
      budget: tour.budget || {},
      recommended_audience: tour.recommended_audience || [],
      best_season: tour.best_season || '',
      recommended_schedule: tour.recommended_schedule || '',
      meeting_point: tour.meeting_point || '',
      includes: tour.includes || [],
      excludes: tour.excludes || [],
      recommendations: tour.recommendations || [],
      what_to_bring: tour.what_to_bring || [],
      tour_rules: tour.tour_rules || [],
      creation_json: {
        source: 'vibetours_official_curated_seed',
        scope: tour.tourScope || 'single_city',
        curated_by: CREATOR_NAME
      }
    };

    const { error: tourErr } = await supabase.from('tours').insert(tourPayload);
    if (tourErr) {
      console.error(`Error saving tour #${i + 1} (${tour.slug}):`, tourErr.message);
      continue;
    }

    importedTours++;

    // Days & Stops
    let tourStopIndex = 0;
    if (tour.days && Array.isArray(tour.days)) {
      for (const day of tour.days) {
        const dayId = deterministicUuid(`vibetour-day:${tour.slug}:${day.day_number}`);
        const dayPayload = {
          id: dayId,
          tour_id: tourId,
          day_number: day.day_number,
          title: day.title,
          notes: day.notes || ''
        };

        const { error: dayErr } = await supabase.from('tour_days').insert(dayPayload);
        if (dayErr) {
          console.warn(`  Warning on day ${day.day_number}:`, dayErr.message);
        } else {
          importedDays++;
        }

        if (day.stops && Array.isArray(day.stops)) {
          const stopsRows = [];
          for (const stop of day.stops) {
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

            stopsRows.push({
              id: stopId,
              tour_id: tourId,
              day_id: dayId,
              stop_order: stopOrder,
              position: position,
              name: stop.name,
              latitude: stop.latitude,
              longitude: stop.longitude,
              image_url: stop.image_url || '',
              images: stop.images || (stop.image_url ? [stop.image_url] : []),
              description: stop.description || '',
              activities: stop.activities || [],
              tips: stop.tips || [],
              curious_facts: stop.curious_facts || [],
              location_info: enrichedLocationInfo,
              suggested_minutes: stop.suggested_minutes || 45,
              image_metadata: imageMetadata
            });
          }

          if (stopsRows.length > 0) {
            const { error: stopsErr } = await supabase.from('tour_stops').insert(stopsRows);
            if (stopsErr) {
              console.warn(`  Warning on stops for day ${day.day_number}:`, stopsErr.message);
            } else {
              importedStops += stopsRows.length;
            }
          }
        }
      }
    }

    // Comment
    const commentId = deterministicUuid(`vibetour-comment:${tour.slug}`);
    await supabase.from('tour_comments').insert({
      id: commentId,
      tour_id: tourId,
      user_id: CREATOR_USER_ID,
      rating: 5,
      body: `Ruta oficial curada y verificada por ${CREATOR_NAME}. ¡Una experiencia inolvidable!`,
      photos: []
    });

    console.log(`[${i + 1}/${allTours.length}] ✓ ${tour.title} (${tour.city})`);
  }

  console.log('\n=============================================');
  console.log(`Direct import completed successfully!`);
  console.log(`Tours imported: ${importedTours}`);
  console.log(`Days imported: ${importedDays}`);
  console.log(`Stops imported: ${importedStops}`);
  console.log('=============================================');
}

runDirectImport().catch(console.error);

-- Nuclear option: Disable RLS temporarily to see if that's the blocker
-- WARNING: Only for debugging. Re-enable RLS after testing.

-- Disable RLS on tours table
alter table public.tours disable row level security;

-- Now the admin should be able to see tours via the app
-- Test this: try to see tours in the admin panel

-- If tours appear after this, the problem is RLS.
-- If tours still don't appear, the problem is in the frontend or the query logic.

-- AFTER TESTING, re-enable RLS:
-- alter table public.tours enable row level security;

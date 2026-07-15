-- Sync any missing users from auth.users to public.users
insert into public.users (id, email, full_name, avatar_url)
select 
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', 'Viajero'),
  raw_user_meta_data ->> 'avatar_url'
from auth.users
where id not in (select id from public.users)
on conflict (id) do nothing;

-- Sync tourist_profiles
insert into public.tourist_profiles (user_id)
select id from public.users
where id not in (select user_id from public.tourist_profiles)
on conflict (user_id) do nothing;

-- Sync settings
insert into public.settings (user_id)
select id from public.users
where id not in (select user_id from public.settings)
on conflict (user_id) do nothing;

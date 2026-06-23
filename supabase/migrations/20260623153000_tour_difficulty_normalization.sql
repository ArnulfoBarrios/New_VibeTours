-- Normalize legacy difficulty values so tour saves stop failing on old schemas.
-- The app should always persist one of: easy, moderate, intense.

alter table public.tours
  drop constraint if exists tours_difficulty_check;

update public.tours
set difficulty = case lower(trim(coalesce(difficulty, '')))
  when 'easy' then 'easy'
  when 'facil' then 'easy'
  when 'moderate' then 'moderate'
  when 'media' then 'moderate'
  when 'intense' then 'intense'
  when 'intensa' then 'intense'
  else 'easy'
end;

create or replace function public.normalize_tour_difficulty()
returns trigger
language plpgsql
as $$
begin
  new.difficulty := case lower(trim(coalesce(new.difficulty, '')))
    when 'easy' then 'easy'
    when 'facil' then 'easy'
    when 'moderate' then 'moderate'
    when 'media' then 'moderate'
    when 'intense' then 'intense'
    when 'intensa' then 'intense'
    else 'easy'
  end;
  return new;
end;
$$;

drop trigger if exists trg_normalize_tour_difficulty on public.tours;

create trigger trg_normalize_tour_difficulty
before insert or update of difficulty
on public.tours
for each row
execute function public.normalize_tour_difficulty();

alter table public.tours
  add constraint tours_difficulty_check
  check (difficulty in ('easy', 'moderate', 'intense'));

-- Fix PQRS table - remove conflicting 'type' column if it exists
-- This fixes the error: null value in column "type" of relation "pqrs"

alter table public.pqrs drop column if exists type;

-- Ensure admin can insert PQRS (for testing)
drop policy if exists "Users create pqrs" on public.pqrs;
create policy "Users create pqrs"
on public.pqrs
for insert
to authenticated
with check ((select auth.uid()) = user_id or user_id is null or (select public.is_admin()));

-- Verify structure
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'pqrs'
order by ordinal_position;

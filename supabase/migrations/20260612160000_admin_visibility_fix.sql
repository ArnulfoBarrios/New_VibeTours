-- Fix para asegurar que el administrador siempre pueda ver todos los tours y evitar conflictos de RLS
-- y asegurar que las funciones se ejecuten correctamente con el contexto adecuado.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_account account
    where account.id is true
      and (
        account.user_id = auth.uid()
        or lower(account.email) = lower(coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', ''))
      )
  );
$$;

-- Asegurar que la politica de administrador para SELECT tenga prioridad y sea clara
drop policy if exists "Admins manage tours" on public.tours;
create policy "Admins manage tours"
on public.tours
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Reparar la politica de lectura para el creador del tour
drop policy if exists "Owners read own tours" on public.tours;
create policy "Owners read own tours"
on public.tours
for select
to authenticated
using (owner_id = auth.uid());

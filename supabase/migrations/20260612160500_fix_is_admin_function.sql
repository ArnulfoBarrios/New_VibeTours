-- Revertir public.is_admin para usar las funciones nativas de Supabase auth.uid() y auth.jwt()
-- que manejan correctamente los casos donde request.jwt.claims esta vacio o no es json valido.

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
        account.user_id = (select auth.uid())
        or lower(account.email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
      )
  );
$$;

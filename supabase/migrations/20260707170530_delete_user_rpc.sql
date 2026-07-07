-- Función para permitir que un usuario autenticado elimine su propia cuenta
create or replace function public.delete_user()
returns void as $$
begin
  -- Solo se borra el usuario si coincide con el auth.uid() de la sesión actual
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public, auth;

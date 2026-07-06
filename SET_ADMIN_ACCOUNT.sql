-- ===================================================================
-- SCRIPT: Establecer Cuenta de Administrador Principal
-- Ejecutar en: Supabase -> Dashboard -> SQL Editor
-- ===================================================================

insert into public.admin_account (email)
values ('admin@vibetours.app')
on conflict (id) do update
set email = 'admin@vibetours.app',
    updated_at = now();

-- Verificar que se guardó correctamente
select 'Administrador actual:', email from public.admin_account where id is true;

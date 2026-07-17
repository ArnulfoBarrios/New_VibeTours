-- migration: add moderation notifications to admin_moderate_tour RPC
create or replace function public.admin_moderate_tour(p_tour_id uuid, p_approved boolean)
returns public.tours
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_tour public.tours;
begin
  update public.tours
  set
    is_published = p_approved,
    moderation_status = case when p_approved then 'approved' else 'rejected' end,
    reviewed_at = now()
  where id = p_tour_id
  returning * into updated_tour;

  if not found then
    raise exception 'Tour not found';
  end if;

  -- Create a notification for the owner of the tour
  if updated_tour.owner_id is not null then
    if p_approved then
      insert into public.notifications (user_id, title, body, type)
      values (
        updated_tour.owner_id,
        'Tour aprobado',
        '¡Felicidades! Tu tour "' || updated_tour.title || '" ha sido aprobado y ya está publicado.',
        'success'
      );
    else
      insert into public.notifications (user_id, title, body, type)
      values (
        updated_tour.owner_id,
        'Tour rechazado',
        'Tu tour "' || updated_tour.title || '" no fue aceptado. Puedes volver a enviarlo o eliminarlo.',
        'warning'
      );
    end if;
  end if;

  return updated_tour;
end;
$$;

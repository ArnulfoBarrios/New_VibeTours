create table if not exists public.admin_account (
  id boolean primary key default true check (id),
  user_id uuid unique references public.users(id) on delete cascade,
  email text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_account_has_identity check (
    user_id is not null or nullif(trim(email), '') is not null
  )
);

alter table public.admin_account enable row level security;

revoke all on public.admin_account from anon;
grant select on public.admin_account to authenticated;

drop trigger if exists admin_account_set_updated_at on public.admin_account;
create trigger admin_account_set_updated_at
before update on public.admin_account
for each row execute function public.set_updated_at();

drop policy if exists "Admin account reads own record" on public.admin_account;
create policy "Admin account reads own record"
on public.admin_account
for select
to authenticated
using (
  user_id = (select auth.uid())
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

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
        or lower(account.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

comment on table public.admin_account is
  'Singleton table. Insert exactly one row with the VIBETOURS administrator user_id or email using a privileged backend/service role.';

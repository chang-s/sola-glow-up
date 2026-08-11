-- Milestone 0 foundation only.
-- This migration is local and has not been applied remotely.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
	id uuid primary key default gen_random_uuid(),
	auth_user_id uuid not null unique references auth.users(id) on delete cascade,
	display_name text,
	timezone text not null default 'America/Los_Angeles',
	unit_system text not null default 'us',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = auth_user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

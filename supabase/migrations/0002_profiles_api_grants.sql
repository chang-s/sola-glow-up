-- Milestone 0 profile API privileges.
-- RLS policies still enforce owner-only access for authenticated users.

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;

grant select, insert, update on table public.profiles to authenticated;

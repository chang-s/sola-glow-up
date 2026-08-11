# Supabase Foundation

Milestone 0 uses the real Supabase architecture.

## Local Migration Status

- `migrations/0001_app_foundation.sql` creates the private `profiles` foundation table and owner-only RLS policies.
- `migrations/0002_profiles_api_grants.sql` grants `SELECT`, `INSERT`, and `UPDATE` on `public.profiles` to `authenticated`; `DELETE` is not granted.
- Domain tables from `DATABASE.md` are intentionally deferred to later milestone migrations.
- Goals/sprints are especially deferred because the Goals schema is provisional until Milestone 3 refinement.

## Remote Migration Status

- The first migration, `0001_app_foundation.sql`, was applied manually before Supabase CLI migration history was configured.
- Supabase migration history has been repaired so `0001` is recorded as applied.
- `0002_profiles_api_grants.sql` has been applied through `pnpm supabase db push --linked`.
- `pnpm supabase db push --linked --dry-run` reports the remote database is up to date.

## Required Project Settings

The local app needs these Vite environment variables in ignored local environment files such as `.env.local`:

- Project URL for `VITE_SUPABASE_URL`
- Public anon key for `VITE_SUPABASE_ANON_KEY`

The anon key is intended for frontend use, but real project secrets should still not be committed. Service role keys must never be exposed to the Vite frontend.

## Remote Migration Rule

Do not apply migrations to a remote Supabase project without explicit Level 1 approval.

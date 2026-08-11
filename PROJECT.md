# Sola Glow-Up

Sola Glow-Up is a private, single-user personal growth and wellness tracker for daily routines, body progress, food behavior, fitness, sleep, beauty, self-care, appointments, and development habits. It should feel cozy, playful, pixel-art-inspired, and personal while still producing useful longitudinal data.

## Current Status

**Current Phase:** Milestone 0 complete; Milestone 1 not yet approved  
**Current Status:** COMPLETE  
**Active Autonomy Level:** Level 1 - Supervised Development  
**Current Priority:** Establish the local Git baseline for the completed Milestone 0 foundation.  
**Next Approved Task:** Awaiting Sola approval for the initial Git commit; do not begin Milestone 1.

## Product Principles

- Fast by default: common logging should take one or two interactions.
- Data is the reward: the app becomes more useful after 7, 30, 90, and 180 days.
- Modular, not hardcoded: habits, schedules, routines, categories, and goals must be configurable.
- Cute but data-rich: cozy/pixel presentation should coexist with serious tracking and analytics.
- Transparent metrics: Glow Scores, streaks, and reports must be explainable.
- Editable history: past days can be backfilled and corrected.
- Private by default: authentication and private storage are required.

## Documentation Map

Authority order for future agents:

1. [docs/PRD.md](docs/PRD.md) - what the product should be.
2. [DECISIONS.md](DECISIONS.md) - approved changes and clarifications.
3. [ARCHITECTURE.md](ARCHITECTURE.md) and [DATABASE.md](DATABASE.md) - how it is built.
4. [ROADMAP.md](ROADMAP.md) - what gets built and in what order.
5. [PROJECT.md](PROJECT.md) - current project state.
6. [AGENTS.md](AGENTS.md) - how agents are allowed to work.

Material contradictions between these documents are a STOP condition. Do not silently choose whichever instruction is convenient.

## Planned Stack

- React
- TypeScript
- Vite
- Progressive Web App
- Supabase for auth, Postgres, and storage
- TanStack Query for server state
- Lightweight local UI state where necessary
- Zod or comparable validation at app boundaries
- Vercel for planned frontend/PWA deployment

## Commands

- Install dependencies: `pnpm install`
- Run locally: `pnpm dev`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Test: `pnpm test`
- Browser smoke test: `pnpm test:browser`
- Build: `pnpm build`
- Preview built app: `pnpm preview`

Do not begin Milestone 1 until Sola explicitly approves it.

## Milestone 0 Completion Notes

- Milestone 0 foundation is complete.
- Real Supabase email/password authentication has been manually validated against the linked project.
- Remote Supabase migration history records `0001_app_foundation.sql` and `0002_profiles_api_grants.sql` as applied.
- `public.profiles` has owner-only RLS policies and authenticated API privileges for `SELECT`, `INSERT`, and `UPDATE`; `DELETE` is not granted.
- Anonymous profile access remains blocked.

## Known Technical Debt

- TypeScript is temporarily pinned to `6.0.0-beta` because the current TypeScript 7 release is outside the supported peer range for the approved `typescript-eslint` lint tooling. Revisit when a stable TypeScript version is compatible with the project's approved lint/tooling stack.

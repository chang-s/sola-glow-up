# Sola Glow-Up

Sola Glow-Up is a private, single-user personal growth and wellness tracker for daily routines, body progress, food behavior, fitness, sleep, beauty, self-care, appointments, and development habits. It should feel cozy, playful, pixel-art-inspired, and personal while still producing useful longitudinal data.

## Current Status

**Current Phase:** Milestone 1 - Universal Habits and Routines
**Current Status:** READY FOR REVIEW
**Active Autonomy Level:** Level 2 - Trusted Development
**Current Priority:** Review the completed Milestone 1 habit/routine implementation.
**Next Approved Task:** Awaiting Sola review of Milestone 1; do not begin Milestone 2.

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
- Frontend/PWA hosting not yet finalized. Evaluate GitHub Pages as the preferred free option before introducing a paid or extra hosting service; Vercel remains an alternative if technical requirements make GitHub Pages unsuitable.

## Architecture/Product Notes

- External ChatGPT/ChatGPT Work workflows may assist with preparing or entering structured data.
- Agent-assisted entries must use the same canonical application data models as manual entries.
- External AI assistance does not imply an AI runtime dependency in the Sola Glow-Up application.

## Commands

- Install dependencies: `pnpm install`
- Run locally: `pnpm dev`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Test: `pnpm test`
- Browser smoke test: `pnpm test:browser`
- Build: `pnpm build`
- Preview built app: `pnpm preview`

Do not begin Milestone 2 until Sola explicitly approves it.

## Milestone 0 Completion Notes

- Milestone 0 foundation is complete.
- Real Supabase email/password authentication has been manually validated against the linked project.
- Remote Supabase migration history records `0001_app_foundation.sql` and `0002_profiles_api_grants.sql` as applied.
- `public.profiles` has owner-only RLS policies and authenticated API privileges for `SELECT`, `INSERT`, and `UPDATE`; `DELETE` is not granted.
- Anonymous profile access remains blocked.

## Milestone 1 Completion Notes

- Universal habit, schedule, habit-entry, routine-group, routine-step, and unlinked routine-step-entry tables exist remotely.
- Remote Supabase migration history records `0003_habits_and_routines.sql` as applied.
- Habit and routine tables use owner-only RLS with authenticated `SELECT`, `INSERT`, and `UPDATE` only; `DELETE` is not granted.
- V1 habit entries are one aggregate active entry per habit per calendar date.
- Linked routine steps use `habit_entries`; unlinked routine steps use `routine_step_entries`.
- Today supports scheduled habit completion, value entry for numeric/duration/quantity habits, routine step completion, and Check All.
- Settings supports creating, editing, reordering, and archiving habits, routine groups, and routine steps.

## Known Technical Debt

- TypeScript is temporarily pinned to `6.0.0-beta` because the current TypeScript 7 release is outside the supported peer range for the approved `typescript-eslint` lint tooling. Revisit when a stable TypeScript version is compatible with the project's approved lint/tooling stack.

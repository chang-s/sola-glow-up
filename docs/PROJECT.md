# Sola Glow-Up

Sola Glow-Up is a private, single-user personal growth and wellness tracker for daily routines, body progress, food behavior, fitness, sleep, beauty, self-care, appointments, and development habits. It should feel cozy, playful, pixel-art-inspired, and personal while still producing useful longitudinal data.

## Current Status

**ACTIVE DEVELOPMENT TARGET:** V0.5 daily personal tracker
**Current Status:** FUNCTIONAL V0.5 COMPLETE; V0.5.4 PIXEL POLISH PLANNING ONLY
**Active Autonomy Level:** Level 2 - Trusted Development
**Current Priority:** Plan V0.5.4 Pixel Polish without beginning implementation.
**Next Approved Task:** V0.5.4 Pixel Polish planning only.

The larger V1/Milestone 1 habit and routine system is preserved in Git and on the remote branch `backup/pre-v0.5`. It is deferred, not cancelled. V1 features must not define the active product experience or roadmap unless Sola explicitly asks to resume them.

## V0.5 Product Principles

- Usable quickly: Sola should be able to start daily logging as soon as possible.
- Simple: avoid generalized architecture and user-facing builders.
- Reliable: authenticated Supabase data should work from phone and computer.
- Cute: the app should feel like a cozy pixel-game wrapper around real data entry.
- Extensible later: do not destructively remove V1 work, but do not let it drive V0.5.

## Long-Term Product Principles

- Fast by default: common logging should take one or two interactions.
- Data is the reward: the app becomes more useful after 7, 30, 90, and 180 days.
- Modular, not hardcoded: habits, schedules, routines, categories, and goals must be configurable.
- Cute but data-rich: cozy/pixel presentation should coexist with serious tracking and analytics.
- Transparent metrics: Glow Scores, streaks, and reports must be explainable.
- Editable history: past days can be backfilled and corrected.
- Private by default: authentication and private storage are required.

## Documentation Map

Authority order for future agents:

1. [V0.5.md](V0.5.md) - active V0.5 product source of truth.
2. [V0.5.4.md](V0.5.4.md) - Pixel Polish planning source.
3. [PROJECT.md](PROJECT.md) - current project state.
4. [DECISIONS.md](DECISIONS.md) - approved changes and clarifications.
5. [ROADMAP.md](ROADMAP.md) - what gets built and in what order.
6. [ARCHITECTURE.md](ARCHITECTURE.md) and [DATABASE.md](DATABASE.md) - how it is built.
7. [PRD.md](PRD.md) - deferred larger V1 product vision.
8. [AGENTS.md](AGENTS.md) - how agents are allowed to work.

Material contradictions between these documents are a STOP condition. Do not silently choose whichever instruction is convenient.

For active V0.5 implementation, `V0.5.md` overrides older V1/Milestone roadmap language. The V1 PRD remains useful context for the long-term product, but it is not the current build target.

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
- V0.5 should use a small dedicated Supabase data model after review rather than forcing the V1 universal habit/routine schema to power the simplified tracker.
- Approved V0.5 resources are `v05_daily_entries`, `v05_checklist_completions`, `v05_food_photos`, and private Storage bucket `v05-food-photos`. They were added by `supabase/migrations/0004_v05_daily_tracker.sql`.
- Active V0.5 navigation should expose only Today, History, and Progress. Dormant V1 screens should be removed from active navigation/routing during implementation without deleting underlying V1 code.
- Functional V0.5 is implemented through V0.5.3: Today, History, food scrapbook, and weight Progress are available as the active product surface.

## Commands

- Install dependencies: `pnpm install`
- Run locally: `pnpm dev`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Test: `pnpm test`
- Browser smoke test: `pnpm test:browser`
- Build: `pnpm build`
- Preview built app: `pnpm preview`

Do not begin V1 Milestone 2 or any deferred V1 feature until Sola explicitly approves it.

## Milestone 0 Completion Notes

- Milestone 0 foundation is complete.
- Real Supabase email/password authentication has been manually validated against the linked project.
- Remote Supabase migration history records `0001_app_foundation.sql` and `0002_profiles_api_grants.sql` as applied.
- `public.profiles` has owner-only RLS policies and authenticated API privileges for `SELECT`, `INSERT`, and `UPDATE`; `DELETE` is not granted.
- Anonymous profile access remains blocked.

## Milestone 1 Completion Notes

- Milestone 1 manual UX review revisions were completed before the V0.5 pivot.
- Universal habit, schedule, habit-entry, routine-group, routine-step, and unlinked routine-step-entry tables exist remotely.
- Remote Supabase migration history records `0003_habits_and_routines.sql` as applied.
- Habit and routine tables use owner-only RLS with authenticated `SELECT`, `INSERT`, and `UPDATE` only; `DELETE` is not granted.
- V1 habit entries are one aggregate active entry per habit per calendar date.
- Linked routine steps use `habit_entries`; unlinked routine steps use `routine_step_entries`.
- Today supports scheduled habit completion, value entry for numeric/duration/quantity habits, routine step completion, and Check All.
- Settings supports creating, editing, reordering, and archiving habits, routine groups, and routine steps.
- The Milestone 1 UX revision replaced internal enum/database wording with friendly labels, added habit edit dialogs, archived restore controls, To Do/Done sections, and compact routine creation with steps.
- This V1 infrastructure is now dormant for active development. Do not drop or reset it.

## V0.5 Completion Notes

- Functional V0.5 is complete through V0.5.3.
- V0.5.0 pivoted the active app shell to Today, History, and Progress while preserving dormant V1 code.
- V0.5.1 made Today usable for real Supabase-backed daily logging, checklist recurrence, completion calendar, and streaks.
- V0.5.2 added private food photo upload, History daily entries, and scrapbook-style gallery/detail viewing.
- V0.5.3 added real weight Progress with starting/latest/change summaries, Detail/All Time chart modes, missing-date timeline behavior, and responsive chart polish.
- V0.5.4 is not implementation-approved yet. It is the next planning target for cozy pixel visual polish only.

## Known Technical Debt

- TypeScript is temporarily pinned to `6.0.0-beta` because the current TypeScript 7 release is outside the supported peer range for the approved `typescript-eslint` lint tooling. Revisit when a stable TypeScript version is compatible with the project's approved lint/tooling stack.

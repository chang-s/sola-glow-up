# Decisions

Future agents should append decisions to this log rather than silently rewriting historical decisions. Product-level changes should be proposed here and approved before the PRD is changed.

## 2026-08-11 - Pivot Active Development Target To V0.5

Decision:
Pivot active Sola Glow-Up development from the larger V1/Milestone 1 universal habits and routines system to a deliberately small V0.5 daily personal tracker.

Rationale:
Sola wants something simple enough to begin using every day as soon as possible. V0.5 should behave like a cute, game-like spreadsheet: check things off, enter a few numbers, upload food photos, browse history, and see weight progress.

Consequences:
`docs/V0.5.md` is now the active product source of truth. The active app should have only Today, History, and Progress. Keep Supabase and existing authentication for cross-device data. Use the approved small dedicated V0.5 data model rather than forcing the simplified tracker through the V1 universal habit/routine schema. Do not create/apply V0.5 migrations until Sola explicitly starts implementation/migration work.

V1 is deferred, not cancelled. The pre-pivot state is preserved in remote branch `backup/pre-v0.5`; existing V1 code, migrations, concepts, and remote tables must not be destructively removed merely because they are dormant.

Deferred V1 functionality includes universal/custom habit builders, routine builders, arbitrary recurrence, archive/restore/reorder management, Glow Score, broad domain navigation, advanced food/nutrition systems, AI integrations, achievements/gamification systems, advanced analytics, calendar systems, and larger roadmap functionality.

## 2026-08-11 - Add V0.5 Completion Calendar And Streaks

Decision:
Add a small monthly completion calendar and motivational current streaks to active V0.5 scope.

Rationale:
Calendar feedback and streaks create immediate motivation from the data V0.5 already collects without requiring a larger game system, goal builder, or V1 analytics stack.

Consequences:
Today now has three major pieces: daily clipboard/check-in, monthly completion calendar, and current streaks. Calendar completion is derived from due checklist items for each day. Streaks are derived from canonical checklist/daily records. Every-other-day checklist streaks count consecutive successful due dates rather than consecutive calendar days.

Do not store independent streak counters or daily completion percentages in the initial V0.5 schema. Do not introduce achievements, XP, levels, currency, rewards, badges, challenges, social comparison, leaderboards, configurable streak engines, or generalized goal-building systems.

## 2026-08-11 - Approve Final V0.5 Constants And Route Strategy

Decision:
Approve the final V0.5 planning decisions before implementation.

Rationale:
The remaining ambiguity needed to be closed so the first implementation pass can stay narrow and avoid re-opening V1 architecture.

Consequences:
Approved V0.5 table names are `v05_daily_entries`, `v05_checklist_completions`, and `v05_food_photos`. Approved private Storage bucket name is `v05-food-photos`.

Approved fixed checklist definitions:

- Daily: `morning_skincare`, `evening_skincare`, `vitamins`, `minoxidil`, `workout`.
- Every other day: `iron`, `irestore_helmet`, `irestore_mask`.

All every-other-day items use anchor date `2026-08-12` and are due August 12, August 14, August 16, August 18, and so on. They are not due August 13, August 15, August 17, and so on. Streaks for these items count consecutive successful due dates.

V0.5 tracking starts on the first saved V0.5 daily entry. Earlier dates are neutral and must not count as failed, 0% completion, streak breaks, or reduced completion statistics. Future dates are neutral/disabled.

Initial displayed streaks are Workout, 7+ hours of sleep, 7,500+ steps, and Vitamins. Initial thresholds are sleep duration of at least 7 hours and steps of at least 7,500. These remain constants/configuration, not a generalized Settings or Goals system.

During V0.5 implementation, remove dormant V1 screens from active navigation/routing and expose only Today, History, and Progress. Preserve dormant V1 code and already-applied V1 database infrastructure for possible future reuse.

Do not create migrations, apply migrations, modify Supabase, or begin implementation until Sola explicitly starts implementation work.

## 2026-08-11 - Milestone 1 Manual UX Review Revisions

Decision:
Reopen Milestone 1 for focused manual UX review revisions.

Rationale:
Sola's manual review accepted the database architecture and structural behavior, but found the user-facing habit and routine experience too close to the internal data model.

Consequences:
Keep the approved database architecture and Milestone 1 boundaries. Improve language, form flow, visual hierarchy, routine creation, archive restoration, and Today completion behavior before returning Milestone 1 to ready for review. Do not begin Milestone 2.

## 2026-08-11 - Milestone 1 UX Revisions Ready for Review

Decision:
Return Milestone 1 to ready for review after completing the focused manual UX revision pass.

Rationale:
The revision pass addressed the approved user-facing feedback without changing the approved database schema, RLS model, or milestone boundaries.

Consequences:
Milestone 1 remains pending Sola review. Do not begin Milestone 2 until Sola explicitly accepts the revised Milestone 1 experience.

## 2026-08-10 - External AI-Assisted Meal Logging for V1

Decision:
Do not build an in-app AI food analysis integration for V1. V1 may use an external ChatGPT/ChatGPT Work workflow to help estimate and structure meal details, but the Sola Glow-Up app itself must not require an AI runtime, AI API key, AI backend, or AI API expense for food logging.

Rationale:
External AI assistance can make meal logging easier without adding V1 infrastructure cost, secrets, backend complexity, or a separate AI-specific product architecture.

Consequences:
External or agent-assisted meal details must become normal canonical `food_entries` records, the same as manual entries. AI-estimated nutrition must remain editable and identifiable as estimated. The proposed future `food_entries` schema may preserve lightweight provenance such as `source` and `nutrition_estimate`, but must not add separate AI tables, prompts, model names, raw responses, token usage, confidence scores, or duplicate calorie/macro sources of truth. In-app AI-assisted food photo/description analysis remains V1.5 unless explicitly approved later.

## 2026-08-10 - Frontend Hosting Cost Preference

Decision:
Frontend/PWA hosting is not yet finalized. Evaluate GitHub Pages as the preferred free option before introducing a paid or extra frontend hosting service. Vercel remains an alternative if technical requirements make GitHub Pages unsuitable.

Rationale:
Recurring infrastructure cost should stay as close to $0 as reasonably possible.

Consequences:
Do not silently change deployment configuration or deploy. Future deployment planning should compare GitHub Pages against Vercel before choosing a production frontend host.

## 2026-08-10 - V1 Authentication

Decision:
Use email/password authentication for V1.

Rationale:
This is a private single-user application and does not need OAuth or magic-link complexity at launch.

Consequences:
Do not add OAuth or magic-link authentication unless requested later.

## 2026-08-10 - Supabase from Milestone 0

Decision:
Use the real Supabase architecture beginning in Milestone 0.

Rationale:
A temporary mock backend would create replacement work and increase the risk of early architectural drift.

Consequences:
Supabase credentials or project actions may require Sola. Stop and ask when those are needed.

## 2026-08-10 - Online-First V1

Decision:
V1 is online-first.

Rationale:
Online-first behavior is simpler, safer, and sufficient for V1 cross-device syncing.

Consequences:
Support loading, retry/error states, safe optimistic updates, unsaved-input protection, and PWA asset/app-shell caching. Do not implement full offline database sync, conflict resolution, or queued offline writes in V1.

## 2026-08-10 - Persist Report Snapshots

Decision:
Persist weekly and monthly report snapshots.

Rationale:
Historical Glow Reports should represent what was generated for that period rather than silently changing when later calculation logic changes.

Consequences:
Reports should be intentionally regenerable. Raw insights and charts may calculate dynamically from current data.

## 2026-08-10 - Soft Delete Photos First

Decision:
Use soft deletion first for user photos and associated records.

Rationale:
Personal photos need protection against accidental deletion.

Consequences:
Permanent storage deletion must be explicit and should never happen automatically as the immediate consequence of a normal delete interaction.

## 2026-08-10 - Placeholder Pixel Sola Assets

Decision:
Use placeholder assets during initial development.

Rationale:
Final artwork should not block application development.

Consequences:
Avatar implementation should make it straightforward to replace placeholder states with purchased, licensed, or custom sprite assets later. Do not generate an elaborate temporary art system.

## 2026-08-10 - Vercel Frontend Deployment Target

Status:
Superseded by the later 2026-08-10 frontend hosting cost preference decision. Vercel remains an alternative, but frontend/PWA hosting is no longer finalized.

Decision:
Use Vercel as the planned frontend/PWA deployment target and Supabase for backend/database/auth/storage.

Rationale:
Vercel is a good fit for a React + TypeScript + Vite/PWA frontend while Supabase handles private backend services.

Consequences:
Do not deploy during project preparation. Architecture is React + TypeScript + Vite/PWA -> Vercel -> Supabase.

## 2026-08-10 - Active Autonomy Level

Decision:
Start at Level 1 - Supervised Development.

Rationale:
The project is not implemented yet and should begin with tight approval boundaries for dependencies, migrations, commits, deployment, secrets, and scope.

Consequences:
Agents may inspect, edit approved-scope code, write/run tests, run local previews, make narrow refactors, update docs, and prepare non-destructive local migrations. High-risk actions require approval.

## 2026-08-10 - Scheduling Semantics

Decision:
Habit schedules support daily, specific weekdays, X times/week, X times/month, every X days, and optional/unscheduled. `every_x_days` schedules use an anchor/start date for deterministic recurrence.

Rationale:
Simple deterministic schedules cover V1 needs without introducing a full calendar recurrence engine.

Consequences:
The schedule engine must calculate every-X-days due dates relative to the anchor date, not the current day. X-times/month is a monthly target without exact calendar dates.

## 2026-08-10 - Canonical Metric Sources

Decision:
Every tracked metric has exactly one canonical source of truth.

Rationale:
Today, Calendar, Insights, and reports should not create duplicate independently editable versions of the same value.

Consequences:
Steps are stored in `daily_metrics.steps`; steps habits/goals may reference that metric for adherence. Food-entry calorie sums and manually entered daily calorie totals are distinct concepts and must be labeled separately.

## 2026-08-10 - Sleep Date Semantics

Decision:
A sleep record belongs to the calendar date on which the user wakes up.

Rationale:
This aligns with the morning Today experience, where Sola records or reviews the sleep just completed.

Consequences:
Today, Calendar, weekly reports, sleep analytics, and historical editing must use the wake-date convention. Date/timezone handling should be tested once implemented.

## 2026-08-10 - Provisional Goals Model

Decision:
The documented Goals schema is provisional until deliberate Milestone 3 refinement.

Rationale:
The initial `metric_type` plus `target_value` sketch may not support habit-based, frequency-based, duration-based, and metric-target goals cleanly.

Consequences:
Milestone 0 must not lock the project into a goal model that prevents later V1 goals such as reach 190 lb, Farsi 20 minutes/day, piano 4 sessions/week, sleep at least 7 hours/night, or steps 8,000/day.

## 2026-08-10 - Agent Failure Budget and Test Integrity

Decision:
Agents must stop after 3 materially different attempted fixes for the same underlying failure, and must not weaken validation to create a false pass.

Rationale:
Stubborn failures should not lead to broad, destructive, or misleading changes.

Consequences:
When blocked, agents must report the failure, attempts, evidence, hypothesis, and recommended next step. Tests, TypeScript, lint, accessibility checks, and runtime errors may only be changed or narrowed for documented, technically appropriate reasons within approved scope.

## 2026-08-10 - Promote to Level 2

Decision:
Promote the project from Level 1 - Supervised Development to Level 2 - Trusted Development after the completed Milestone 0 baseline was committed and pushed to a private GitHub repository.

Rationale:
Milestone 0 demonstrated reliable scope discipline, reproducible validation, documented Supabase migration handling, and enough project documentation for a fresh Codex session to reconstruct the current state.

Consequences:
Level 2 permissions are exactly those documented in `AGENTS.md`: agents may install reasonable dependencies when clearly required by an approved task, create non-destructive migrations, commit approved-scope work, work through multiple related roadmap tasks, and maintain project documentation automatically. High-risk actions, pushes, deployments, remote migrations, secrets, production data changes, and all permanent STOP conditions still require explicit approval where documented.

## 2026-08-10 - Milestone 1 Habit and Routine Schema Approval

Decision:
Approve Milestone 1 implementation for universal habits and routines using one aggregate active `habit_entries` row per habit per calendar date.

Rationale:
V1 needs fast daily completion and simple deterministic history rather than session-level habit logging.

Consequences:
Enforce one non-deleted `habit_entries` row per `habit_id` plus `entry_date`. Numeric, duration, and quantity habits store the day's aggregate value. Do not implement session-level habit logging in Milestone 1.

## 2026-08-10 - Routine Step Completion Sources

Decision:
Routine steps may exist without linked habits. Linked routine steps write completion/value state through `habit_entries`; unlinked routine steps write completion through `routine_step_entries`.

Rationale:
Routine steps should support granular skincare, haircare, body care, and similar checklist items without forcing every step to become a first-class habit.

Consequences:
Do not create duplicate completion records in both systems for the same routine step. `routine_step_entries` is only for unlinked routine step completion.

## 2026-08-10 - Milestone 1 Schedule Conflict Boundary

Decision:
Use straightforward database constraints for schedule shape and date ranges, and keep higher-level recurrence conflict validation in application/domain logic and tests.

Rationale:
V1 recurrence should stay intentionally simple. Full recurrence-overlap detection with complex Postgres range/exclusion machinery would be disproportionate for Milestone 1.

Consequences:
The database enforces valid schedule fields, date ordering, and one active schedule definition of each schedule type per habit. Application/domain tests must guard against ambiguous due-date definitions beyond that structural boundary.

# Decisions

Future agents should append decisions to this log rather than silently rewriting historical decisions. Product-level changes should be proposed here and approved before the PRD is changed.

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

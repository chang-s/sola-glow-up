# Architecture

## Status

This document describes the approved architecture and Milestone 0 foundation. It should evolve alongside the code, but product-level changes must be proposed in `DECISIONS.md` and approved before changing the PRD.

## Technology Stack

- Frontend: React, TypeScript, Vite
- App model: responsive Progressive Web App
- Deployment target: not finalized. Evaluate GitHub Pages as the preferred free frontend/PWA hosting option before introducing a paid or extra hosting service; Vercel remains an alternative if GitHub Pages is unsuitable for technical requirements.
- Backend: Supabase
- Database: Supabase Postgres
- Authentication: Supabase Auth with email/password for V1
- Storage: Supabase Storage with private buckets for user photos/files
- Server state: TanStack Query
- Local UI state: lightweight React state/context or a small store when needed
- Validation: Zod or comparable boundary validation

Do not introduce a custom backend unless a future approved requirement clearly requires one.

Implementation note:
Milestone 0 uses `pnpm` as the package manager and pins TypeScript to `6.0.0-beta` because the current TypeScript 7 release is outside the supported peer range for the approved `typescript-eslint` toolchain. This is temporary dependency/tooling technical debt and should be revisited when a stable TypeScript version is compatible with the approved lint stack.

## Application Modules

- `today`: daily command center, routines, scheduled habits, quick logging, Glow Score.
- `habits`: universal habit definitions, schedules, entries, streaks, adherence.
- `body`: weight, measurements, milestones, progress photos.
- `food`: meal/food behavior logging, optional nutrition, food photos, gallery.
- `fitness`: steps, movement minutes, workouts, weekly targets.
- `beauty`: skincare, haircare, body/foot care, products, treatments, appointments.
- `growth`: Farsi, piano, reading, and other development habits.
- `calendar`: month/day history, backfill, historical editing.
- `insights`: deterministic charts, observations, weekly/monthly reports.
- `settings`: habits, routines, goals, schedules, export, profile/app preferences.

## Routing

Planned primary routes:

- `/today`
- `/glow-up`
- `/food`
- `/fitness`
- `/beauty`
- `/growth`
- `/insights`
- `/calendar`
- `/settings`

Use compact modals, drawers, or mobile sheets for quick creation/editing where that keeps logging fast. Shared editing flows should be reusable between Today, Calendar, and domain screens.

Milestone 0 implements placeholder routes only. Later milestones own actual feature screens.

## State Management

Use TanStack Query for Supabase-backed server state: profile, habits, schedules, entries, photos, goals, reports, and domain records.

Use local component state for transient UI concerns such as open sheets, selected dates, form drafts, tabs, toasts, and local controls.

Add a small app-level store only if repeated cross-route UI state becomes painful. Do not create one large global health-data store.

## Data Access

Wrap Supabase access behind feature-oriented data modules rather than scattering raw queries through UI components. Calculation utilities should be pure and separately tested.

Important calculation boundaries:

- Glow Score
- Habit schedule expansion
- Streaks
- Weekly/monthly adherence
- Weight trend and milestones
- Report generation
- Deterministic pattern observations

Habit schedule expansion must remain intentionally simple in V1. Supported schedule types are daily, specific weekdays, X times/week, X times/month, every X days, and optional/unscheduled.

`every_x_days` schedules must use an anchor/start date. For example, if iRestore begins on August 10 and occurs every 2 days, due dates are calculated from August 10 rather than from the current day. This keeps recurrence deterministic across devices and sessions.

Do not build a Google Calendar-style recurrence engine for V1.

## Authentication

V1 uses email/password authentication only.

Do not add OAuth or magic-link authentication unless requested later.

All private routes require an authenticated Supabase user. Application data should be owned by that user through `user_id` and protected by Row Level Security.

Milestone 0 includes a functional email/password sign-in foundation when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured. Without those variables, the app runs without mock data and clearly reports that Supabase setup is pending.

## Storage and Photo Architecture

Use private Supabase Storage buckets for:

- Food photos
- Progress photos
- Product images if needed

Photo database records store owner, storage path, date, label/type, related entity, and deletion state. Normal delete interactions should soft-delete records first. Permanent storage deletion is explicit and never automatic.

## PWA Approach

V1 is online-first. Use PWA behavior for installability and appropriate asset/app-shell caching.

Do not implement full offline database synchronization, conflict resolution, or queued offline writes in V1.

Support:

- Good loading states
- Retry/error states
- Optimistic updates where safe
- Protection against losing unsaved form input
- Respect for reduced-motion settings where practical

Milestone 0 generates a PWA manifest and service worker with placeholder app metadata and icon assets. Offline behavior remains limited to app-shell/asset caching.

## Responsive Strategy

Support Windows desktop and Android mobile from the beginning.

Mobile priorities:

- One-tap checkbox completion
- Fast food capture
- Bottom-sheet style quick entry where useful
- Thumb-friendly controls

Desktop priorities:

- Keyboard accessibility
- Visible focus states
- Denser but calm information layouts
- Efficient historical editing

Status and completion state must not rely solely on color.

## Universal Habits, Routines, and Specialized Domains

Every tracked metric has exactly one canonical source of truth. Today, Calendar, Insights, reports, and domain views should read from that canonical source instead of maintaining duplicate independently editable copies. Derived values should normally be calculated from canonical data rather than separately stored.

The universal habit system owns configurable behavior tracking:

- Habit definition
- Tracking type
- Target value/unit
- Schedule/frequency
- Time group
- Glow Score inclusion
- Display order
- Active/archive state
- Entries/completions

Routine groups organize repeatable checklist flows such as AM skincare, PM skincare, haircare, body care, foot care, morning, and evening. A routine step may link to a universal habit when it should contribute to habit history, streaks, or Glow Score.

Specialized domains own structured records that need typed analytics:

- Weight and measurements
- Sleep
- Food entries and nutrition
- Workouts and steps
- Products
- Appointments
- Photos

Do not force every metric into an unstructured habit blob. Use the universal habit system for configurable recurring behaviors, and use typed domain tables for structured facts and analytics.

## V1 Source-of-Truth Matrix

| Data | Canonical source | Notes |
| --- | --- | --- |
| Weight | `weight_entries` | Today and Glow Up read/write the same weight record for a date. |
| Measurements | `measurement_entries` | Measurement type distinguishes waist, hips, chest, thigh, and custom measurements. |
| Steps | `daily_metrics.steps` | A steps habit/goal may reference this metric for targets or adherence, but must not store a second independent steps value. |
| Fasting glucose | `daily_metrics.fasting_glucose` | Today and historical editing use the same daily metric field. |
| Resting heart rate | `daily_metrics.resting_heart_rate` | Today and historical editing use the same daily metric field. |
| Period status | `daily_metrics.period_status` | One daily status value per date. |
| Sleep | `sleep_entries` | A sleep record belongs to the calendar date on which the user wakes up. |
| Workouts/exercise | `workouts` | Exercise habits/goals may reference workouts for adherence instead of duplicating completion. |
| Food/macros | `food_entries` | Per-entry calories/macros are optional and may be summed for food-log totals. |
| Manual daily calories | `daily_metrics.manual_calorie_total` | Used when food entries are incomplete. Keep distinct from derived food-log calories. |
| Derived food-log calorie sum | calculated from `food_entries.calories` | Not separately editable as its own daily value. |
| Farsi/piano/growth practice | `habit_entries` | Growth practice uses universal habits with duration or quantity tracking. |
| Routine/habit completion | `habit_entries` | Routine steps may link to habits; Check All writes the linked completions. |

Calories have two distinct concepts: a derived food-log calorie sum from food entries and an optional manually entered daily calorie total for incomplete food logs. UI and reports should label these distinctly and must not silently treat them as two conflicting versions of the same value.

## Sleep Date Convention

A sleep record belongs to the calendar date on which the user wakes up.

Example:

- Bedtime: August 10, 11:30 PM
- Wake time: August 11, 7:30 AM
- `sleep_date`: August 11

Today, Calendar, weekly reports, sleep analytics, and historical editing should all use this convention. Timezone/date handling should be tested once implemented.

## Architectural Boundaries

- V1.5/Future features must not be implemented without approval.
- In-app AI food analysis is not a V1 dependency.
- External ChatGPT/ChatGPT Work workflows may assist with preparing or entering structured data, but agent-assisted entries must use canonical application data models and do not imply an AI runtime, AI API key, AI backend, or AI API expense in the Sola Glow-Up application.
- Automatic health import is not a V1 dependency.
- Money/expense tracking is a separate future module requiring separate planning.
- Pixel Sola V1 should be a lightweight state/reaction system with replaceable placeholder assets, not a game simulation.
- The final Goals schema and progress-calculation model must be deliberately reviewed before Goals are implemented in Milestone 3.
- Do not perform unrelated cleanup while completing a scoped task unless necessary for correctness.

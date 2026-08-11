# Roadmap

## Status Terms

- `NOT STARTED`
- `IN PROGRESS`
- `BLOCKED`
- `READY FOR REVIEW`
- `COMPLETE`

## Current Roadmap State

**Current Phase:** Milestone 0 complete; Milestone 1 not yet approved  
**Current Status:** COMPLETE  
**Active Autonomy Level:** Level 1 - Supervised Development  
**Next Approved Task:** Awaiting Sola approval for the initial Git commit; do not begin Milestone 1.

Agents should never guess what to work on when `Next Approved Task` exists.

## Milestone 0 - Project Foundation

**Status:** COMPLETE

Objective:
Create the runnable technical foundation without building product features.

Tasks:

- [x] Scaffold React + TypeScript + Vite app.
- [x] Configure PWA shell.
- [x] Add Supabase client configuration.
- [x] Add email/password auth foundation.
- [x] Add base routing/navigation shell.
- [x] Add responsive design foundation.
- [x] Add initial test/build tooling.
- [x] Add `.env.example` updates as implementation clarifies exact variables.
- [x] Prepare local non-destructive schema/migration structure if approved.

Dependencies:

- User approval to begin Milestone 0.
- Supabase project credentials or user action when needed.
- Approval before installing dependencies.

Acceptance Criteria:

- App runs locally.
- App builds successfully.
- Auth route/protected route foundation exists.
- PWA shell foundation exists.
- No real product features are implemented beyond foundation needs.
- Documentation is updated with actual commands and setup notes.

Required Validation:

- [x] Run local/built app through browser smoke test.
- [x] Run typecheck.
- [x] Run lint.
- [x] Run tests.
- [x] Run build.

Explicit Non-Scope:

- Food logging.
- Habit implementation.
- Glow Score calculations.
- Reports.
- AI.
- Pixel Sola final artwork.
- Deployment.

## Milestone 1 - Universal Habits and Routines

**Status:** NOT STARTED

Objective:
Build configurable daily behavior tracking.

Tasks:

- Habit definitions.
- Habit schedules, including deterministic `every_x_days` anchors and `times_per_month`.
- Habit entries/completions.
- Routine groups and steps.
- Check All behavior.
- Create/edit/reorder/deactivate habits.

Dependencies:

- Milestone 0 foundation.
- Approved schema for habits/routines.

Acceptance Criteria:

- User can create, edit, reorder, deactivate, and complete scheduled habits.
- Routine groups support individual checkboxes and Check All.
- Optional/unscheduled habits do not penalize by default.

Required Validation:

- Schedule expansion tests, including anchored every-X-days and X-times/month behavior.
- Completion tests.
- Basic accessibility and responsive checks.

Explicit Non-Scope:

- Full Today dashboard polish.
- Advanced insights.
- Specialized domain screens beyond links needed for habits.

## Milestone 2 - Today and Daily History

**Status:** NOT STARTED

Objective:
Make the daily logging loop useful and editable.

Tasks:

- Today screen.
- Date/context greeting.
- Scheduled habits and routines.
- Previous-day morning fields.
- Daily metrics.
- Notes.
- Calendar day editing/backfill foundation.

Dependencies:

- Milestone 1 habit/routine system.

Acceptance Criteria:

- Most daily logging can happen from Today.
- Past dates can be selected and edited.
- Unsaved form input is protected.

Required Validation:

- Date/timezone tests.
- Historical editing checks.
- Desktop and mobile layout checks.

Explicit Non-Scope:

- Complex charts.
- Weekly/monthly reports.
- AI.

## Milestone 3 - Glow Score, Streaks, Goals, and Sprints

**Status:** NOT STARTED

Objective:
Add transparent motivation and temporary goal structures.

Tasks:

- Glow Score calculations.
- Category-level scores.
- Contributor explanations.
- Streaks and best streaks where useful.
- Deliberate review of final Goals schema and progress-calculation model before implementation.
- Goals.
- Time-bound sprints.

Dependencies:

- Habit entries.
- Daily history.
- Confirmed Goals schema that supports habit-based, frequency-based, duration-based, and metric-target goals.

Acceptance Criteria:

- Glow Score uses completed scheduled eligible items divided by scheduled eligible items.
- Optional items do not penalize by default.
- User can create long-term goals and temporary sprints.
- Calculations are understandable in the UI.

Required Validation:

- Glow Score tests.
- Streak tests.
- Goal progress calculation tests for metric, duration, and frequency examples.
- Sprint inclusion tests.

Explicit Non-Scope:

- Coins, XP, levels, cosmetics, pet, or room simulation.

## Milestone 4 - Body, Fitness, and Growth

**Status:** NOT STARTED

Objective:
Add structured progress tracking and core charts.

Tasks:

- Weight entries.
- Measurements.
- Milestones.
- Steps.
- Workouts.
- Growth habit views.
- Basic charts for weight, fitness, and growth.

Dependencies:

- Daily metrics.
- Habits.
- Goals/sprints.

Acceptance Criteria:

- Latest weight, starting weight, goal, next milestone, total change, and trend are visible.
- Workouts and steps support daily/weekly targets.
- Growth shows target/progress, streaks, and weekly completion.

Required Validation:

- Trend calculation tests.
- Chart data transform tests.
- Responsive chart checks.

Explicit Non-Scope:

- Progress-photo comparison.
- Health-data import.

## Milestone 5 - Food

**Status:** NOT STARTED

Objective:
Build fast manual food and eating-behavior logging.

Tasks:

- `+ I Ate Something` flow.
- Photo upload.
- Description and portion notes.
- Eating reason.
- Hunger/fullness fields.
- Craving details.
- Optional calories/macros.
- Chronological gallery.

Dependencies:

- Supabase Storage.
- Daily history.

Acceptance Criteria:

- Food can be logged quickly on Android mobile.
- Photos are stored privately.
- Manual nutrition remains optional.
- Gallery shows photos with log details.

Required Validation:

- Upload metadata checks.
- Mobile capture flow checks.
- Private storage access checks.

Explicit Non-Scope:

- AI food-photo analysis.
- Automatic calorie/macro estimates.

## Milestone 6 - Beauty and Progress Photos

**Status:** NOT STARTED

Objective:
Support beauty/self-care tracking and visual progress records.

Tasks:

- Beauty routine groups.
- Hair/body/foot treatments.
- Product library.
- Appointments.
- Progress photo upload and timeline.

Dependencies:

- Routine system.
- Supabase Storage.

Acceptance Criteria:

- Beauty routines are configurable and completable.
- Products and appointments can be tracked.
- Progress photos support labels and associated weight/date.

Required Validation:

- Routine completion checks.
- Photo privacy checks.
- Timeline browsing checks.

Explicit Non-Scope:

- AI progress-photo comparison.
- Final Pixel Sola art.

## Milestone 7 - Insights, Calendar, Reports, and Export

**Status:** NOT STARTED

Objective:
Turn history into useful deterministic reflection.

Tasks:

- Calendar month states.
- Day detail polish.
- Deterministic analytics.
- Weekly report snapshots.
- Monthly report snapshots.
- Report regeneration path.
- CSV/JSON export.

Dependencies:

- Sufficient domain data.
- Report snapshot schema.

Acceptance Criteria:

- Calendar distinguishes strong, partial, low/no completion, and no data without relying only on color.
- Weekly/monthly reports persist historically.
- Insufficient-data states are honest.
- Structured export works.

Required Validation:

- Report generation tests.
- Export shape tests.
- Analytics threshold tests.

Explicit Non-Scope:

- Natural-language insight assistant.
- Conversational history queries.

## Milestone 8 - Pixel Sola and V1 Polish

**Status:** NOT STARTED

Objective:
Add delight and complete V1 usability/installability polish.

Tasks:

- Placeholder Pixel Sola state system.
- Idle, happy, excited, celebrating, sleeping, exercising, skincare/self-care, annoyed/judgmental states.
- Micro-animations and milestone celebrations.
- Accessibility pass.
- Responsive QA.
- PWA installability QA.

Dependencies:

- Core V1 behavior.
- Placeholder asset approach.

Acceptance Criteria:

- Pixel Sola reacts contextually without blocking logging.
- Placeholder assets are easy to replace later.
- Desktop and Android experiences are comfortable.
- Reduced-motion preferences are respected.

Required Validation:

- Desktop and mobile visual checks.
- Keyboard/focus checks.
- PWA build/install checks where available.

Explicit Non-Scope:

- Pixel pet.
- Room simulation.
- Currency, XP, levels, inventories, or unlockable cosmetics.

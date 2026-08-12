# Roadmap

## Status Terms

- `NOT STARTED`
- `IN PROGRESS`
- `BLOCKED`
- `READY FOR REVIEW`
- `COMPLETE`

## Current Roadmap State

**ACTIVE DEVELOPMENT TARGET:** V0.5 daily personal tracker
**Current Phase:** V0.5.0 - Foundation / Pivot
**Current Status:** V0.5 PRODUCT SPEC APPROVED; IMPLEMENTATION NOT STARTED
**Active Autonomy Level:** Level 2 - Trusted Development
**Next Approved Task:** Wait for Sola's explicit instruction before beginning V0.5 implementation.

Agents should never guess what to work on when `Next Approved Task` exists.

V1/Milestone 1 work is preserved in Git and on remote branch `backup/pre-v0.5`, but the active roadmap is now V0.5. V1 features must not be implemented unless Sola explicitly requests them.

## V0.5 Roadmap

Roadmap philosophy:

- Put a genuinely usable tracker in Sola's hands as early as possible.
- Keep the product small, reliable, and cute.
- Reuse foundation infrastructure.
- Do not rebuild the V1 universal habit/routine system under a new name.
- Treat monthly completion calendar and streaks as derived V0.5 motivation, not a gamification platform.
- Preserve V1 code and migrations as dormant infrastructure.

### V0.5.0 - Foundation / Pivot

**Status:** COMPLETE

Objective:
Prepare the simplified three-screen product direction and V0.5 data model.

Tasks:

- [x] Preserve the pre-pivot V1 state in remote branch `backup/pre-v0.5`.
- [x] Document the active V0.5 product source of truth in `docs/V0.5.md`.
- [x] Review and approve the V0.5 schema/table/bucket names before implementation.
- [x] Reduce the active product plan to Today, History, and Progress.
- [x] Document the approved strategy to remove dormant V1 screens from active V0.5 navigation/routing while preserving V1 code.
- [x] Approve fixed checklist keys, every-other-day anchor date, tracking-start semantics, and initial streak thresholds.

Acceptance Criteria:

- Future sessions can clearly identify V0.5 as the active target.
- V1 is clearly marked as deferred, not cancelled.
- No code or database migrations are changed during the documentation pivot.
- V0.5 implementation still requires Sola's explicit instruction.

### V0.5.1 - Usable Today

**Status:** NOT STARTED

Objective:
Make the app usable for real daily logging.

Tasks:

- Implement the Today screen as the main daily check-in.
- Save and reload daily scalar fields from authenticated Supabase data.
- Implement a small fixed checklist.
- Implement simple daily and every-other-day due logic.
- Let Worked out reveal activity type and duration fields.
- Add a small monthly completion calendar derived from due checklist completions.
- Add a small current-streaks panel derived from checklist and daily data.
- Ensure edits update the same daily record rather than creating duplicates.

Acceptance Criteria:

- Sola can sign in and log today's checklist/data from desktop or phone.
- Reopening the app shows the saved data for the same authenticated user.
- Not-due checklist items do not appear as incomplete for that day.
- The monthly calendar distinguishes Great, Good, Some progress, No activity, future dates, and dates before tracking began.
- Streaks count consecutive successful due dates for every-other-day checklist items.

### V0.5.2 - History And Food Gallery

**Status:** NOT STARTED

Objective:
Let Sola look backward, edit previous days, and browse food photos.

Tasks:

- Browse previous daily entries.
- Open a day and edit its checklist/data.
- Upload one or more food photos for a day.
- Store food photos privately in Supabase Storage.
- Add meal type and note metadata.
- Build a scrapbook-style grid of clickable food photo cards.

Acceptance Criteria:

- Previous days are viewable and editable.
- Food photos display in a cute visual gallery.
- Clicking a photo shows the larger image and associated date/meal/note metadata.

### V0.5.3 - Progress

**Status:** NOT STARTED

Objective:
Show small, useful weight progress without becoming a full analytics product.

Tasks:

- Show starting weight.
- Show current/latest weight.
- Show total weight change.
- Show a weight-over-time graph.
- Optionally add only trivial summaries from existing V0.5 data.

Acceptance Criteria:

- Weight progress is understandable at a glance.
- The chart is data-driven and responsive.
- No advanced analytics, Glow Score, or full reporting system is added.

### V0.5.4 - Pixel Polish

**Status:** NOT STARTED

Objective:
Progressively strengthen the cozy pixel-game presentation around the simple tracker.

Tasks:

- Refine Today as a pixel clipboard or quest board.
- Refine History as a pixel notebook or scrapbook.
- Refine Progress as a chart board or graph-paper panel.
- Add small mascot/static pose presentation if useful.
- Improve mobile and desktop polish.

Acceptance Criteria:

- The app feels cute, cozy, and personal without sacrificing real accessible controls.
- Pixel presentation decorates and frames the UI rather than replacing functional inputs.
- No game engine, player movement, or elaborate animation system is introduced.

## Deferred V1 Roadmap

The following V1 roadmap remains useful long-term context but is not active development scope.

## Milestone 0 - Project Foundation

**Status:** READY FOR REVIEW

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

**Status:** COMPLETE

Objective:
Build configurable daily behavior tracking.

Tasks:

- [x] Habit definitions.
- [x] Habit schedules, including deterministic `every_x_days` anchors and `times_per_month`.
- [x] Habit entries/completions.
- [x] Routine groups and steps.
- [x] Check All behavior.
- [x] Create/edit/reorder/deactivate habits.

Dependencies:

- Milestone 0 foundation.
- Approved schema for habits/routines.

Acceptance Criteria:

- User can create, edit, reorder, deactivate, and complete scheduled habits.
- Routine groups support individual checkboxes and Check All.
- Optional/unscheduled habits do not penalize by default.

Required Validation:

- [x] Schedule expansion tests, including anchored every-X-days and X-times/month behavior.
- [x] Completion tests.
- [x] Basic accessibility and responsive checks.

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
- Externally AI-assisted food details, if manually entered or entered by an approved Work workflow, become normal editable `food_entries` records.
- Estimated nutrition values are editable and identifiable as estimates.
- Gallery shows photos with log details.

Required Validation:

- Upload metadata checks.
- Mobile capture flow checks.
- Private storage access checks.

Explicit Non-Scope:

- In-app AI food-photo analysis.
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

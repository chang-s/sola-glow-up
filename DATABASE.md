# Database

## Status

This document describes the intended Supabase/Postgres architecture and current migration state. It should evolve alongside implementation and migrations.

Current migration state:

- Local migration foundation exists at `supabase/migrations/0001_app_foundation.sql`.
- Remote migration history records `0001_app_foundation.sql` and `0002_profiles_api_grants.sql` as applied.
- `0001_app_foundation.sql` creates only the `profiles` foundation table, timestamp trigger, and owner-only RLS policies.
- `0002_profiles_api_grants.sql` grants API table privileges for authenticated profile access while leaving row-level access to the owner-only RLS policies.
- Milestone 1 local migration work adds universal habit and routine tables in `supabase/migrations/0003_habits_and_routines.sql`.
- Goals/sprints remain deferred because the Goals model is provisional until Milestone 3 refinement.

## Design Principles

- Use relational structure for data that needs reliable analytics.
- Use the universal habit system for configurable recurring behaviors.
- Avoid turning every tracked metric into an unstructured blob.
- Keep all personal data private by default.
- Use soft deletion/archive strategies for user-created data where accidental loss matters.
- Persist weekly and monthly report snapshots.
- Every tracked metric has exactly one canonical source of truth. Views should read from canonical records instead of creating duplicate editable values.

## Proposed Tables

### Identity

`profiles`

- `id` primary key
- `auth_user_id` references Supabase auth user
- `display_name`
- `timezone`
- `unit_system`
- `created_at`
- `updated_at`

### Universal Habits

`habits`

- `id` primary key
- `user_id` references `profiles.id`
- `name`
- `description`
- `category`
- `icon`
- `tracking_type`
- `target_value`
- `target_unit`
- `time_group`
- `start_date`
- `end_date`
- `active`
- `include_in_glow_score`
- `display_order`
- `archived_at`
- `created_at`
- `updated_at`

Milestone 1 uses constrained text for `tracking_type` and `time_group`. Habits are archived/deactivated rather than hard-deleted during normal app use so historical entries remain meaningful.

`habit_schedules`

- `id` primary key
- `user_id` references `profiles.id`
- `habit_id` references `habits.id`
- `schedule_type`
- `weekdays`
- `times_per_week`
- `times_per_month`
- `interval_days`
- `anchor_date`
- `start_date`
- `end_date`
- `created_at`
- `updated_at`

For `every_x_days`, `anchor_date` is required and recurrence is calculated relative to that date. For example, an every-2-days habit anchored on August 10 is due on August 10, August 12, August 14, and so on. The schedule engine must not base recurrence on the current day.

For `times_per_month`, the schedule sets a monthly completion target without requiring exact calendar dates. V1 should not become a full recurrence engine.

Milestone 1 enforces straightforward structural schedule constraints in the database. Higher-level recurrence conflict validation remains in application/domain logic and tests.

`habit_entries`

- `id` primary key
- `habit_id` references `habits.id`
- `user_id` references `profiles.id`
- `entry_date`
- `completed`
- `value_numeric`
- `value_duration_minutes`
- `value_quantity`
- `notes`
- `source`
- `created_at`
- `updated_at`
- `deleted_at`

V1 stores one aggregate active entry per habit per calendar date. Duration, numeric, and quantity values represent the day's aggregate value, not individual same-day sessions.

### Routines

`routine_groups`

- `id` primary key
- `user_id` references `profiles.id`
- `name`
- `category`
- `time_group`
- `display_order`
- `active`
- `archived_at`
- `created_at`
- `updated_at`

`routine_steps`

- `id` primary key
- `user_id` references `profiles.id`
- `routine_group_id` references `routine_groups.id`
- `linked_habit_id` nullable reference to `habits.id`
- `name`
- `display_order`
- `active`
- `archived_at`
- `created_at`
- `updated_at`

Linked routine steps write completion/value state through the linked habit's `habit_entries`.

`routine_step_entries`

- `id` primary key
- `user_id` references `profiles.id`
- `routine_step_id` references `routine_steps.id`
- `entry_date`
- `completed`
- `notes`
- `source`
- `created_at`
- `updated_at`
- `deleted_at`

Unlinked routine steps write completion through `routine_step_entries`. Do not create duplicate completion records in both systems for the same step.

### Goals and Sprints

`goals`

- `id` primary key
- `user_id` references `profiles.id`
- `name`
- `type`
- `start_date`
- `target_date`
- `metric_type`
- `target_value`
- `status`
- `notes`
- `created_at`
- `updated_at`
- `archived_at`

The Goals schema is provisional. `metric_type` and `target_value` may not be expressive enough for all V1 goals, including weight targets, daily duration goals, weekly frequency goals, sleep minimums, and metric targets. The final Goals schema and progress-calculation model must be deliberately reviewed before Goals are implemented in Milestone 3. Milestone 0 must not prematurely lock the project into a goal model that prevents habit-based, frequency-based, duration-based, or metric-target goals.

`sprints`

- `id` primary key
- `user_id` references `profiles.id`
- `name`
- `start_date`
- `end_date`
- `status`
- `notes`
- `created_at`
- `updated_at`
- `archived_at`

`sprint_items`

- `id` primary key
- `sprint_id` references `sprints.id`
- `linked_habit_id` nullable reference to `habits.id`
- `linked_goal_id` nullable reference to `goals.id`
- `label`
- `target_value`
- `created_at`
- `updated_at`

### Daily and Domain Records

`daily_metrics`

- `id` primary key
- `user_id` references `profiles.id`
- `date`
- `steps`
- `fasting_glucose`
- `resting_heart_rate`
- `period_status`
- `manual_calorie_total`
- `notes`
- `created_at`
- `updated_at`

`manual_calorie_total` is an optional user-entered daily total for days when food entries are incomplete. It is distinct from the derived food-log calorie sum calculated from `food_entries.calories`.

`weight_entries`

- `id` primary key
- `user_id` references `profiles.id`
- `date`
- `weight`
- `source`
- `notes`
- `created_at`
- `updated_at`
- `deleted_at`

`measurement_entries`

- `id` primary key
- `user_id` references `profiles.id`
- `date`
- `measurement_type`
- `value`
- `unit`
- `notes`
- `created_at`
- `updated_at`
- `deleted_at`

`sleep_entries`

- `id` primary key
- `user_id` references `profiles.id`
- `sleep_date`
- `bedtime`
- `wake_time`
- `duration_minutes`
- `quality`
- `notes`
- `created_at`
- `updated_at`
- `deleted_at`

`sleep_date` is the calendar date on which the user wakes up. A sleep from August 10 at 11:30 PM to August 11 at 7:30 AM has `sleep_date` August 11.

`workouts`

- `id` primary key
- `user_id` references `profiles.id`
- `date`
- `workout_type`
- `duration_minutes`
- `estimated_calories`
- `notes`
- `created_at`
- `updated_at`
- `deleted_at`

`food_entries`

- `id` primary key
- `user_id` references `profiles.id`
- `eaten_at`
- `description`
- `portion_notes`
- `eating_reason`
- `hunger_before`
- `fullness_after`
- `still_hungry`
- `satisfaction`
- `craving_details`
- `calories`
- `protein`
- `carbs`
- `fat`
- `notes`
- `created_at`
- `updated_at`
- `deleted_at`

`food_photos`

- `id` primary key
- `food_entry_id` references `food_entries.id`
- `user_id` references `profiles.id`
- `storage_path`
- `label`
- `created_at`
- `deleted_at`
- `permanently_deleted_at`

`progress_photos`

- `id` primary key
- `user_id` references `profiles.id`
- `date`
- `storage_path`
- `label`
- `associated_weight_entry_id` nullable reference to `weight_entries.id`
- `notes`
- `created_at`
- `deleted_at`
- `permanently_deleted_at`

`products`

- `id` primary key
- `user_id` references `profiles.id`
- `name`
- `category`
- `start_date`
- `end_date`
- `active`
- `image_path`
- `notes`
- `created_at`
- `updated_at`
- `archived_at`

`appointments`

- `id` primary key
- `user_id` references `profiles.id`
- `appointment_type`
- `scheduled_at`
- `provider`
- `location`
- `notes`
- `completed`
- `created_at`
- `updated_at`
- `deleted_at`

`notes`

- `id` primary key
- `user_id` references `profiles.id`
- `date`
- `body`
- `tags`
- `created_at`
- `updated_at`
- `deleted_at`

### Reports

`report_snapshots`

- `id` primary key
- `user_id` references `profiles.id`
- `report_type`
- `period_start`
- `period_end`
- `generated_at`
- `generator_version`
- `summary_json`
- `created_at`

Weekly and monthly reports should persist as snapshots. Regeneration should be an intentional action that creates or replaces a snapshot according to an explicit UI flow.

## Proposed Enums

- `tracking_type`: checkbox, numeric, duration, quantity
- `schedule_type`: daily, weekdays, times_per_week, times_per_month, every_x_days, optional
- `time_group`: morning, afternoon, evening, anytime
- `goal_type`: target, habit_adherence, sprint, maintenance
- `goal_status`: active, paused, complete, archived
- `sprint_status`: planned, active, complete, archived
- `eating_reason`: hungry, craving, bored, emotional, social, habit, it_was_there, other
- `photo_label`: front, side, back, custom
- `report_type`: weekly, monthly

Final enum implementation may use Postgres enums or constrained text depending on migration ergonomics. Pick deliberately during Milestone 0.

## Canonical Sources of Truth

| Data | Canonical source | Notes |
| --- | --- | --- |
| Weight | `weight_entries` | One weight record per intended date/source; Today and Body read the same data. |
| Measurements | `measurement_entries` | Measurement type distinguishes standard and custom measurements. |
| Steps | `daily_metrics.steps` | Habits/goals may reference steps for adherence, but should not store a second steps value in `habit_entries`. |
| Fasting glucose | `daily_metrics.fasting_glucose` | Daily scalar metric. |
| Resting heart rate | `daily_metrics.resting_heart_rate` | Daily scalar metric. |
| Period status | `daily_metrics.period_status` | Daily status field. |
| Sleep | `sleep_entries` | Assigned to wake date via `sleep_date`. |
| Workouts/exercise | `workouts` | Workout records own type, duration, calories, and notes. |
| Derived food-log calories/macros | `food_entries` | Sum per-entry values when present. |
| Manual daily calories | `daily_metrics.manual_calorie_total` | Separate fallback total for incomplete food logs. |
| Farsi/piano/growth practice | `habit_entries` | Duration/quantity entries for configurable growth habits. |
| Routine/habit completion | `habit_entries` | Routine groups organize linked habit completions. |

Derived values, such as food-log calorie sums, weekly adherence, streaks, and report observations, should normally be calculated from canonical records. Persist only where a decision says to preserve historical generated output, such as report snapshots.

## Relationships

```mermaid
erDiagram
  profiles ||--o{ habits : owns
  habits ||--o{ habit_schedules : has
  habits ||--o{ habit_entries : records
  profiles ||--o{ routine_groups : owns
  routine_groups ||--o{ routine_steps : contains
  routine_steps }o--o| habits : links
  profiles ||--o{ goals : owns
  profiles ||--o{ sprints : owns
  sprints ||--o{ sprint_items : contains
  profiles ||--o{ daily_metrics : records
  profiles ||--o{ weight_entries : records
  profiles ||--o{ measurement_entries : records
  profiles ||--o{ sleep_entries : records
  profiles ||--o{ workouts : records
  profiles ||--o{ food_entries : records
  food_entries ||--o{ food_photos : has
  profiles ||--o{ progress_photos : stores
  profiles ||--o{ products : owns
  profiles ||--o{ appointments : records
  profiles ||--o{ notes : writes
  profiles ||--o{ report_snapshots : generates
```

## RLS Strategy

All application tables should include `user_id` unless they are purely global reference tables. V1 should avoid global editable reference tables unless needed.

Policies should allow authenticated users to select, insert, update, and delete only rows owned by their profile/user id.

Storage policies should protect files by owner. Storage paths should include a user-specific prefix to make ownership checks straightforward.

## Storage Buckets

Planned private buckets:

- `food-photos`
- `progress-photos`
- `product-images` if product images are implemented

Use signed URLs or authenticated access patterns. Do not make personal photo buckets public.

## Soft Deletion Strategy

- Configurable entities use `archived_at` when they should disappear from normal active views but remain historically meaningful.
- User-entered records use `deleted_at` when accidental deletion protection matters.
- Photo records include `deleted_at` and `permanently_deleted_at`.
- Permanent storage deletion must be explicit and approval-worthy outside normal app behavior.

## Migration Rules

- Keep migrations reproducible.
- Prefer small, reviewable migrations.
- Prepare non-destructive migrations locally within approved scope.
- Do not apply remote migrations without approval at Level 1.
- Destructive migrations are a permanent STOP condition.
- Authentication, RLS, and storage security changes require careful review and may require approval.

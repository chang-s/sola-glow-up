# Sola Glow-Up --- Product Requirements Document

**Status:** Implementation-planning draft\
**Product:** Private, single-user personal growth and wellness tracker\
**Platforms:** Responsive Progressive Web App (Windows + Android)\
**Primary user:** Sola

## Current Implementation Status

**ACTIVE DEVELOPMENT TARGET:** V0.5 daily personal tracker.

**Current Status:** Functional V0.5 is complete through V0.5.3. V0.5.4 Pixel Polish is planning-only until Sola explicitly approves implementation.

The larger V1 product vision in this PRD is deferred, not cancelled. For active work, use `docs/V0.5.md` as the source of truth. Do not implement V1 features from this PRD unless Sola explicitly asks to resume V1 work.

The pre-pivot V1/Milestone 1 implementation is preserved in Git and on remote branch `backup/pre-v0.5`.

## 1. Executive Summary

Sola Glow-Up is a private personal tracking application for health, body
progress, nutrition behavior, fitness, sleep, skincare, haircare,
self-care, supplements, appointments, and personal-development habits.

The product combines very fast daily logging with increasingly useful
longitudinal data: trends, streaks, milestones, adherence, progress
photos, correlations, and weekly/monthly reports. The experience should
feel cozy, playful, pixel-art-inspired, and personal rather than
clinical or corporate.

The architecture must be modular. New habits such as Farsi, piano,
reading, or future routines must be configurable without code changes.

**Core loop:** Track → Complete → Reflect → Discover patterns → Adjust →
Repeat.

## 2. Product Goals

-   Make routine daily logging possible in one or two interactions.
-   Track measurable outcomes and recurring behaviors.
-   Turn accumulated history into useful visual insights.
-   Support short-term "sprints" alongside long-term goals.
-   Make consistency motivating through streaks, milestones, completion
    feedback, and Pixel Sola reactions.
-   Keep historical records editable and exportable.
-   Sync automatically between desktop and mobile.
-   Keep personal data private by default.

## 3. Product Principles

### Fast by default

Common actions should not require multi-screen workflows.

### Data is the reward

The app should become substantially more useful after 7, 30, 90, and 180
days.

### Modular, not hardcoded

Habits, schedules, routines, categories, and goals must be
user-configurable.

### Cute but data-rich

Pixel-art/Tamagotchi-adjacent presentation should coexist with serious
visualization and analytics.

### Transparent metrics

Glow Scores and streaks must have understandable calculations.

### Editable history

Any past day can be backfilled or corrected.

### Private by default

Authentication and private storage are required.

## 4. Primary Information Architecture

1.  **Today** --- daily command center
2.  **Glow Up** --- weight, measurements, milestones, progress photos
3.  **Food** --- meals, eating behavior, cravings, nutrition, gallery
4.  **Fitness** --- steps, movement, workouts
5.  **Beauty** --- skincare, hair, body/foot care, products,
    appointments
6.  **Growth** --- Farsi, piano, reading, arbitrary development habits
7.  **Insights** --- charts, adherence, correlations, reports
8.  **Calendar** --- historical day/month views
9.  **Settings** --- habits, routines, schedules, goals, export

Sleep is a tracked domain but does not require dedicated primary
navigation in V1.

## 5. V1 Functional Requirements

### 5.1 Today

Today is the highest-priority screen and should handle most daily
interactions.

Display: - Date and contextual greeting - Pixel Sola - Daily Glow
Score - Streak summary - Previous-day fields - Morning/evening
routines - Today's scheduled habits - Quick actions for food, workout,
and notes

Track or expose: - Weight - Fasting glucose - Resting heart rate -
Period status - Bedtime and wake time - Calculated sleep duration -
Steps - Exercise - Daily calorie total when available

The morning flow must allow entry of previous-day information such as
sleep, total steps, and calories.

Routine groups must support individual checkboxes plus **Check All**.

### 5.2 Universal Habit System

Habit fields: - Name - Description - Category - Icon - Tracking type -
Target value/unit - Frequency - Time group - Start/end date - Active
status - Glow Score inclusion - Display order

V1 tracking types: - Checkbox - Numeric - Duration - Quantity

V1 schedules: - Daily - Specific weekdays - X times/week - Every X
days - Optional/unscheduled

Examples: - Minoxidil --- daily checkbox - iRestore --- every-other-day
checkbox - Farsi --- 20 minutes daily - Piano --- four sessions/week -
Steps --- numeric daily target

Users can create, edit, reorder, and deactivate habits without code
changes.

### 5.3 Goals and Sprints

Goal types: - Target - Habit/adherence - Time-bound sprint - Maintenance

Fields: - Name - Type - Start date - Target date - Associated
metric/habits - Target value - Status/progress

A temporary sprint such as **BlizzCon Prep** can bundle weight,
exercise, steps, food logging, sleep, skincare, haircare, and
preparation behaviors without permanently changing long-term routines.

### 5.4 Glow Up / Body

Weight: - Latest weight prominently - Starting weight - Ultimate goal -
Next milestone - Total change - Distance to milestone - Daily chart -
Smoothed trend such as 7-day average

Support configurable milestone celebrations, initially every 10 lb.

Measurements: - Waist - Hips - Chest - Thigh - Custom measurements

Progress photos: - Date - Associated weight - Front/side/back/custom
labels - Secure storage - Timeline browsing

### 5.5 Food

Primary action: **+ I Ate Something**

Entry supports: - Take/upload photo - Text description - Portion/notes -
Timestamp - Eating reason - Hunger before (1--10) - Fullness after
(1--10) - Still hungry yes/no - Satisfaction - Craving details -
Optional calories/protein/carbs/fat

Default eating reasons: Hungry, Craving, Bored, Emotional, Social,
Habit, It was there, Other.

Provide a chronological photo gallery with log details.

Manual food entry is a permanent supported workflow. V1 does not depend
on in-app AI food-photo analysis, an AI runtime, an AI API key, an AI
backend, or AI API expense.

V1 may support an external AI-assisted workflow: Sola can take or upload
a meal photo, have ChatGPT/ChatGPT Work outside the app estimate and
structure details such as meal description, portion notes, calories,
protein, carbs, fat, and other useful food-entry details, then manually
enter or paste that information into Glow-Up. A later authorized Work
workflow may also add the structured entry if explicitly approved.

External AI assistance does not create a separate food record type. The
resulting entry uses the same canonical `food_entries` model as a fully
manual entry. AI-estimated nutrition values must remain editable and
should be identified as estimates rather than measured or authoritative
values.

### 5.6 Fitness

Track: - Steps - Movement minutes - Workout type - Duration - Estimated
calories - Notes

Default workout types can include treadmill, strength, PT, walking, and
custom.

Support daily and weekly targets.

### 5.7 Beauty and Self-Care

Configurable routine groups: - AM skincare - PM skincare - Haircare -
Body care - Foot care

Each supports individual steps and Check All.

Scheduled treatments may include iRestore, masks, minoxidil, hair
washing, and foot care.

Product library fields: - Name - Category - Start/end dates - Active
status - Notes - Optional image

Appointment tracking supports nutritionist, trainer, salon, nail/foot
care, acupuncture, spa, massage, and custom types.

### 5.8 Growth

Uses the universal habit system.

Initial examples: - Farsi - Piano - Reading

Show daily target/progress, streak, weekly completion, and
duration/quantity.

### 5.9 Calendar and History

Month view visually distinguishes strong completion, partial completion,
low/no completion, and no data. Do not rely solely on color.

Selecting a day exposes: - Glow Score/category completion - Weight -
Sleep - Steps - Workout - Food - Routines - Growth habits - Notes

All history is editable and arbitrary older dates can be backfilled.

### 5.10 Insights

V1 deterministic analytics:

**Weight:** time series, smoothed trend, weekly/monthly change,
milestones.

**Fitness:** steps, workout frequency, minutes/week, completion.

**Sleep:** duration, bedtime, wake time, averages/trends.

**Beauty:** AM/PM skincare and treatment adherence.

**Growth:** practice minutes, sessions, streaks, adherence.

**Food:** eating-reason distribution, hunger/fullness averages,
time-of-day patterns, craving frequency.

Pattern observations may compare sleep vs hunger/intake, boredom eating
by time, workout frequency vs weight trend, and habit adherence. The UI
must say when insufficient data exists rather than imply conclusions.

### 5.11 Weekly and Monthly Reports

Sunday Glow Report: - Weight change - Average Glow Score -
Week-over-week change - Strongest/lowest category - Streaks - Habit
adherence - Selected charts - Notable observations - Pixel Sola message

Monthly reports provide broader trends and remain historically
accessible.

### 5.12 Glow Score

Default:

**completed scheduled eligible items / scheduled eligible items × 100**

Requirements: - Explain contributing items - Category-level scores -
Optional items do not penalize by default - Habits can be excluded - No
hidden health-quality judgment

### 5.13 Streaks

Support current streaks, best streaks where useful, and weekly
completion. Broken-streak feedback may be playful/direct.

### 5.14 Pixel Sola

V1 visual states: - Idle - Happy - Excited - Celebrating - Sleeping -
Exercising - Skincare/self-care - Annoyed/judgmental

Reactions may depend on time, routines, daily completion, workouts,
milestones, and streaks.

V1 explicitly excludes currency, XP, inventories, unlockable cosmetics,
and full Tamagotchi simulation.

### 5.15 Notes and Export

Support lightweight date-associated notes.

Provide structured export, preferably CSV and/or JSON. Photos may be
exported separately.

## 6. UX Requirements

-   Fully responsive Windows desktop and Android layouts.
-   Installable PWA where supported.
-   Checkbox completion ideally requires one tap.
-   Compact inline/modal/sheet editing for numeric values.
-   Mobile-first food capture.
-   Keyboard-accessible desktop interactions.
-   Visible focus states and semantic labels.
-   Sufficient contrast.
-   Status must not rely solely on color.
-   Respect reduced-motion settings where practical.
-   Use micro-animations, progress transitions, and milestone
    celebrations without obstructing logging.

## 7. Visual Direction

Keywords: cozy, pixel art, cute, Tamagotchi-adjacent, warm, personal,
playful, polished, data-rich.

Avoid: - Clinical medical dashboards - Generic corporate SaaS
aesthetics - Excessive clutter - Game systems that overwhelm tracking

The application should support purchased/licensed pixel assets rather
than depend on generated artwork.

## 8. Technical Direction

Preferred starting architecture, subject to implementation validation:

**Frontend** - React - TypeScript - Vite - Responsive PWA

**Backend** - Supabase or comparable managed service - Authentication -
Relational database - File/photo storage - Cross-device synchronization

Single-user authenticated access. Do not assume public data.

Core data concepts: - Profile - Habits - Habit schedules - Habit
entries/completions - Routine groups/steps - Goals/sprints - Weight -
Measurements - Sleep - Food and food photos - Workouts - Products -
Appointments - Progress photos - Notes - Reports/snapshots where
appropriate

Prefer reusable models over bespoke columns when the universal tracking
model can represent a concept cleanly.

## 9. V1.5

-   In-app AI-assisted food photo/description analysis with editable
    calorie/macro estimates
-   Progress-photo comparison
-   Deeper correlations and natural-language insights
-   Questions against personal history
-   Android-compatible health-data import exploration
-   Optional notifications/reminders

Manual entry must remain available.

## 10. Future / Dream Roadmap

-   Richer Pixel Sola room/world
-   Pixel pet
-   Interactive room objects
-   More animations
-   Home-screen widgets
-   Calendar integration
-   AI reflection assistant
-   Conversational history queries

### Money / Expense Tracking

Treat Money as a distinct future module, not V1.

Potential scope: - Transactions - Categories - Monthly spending -
Income - Savings - Investments - Subscriptions - Recurring expenses -
Budget/goal progress - Spending insights

Financial integrations, architecture, and security require separate
planning.

## 11. Explicit V1 Non-Goals

Do not delay V1 for: - In-app AI food analysis - Automatic health
import - Expense tracking - Full RPG mechanics - Coins/XP/levels -
Cosmetic unlocks - Pixel pet - Complex room simulation -
Multi-user/social features - Public profiles - Commercial billing -
Notification quick logging - Third-party calendar sync

## 12. Recommended Delivery Phases

### Phase 0 --- Foundation

Repository, architecture decision, PWA shell, authentication, schema,
responsive design system, test/seed data, navigation.

### Phase 1 --- Daily Core

Today, universal habits, routines, daily entries, historical editing,
Glow Score, streaks.

### Phase 2 --- Body/Fitness/Growth

Weight, measurements, goals/sprints, workouts, Growth, core charts.

### Phase 3 --- Food

Food logging, behavioral context, photos, gallery, manual nutrition.

### Phase 4 --- Beauty

Skincare/hair/body routines, products, treatments, appointments,
progress photos.

### Phase 5 --- Insights

Calendar polish, analytics, weekly/monthly reports, deterministic
pattern detection.

### Phase 6 --- Character Polish

Pixel Sola state machine, contextual reactions, celebrations, final
PWA/installability and responsive QA.

Each phase should leave the product runnable and testable.

## 13. Acceptance Criteria for V1

V1 is ready when the user can:

1.  Install/open the same product on Windows and Android.
2.  Authenticate and see synchronized private data.
3.  Complete morning/evening routines quickly.
4.  Create arbitrary habits and schedules without code changes.
5.  Track weight, measurements, sleep, steps, workouts, food behavior,
    beauty routines, and Growth habits.
6.  Backfill and edit historical days.
7.  Create long-term goals and temporary sprints.
8.  Browse food/progress photos.
9.  View useful charts, adherence, Glow Scores, streaks, and calendar
    history.
10. Receive weekly/monthly summaries based on stored data.
11. Export structured data.
12. Interact with a lightweight Pixel Sola system.
13. Use the core experience comfortably on desktop and mobile.

## 14. Engineering Guardrails

-   Do not prematurely optimize for multi-user scale.
-   Do not add V1.5/Future features while implementing V1 unless
    explicitly approved.
-   Keep schema migrations reproducible.
-   Never commit secrets.
-   Maintain `.env.example`.
-   Use automated tests for critical calculations and data
    transformations.
-   Validate mobile and desktop layouts before considering a phase
    complete.
-   Prefer small, reviewable commits.
-   Maintain a project status/decision document so another agent can
    resume work.
-   Document setup, database migrations, deployment, and testing.
-   Never delete user data or perform destructive schema operations
    without explicit approval.

## 15. Success Indicators

Because this is a single-user personal product, success is behavioral
rather than commercial:

-   Daily logging remains fast enough to sustain use.
-   The user returns consistently.
-   Historical data becomes more useful over time.
-   The user can add/change routines without developer intervention.
-   The user regularly uses charts/reports to identify patterns.
-   Desktop/mobile synchronization is reliable.
-   The experience remains delightful rather than becoming
    administrative work.

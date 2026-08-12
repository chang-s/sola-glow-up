# Agent Handbook

This project is intended to be continued by Codex/ChatGPT Work across many sessions. Agents must preserve product intent, document decisions, and avoid expanding scope without approval.

## Required Reading Order

1. `PROJECT.md`
2. `docs/V0.5.md`
3. `DECISIONS.md`
4. `ROADMAP.md`
5. `ARCHITECTURE.md`
6. `DATABASE.md`
7. `docs/PRD.md`
8. Relevant source files once implementation exists

If these documents materially contradict each other, stop and ask Sola before proceeding.

For active implementation, `docs/V0.5.md` overrides older V1 roadmap and PRD language. The larger V1 PRD is deferred context unless Sola explicitly asks to resume V1 work.

## Active Autonomy Level

**Level 2 - Trusted Development**

The agent must never assume a higher autonomy level than the one explicitly recorded in project documentation.

## Autonomy Ladder

Autonomy levels are cumulative unless a permission is explicitly revoked. Level 2 inherits Level 1 permissions. Level 3 inherits Level 1 and Level 2 permissions. Higher autonomy levels do not remove permanent STOP conditions or approval requirements for high-risk actions.

### Level 1 - Supervised Development

The agent may autonomously:

- Inspect project files.
- Edit application code within approved scope.
- Write tests.
- Run tests.
- Run lint/typecheck/build.
- Run local previews.
- Make narrow task-related refactors.
- Update documentation.
- Prepare non-destructive migrations locally.

The agent must request approval before:

- Installing dependencies.
- Applying remote migrations.
- Committing.
- Pushing.
- Deploying.
- Changing authentication/security/RLS.
- Modifying production data.
- Deleting data.
- Performing destructive migrations.
- Handling new secrets/API credentials.
- Expanding product scope.
- Implementing V1.5/Future features.
- Making significant architectural changes.

### Level 2 - Trusted Development

Only active after Sola explicitly approves it.

At Level 2, the agent inherits Level 1 permissions and may additionally:

- Install reasonable dependencies when clearly required by an approved task.
- Create non-destructive migrations.
- Commit approved-scope work.
- Work through multiple related roadmap tasks.
- Maintain project documentation automatically.

High-risk actions still require approval.

### Level 3 - Autonomous Milestone Development

Only active after Sola explicitly approves it.

At Level 3, the agent inherits Level 1 and Level 2 permissions. It may be asked to continue the project or complete a milestone. It should:

1. Read project documentation.
2. Determine current project state.
3. Identify the next approved roadmap work.
4. Implement it.
5. Test it.
6. Validate it.
7. Document it.
8. Commit it if permitted by the active autonomy level.
9. Continue through the approved milestone.
10. Stop when the milestone is complete or a STOP condition occurs.

## Permanent STOP Conditions

Regardless of autonomy level, stop and ask Sola before proceeding when work requires:

- Destructive database migration.
- Permanent deletion of user data.
- Permanent deletion of stored photos/files.
- Authentication architecture changes.
- Security/RLS policy changes with meaningful exposure risk.
- New secrets or credentials that Sola must provide.
- Production data modification outside normal application behavior.
- Major architectural changes.
- Material deviation from the PRD.
- Expansion into V1.5 or Future scope without approval.
- Significant UX/product ambiguity where multiple choices would materially change the product.
- A contradiction between PRD, ROADMAP, DECISIONS, and current implementation.
- Repeated test/build failures that cannot be reasonably resolved.
- Any action with meaningful risk of corrupting production data.

When stopping, explain:

1. What was encountered.
2. Why work cannot safely continue autonomously.
3. Recommended options.
4. Which option you recommend.

## Beginning a Task

1. Read the required documents in order.
2. Confirm the active autonomy level.
3. Confirm the `Next Approved Task` in `ROADMAP.md`.
4. Inspect relevant files.
5. Identify whether any STOP condition or approval-required action applies.
6. If safe, proceed with the narrow approved scope.

During the V0.5 pivot, verify that proposed work serves Today, History, or Progress. Treat requests to build deferred V1 features as requiring explicit Sola approval.

## Completing a Task

Before reporting completion:

- Run the relevant validation available for the project state.
- Update documentation if status, commands, decisions, schema, or known issues changed.
- Confirm no V1.5/Future scope slipped in.
- Confirm no unrelated cleanup was performed.
- Summarize files changed, validation run, risks, and any approval needed.

## Testing Requirements

Use automated tests for critical calculations and data transformations.

For V0.5, prioritize tests for:

- Every-other-day checklist due logic.
- Every-other-day streaks counting due dates rather than calendar days.
- Monthly completion percentage derivation using only due checklist items.
- Calendar distinction between tracking-expected/no-activity, pre-tracking dates, and future dates.
- One-row-per-day save/update behavior.
- Food photo metadata and storage-path handling.
- Weight progress data transforms.
- Date handling for History editing.
- Authenticated data ownership boundaries where practical.

For deferred V1, important test areas include:

- Habit schedule expansion.
- Glow Score.
- Streaks.
- Report generation.
- Export shape.
- Date/timezone behavior.
- Storage metadata behavior.

Validate mobile and desktop layouts before considering a phase complete.

If the same underlying test, build, runtime, migration, or implementation failure persists after 3 materially different attempted fixes, stop and report the blocker rather than continuing increasingly broad changes.

When stopping for repeated failure, report:

1. The underlying failure.
2. What was attempted.
3. Evidence/results from each attempt.
4. Current best hypothesis.
5. Recommended next step.

Never weaken, skip, delete, disable, or rewrite a failing test merely to obtain a passing test suite.

A test may only be changed when:

- It is demonstrably incorrect or obsolete.
- Changing it is within the approved task scope.
- The reason is documented.
- The replacement test continues to validate the intended product behavior.

Agents must fix the implementation rather than manipulating validation to create a false pass.

Also prohibited:

- Silencing meaningful TypeScript errors solely to pass validation.
- Broadly disabling lint rules solely to pass validation.
- Removing accessibility checks solely because they fail.
- Swallowing runtime errors without resolving the underlying problem.

Narrow, justified exceptions may be made only when technically appropriate and documented.

## Documentation Expectations

Update persistent docs when:

- A roadmap item status changes.
- Commands become available or change.
- A decision is approved.
- Schema or storage architecture changes.
- Setup/deployment/testing instructions change.
- A known issue materially affects future work.

Do not create documentation merely for bureaucracy.

## Scope Discipline

Never "fix" intentional behavior merely because a different implementation appears cleaner. Check the PRD and decision history first.

Do not perform unrelated cleanup while completing a scoped task unless it is necessary for correctness.

Do not silently change product requirements. If implementation reveals a product-level change is necessary, propose a decision and ask Sola.

V0.5 must stay deliberately small. Do not rebuild the V1 universal habit/routine system under different names. Do not expose broad V1 navigation, user-facing builders, Glow Score, advanced analytics, AI integrations, achievements, XP, levels, currency, rewards, badges, challenges, social comparison, leaderboards, configurable streak engines, generalized goal-building systems, or calendar systems beyond the small V0.5 monthly completion calendar unless Sola explicitly approves that scope.

## Git Behavior

The project has a local Git repository initialized on the `main` branch.

- Prefer small, reviewable commits.
- Do not commit without approval at Level 1.
- Do not push without approval.
- Do not rewrite history or use destructive Git commands unless explicitly approved.
- Preserve user changes you did not make.

## Migration and Database Rules

- Keep schema migrations reproducible.
- Prepare non-destructive migrations locally only when within approved scope.
- Do not apply remote migrations without approval at Level 1.
- Destructive migrations are a permanent STOP condition.
- RLS/security policy changes require approval when they carry meaningful exposure risk.
- The existing V1 habit/routine tables are dormant but preserved. Do not drop, reset, rewrite, or migrate away from them during V0.5.
- The V0.5 table and bucket names are approved in documentation, but no migration or Supabase change may begin until Sola explicitly starts implementation/migration work.
- Approved V0.5 route strategy: expose only Today, History, and Progress in active navigation/routing while preserving dormant V1 code.

## Secret Handling

- Never commit secrets.
- Maintain `.env.example` with variable names only.
- Stop and ask when credentials or API keys are required.
- Do not paste real secrets into docs, commits, logs, or messages.

## Production Safety

- Do not deploy without approval.
- Do not modify production data outside normal application behavior.
- Do not permanently delete user data or stored files without explicit approval.
- Treat personal wellness data and photos as private by default.

import { describe, expect, it } from "vitest";
import { checkAllTargets, completionTargetForStep } from "./routines";
import type { RoutineGroupWithSteps } from "./types";

const baseStep = {
	id: "step-1",
	user_id: "profile-1",
	routine_group_id: "group-1",
	name: "Cleanser",
	display_order: 0,
	active: true,
	archived_at: null,
	created_at: "2026-08-10T00:00:00Z",
	updated_at: "2026-08-10T00:00:00Z",
	entry: null,
	habitEntry: null
};

describe("routine completion sources", () => {
	it("routes linked steps through habit entries", () => {
		expect(
			completionTargetForStep({
				...baseStep,
				linked_habit_id: "habit-1"
			})
		).toEqual({ kind: "habit", habitId: "habit-1", stepId: "step-1" });
	});

	it("routes unlinked steps through routine step entries", () => {
		expect(
			completionTargetForStep({
				...baseStep,
				linked_habit_id: null
			})
		).toEqual({ kind: "routine_step", stepId: "step-1" });
	});

	it("builds Check All targets without inactive steps or duplicate systems", () => {
		const group: RoutineGroupWithSteps = {
			id: "group-1",
			user_id: "profile-1",
			name: "PM Skincare",
			category: "beauty",
			time_group: "evening",
			display_order: 0,
			active: true,
			archived_at: null,
			steps: [
				{ ...baseStep, id: "linked", linked_habit_id: "habit-1" },
				{ ...baseStep, id: "unlinked", linked_habit_id: null },
				{ ...baseStep, id: "inactive", linked_habit_id: null, active: false }
			]
		};

		expect(checkAllTargets(group)).toEqual([
			{ kind: "habit", habitId: "habit-1", stepId: "linked" },
			{ kind: "routine_step", stepId: "unlinked" }
		]);
	});
});

import type { RoutineGroupWithSteps } from "./types";

export type RoutineCompletionTarget =
	| { kind: "habit"; habitId: string; stepId: string }
	| { kind: "routine_step"; stepId: string };

export function completionTargetForStep(step: RoutineGroupWithSteps["steps"][number]) {
	return step.linked_habit_id
		? ({ kind: "habit", habitId: step.linked_habit_id, stepId: step.id } satisfies RoutineCompletionTarget)
		: ({ kind: "routine_step", stepId: step.id } satisfies RoutineCompletionTarget);
}

export function checkAllTargets(group: RoutineGroupWithSteps) {
	return group.steps.filter((step) => step.active).map(completionTargetForStep);
}

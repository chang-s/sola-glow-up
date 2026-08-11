import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { updateHabitEntry, updateRoutineStepEntry } from "./api";
import { checkAllTargets } from "./routines";
import { isHabitDueOnDate, scheduleLabel, todayKey } from "./schedule";
import { useHabitDashboard } from "./useHabitDashboard";
import type { HabitWithSchedule, RoutineGroupWithSteps } from "./types";

function valueForHabit(habit: HabitWithSchedule) {
	if (!habit.entry) return "";
	if (habit.tracking_type === "numeric") return habit.entry.value_numeric ?? "";
	if (habit.tracking_type === "duration") return habit.entry.value_duration_minutes ?? "";
	if (habit.tracking_type === "quantity") return habit.entry.value_quantity ?? "";
	return "";
}

export function TodayPage() {
	const dateKey = todayKey();
	const { isConfigured } = useAuth();
	const { profile, dashboard } = useHabitDashboard(dateKey);
	const queryClient = useQueryClient();

	const invalidate = async () => {
		await queryClient.invalidateQueries({ queryKey: ["habit-dashboard", profile.data?.id, dateKey] });
	};

	const habitMutation = useMutation({
		mutationFn: updateHabitEntry,
		onSuccess: invalidate
	});

	const stepMutation = useMutation({
		mutationFn: updateRoutineStepEntry,
		onSuccess: invalidate
	});

	if (!isConfigured) {
		return (
			<section className="work-surface" aria-labelledby="today-title">
				<div className="surface-header">
					<div>
						<p className="eyebrow">Milestone 1</p>
						<h2 id="today-title">Today</h2>
					</div>
				</div>
				<section className="panel-state">
					Add Supabase environment variables to use habit and routine tracking.
				</section>
			</section>
		);
	}

	if (profile.isLoading || dashboard.isLoading) {
		return <section className="panel-state">Loading today's habits...</section>;
	}

	if (profile.error || dashboard.error || !profile.data || !dashboard.data) {
		return (
			<section className="panel-state error-state">
				{profile.error?.message ?? dashboard.error?.message ?? "Habit data is unavailable."}
			</section>
		);
	}

	const scheduledHabits = dashboard.data.habits.filter((habit) =>
		isHabitDueOnDate(habit.schedule, dateKey)
	);

	async function toggleHabit(habit: HabitWithSchedule, completed: boolean, value: number | null = null) {
		await habitMutation.mutateAsync({
			profileId: profile.data!.id,
			habitId: habit.id,
			dateKey,
			completed,
			value,
			trackingType: habit.tracking_type
		});
	}

	async function checkAll(group: RoutineGroupWithSteps) {
		for (const target of checkAllTargets(group)) {
			if (target.kind === "habit") {
				const habit = dashboard.data!.habits.find((item) => item.id === target.habitId);
				if (habit) {
					await habitMutation.mutateAsync({
						profileId: profile.data!.id,
						habitId: habit.id,
						dateKey,
						completed: true,
						value: valueForHabit(habit) === "" ? null : Number(valueForHabit(habit)),
						trackingType: habit.tracking_type,
						source: "routine_check_all"
					});
				}
				continue;
			}

			await stepMutation.mutateAsync({
				profileId: profile.data!.id,
				stepId: target.stepId,
				dateKey,
				completed: true,
				source: "routine_check_all"
			});
		}
	}

	return (
		<section className="work-surface" aria-labelledby="today-title">
			<div className="surface-header">
				<div>
					<p className="eyebrow">Milestone 1</p>
					<h2 id="today-title">Today</h2>
				</div>
				<time dateTime={dateKey}>{dateKey}</time>
			</div>

			<div className="surface-grid">
				<section className="tool-panel" aria-labelledby="scheduled-habits-title">
					<h3 id="scheduled-habits-title">Scheduled Habits</h3>
					{scheduledHabits.length ? (
						<div className="stack-list">
							{scheduledHabits.map((habit) => (
								<div className="check-row" key={habit.id}>
									<label>
										<input
											type="checkbox"
											checked={Boolean(habit.entry?.completed)}
											onChange={(event) => toggleHabit(habit, event.target.checked)}
										/>
										<span>
											<strong>{habit.name}</strong>
											<small>{scheduleLabel(habit.schedule)}</small>
										</span>
									</label>
									{habit.tracking_type !== "checkbox" ? (
										<input
											className="value-input"
											type="number"
											min="0"
											aria-label={`${habit.name} value`}
											value={valueForHabit(habit)}
											onChange={(event) =>
												toggleHabit(
													habit,
													Number(event.target.value) > 0,
													event.target.value === "" ? null : Number(event.target.value)
												)
											}
										/>
									) : null}
								</div>
							))}
						</div>
					) : (
						<p className="empty-note">No scheduled habits are due today.</p>
					)}
				</section>

				<section className="tool-panel" aria-labelledby="routine-title">
					<h3 id="routine-title">Routines</h3>
					{dashboard.data.routineGroups.length ? (
						<div className="stack-list">
							{dashboard.data.routineGroups.map((group) => (
								<div className="routine-block" key={group.id}>
									<div className="routine-heading">
										<strong>{group.name}</strong>
										<button type="button" onClick={() => checkAll(group)}>
											<Check aria-hidden="true" size={16} />
											Check All
										</button>
									</div>
									{group.steps.map((step) => {
										const checked = step.linked_habit_id
											? Boolean(step.habitEntry?.completed)
											: Boolean(step.entry?.completed);
										return (
											<label className="check-row compact" key={step.id}>
												<input
													type="checkbox"
													checked={checked}
													onChange={async (event) => {
														if (step.linked_habit_id) {
															const habit = dashboard.data!.habits.find(
																(item) => item.id === step.linked_habit_id
															);
															if (habit) await toggleHabit(habit, event.target.checked);
															return;
														}
														await stepMutation.mutateAsync({
															profileId: profile.data!.id,
															stepId: step.id,
															dateKey,
															completed: event.target.checked
														});
													}}
												/>
												<span>{step.name}</span>
											</label>
										);
									})}
								</div>
							))}
						</div>
					) : (
						<p className="empty-note">Create routine groups in Settings.</p>
					)}
				</section>
			</div>

			{habitMutation.isPending || stepMutation.isPending ? (
				<div className="save-indicator" role="status">
					<Loader2 aria-hidden="true" size={16} />
					Saving
				</div>
			) : null}
		</section>
	);
}

import { KeyboardEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Loader2, RotateCcw } from "lucide-react";
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

function isHabitComplete(habit: HabitWithSchedule) {
	if (!habit.entry) return false;
	if (habit.tracking_type === "checkbox") return habit.entry.completed;
	return Number(valueForHabit(habit)) > 0;
}

function friendlyDate(dateKey: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric"
	}).format(new Date(`${dateKey}T00:00:00`));
}

function shiftDate(dateKey: string, offsetDays: number) {
	const date = new Date(`${dateKey}T00:00:00`);
	date.setDate(date.getDate() + offsetDays);
	return todayKey(date);
}

export function TodayPage() {
	const [dateKey, setDateKey] = useState(todayKey());
	const { isConfigured } = useAuth();
	const { profile, dashboard } = useHabitDashboard(dateKey);
	const queryClient = useQueryClient();
	const [valueDrafts, setValueDrafts] = useState<Record<string, string>>({});
	const [habitOverrides, setHabitOverrides] = useState<
		Record<string, { completed: boolean; value: number | null }>
	>({});

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

	const habitsForDate = dashboard.data.habits.map((habit) => {
		const override = habitOverrides[`${dateKey}:${habit.id}`];
		if (!override) return habit;

		return {
			...habit,
			entry: {
				id: habit.entry?.id ?? `pending-${habit.id}`,
				user_id: habit.user_id,
				habit_id: habit.id,
				entry_date: dateKey,
				completed: override.completed,
				value_numeric: habit.tracking_type === "numeric" ? override.value : null,
				value_duration_minutes: habit.tracking_type === "duration" ? override.value : null,
				value_quantity: habit.tracking_type === "quantity" ? override.value : null,
				notes: habit.entry?.notes ?? null,
				source: habit.entry?.source ?? "manual",
				deleted_at: null
			}
		} satisfies HabitWithSchedule;
	});

	const scheduledHabits = habitsForDate.filter(
		(habit) => habit.active && !habit.archived_at && isHabitDueOnDate(habit.schedule, dateKey)
	);
	const toDoHabits = scheduledHabits.filter((habit) => !isHabitComplete(habit));
	const doneHabits = scheduledHabits.filter(isHabitComplete);
	const activeRoutineGroups = dashboard.data.routineGroups
		.filter((group) => group.active && !group.archived_at)
		.map((group) => ({
			...group,
			steps: group.steps.filter((step) => step.active && !step.archived_at)
		}));

	async function toggleHabit(habit: HabitWithSchedule, completed: boolean, value: number | null = null) {
		setHabitOverrides((current) => ({
			...current,
			[`${dateKey}:${habit.id}`]: { completed, value }
		}));
		await habitMutation.mutateAsync({
			profileId: profile.data!.id,
			habitId: habit.id,
			dateKey,
			completed,
			value,
			trackingType: habit.tracking_type
		});
	}

	async function saveValueHabit(habit: HabitWithSchedule, draftValue: string) {
		const value = draftValue === "" ? null : Number(draftValue);
		await toggleHabit(habit, Boolean(value && value > 0), value);
	}

	function handleValueKeyDown(event: KeyboardEvent<HTMLInputElement>, habit: HabitWithSchedule) {
		if (event.key === "Enter") {
			event.currentTarget.blur();
			void saveValueHabit(habit, valueDrafts[habit.id] ?? "");
		}
	}

	async function checkAll(group: RoutineGroupWithSteps) {
		for (const target of checkAllTargets(group)) {
			if (target.kind === "habit") {
				const habit = habitsForDate.find((item) => item.id === target.habitId);
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

	function renderHabit(habit: HabitWithSchedule) {
		const label =
			habit.tracking_type === "duration"
				? `${habit.name} minutes`
				: `${habit.name} value`;

		if (habit.tracking_type === "checkbox") {
			return (
				<label className="check-row compact" key={habit.id}>
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
			);
		}

		return (
			<div className="value-row" key={habit.id}>
				<span>
					<strong>{habit.name}</strong>
					<small>{scheduleLabel(habit.schedule)}</small>
				</span>
				<div className="value-entry">
					<input
						className="value-input"
						type="number"
						min="0"
						inputMode="decimal"
						aria-label={label}
						value={valueDrafts[`${dateKey}:${habit.id}`] ?? String(valueForHabit(habit))}
						onChange={(event) =>
							setValueDrafts((current) => ({
								...current,
								[`${dateKey}:${habit.id}`]: event.target.value
							}))
						}
						onBlur={(event) => saveValueHabit(habit, event.target.value)}
						onKeyDown={(event) => handleValueKeyDown(event, habit)}
					/>
					{habit.target_unit ? <small>{habit.target_unit}</small> : null}
					{isHabitComplete(habit) ? (
						<button
							type="button"
							aria-label={`Clear ${habit.name}`}
							onClick={() => {
								setValueDrafts((current) => ({ ...current, [`${dateKey}:${habit.id}`]: "" }));
								void saveValueHabit(habit, "");
							}}
						>
							<RotateCcw aria-hidden="true" size={16} />
							Clear
						</button>
					) : null}
				</div>
			</div>
		);
	}

	return (
		<section className="work-surface" aria-labelledby="today-title">
			<div className="surface-header">
				<div>
					<p className="eyebrow">Milestone 1</p>
					<h2 id="today-title">Today</h2>
				</div>
				<div className="date-controls">
					<button type="button" aria-label="Previous day" onClick={() => setDateKey(shiftDate(dateKey, -1))}>
						<ChevronLeft aria-hidden="true" size={16} />
					</button>
					<label>
						<span>Date</span>
						<input
							type="date"
							value={dateKey}
							onChange={(event) => setDateKey(event.target.value || todayKey())}
							aria-label="Choose date"
						/>
					</label>
					<button type="button" aria-label="Next day" onClick={() => setDateKey(shiftDate(dateKey, 1))}>
						<ChevronRight aria-hidden="true" size={16} />
					</button>
					{dateKey !== todayKey() ? (
						<button type="button" onClick={() => setDateKey(todayKey())}>
							Today
						</button>
					) : null}
					<time dateTime={dateKey}>{friendlyDate(dateKey)}</time>
				</div>
			</div>

			<div className="surface-grid">
				<section className="tool-panel" aria-labelledby="scheduled-habits-title">
					<h3 id="scheduled-habits-title">To Do</h3>
					{toDoHabits.length ? <div className="stack-list">{toDoHabits.map(renderHabit)}</div> : <p className="empty-note">Nothing scheduled here.</p>}
				</section>

				<section className="tool-panel done-panel" aria-labelledby="done-habits-title">
					<h3 id="done-habits-title">Done</h3>
					{doneHabits.length ? <div className="stack-list done-list">{doneHabits.map(renderHabit)}</div> : <p className="empty-note">Completed habits will land here.</p>}
				</section>

				<section className="tool-panel" aria-labelledby="routine-title">
					<h3 id="routine-title">Routines</h3>
					{activeRoutineGroups.length ? (
						<div className="stack-list">
							{activeRoutineGroups.map((group) => (
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

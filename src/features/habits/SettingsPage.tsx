import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Archive, Pencil, Plus, Save, X } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import {
	archiveRecord,
	createHabit,
	createRoutineGroup,
	createRoutineStep,
	reorderRecord,
	updateHabitDetails,
	updateRoutineGroupDetails,
	updateRoutineStepDetails
} from "./api";
import { scheduleLabel, todayKey, validateScheduleDraft } from "./schedule";
import { useHabitDashboard } from "./useHabitDashboard";
import type { HabitWithSchedule, RoutineGroupWithSteps, ScheduleType, TimeGroup, TrackingType } from "./types";

const timeGroups: TimeGroup[] = ["morning", "afternoon", "evening", "anytime"];
const trackingTypes: TrackingType[] = ["checkbox", "numeric", "duration", "quantity"];
const scheduleTypes: ScheduleType[] = [
	"daily",
	"weekdays",
	"times_per_week",
	"times_per_month",
	"every_x_days",
	"optional"
];

type EditDraft =
	| {
			kind: "habit";
			id: string;
			name: string;
			category: string;
			targetValue: string;
			targetUnit: string;
			timeGroup: TimeGroup;
			includeInGlowScore: boolean;
	  }
	| {
			kind: "group";
			id: string;
			name: string;
			category: string;
			timeGroup: TimeGroup;
	  }
	| {
			kind: "step";
			id: string;
			name: string;
			linkedHabitId: string;
	  };

export function SettingsPage() {
	const dateKey = todayKey();
	const { isConfigured } = useAuth();
	const { profile, dashboard } = useHabitDashboard(dateKey);
	const queryClient = useQueryClient();
	const [habitError, setHabitError] = useState<string | null>(null);
	const [name, setName] = useState("");
	const [category, setCategory] = useState("growth");
	const [trackingType, setTrackingType] = useState<TrackingType>("checkbox");
	const [targetValue, setTargetValue] = useState("");
	const [targetUnit, setTargetUnit] = useState("");
	const [timeGroup, setTimeGroup] = useState<TimeGroup>("anytime");
	const [includeInGlowScore, setIncludeInGlowScore] = useState(true);
	const [scheduleType, setScheduleType] = useState<ScheduleType>("daily");
	const [weekdays, setWeekdays] = useState<number[]>([]);
	const [timesPerWeek, setTimesPerWeek] = useState("");
	const [timesPerMonth, setTimesPerMonth] = useState("");
	const [intervalDays, setIntervalDays] = useState("");
	const [anchorDate, setAnchorDate] = useState(dateKey);
	const [routineName, setRoutineName] = useState("");
	const [routineStepName, setRoutineStepName] = useState("");
	const [selectedGroup, setSelectedGroup] = useState("");
	const [linkedHabit, setLinkedHabit] = useState("");
	const [editDraft, setEditDraft] = useState<EditDraft | null>(null);

	const invalidate = async () => {
		await queryClient.invalidateQueries({ queryKey: ["habit-dashboard", profile.data?.id, dateKey] });
	};

	const mutation = useMutation({
		mutationFn: async (task: () => Promise<void>) => task(),
		onSuccess: invalidate
	});

	if (!isConfigured) {
		return (
			<section className="work-surface" aria-labelledby="settings-title">
				<div className="surface-header">
					<div>
						<p className="eyebrow">Universal Habits</p>
						<h2 id="settings-title">Settings</h2>
					</div>
				</div>
				<section className="panel-state">
					Add Supabase environment variables to configure habits and routines.
				</section>
			</section>
		);
	}

	if (profile.isLoading || dashboard.isLoading) {
		return <section className="panel-state">Loading settings...</section>;
	}

	if (profile.error || dashboard.error || !profile.data || !dashboard.data) {
		return (
			<section className="panel-state error-state">
				{profile.error?.message ?? dashboard.error?.message ?? "Settings are unavailable."}
			</section>
		);
	}

	async function submitHabit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setHabitError(null);
		const validationError = validateScheduleDraft({
			scheduleType,
			weekdays,
			timesPerWeek,
			timesPerMonth,
			intervalDays,
			anchorDate
		});
		if (validationError) {
			setHabitError(validationError);
			return;
		}

		await mutation.mutateAsync(() =>
			createHabit({
				profileId: profile.data!.id,
				name,
				category,
				trackingType,
				targetValue: targetValue ? Number(targetValue) : null,
				targetUnit: targetUnit || null,
				timeGroup,
				startDate: dateKey,
				includeInGlowScore,
				displayOrder: dashboard.data!.habits.length,
				schedule: {
					type: scheduleType,
					weekdays: scheduleType === "weekdays" ? weekdays : null,
					timesPerWeek: scheduleType === "times_per_week" ? Number(timesPerWeek) : null,
					timesPerMonth: scheduleType === "times_per_month" ? Number(timesPerMonth) : null,
					intervalDays: scheduleType === "every_x_days" ? Number(intervalDays) : null,
					anchorDate: scheduleType === "every_x_days" ? anchorDate : null
				}
			})
		);

		setName("");
		setTargetValue("");
		setTargetUnit("");
	}

	async function submitRoutineGroup(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		await mutation.mutateAsync(() =>
			createRoutineGroup({
				profileId: profile.data!.id,
				name: routineName,
				category: "routine",
				timeGroup,
				displayOrder: dashboard.data!.routineGroups.length
			})
		);
		setRoutineName("");
	}

	async function submitRoutineStep(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		await mutation.mutateAsync(() =>
			createRoutineStep({
				profileId: profile.data!.id,
				routineGroupId: selectedGroup,
				name: routineStepName,
				linkedHabitId: linkedHabit || null,
				displayOrder:
					dashboard.data!.routineGroups.find((group) => group.id === selectedGroup)?.steps.length ?? 0
			})
		);
		setRoutineStepName("");
		setLinkedHabit("");
	}

	async function move(table: "habits" | "routine_groups" | "routine_steps", id: string, order: number) {
		await mutation.mutateAsync(() => reorderRecord(table, id, order));
	}

	function editHabit(habit: HabitWithSchedule) {
		setEditDraft({
			kind: "habit",
			id: habit.id,
			name: habit.name,
			category: habit.category,
			targetValue: habit.target_value?.toString() ?? "",
			targetUnit: habit.target_unit ?? "",
			timeGroup: habit.time_group,
			includeInGlowScore: habit.include_in_glow_score
		});
	}

	function editGroup(group: RoutineGroupWithSteps) {
		setEditDraft({
			kind: "group",
			id: group.id,
			name: group.name,
			category: group.category ?? "",
			timeGroup: group.time_group
		});
	}

	function editStep(step: RoutineGroupWithSteps["steps"][number]) {
		setEditDraft({
			kind: "step",
			id: step.id,
			name: step.name,
			linkedHabitId: step.linked_habit_id ?? ""
		});
	}

	async function saveEdit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!editDraft) return;

		if (editDraft.kind === "habit") {
			await mutation.mutateAsync(() =>
				updateHabitDetails({
					id: editDraft.id,
					name: editDraft.name,
					category: editDraft.category,
					targetValue: editDraft.targetValue ? Number(editDraft.targetValue) : null,
					targetUnit: editDraft.targetUnit || null,
					timeGroup: editDraft.timeGroup,
					includeInGlowScore: editDraft.includeInGlowScore
				})
			);
		}

		if (editDraft.kind === "group") {
			await mutation.mutateAsync(() =>
				updateRoutineGroupDetails({
					id: editDraft.id,
					name: editDraft.name,
					category: editDraft.category || null,
					timeGroup: editDraft.timeGroup
				})
			);
		}

		if (editDraft.kind === "step") {
			await mutation.mutateAsync(() =>
				updateRoutineStepDetails({
					id: editDraft.id,
					name: editDraft.name,
					linkedHabitId: editDraft.linkedHabitId || null
				})
			);
		}

		setEditDraft(null);
	}

	return (
		<section className="work-surface" aria-labelledby="settings-title">
			<div className="surface-header">
				<div>
					<p className="eyebrow">Universal Habits</p>
					<h2 id="settings-title">Settings</h2>
				</div>
			</div>

			<div className="surface-grid">
				<form className="tool-panel form-grid" onSubmit={submitHabit}>
					<h3>Create Habit</h3>
					<label>
						<span>Name</span>
						<input value={name} onChange={(event) => setName(event.target.value)} required />
					</label>
					<label>
						<span>Category</span>
						<input value={category} onChange={(event) => setCategory(event.target.value)} required />
					</label>
					<label>
						<span>Tracking</span>
						<select value={trackingType} onChange={(event) => setTrackingType(event.target.value as TrackingType)}>
							{trackingTypes.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
					</label>
					<label>
						<span>Target</span>
						<input
							type="number"
							min="0"
							value={targetValue}
							onChange={(event) => setTargetValue(event.target.value)}
						/>
					</label>
					<label>
						<span>Unit</span>
						<input value={targetUnit} onChange={(event) => setTargetUnit(event.target.value)} />
					</label>
					<label>
						<span>Time</span>
						<select value={timeGroup} onChange={(event) => setTimeGroup(event.target.value as TimeGroup)}>
							{timeGroups.map((group) => (
								<option key={group} value={group}>
									{group}
								</option>
							))}
						</select>
					</label>
					<label>
						<span>Schedule</span>
						<select
							value={scheduleType}
							onChange={(event) => setScheduleType(event.target.value as ScheduleType)}
						>
							{scheduleTypes.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
					</label>
					{scheduleType === "weekdays" ? (
						<div className="weekday-grid">
							{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, index) => (
								<label key={label}>
									<input
										type="checkbox"
										checked={weekdays.includes(index)}
										onChange={(event) =>
											setWeekdays((current) =>
												event.target.checked
													? [...current, index].sort()
													: current.filter((day) => day !== index)
											)
										}
									/>
									<span>{label}</span>
								</label>
							))}
						</div>
					) : null}
					{scheduleType === "times_per_week" ? (
						<label>
							<span>Times/week</span>
							<input
								type="number"
								min="1"
								max="7"
								value={timesPerWeek}
								onChange={(event) => setTimesPerWeek(event.target.value)}
							/>
						</label>
					) : null}
					{scheduleType === "times_per_month" ? (
						<label>
							<span>Times/month</span>
							<input
								type="number"
								min="1"
								max="31"
								value={timesPerMonth}
								onChange={(event) => setTimesPerMonth(event.target.value)}
							/>
						</label>
					) : null}
					{scheduleType === "every_x_days" ? (
						<>
							<label>
								<span>Interval days</span>
								<input
									type="number"
									min="1"
									value={intervalDays}
									onChange={(event) => setIntervalDays(event.target.value)}
								/>
							</label>
							<label>
								<span>Anchor date</span>
								<input
									type="date"
									value={anchorDate}
									onChange={(event) => setAnchorDate(event.target.value)}
								/>
							</label>
						</>
					) : null}
					<label className="inline-control">
						<input
							type="checkbox"
							checked={includeInGlowScore}
							onChange={(event) => setIncludeInGlowScore(event.target.checked)}
						/>
						<span>Eligible later</span>
					</label>
					{habitError ? <p className="form-error">{habitError}</p> : null}
					<button type="submit" disabled={mutation.isPending}>
						<Plus aria-hidden="true" size={16} />
						Add habit
					</button>
				</form>

				<section className="tool-panel">
					<h3>Habits</h3>
					<div className="stack-list">
						{dashboard.data.habits.map((habit, index) => (
							<div className="manage-item" key={habit.id}>
								<div className="manage-row">
									<span>
										<strong>{habit.name}</strong>
										<small>{scheduleLabel(habit.schedule)}</small>
									</span>
									<div>
										<button type="button" aria-label={`Edit ${habit.name}`} onClick={() => editHabit(habit)}>
											<Pencil aria-hidden="true" size={16} />
										</button>
										<button type="button" aria-label={`Move ${habit.name} up`} onClick={() => move("habits", habit.id, index - 1)}>
											<ArrowUp aria-hidden="true" size={16} />
										</button>
										<button type="button" aria-label={`Move ${habit.name} down`} onClick={() => move("habits", habit.id, index + 1)}>
											<ArrowDown aria-hidden="true" size={16} />
										</button>
										<button type="button" aria-label={`Archive ${habit.name}`} onClick={() => mutation.mutateAsync(() => archiveRecord("habits", habit.id))}>
											<Archive aria-hidden="true" size={16} />
										</button>
									</div>
								</div>
								{editDraft?.kind === "habit" && editDraft.id === habit.id ? (
									<form className="inline-edit form-grid" onSubmit={saveEdit}>
										<label>
											<span>Name</span>
											<input value={editDraft.name} onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} required />
										</label>
										<label>
											<span>Category</span>
											<input value={editDraft.category} onChange={(event) => setEditDraft({ ...editDraft, category: event.target.value })} required />
										</label>
										<label>
											<span>Target</span>
											<input type="number" min="0" value={editDraft.targetValue} onChange={(event) => setEditDraft({ ...editDraft, targetValue: event.target.value })} />
										</label>
										<label>
											<span>Unit</span>
											<input value={editDraft.targetUnit} onChange={(event) => setEditDraft({ ...editDraft, targetUnit: event.target.value })} />
										</label>
										<label>
											<span>Time</span>
											<select value={editDraft.timeGroup} onChange={(event) => setEditDraft({ ...editDraft, timeGroup: event.target.value as TimeGroup })}>
												{timeGroups.map((group) => (
													<option key={group} value={group}>
														{group}
													</option>
												))}
											</select>
										</label>
										<label className="inline-control">
											<input type="checkbox" checked={editDraft.includeInGlowScore} onChange={(event) => setEditDraft({ ...editDraft, includeInGlowScore: event.target.checked })} />
											<span>Eligible later</span>
										</label>
										<div className="edit-actions">
											<button type="submit" disabled={mutation.isPending}>
												<Save aria-hidden="true" size={16} />
												Save
											</button>
											<button type="button" onClick={() => setEditDraft(null)}>
												<X aria-hidden="true" size={16} />
												Cancel
											</button>
										</div>
									</form>
								) : null}
							</div>
						))}
					</div>
				</section>

				<form className="tool-panel form-grid" onSubmit={submitRoutineGroup}>
					<h3>Create Routine Group</h3>
					<label>
						<span>Name</span>
						<input
							value={routineName}
							onChange={(event) => setRoutineName(event.target.value)}
							required
						/>
					</label>
					<button type="submit" disabled={mutation.isPending}>
						<Plus aria-hidden="true" size={16} />
						Add group
					</button>
				</form>

				<form className="tool-panel form-grid" onSubmit={submitRoutineStep}>
					<h3>Create Routine Step</h3>
					<label>
						<span>Group</span>
						<select
							value={selectedGroup}
							onChange={(event) => setSelectedGroup(event.target.value)}
							required
						>
							<option value="">Choose group</option>
							{dashboard.data.routineGroups.map((group) => (
								<option key={group.id} value={group.id}>
									{group.name}
								</option>
							))}
						</select>
					</label>
					<label>
						<span>Name</span>
						<input
							value={routineStepName}
							onChange={(event) => setRoutineStepName(event.target.value)}
							required
						/>
					</label>
					<label>
						<span>Linked habit</span>
						<select value={linkedHabit} onChange={(event) => setLinkedHabit(event.target.value)}>
							<option value="">No linked habit</option>
							{dashboard.data.habits.map((habit) => (
								<option key={habit.id} value={habit.id}>
									{habit.name}
								</option>
							))}
						</select>
					</label>
					<button type="submit" disabled={mutation.isPending}>
						<Plus aria-hidden="true" size={16} />
						Add step
					</button>
				</form>

				<section className="tool-panel wide-panel">
					<h3>Routine Groups and Steps</h3>
					<div className="stack-list">
						{dashboard.data.routineGroups.map((group, groupIndex) => (
							<div className="manage-item" key={group.id}>
								<div className="manage-row">
									<span>
										<strong>{group.name}</strong>
										<small>{group.time_group}</small>
									</span>
									<div>
										<button type="button" aria-label={`Edit ${group.name}`} onClick={() => editGroup(group)}>
											<Pencil aria-hidden="true" size={16} />
										</button>
										<button type="button" aria-label={`Move ${group.name} up`} onClick={() => move("routine_groups", group.id, groupIndex - 1)}>
											<ArrowUp aria-hidden="true" size={16} />
										</button>
										<button type="button" aria-label={`Move ${group.name} down`} onClick={() => move("routine_groups", group.id, groupIndex + 1)}>
											<ArrowDown aria-hidden="true" size={16} />
										</button>
										<button type="button" aria-label={`Archive ${group.name}`} onClick={() => mutation.mutateAsync(() => archiveRecord("routine_groups", group.id))}>
											<Archive aria-hidden="true" size={16} />
										</button>
									</div>
								</div>
								{editDraft?.kind === "group" && editDraft.id === group.id ? (
									<form className="inline-edit form-grid" onSubmit={saveEdit}>
										<label>
											<span>Name</span>
											<input value={editDraft.name} onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} required />
										</label>
										<label>
											<span>Category</span>
											<input value={editDraft.category} onChange={(event) => setEditDraft({ ...editDraft, category: event.target.value })} />
										</label>
										<label>
											<span>Time</span>
											<select value={editDraft.timeGroup} onChange={(event) => setEditDraft({ ...editDraft, timeGroup: event.target.value as TimeGroup })}>
												{timeGroups.map((item) => (
													<option key={item} value={item}>
														{item}
													</option>
												))}
											</select>
										</label>
										<div className="edit-actions">
											<button type="submit" disabled={mutation.isPending}>
												<Save aria-hidden="true" size={16} />
												Save
											</button>
											<button type="button" onClick={() => setEditDraft(null)}>
												<X aria-hidden="true" size={16} />
												Cancel
											</button>
										</div>
									</form>
								) : null}
								<div className="nested-list">
									{group.steps.map((step, stepIndex) => (
										<div className="manage-item" key={step.id}>
											<div className="manage-row">
												<span>
													<strong>{step.name}</strong>
													<small>{step.linked_habit_id ? "Linked habit step" : "Routine-only step"}</small>
												</span>
												<div>
													<button type="button" aria-label={`Edit ${step.name}`} onClick={() => editStep(step)}>
														<Pencil aria-hidden="true" size={16} />
													</button>
													<button type="button" aria-label={`Move ${step.name} up`} onClick={() => move("routine_steps", step.id, stepIndex - 1)}>
														<ArrowUp aria-hidden="true" size={16} />
													</button>
													<button type="button" aria-label={`Move ${step.name} down`} onClick={() => move("routine_steps", step.id, stepIndex + 1)}>
														<ArrowDown aria-hidden="true" size={16} />
													</button>
													<button type="button" aria-label={`Archive ${step.name}`} onClick={() => mutation.mutateAsync(() => archiveRecord("routine_steps", step.id))}>
														<Archive aria-hidden="true" size={16} />
													</button>
												</div>
											</div>
											{editDraft?.kind === "step" && editDraft.id === step.id ? (
												<form className="inline-edit form-grid" onSubmit={saveEdit}>
													<label>
														<span>Name</span>
														<input value={editDraft.name} onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} required />
													</label>
													<label>
														<span>Linked habit</span>
														<select value={editDraft.linkedHabitId} onChange={(event) => setEditDraft({ ...editDraft, linkedHabitId: event.target.value })}>
															<option value="">No linked habit</option>
															{dashboard.data.habits.map((habit) => (
																<option key={habit.id} value={habit.id}>
																	{habit.name}
																</option>
															))}
														</select>
													</label>
													<div className="edit-actions">
														<button type="submit" disabled={mutation.isPending}>
															<Save aria-hidden="true" size={16} />
															Save
														</button>
														<button type="button" onClick={() => setEditDraft(null)}>
															<X aria-hidden="true" size={16} />
															Cancel
														</button>
													</div>
												</form>
											) : null}
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</section>
			</div>
		</section>
	);
}

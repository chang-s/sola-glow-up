import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Archive, Pencil, Plus, RotateCcw, Save, X } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import {
	archiveRecord,
	createHabit,
	createRoutine,
	moveItem,
	reorderRecords,
	restoreRecord,
	updateHabitDetails,
	updateRoutineGroupDetails,
	updateRoutineStepDetails
} from "./api";
import {
	categoryLabel,
	categoryOptions,
	goalLabelForTrackingType,
	scheduleOptions,
	shouldShowGoalFields,
	timeGroupLabel,
	timeGroupOptions,
	trackingLabel,
	trackingOptions
} from "./labels";
import { scheduleLabel, todayKey, validateScheduleDraft } from "./schedule";
import { useHabitDashboard } from "./useHabitDashboard";
import type { HabitWithSchedule, ScheduleType, TimeGroup, TrackingType } from "./types";

type HabitDraft = {
	name: string;
	category: string;
	trackingType: TrackingType;
	goal: string;
	unit: string;
	timeGroup: TimeGroup;
	scheduleType: ScheduleType;
	weekdays: number[];
	timesPerWeek: string;
	timesPerMonth: string;
	intervalDays: string;
	startDate: string;
};

type RoutineStepDraft = {
	id: string;
	name: string;
	linkedHabitId: string;
};

type RoutineDraft = {
	name: string;
	category: string;
	timeGroup: TimeGroup;
	steps: RoutineStepDraft[];
};

type EditDraft =
	| { kind: "habit"; id: string; draft: HabitDraft }
	| { kind: "group"; id: string; name: string; category: string; timeGroup: TimeGroup }
	| { kind: "step"; id: string; name: string; linkedHabitId: string };

const emptyHabitDraft = (dateKey: string): HabitDraft => ({
	name: "",
	category: "growth",
	trackingType: "checkbox",
	goal: "",
	unit: "",
	timeGroup: "anytime",
	scheduleType: "daily",
	weekdays: [],
	timesPerWeek: "",
	timesPerMonth: "",
	intervalDays: "",
	startDate: dateKey
});

const emptyRoutineDraft = (): RoutineDraft => ({
	name: "",
	category: "beauty",
	timeGroup: "evening",
	steps: [{ id: crypto.randomUUID(), name: "", linkedHabitId: "" }]
});

function habitDraftFromHabit(habit: HabitWithSchedule): HabitDraft {
	return {
		name: habit.name,
		category: habit.category,
		trackingType: habit.tracking_type,
		goal: habit.target_value?.toString() ?? "",
		unit: habit.target_unit ?? "",
		timeGroup: habit.time_group,
		scheduleType: habit.schedule?.schedule_type ?? "daily",
		weekdays: habit.schedule?.weekdays ?? [],
		timesPerWeek: habit.schedule?.times_per_week?.toString() ?? "",
		timesPerMonth: habit.schedule?.times_per_month?.toString() ?? "",
		intervalDays: habit.schedule?.interval_days?.toString() ?? "",
		startDate: habit.schedule?.anchor_date ?? habit.start_date
	};
}

function habitSummary(habit: HabitWithSchedule) {
	const goal =
		habit.tracking_type === "checkbox" || habit.target_value === null
			? trackingLabel(habit.tracking_type)
			: `${habit.target_value} ${habit.target_unit ?? ""}`.trim();
	return `${categoryLabel(habit.category)} • ${goal} • ${scheduleLabel(habit.schedule)}`;
}

export function SettingsPage() {
	const dateKey = todayKey();
	const { isConfigured } = useAuth();
	const { profile, dashboard } = useHabitDashboard(dateKey);
	const queryClient = useQueryClient();
	const [habitError, setHabitError] = useState<string | null>(null);
	const [habitDraft, setHabitDraft] = useState(() => emptyHabitDraft(dateKey));
	const [routineDraft, setRoutineDraft] = useState(() => emptyRoutineDraft());
	const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
	const dialogRef = useRef<HTMLDivElement>(null);

	const invalidate = async () => {
		await queryClient.invalidateQueries({ queryKey: ["habit-dashboard", profile.data?.id, dateKey] });
	};

	const mutation = useMutation({
		mutationFn: async (task: () => Promise<void>) => task(),
		onSuccess: invalidate
	});

	useEffect(() => {
		if (!editDraft) return;
		const firstField = dialogRef.current?.querySelector<HTMLElement>("input, select, button");
		firstField?.focus();

		function onKeyDown(event: globalThis.KeyboardEvent) {
			if (event.key === "Escape") setEditDraft(null);
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [editDraft]);

	const activeHabits = useMemo(
		() => dashboard.data?.habits.filter((habit) => habit.active && !habit.archived_at) ?? [],
		[dashboard.data]
	);
	const archivedHabits = useMemo(
		() => dashboard.data?.habits.filter((habit) => !habit.active || habit.archived_at) ?? [],
		[dashboard.data]
	);
	const activeGroups = useMemo(
		() =>
			dashboard.data?.routineGroups
				.filter((group) => group.active && !group.archived_at)
				.map((group) => ({
					...group,
					steps: group.steps.filter((step) => step.active && !step.archived_at)
				})) ?? [],
		[dashboard.data]
	);
	const archivedGroups = useMemo(
		() => dashboard.data?.routineGroups.filter((group) => !group.active || group.archived_at) ?? [],
		[dashboard.data]
	);
	const archivedSteps = useMemo(
		() =>
			dashboard.data?.routineGroups.flatMap((group) =>
				group.steps
					.filter((step) => !step.active || step.archived_at)
					.map((step) => ({ ...step, groupName: group.name }))
			) ?? [],
		[dashboard.data]
	);

	if (!isConfigured) {
		return (
			<section className="work-surface" aria-labelledby="settings-title">
				<div className="surface-header">
					<div>
						<p className="eyebrow">Universal Habits</p>
						<h2 id="settings-title">Settings</h2>
					</div>
				</div>
				<section className="panel-state">Add Supabase environment variables to configure habits and routines.</section>
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

	function setHabitField<Key extends keyof HabitDraft>(key: Key, value: HabitDraft[Key]) {
		setHabitDraft((current) => ({ ...current, [key]: value }));
	}

	function validateHabitDraft(draft: HabitDraft) {
		return validateScheduleDraft({
			scheduleType: draft.scheduleType,
			weekdays: draft.weekdays,
			timesPerWeek: draft.timesPerWeek,
			timesPerMonth: draft.timesPerMonth,
			intervalDays: draft.intervalDays,
			anchorDate: draft.startDate
		});
	}

	async function submitHabit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setHabitError(null);
		const validationError = validateHabitDraft(habitDraft);
		if (validationError) {
			setHabitError(validationError);
			return;
		}

		await mutation.mutateAsync(() =>
			createHabit({
				profileId: profile.data!.id,
				name: habitDraft.name,
				category: habitDraft.category,
				trackingType: habitDraft.trackingType,
				targetValue: shouldShowGoalFields(habitDraft.trackingType) && habitDraft.goal ? Number(habitDraft.goal) : null,
				targetUnit: shouldShowGoalFields(habitDraft.trackingType) ? habitDraft.unit || null : null,
				timeGroup: habitDraft.timeGroup,
				startDate: habitDraft.startDate,
				includeInGlowScore: true,
				displayOrder: activeHabits.length,
				schedule: {
					type: habitDraft.scheduleType,
					weekdays: habitDraft.scheduleType === "weekdays" ? habitDraft.weekdays : null,
					timesPerWeek: habitDraft.scheduleType === "times_per_week" ? Number(habitDraft.timesPerWeek) : null,
					timesPerMonth: habitDraft.scheduleType === "times_per_month" ? Number(habitDraft.timesPerMonth) : null,
					intervalDays: habitDraft.scheduleType === "every_x_days" ? Number(habitDraft.intervalDays) : null,
					anchorDate: habitDraft.scheduleType === "every_x_days" ? habitDraft.startDate : null
				}
			})
		);

		setHabitDraft(emptyHabitDraft(dateKey));
	}

	async function submitRoutine(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const steps = routineDraft.steps
			.map((step) => {
				const habitName = activeHabits.find((habit) => habit.id === step.linkedHabitId)?.name;
				return {
					name: (step.name || habitName || "").trim(),
					linkedHabitId: step.linkedHabitId || null
				};
			})
			.filter((step) => step.name);

		await mutation.mutateAsync(() =>
			createRoutine({
				profileId: profile.data!.id,
				name: routineDraft.name,
				category: routineDraft.category || null,
				timeGroup: routineDraft.timeGroup,
				displayOrder: activeGroups.length,
				steps
			})
		);
		setRoutineDraft(emptyRoutineDraft());
	}

	async function moveList(
		table: "habits" | "routine_groups" | "routine_steps",
		items: Array<{ id: string }>,
		fromIndex: number,
		toIndex: number
	) {
		await mutation.mutateAsync(() => reorderRecords(table, moveItem(items, fromIndex, toIndex)));
	}

	async function saveEdit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!editDraft) return;

		if (editDraft.kind === "habit") {
			await mutation.mutateAsync(() =>
				updateHabitDetails({
					id: editDraft.id,
					name: editDraft.draft.name,
					category: editDraft.draft.category,
					targetValue:
						shouldShowGoalFields(editDraft.draft.trackingType) && editDraft.draft.goal
							? Number(editDraft.draft.goal)
							: null,
					targetUnit: shouldShowGoalFields(editDraft.draft.trackingType) ? editDraft.draft.unit || null : null,
					timeGroup: editDraft.draft.timeGroup,
					includeInGlowScore: true
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
					name: editDraft.name || activeHabits.find((habit) => habit.id === editDraft.linkedHabitId)?.name || "",
					linkedHabitId: editDraft.linkedHabitId || null
				})
			);
		}

		setEditDraft(null);
	}

	function setRoutineStep(index: number, update: Partial<RoutineStepDraft>) {
		setRoutineDraft((current) => ({
			...current,
			steps: current.steps.map((step, itemIndex) => {
				if (itemIndex !== index) return step;
				const next = { ...step, ...update };
				if (update.linkedHabitId && !step.name) {
					next.name = activeHabits.find((habit) => habit.id === update.linkedHabitId)?.name ?? "";
				}
				return next;
			})
		}));
	}

	function closeDialog(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key === "Escape") setEditDraft(null);
	}

	return (
		<section className="work-surface" aria-labelledby="settings-title">
			<div className="surface-header">
				<div>
					<p className="eyebrow">Universal Habits</p>
					<h2 id="settings-title">Settings</h2>
				</div>
			</div>

			<div className="settings-sections">
				<section className="settings-section" aria-labelledby="habits-settings-title">
					<div className="section-heading">
						<div>
							<p className="eyebrow">Trackable actions</p>
							<h3 id="habits-settings-title">Habits</h3>
						</div>
					</div>

					<div className="surface-grid">
						<form className="tool-panel form-grid" onSubmit={submitHabit}>
							<h4>Create Habit</h4>
							<label>
								<span>Name <em>Required</em></span>
								<input value={habitDraft.name} onChange={(event) => setHabitField("name", event.target.value)} required />
							</label>
							<div className="compact-fields">
								<label>
									<span>Category <em>Required</em></span>
									<select value={habitDraft.category} onChange={(event) => setHabitField("category", event.target.value)}>
										{categoryOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</label>
								<label>
									<span>Track by <em>Required</em></span>
									<select value={habitDraft.trackingType} onChange={(event) => setHabitField("trackingType", event.target.value as TrackingType)}>
										{trackingOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</label>
							</div>
							{shouldShowGoalFields(habitDraft.trackingType) ? (
								<div className="compact-fields">
									<label>
										<span>{goalLabelForTrackingType(habitDraft.trackingType)} <em>Optional</em></span>
										<input className="compact-input" type="number" min="0" value={habitDraft.goal} onChange={(event) => setHabitField("goal", event.target.value)} />
									</label>
									<label>
										<span>Unit <em>Optional</em></span>
										<input value={habitDraft.unit} placeholder="minutes, steps, sessions" onChange={(event) => setHabitField("unit", event.target.value)} />
									</label>
								</div>
							) : null}
							<div className="compact-fields">
								<label>
									<span>When <em>Required</em></span>
									<select value={habitDraft.timeGroup} onChange={(event) => setHabitField("timeGroup", event.target.value as TimeGroup)}>
										{timeGroupOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</label>
								<label>
									<span>Frequency <em>Required</em></span>
									<select value={habitDraft.scheduleType} onChange={(event) => setHabitField("scheduleType", event.target.value as ScheduleType)}>
										{scheduleOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</label>
							</div>
							<ScheduleFields draft={habitDraft} setDraft={setHabitDraft} />
							{habitError ? <p className="form-error">{habitError}</p> : null}
							<button type="submit" disabled={mutation.isPending}>
								<Plus aria-hidden="true" size={16} />
								Add habit
							</button>
						</form>

						<section className="tool-panel">
							<h4>Manage Habits</h4>
							<div className="stack-list">
								{activeHabits.map((habit, index) => (
									<div className="manage-row" key={habit.id}>
										<span>
											<strong>{habit.name}</strong>
											<small>{habitSummary(habit)}</small>
										</span>
										<div>
											<button type="button" aria-label={`Edit ${habit.name}`} onClick={() => setEditDraft({ kind: "habit", id: habit.id, draft: habitDraftFromHabit(habit) })}>
												<Pencil aria-hidden="true" size={16} />
											</button>
											<button type="button" aria-label={`Move ${habit.name} up`} onClick={() => moveList("habits", activeHabits, index, index - 1)}>
												<ArrowUp aria-hidden="true" size={16} />
											</button>
											<button type="button" aria-label={`Move ${habit.name} down`} onClick={() => moveList("habits", activeHabits, index, index + 1)}>
												<ArrowDown aria-hidden="true" size={16} />
											</button>
											<button type="button" aria-label={`Archive ${habit.name}`} onClick={() => mutation.mutateAsync(() => archiveRecord("habits", habit.id))}>
												<Archive aria-hidden="true" size={16} />
											</button>
										</div>
									</div>
								))}
							</div>
							<ArchivedPanel
								title={`Archived habits (${archivedHabits.length})`}
								emptyText="No archived habits."
								items={archivedHabits}
								onRestore={(id) => mutation.mutateAsync(() => restoreRecord("habits", id))}
							/>
						</section>
					</div>
				</section>

				<section className="settings-section" aria-labelledby="routines-settings-title">
					<div className="section-heading">
						<div>
							<p className="eyebrow">Grouped checklists</p>
							<h3 id="routines-settings-title">Routines</h3>
						</div>
					</div>
					<div className="surface-grid">
						<form className="tool-panel form-grid" onSubmit={submitRoutine}>
							<h4>Create Routine</h4>
							<label>
								<span>Name <em>Required</em></span>
								<input value={routineDraft.name} onChange={(event) => setRoutineDraft((current) => ({ ...current, name: event.target.value }))} required />
							</label>
							<div className="compact-fields">
								<label>
									<span>Category <em>Optional</em></span>
									<select value={routineDraft.category} onChange={(event) => setRoutineDraft((current) => ({ ...current, category: event.target.value }))}>
										{categoryOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</label>
								<label>
									<span>When <em>Required</em></span>
									<select value={routineDraft.timeGroup} onChange={(event) => setRoutineDraft((current) => ({ ...current, timeGroup: event.target.value as TimeGroup }))}>
										{timeGroupOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</label>
							</div>
							<div className="routine-step-builder">
								<strong>Steps</strong>
								{routineDraft.steps.map((step, index) => (
									<div className="routine-step-draft" key={step.id}>
										<label>
											<span>Step name <em>{step.linkedHabitId ? "Optional" : "Required"}</em></span>
											<input value={step.name} onChange={(event) => setRoutineStep(index, { name: event.target.value })} required={!step.linkedHabitId} />
										</label>
										<label>
											<span>Connect to an existing habit <em>Optional</em></span>
											<select value={step.linkedHabitId} onChange={(event) => setRoutineStep(index, { linkedHabitId: event.target.value })}>
												<option value="">No connected habit</option>
												{activeHabits.map((habit) => (
													<option key={habit.id} value={habit.id}>
														{habit.name}
													</option>
												))}
											</select>
										</label>
									</div>
								))}
								<button type="button" onClick={() => setRoutineDraft((current) => ({ ...current, steps: [...current.steps, { id: crypto.randomUUID(), name: "", linkedHabitId: "" }] }))}>
									<Plus aria-hidden="true" size={16} />
									Add step
								</button>
							</div>
							<button type="submit" disabled={mutation.isPending}>
								<Plus aria-hidden="true" size={16} />
								Add routine
							</button>
						</form>

						<section className="tool-panel">
							<h4>Manage Routines</h4>
							<div className="stack-list">
								{activeGroups.map((group, groupIndex) => (
									<div className="manage-item" key={group.id}>
										<div className="manage-row">
											<span>
												<strong>{group.name}</strong>
												<small>{categoryLabel(group.category ?? "") || "Routine"} • {timeGroupLabel(group.time_group)}</small>
											</span>
											<div>
												<button type="button" aria-label={`Edit ${group.name}`} onClick={() => setEditDraft({ kind: "group", id: group.id, name: group.name, category: group.category ?? "", timeGroup: group.time_group })}>
													<Pencil aria-hidden="true" size={16} />
												</button>
												<button type="button" aria-label={`Move ${group.name} up`} onClick={() => moveList("routine_groups", activeGroups, groupIndex, groupIndex - 1)}>
													<ArrowUp aria-hidden="true" size={16} />
												</button>
												<button type="button" aria-label={`Move ${group.name} down`} onClick={() => moveList("routine_groups", activeGroups, groupIndex, groupIndex + 1)}>
													<ArrowDown aria-hidden="true" size={16} />
												</button>
												<button type="button" aria-label={`Archive ${group.name}`} onClick={() => mutation.mutateAsync(() => archiveRecord("routine_groups", group.id))}>
													<Archive aria-hidden="true" size={16} />
												</button>
											</div>
										</div>
										<div className="nested-list">
											{group.steps.map((step, stepIndex) => (
												<div className="manage-row" key={step.id}>
													<span>
														<strong>{step.name}</strong>
														<small>{step.linked_habit_id ? "Connected to a habit" : "Routine-only step"}</small>
													</span>
													<div>
														<button type="button" aria-label={`Edit ${step.name}`} onClick={() => setEditDraft({ kind: "step", id: step.id, name: step.name, linkedHabitId: step.linked_habit_id ?? "" })}>
															<Pencil aria-hidden="true" size={16} />
														</button>
														<button type="button" aria-label={`Move ${step.name} up`} onClick={() => moveList("routine_steps", group.steps, stepIndex, stepIndex - 1)}>
															<ArrowUp aria-hidden="true" size={16} />
														</button>
														<button type="button" aria-label={`Move ${step.name} down`} onClick={() => moveList("routine_steps", group.steps, stepIndex, stepIndex + 1)}>
															<ArrowDown aria-hidden="true" size={16} />
														</button>
														<button type="button" aria-label={`Archive ${step.name}`} onClick={() => mutation.mutateAsync(() => archiveRecord("routine_steps", step.id))}>
															<Archive aria-hidden="true" size={16} />
														</button>
													</div>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
							<ArchivedPanel
								title={`Archived routines (${archivedGroups.length + archivedSteps.length})`}
								emptyText="No archived routines or steps."
								items={[
									...archivedGroups.map((group) => ({ id: group.id, name: group.name, helper: "Routine", table: "routine_groups" as const })),
									...archivedSteps.map((step) => ({ id: step.id, name: step.name, helper: `Step in ${step.groupName}`, table: "routine_steps" as const }))
								]}
								onRestore={(id, table) => mutation.mutateAsync(() => restoreRecord(table ?? "routine_groups", id))}
							/>
						</section>
					</div>
				</section>
			</div>

			{editDraft ? (
				<div className="dialog-backdrop" role="presentation" onMouseDown={() => setEditDraft(null)}>
					<div className="edit-dialog" role="dialog" aria-modal="true" aria-label="Edit item" ref={dialogRef} onKeyDown={closeDialog} onMouseDown={(event) => event.stopPropagation()}>
						<form className="form-grid" onSubmit={saveEdit}>
							<div className="dialog-heading">
								<h3>Edit {editDraft.kind === "habit" ? "Habit" : editDraft.kind === "group" ? "Routine" : "Step"}</h3>
								<button type="button" aria-label="Close edit dialog" onClick={() => setEditDraft(null)}>
									<X aria-hidden="true" size={16} />
								</button>
							</div>
							<EditFields editDraft={editDraft} setEditDraft={setEditDraft} activeHabits={activeHabits} />
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
					</div>
				</div>
			) : null}
		</section>
	);
}

function ScheduleFields({
	draft,
	setDraft
}: {
	draft: HabitDraft;
	setDraft: React.Dispatch<React.SetStateAction<HabitDraft>>;
}) {
	if (draft.scheduleType === "weekdays") {
		return (
			<div className="weekday-grid" aria-label="Choose days">
				{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, index) => (
					<label key={label}>
						<input
							type="checkbox"
							checked={draft.weekdays.includes(index)}
							onChange={(event) =>
								setDraft((current) => ({
									...current,
									weekdays: event.target.checked
										? [...current.weekdays, index].sort()
										: current.weekdays.filter((day) => day !== index)
								}))
							}
						/>
						<span>{label}</span>
					</label>
				))}
			</div>
		);
	}

	if (draft.scheduleType === "times_per_week") {
		return (
			<label className="narrow-field">
				<span>Times per week <em>Required</em></span>
				<input type="number" min="1" max="7" value={draft.timesPerWeek} onChange={(event) => setDraft((current) => ({ ...current, timesPerWeek: event.target.value }))} />
			</label>
		);
	}

	if (draft.scheduleType === "times_per_month") {
		return (
			<label className="narrow-field">
				<span>Times per month <em>Required</em></span>
				<input type="number" min="1" max="31" value={draft.timesPerMonth} onChange={(event) => setDraft((current) => ({ ...current, timesPerMonth: event.target.value }))} />
			</label>
		);
	}

	if (draft.scheduleType === "every_x_days") {
		return (
			<div className="compact-fields">
				<label>
					<span>Every <em>Required</em></span>
					<input type="number" min="1" value={draft.intervalDays} onChange={(event) => setDraft((current) => ({ ...current, intervalDays: event.target.value }))} />
				</label>
				<label>
					<span>Starting <em>Required</em></span>
					<input type="date" value={draft.startDate} onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))} />
				</label>
			</div>
		);
	}

	return null;
}

function EditFields({
	editDraft,
	setEditDraft,
	activeHabits
}: {
	editDraft: EditDraft;
	setEditDraft: React.Dispatch<React.SetStateAction<EditDraft | null>>;
	activeHabits: HabitWithSchedule[];
}) {
	if (editDraft.kind === "habit") {
		return (
			<>
				<label>
					<span>Name <em>Required</em></span>
					<input value={editDraft.draft.name} onChange={(event) => setEditDraft({ ...editDraft, draft: { ...editDraft.draft, name: event.target.value } })} required />
				</label>
				<div className="compact-fields">
					<label>
						<span>Category <em>Required</em></span>
						<select value={editDraft.draft.category} onChange={(event) => setEditDraft({ ...editDraft, draft: { ...editDraft.draft, category: event.target.value } })}>
							{categoryOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>
					<label>
						<span>When <em>Required</em></span>
						<select value={editDraft.draft.timeGroup} onChange={(event) => setEditDraft({ ...editDraft, draft: { ...editDraft.draft, timeGroup: event.target.value as TimeGroup } })}>
							{timeGroupOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>
				</div>
				{shouldShowGoalFields(editDraft.draft.trackingType) ? (
					<div className="compact-fields">
						<label>
							<span>{goalLabelForTrackingType(editDraft.draft.trackingType)} <em>Optional</em></span>
							<input type="number" min="0" value={editDraft.draft.goal} onChange={(event) => setEditDraft({ ...editDraft, draft: { ...editDraft.draft, goal: event.target.value } })} />
						</label>
						<label>
							<span>Unit <em>Optional</em></span>
							<input value={editDraft.draft.unit} onChange={(event) => setEditDraft({ ...editDraft, draft: { ...editDraft.draft, unit: event.target.value } })} />
						</label>
					</div>
				) : null}
			</>
		);
	}

	if (editDraft.kind === "group") {
		return (
			<>
				<label>
					<span>Name <em>Required</em></span>
					<input value={editDraft.name} onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} required />
				</label>
				<div className="compact-fields">
					<label>
						<span>Category <em>Optional</em></span>
						<select value={editDraft.category} onChange={(event) => setEditDraft({ ...editDraft, category: event.target.value })}>
							{categoryOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>
					<label>
						<span>When <em>Required</em></span>
						<select value={editDraft.timeGroup} onChange={(event) => setEditDraft({ ...editDraft, timeGroup: event.target.value as TimeGroup })}>
							{timeGroupOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>
				</div>
			</>
		);
	}

	return (
		<>
			<label>
				<span>Step name <em>Optional when connected</em></span>
				<input value={editDraft.name} onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} />
			</label>
			<label>
				<span>Connect to an existing habit <em>Optional</em></span>
				<select
					value={editDraft.linkedHabitId}
					onChange={(event) => {
						const selectedHabit = activeHabits.find((habit) => habit.id === event.target.value);
						setEditDraft({
							...editDraft,
							linkedHabitId: event.target.value,
							name: editDraft.name || selectedHabit?.name || ""
						});
					}}
				>
					<option value="">No connected habit</option>
					{activeHabits.map((habit) => (
						<option key={habit.id} value={habit.id}>
							{habit.name}
						</option>
					))}
				</select>
			</label>
		</>
	);
}

function ArchivedPanel<T extends { id: string; name: string; helper?: string; table?: "routine_groups" | "routine_steps" }>({
	title,
	emptyText,
	items,
	onRestore
}: {
	title: string;
	emptyText: string;
	items: T[];
	onRestore: (id: string, table?: T["table"]) => Promise<void>;
}) {
	return (
		<details className="archive-panel">
			<summary>{title}</summary>
			{items.length ? (
				<div className="stack-list">
					{items.map((item) => (
						<div className="manage-row" key={`${item.table ?? "habits"}-${item.id}`}>
							<span>
								<strong>{item.name}</strong>
								{item.helper ? <small>{item.helper}</small> : null}
							</span>
							<button type="button" aria-label={`Restore ${item.name}`} onClick={() => onRestore(item.id, item.table)}>
								<RotateCcw aria-hidden="true" size={16} />
							</button>
						</div>
					))}
				</div>
			) : (
				<p className="empty-note">{emptyText}</p>
			)}
		</details>
	);
}

import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type {
	Habit,
	HabitEntry,
	HabitSchedule,
	HabitWithSchedule,
	Profile,
	RoutineGroup,
	RoutineGroupWithSteps,
	RoutineStep,
	RoutineStepEntry,
	ScheduleType,
	TimeGroup,
	TrackingType
} from "./types";

function requireSupabase() {
	if (!supabase) {
		throw new Error("Supabase is not configured.");
	}

	return supabase;
}

function throwIfError(error: { message: string } | null) {
	if (error) throw new Error(error.message);
}

export async function getOrCreateProfile(user: User) {
	const client = requireSupabase();

	const existing = await client
		.from("profiles")
		.select("id, auth_user_id, display_name, timezone, unit_system")
		.eq("auth_user_id", user.id)
		.maybeSingle<Profile>();

	if (existing.error) throw new Error(existing.error.message);
	if (existing.data) return existing.data;

	const created = await client
		.from("profiles")
		.insert({
			auth_user_id: user.id,
			display_name: user.email?.split("@")[0] ?? "Sola"
		})
		.select("id, auth_user_id, display_name, timezone, unit_system")
		.single<Profile>();

	if (created.error) throw new Error(created.error.message);
	return created.data;
}

export async function loadHabitDashboard(profileId: string, dateKey: string) {
	const client = requireSupabase();

	const [habitsResult, schedulesResult, entriesResult, groupsResult, stepsResult, stepEntriesResult] =
		await Promise.all([
			client
				.from("habits")
				.select("*")
				.eq("user_id", profileId)
				.order("display_order", { ascending: true })
				.returns<Habit[]>(),
			client
				.from("habit_schedules")
				.select("*")
				.eq("user_id", profileId)
				.is("archived_at", null)
				.returns<HabitSchedule[]>(),
			client
				.from("habit_entries")
				.select("*")
				.eq("user_id", profileId)
				.eq("entry_date", dateKey)
				.is("deleted_at", null)
				.returns<HabitEntry[]>(),
			client
				.from("routine_groups")
				.select("*")
				.eq("user_id", profileId)
				.order("display_order", { ascending: true })
				.returns<RoutineGroup[]>(),
			client
				.from("routine_steps")
				.select("*")
				.eq("user_id", profileId)
				.order("display_order", { ascending: true })
				.returns<RoutineStep[]>(),
			client
				.from("routine_step_entries")
				.select("*")
				.eq("user_id", profileId)
				.eq("entry_date", dateKey)
				.is("deleted_at", null)
				.returns<RoutineStepEntry[]>()
		]);

	for (const result of [
		habitsResult,
		schedulesResult,
		entriesResult,
		groupsResult,
		stepsResult,
		stepEntriesResult
	]) {
		throwIfError(result.error);
	}

	const habitsData = habitsResult.data ?? [];
	const schedulesData = schedulesResult.data ?? [];
	const entriesData = entriesResult.data ?? [];
	const groupsData = groupsResult.data ?? [];
	const stepsData = stepsResult.data ?? [];
	const stepEntriesData = stepEntriesResult.data ?? [];

	const schedulesByHabit = new Map(schedulesData.map((schedule) => [schedule.habit_id, schedule]));
	const entriesByHabit = new Map(entriesData.map((entry) => [entry.habit_id, entry]));
	const stepEntriesByStep = new Map(
		stepEntriesData.map((entry) => [entry.routine_step_id, entry])
	);

	const habits: HabitWithSchedule[] = habitsData.map((habit) => ({
		...habit,
		schedule:
			habit.archived_at || !habit.active ? null : schedulesByHabit.get(habit.id) ?? null,
		entry: entriesByHabit.get(habit.id) ?? null
	}));

	const habitEntriesByHabit = new Map(habits.map((habit) => [habit.id, habit.entry]));
	const stepsByGroup = new Map<string, RoutineGroupWithSteps["steps"]>();

	for (const step of stepsData) {
		const list = stepsByGroup.get(step.routine_group_id) ?? [];
		list.push({
			...step,
			entry: stepEntriesByStep.get(step.id) ?? null,
			habitEntry: step.linked_habit_id ? habitEntriesByHabit.get(step.linked_habit_id) ?? null : null
		});
		stepsByGroup.set(step.routine_group_id, list);
	}

	const routineGroups: RoutineGroupWithSteps[] = groupsData.map((group) => ({
		...group,
		steps: stepsByGroup.get(group.id) ?? []
	}));

	return { habits, routineGroups };
}

export type CreateHabitInput = {
	profileId: string;
	name: string;
	category: string;
	trackingType: TrackingType;
	targetValue: number | null;
	targetUnit: string | null;
	timeGroup: TimeGroup;
	startDate: string;
	includeInGlowScore: boolean;
	displayOrder: number;
	schedule: {
		type: ScheduleType;
		weekdays: number[] | null;
		timesPerWeek: number | null;
		timesPerMonth: number | null;
		intervalDays: number | null;
		anchorDate: string | null;
	};
};

export async function createHabit(input: CreateHabitInput) {
	const client = requireSupabase();

	const habitResult = await client
		.from("habits")
		.insert({
			user_id: input.profileId,
			name: input.name,
			category: input.category,
			tracking_type: input.trackingType,
			target_value: input.targetValue,
			target_unit: input.targetUnit,
			time_group: input.timeGroup,
			start_date: input.startDate,
			include_in_glow_score: input.includeInGlowScore,
			display_order: input.displayOrder
		})
		.select("id")
		.single<{ id: string }>();

	if (habitResult.error) throw new Error(habitResult.error.message);

	const scheduleResult = await client.from("habit_schedules").insert({
		user_id: input.profileId,
		habit_id: habitResult.data.id,
		schedule_type: input.schedule.type,
		weekdays: input.schedule.weekdays,
		times_per_week: input.schedule.timesPerWeek,
		times_per_month: input.schedule.timesPerMonth,
		interval_days: input.schedule.intervalDays,
		anchor_date: input.schedule.anchorDate,
		start_date: input.startDate
	});

	if (scheduleResult.error) throw new Error(scheduleResult.error.message);
}

export async function updateHabitEntry(input: {
	profileId: string;
	habitId: string;
	dateKey: string;
	completed: boolean;
	value: number | null;
	trackingType: TrackingType;
	source?: HabitEntry["source"];
}) {
	const client = requireSupabase();

	const payload = {
		user_id: input.profileId,
		habit_id: input.habitId,
		entry_date: input.dateKey,
		completed: input.completed,
		value_numeric: input.trackingType === "numeric" ? input.value : null,
		value_duration_minutes: input.trackingType === "duration" ? input.value : null,
		value_quantity: input.trackingType === "quantity" ? input.value : null,
		source: input.source ?? "manual"
	};

	const existing = await client
		.from("habit_entries")
		.select("id")
		.eq("habit_id", input.habitId)
		.eq("entry_date", input.dateKey)
		.is("deleted_at", null)
		.maybeSingle<{ id: string }>();

	if (existing.error) throw new Error(existing.error.message);

	const result = existing.data
		? await client.from("habit_entries").update(payload).eq("id", existing.data.id)
		: await client.from("habit_entries").insert(payload);

	if (result.error) throw new Error(result.error.message);
}

export async function updateRoutineStepEntry(input: {
	profileId: string;
	stepId: string;
	dateKey: string;
	completed: boolean;
	source?: RoutineStepEntry["source"];
}) {
	const client = requireSupabase();

	const payload = {
		user_id: input.profileId,
		routine_step_id: input.stepId,
		entry_date: input.dateKey,
		completed: input.completed,
		source: input.source ?? "manual"
	};

	const existing = await client
		.from("routine_step_entries")
		.select("id")
		.eq("routine_step_id", input.stepId)
		.eq("entry_date", input.dateKey)
		.is("deleted_at", null)
		.maybeSingle<{ id: string }>();

	if (existing.error) throw new Error(existing.error.message);

	const result = existing.data
		? await client.from("routine_step_entries").update(payload).eq("id", existing.data.id)
		: await client.from("routine_step_entries").insert(payload);

	if (result.error) throw new Error(result.error.message);
}

export async function createRoutineGroup(input: {
	profileId: string;
	name: string;
	category: string | null;
	timeGroup: TimeGroup;
	displayOrder: number;
}) {
	const client = requireSupabase();
	const result = await client.from("routine_groups").insert({
		user_id: input.profileId,
		name: input.name,
		category: input.category,
		time_group: input.timeGroup,
		display_order: input.displayOrder
	});

	if (result.error) throw new Error(result.error.message);
}

export async function createRoutineStep(input: {
	profileId: string;
	routineGroupId: string;
	name: string;
	linkedHabitId: string | null;
	displayOrder: number;
}) {
	const client = requireSupabase();
	const result = await client.from("routine_steps").insert({
		user_id: input.profileId,
		routine_group_id: input.routineGroupId,
		name: input.name,
		linked_habit_id: input.linkedHabitId,
		display_order: input.displayOrder
	});

	if (result.error) throw new Error(result.error.message);
}

export async function createRoutine(input: {
	profileId: string;
	name: string;
	category: string | null;
	timeGroup: TimeGroup;
	displayOrder: number;
	steps: Array<{ name: string; linkedHabitId: string | null }>;
}) {
	const client = requireSupabase();
	const groupResult = await client
		.from("routine_groups")
		.insert({
			user_id: input.profileId,
			name: input.name,
			category: input.category,
			time_group: input.timeGroup,
			display_order: input.displayOrder
		})
		.select("id")
		.single<{ id: string }>();

	if (groupResult.error) throw new Error(groupResult.error.message);

	if (!input.steps.length) return;

	const stepsResult = await client.from("routine_steps").insert(
		input.steps.map((step, index) => ({
			user_id: input.profileId,
			routine_group_id: groupResult.data.id,
			name: step.name,
			linked_habit_id: step.linkedHabitId,
			display_order: index
		}))
	);

	if (stepsResult.error) throw new Error(stepsResult.error.message);
}

export async function updateHabitDetails(input: {
	id: string;
	name: string;
	category: string;
	targetValue: number | null;
	targetUnit: string | null;
	timeGroup: TimeGroup;
	includeInGlowScore: boolean;
}) {
	const client = requireSupabase();
	const result = await client
		.from("habits")
		.update({
			name: input.name,
			category: input.category,
			target_value: input.targetValue,
			target_unit: input.targetUnit,
			time_group: input.timeGroup,
			include_in_glow_score: input.includeInGlowScore
		})
		.eq("id", input.id);

	if (result.error) throw new Error(result.error.message);
}

export async function updateRoutineGroupDetails(input: {
	id: string;
	name: string;
	category: string | null;
	timeGroup: TimeGroup;
}) {
	const client = requireSupabase();
	const result = await client
		.from("routine_groups")
		.update({
			name: input.name,
			category: input.category,
			time_group: input.timeGroup
		})
		.eq("id", input.id);

	if (result.error) throw new Error(result.error.message);
}

export async function updateRoutineStepDetails(input: {
	id: string;
	name: string;
	linkedHabitId: string | null;
}) {
	const client = requireSupabase();
	const result = await client
		.from("routine_steps")
		.update({
			name: input.name,
			linked_habit_id: input.linkedHabitId
		})
		.eq("id", input.id);

	if (result.error) throw new Error(result.error.message);
}

export async function archiveRecord(table: "habits" | "routine_groups" | "routine_steps", id: string) {
	const client = requireSupabase();
	const result = await client
		.from(table)
		.update({ active: false, archived_at: new Date().toISOString() })
		.eq("id", id);

	if (result.error) throw new Error(result.error.message);
}

export async function restoreRecord(table: "habits" | "routine_groups" | "routine_steps", id: string) {
	const client = requireSupabase();
	const result = await client
		.from(table)
		.update({ active: true, archived_at: null })
		.eq("id", id);

	if (result.error) throw new Error(result.error.message);
}

export async function reorderRecord(
	table: "habits" | "routine_groups" | "routine_steps",
	id: string,
	displayOrder: number
) {
	const client = requireSupabase();
	const result = await client.from(table).update({ display_order: displayOrder }).eq("id", id);

	if (result.error) throw new Error(result.error.message);
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
	if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
		return items;
	}

	const next = [...items];
	const [item] = next.splice(fromIndex, 1);
	next.splice(toIndex, 0, item);
	return next;
}

export async function reorderRecords(
	table: "habits" | "routine_groups" | "routine_steps",
	items: Array<{ id: string }>
) {
	const client = requireSupabase();

	await Promise.all(
		items.map(async (item, displayOrder) => {
			const result = await client
				.from(table)
				.update({ display_order: displayOrder })
				.eq("id", item.id);

			if (result.error) throw new Error(result.error.message);
		})
	);
}

import { supabase } from "../../lib/supabase";
import type { V05ChecklistItemKey } from "./checklist";
import type {
	V05ChecklistCompletion,
	V05DailyEntry,
	V05DailyEntryInput,
	V05MotivationData,
	V05TodayData
} from "./types";

function requireSupabase() {
	if (!supabase) {
		throw new Error("Supabase is not configured.");
	}

	return supabase;
}

function friendlyError(error: { message: string } | null) {
	if (!error) return;
	throw new Error(error.message);
}

export async function loadV05TodayData(
	profileId: string,
	dateKey: string
): Promise<V05TodayData> {
	const client = requireSupabase();

	const [dailyEntryResult, checklistResult] = await Promise.all([
		client
			.from("v05_daily_entries")
			.select("*")
			.eq("user_id", profileId)
			.eq("entry_date", dateKey)
			.maybeSingle<V05DailyEntry>(),
		client
			.from("v05_checklist_completions")
			.select("*")
			.eq("user_id", profileId)
			.eq("entry_date", dateKey)
			.returns<V05ChecklistCompletion[]>()
	]);

	friendlyError(dailyEntryResult.error);
	friendlyError(checklistResult.error);

	return {
		dailyEntry: dailyEntryResult.data ?? null,
		checklistCompletions: checklistResult.data ?? []
	};
}

export async function loadV05MotivationData(
	profileId: string,
	rangeStart: string,
	rangeEnd: string
): Promise<V05MotivationData> {
	const client = requireSupabase();

	const earliestEntryResult = await client
		.from("v05_daily_entries")
		.select("entry_date")
		.eq("user_id", profileId)
		.order("entry_date", { ascending: true })
		.limit(1)
		.maybeSingle<{ entry_date: string }>();

	friendlyError(earliestEntryResult.error);

	const trackingStartDate = earliestEntryResult.data?.entry_date ?? null;
	if (!trackingStartDate) {
		return {
			trackingStartDate: null,
			dailyEntries: [],
			checklistCompletions: []
		};
	}

	const effectiveRangeStart = rangeStart < trackingStartDate ? rangeStart : trackingStartDate;

	const [dailyEntriesResult, checklistResult] = await Promise.all([
		client
			.from("v05_daily_entries")
			.select("*")
			.eq("user_id", profileId)
			.gte("entry_date", effectiveRangeStart)
			.lte("entry_date", rangeEnd)
			.order("entry_date", { ascending: true })
			.returns<V05DailyEntry[]>(),
		client
			.from("v05_checklist_completions")
			.select("*")
			.eq("user_id", profileId)
			.gte("entry_date", effectiveRangeStart)
			.lte("entry_date", rangeEnd)
			.returns<V05ChecklistCompletion[]>()
	]);

	friendlyError(dailyEntriesResult.error);
	friendlyError(checklistResult.error);

	return {
		trackingStartDate,
		dailyEntries: dailyEntriesResult.data ?? [],
		checklistCompletions: checklistResult.data ?? []
	};
}

export async function ensureV05DailyEntry(profileId: string, dateKey: string) {
	const client = requireSupabase();
	const result = await client
		.from("v05_daily_entries")
		.upsert(
			{
				user_id: profileId,
				entry_date: dateKey
			},
			{ onConflict: "user_id,entry_date" }
		)
		.select("*")
		.single<V05DailyEntry>();

	friendlyError(result.error);
	return result.data;
}

export async function saveV05DailyEntry(
	profileId: string,
	dateKey: string,
	input: V05DailyEntryInput
) {
	const client = requireSupabase();
	const payload = {
		user_id: profileId,
		entry_date: dateKey,
		...input,
		workout_activity_type: input.worked_out ? input.workout_activity_type : null,
		workout_duration_minutes: input.worked_out ? input.workout_duration_minutes : null
	};

	const result = await client
		.from("v05_daily_entries")
		.upsert(payload, { onConflict: "user_id,entry_date" })
		.select("*")
		.single<V05DailyEntry>();

	friendlyError(result.error);
	return result.data;
}

export async function setV05ChecklistCompletion(
	profileId: string,
	dateKey: string,
	itemKey: V05ChecklistItemKey,
	completed: boolean
) {
	const client = requireSupabase();
	await ensureV05DailyEntry(profileId, dateKey);

	const completionResult = await client
		.from("v05_checklist_completions")
		.upsert(
			{
				user_id: profileId,
				entry_date: dateKey,
				item_key: itemKey,
				completed
			},
			{ onConflict: "user_id,entry_date,item_key" }
		)
		.select("*")
		.single<V05ChecklistCompletion>();

	friendlyError(completionResult.error);

	if (itemKey === "workout") {
		const workoutPayload = completed
			? { worked_out: true }
			: {
					worked_out: false,
					workout_activity_type: null,
					workout_duration_minutes: null
				};

		const workoutResult = await client
			.from("v05_daily_entries")
			.update(workoutPayload)
			.eq("user_id", profileId)
			.eq("entry_date", dateKey);

		friendlyError(workoutResult.error);
	}

	return completionResult.data;
}

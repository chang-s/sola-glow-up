import { supabase } from "../../lib/supabase";
import type { V05ChecklistItemKey } from "./checklist";
import type {
	V05ChecklistCompletion,
	V05DailyEntry,
	V05DailyEntryInput,
	V05FoodPhoto,
	V05FoodPhotoInput,
	V05FoodPhotoWithUrl,
	V05HistoryData,
	V05MotivationData,
	V05TodayData
} from "./types";

const FOOD_PHOTO_BUCKET = "v05-food-photos";
const FOOD_PHOTO_SIGNED_URL_SECONDS = 60 * 30;
const SUPPORTED_FOOD_IMAGE_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/heic",
	"image/heif"
]);

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

function safeFoodPhotoPath(profileId: string, dateKey: string, file: File) {
	const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
	const uniqueName =
		typeof crypto !== "undefined" && "randomUUID" in crypto
			? crypto.randomUUID()
			: `${Date.now()}-${Math.random().toString(16).slice(2)}`;

	return `${profileId}/${dateKey}/${uniqueName}.${extension}`;
}

function validateFoodPhotoFile(file: File) {
	if (!SUPPORTED_FOOD_IMAGE_TYPES.has(file.type)) {
		throw new Error("Unsupported food photo type.");
	}
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

export async function loadV05FoodPhotos(
	profileId: string,
	dateKey?: string
): Promise<V05FoodPhotoWithUrl[]> {
	const client = requireSupabase();
	let query = client
		.from("v05_food_photos")
		.select("*")
		.eq("user_id", profileId)
		.is("deleted_at", null)
		.order("created_at", { ascending: false });

	if (dateKey) {
		query = query.eq("entry_date", dateKey);
	}

	const result = await query.returns<V05FoodPhoto[]>();
	friendlyError(result.error);

	const photos = result.data ?? [];
	const signed = await Promise.all(
		photos.map(async (photo): Promise<V05FoodPhotoWithUrl> => {
			const signedResult = await client.storage
				.from(FOOD_PHOTO_BUCKET)
				.createSignedUrl(photo.storage_path, FOOD_PHOTO_SIGNED_URL_SECONDS);

			return {
				...photo,
				signedUrl: signedResult.error ? null : signedResult.data.signedUrl
			};
		})
	);

	return signed;
}

export async function loadV05HistoryData(profileId: string): Promise<V05HistoryData> {
	const client = requireSupabase();

	const dailyEntriesResult = await client
		.from("v05_daily_entries")
		.select("*")
		.eq("user_id", profileId)
		.order("entry_date", { ascending: false })
		.limit(90)
		.returns<V05DailyEntry[]>();

	friendlyError(dailyEntriesResult.error);

	const dailyEntries = dailyEntriesResult.data ?? [];
	const oldestDate = dailyEntries.at(-1)?.entry_date;
	const newestDate = dailyEntries[0]?.entry_date;

	let checklistCompletions: V05ChecklistCompletion[] = [];
	if (oldestDate && newestDate) {
		const checklistResult = await client
			.from("v05_checklist_completions")
			.select("*")
			.eq("user_id", profileId)
			.gte("entry_date", oldestDate)
			.lte("entry_date", newestDate)
			.returns<V05ChecklistCompletion[]>();

		friendlyError(checklistResult.error);
		checklistCompletions = checklistResult.data ?? [];
	}

	return {
		dailyEntries,
		checklistCompletions,
		foodPhotos: await loadV05FoodPhotos(profileId)
	};
}

export async function uploadV05FoodPhoto(
	profileId: string,
	dateKey: string,
	input: V05FoodPhotoInput
) {
	const client = requireSupabase();
	validateFoodPhotoFile(input.file);
	await ensureV05DailyEntry(profileId, dateKey);

	const storagePath = safeFoodPhotoPath(profileId, dateKey, input.file);
	const uploadResult = await client.storage
		.from(FOOD_PHOTO_BUCKET)
		.upload(storagePath, input.file, {
			contentType: input.file.type,
			upsert: false
		});

	if (uploadResult.error) throw new Error(uploadResult.error.message);

	const metadataResult = await client
		.from("v05_food_photos")
		.insert({
			user_id: profileId,
			entry_date: dateKey,
			storage_path: storagePath,
			meal_type: input.meal_type,
			note: input.note
		})
		.select("*")
		.single<V05FoodPhoto>();

	if (metadataResult.error) {
		await client.storage.from(FOOD_PHOTO_BUCKET).remove([storagePath]);
		throw new Error(metadataResult.error.message);
	}

	return metadataResult.data;
}

export async function deleteV05FoodPhoto(profileId: string, photo: V05FoodPhoto) {
	const client = requireSupabase();
	const removeResult = await client.storage.from(FOOD_PHOTO_BUCKET).remove([photo.storage_path]);
	friendlyError(removeResult.error);

	const metadataResult = await client
		.from("v05_food_photos")
		.update({ deleted_at: new Date().toISOString() })
		.eq("user_id", profileId)
		.eq("id", photo.id);

	friendlyError(metadataResult.error);
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

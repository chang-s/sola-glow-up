import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	deleteV05FoodPhoto,
	loadV05FoodPhotos,
	loadV05MotivationData,
	loadV05ProgressData,
	saveV05DailyEntry,
	setV05ChecklistCompletion,
	uploadV05FoodPhoto
} from "./api";

const supabaseMock = vi.hoisted(() => ({
	from: vi.fn(),
	storageFrom: vi.fn()
}));

vi.mock("../../lib/supabase", () => ({
	supabase: {
		from: supabaseMock.from,
		storage: {
			from: supabaseMock.storageFrom
		}
	}
}));

function upsertSingleChain(data: unknown = {}) {
	const single = vi.fn(async () => ({ data, error: null }));
	const select = vi.fn(() => ({ single }));
	const upsert = vi.fn(() => ({ select }));

	return { upsert, select, single };
}

function motivationRangeChain(data: unknown[]) {
	const chain = {
		select: vi.fn(() => chain),
		eq: vi.fn(() => chain),
		is: vi.fn(() => chain),
		not: vi.fn(() => chain),
		gte: vi.fn(() => chain),
		lte: vi.fn(() => chain),
		order: vi.fn(() => chain),
		returns: vi.fn(async () => ({ data, error: null }))
	};

	return chain;
}

function insertSingleChain(data: unknown = {}) {
	const single = vi.fn(async () => ({ data, error: null }));
	const select = vi.fn(() => ({ single }));
	const insert = vi.fn(() => ({ select }));

	return { insert, select, single };
}

function updateChain() {
	const chain = {
		update: vi.fn(() => chain),
		eq: vi.fn(() => chain),
		then: (resolve: (value: { error: null }) => void) => resolve({ error: null })
	};

	return chain;
}

describe("V0.5 Supabase API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("saves daily fields with one upsert per user/date", async () => {
		const chain = upsertSingleChain({ id: "entry-1" });
		supabaseMock.from.mockReturnValue(chain);

		await saveV05DailyEntry("profile-1", "2026-08-12", {
			weight: 181.6,
			steps: 7500,
			sleep_duration_minutes: 435,
			bedtime: "23:30",
			wake_time: "06:45",
			previous_day_calories: 1900,
			worked_out: false,
			workout_activity_type: "Walk",
			workout_duration_minutes: 35,
			notes: null
		});

		expect(supabaseMock.from).toHaveBeenCalledWith("v05_daily_entries");
		expect(chain.upsert).toHaveBeenCalledWith(
			{
				user_id: "profile-1",
				entry_date: "2026-08-12",
				weight: 181.6,
				steps: 7500,
				sleep_duration_minutes: 435,
				bedtime: "23:30",
				wake_time: "06:45",
				previous_day_calories: 1900,
				worked_out: false,
				workout_activity_type: null,
				workout_duration_minutes: null,
				notes: null
			},
			{ onConflict: "user_id,entry_date" }
		);
	});

	it("ensures the canonical daily entry before checklist completion upsert", async () => {
		const dailyChain = upsertSingleChain({ id: "entry-1" });
		const completionChain = upsertSingleChain({ id: "completion-1" });
		supabaseMock.from
			.mockReturnValueOnce(dailyChain)
			.mockReturnValueOnce(completionChain);

		await setV05ChecklistCompletion("profile-1", "2026-08-12", "vitamins", true);

		expect(supabaseMock.from).toHaveBeenNthCalledWith(1, "v05_daily_entries");
		expect(dailyChain.upsert).toHaveBeenCalledWith(
			{
				user_id: "profile-1",
				entry_date: "2026-08-12"
			},
			{ onConflict: "user_id,entry_date" }
		);
		expect(supabaseMock.from).toHaveBeenNthCalledWith(2, "v05_checklist_completions");
		expect(completionChain.upsert).toHaveBeenCalledWith(
			{
				user_id: "profile-1",
				entry_date: "2026-08-12",
				item_key: "vitamins",
				completed: true
			},
			{ onConflict: "user_id,entry_date,item_key" }
		);
	});

	it("loads motivation data with range queries instead of per-day requests", async () => {
		const earliestChain = {
			select: vi.fn(() => earliestChain),
			eq: vi.fn(() => earliestChain),
			order: vi.fn(() => earliestChain),
			limit: vi.fn(() => earliestChain),
			maybeSingle: vi.fn(async () => ({
				data: { entry_date: "2026-08-10" },
				error: null
			}))
		};
		const dailyRangeChain = motivationRangeChain([{ entry_date: "2026-08-12" }]);
		const checklistRangeChain = motivationRangeChain([{ entry_date: "2026-08-12" }]);
		supabaseMock.from
			.mockReturnValueOnce(earliestChain)
			.mockReturnValueOnce(dailyRangeChain)
			.mockReturnValueOnce(checklistRangeChain);

		const data = await loadV05MotivationData("profile-1", "2026-08-01", "2026-08-31");

		expect(data.trackingStartDate).toBe("2026-08-10");
		expect(supabaseMock.from).toHaveBeenCalledTimes(3);
		expect(dailyRangeChain.gte).toHaveBeenCalledWith("entry_date", "2026-08-01");
		expect(dailyRangeChain.lte).toHaveBeenCalledWith("entry_date", "2026-08-31");
		expect(checklistRangeChain.gte).toHaveBeenCalledWith("entry_date", "2026-08-01");
		expect(checklistRangeChain.lte).toHaveBeenCalledWith("entry_date", "2026-08-31");
	});

	it("loads only recorded weights in chronological order for Progress", async () => {
		const chain = motivationRangeChain([
			{ entry_date: "2026-08-12", weight: 181.6 },
			{ entry_date: "2026-08-15", weight: 179.8 }
		]);
		supabaseMock.from.mockReturnValue(chain);

		const data = await loadV05ProgressData("profile-1");

		expect(supabaseMock.from).toHaveBeenCalledWith("v05_daily_entries");
		expect(chain.select).toHaveBeenCalledWith("entry_date, weight");
		expect(chain.eq).toHaveBeenCalledWith("user_id", "profile-1");
		expect(chain.not).toHaveBeenCalledWith("weight", "is", null);
		expect(chain.order).toHaveBeenCalledWith("entry_date", { ascending: true });
		expect(data.weightEntries).toEqual([
			{ entry_date: "2026-08-12", weight: 181.6 },
			{ entry_date: "2026-08-15", weight: 179.8 }
		]);
	});

	it("loads active food photos newest-first with signed private URLs", async () => {
		const foodChain = motivationRangeChain([
			{
				id: "photo-1",
				user_id: "profile-1",
				entry_date: "2026-08-12",
				storage_path: "profile-1/2026-08-12/photo.jpg",
				meal_type: "Lunch",
				note: null,
				deleted_at: null
			}
		]);
		const storage = {
			createSignedUrl: vi.fn(async () => ({
				data: { signedUrl: "https://signed.example/photo" },
				error: null
			}))
		};
		supabaseMock.from.mockReturnValue(foodChain);
		supabaseMock.storageFrom.mockReturnValue(storage);

		const photos = await loadV05FoodPhotos("profile-1");

		expect(foodChain.eq).toHaveBeenCalledWith("user_id", "profile-1");
		expect(foodChain.is).toHaveBeenCalledWith("deleted_at", null);
		expect(foodChain.order).toHaveBeenCalledWith("created_at", { ascending: false });
		expect(storage.createSignedUrl).toHaveBeenCalledWith(
			"profile-1/2026-08-12/photo.jpg",
			1800
		);
		expect(photos[0].signedUrl).toBe("https://signed.example/photo");
	});

	it("ensures the canonical daily entry and stores metadata after food upload", async () => {
		const dailyChain = upsertSingleChain({ id: "entry-1" });
		const metadataChain = insertSingleChain({ id: "photo-1" });
		const storage = {
			upload: vi.fn(async () => ({ data: {}, error: null })),
			remove: vi.fn(async () => ({ data: {}, error: null }))
		};
		const file = new File(["tiny"], "lunch.png", { type: "image/png" });
		supabaseMock.from.mockReturnValueOnce(dailyChain).mockReturnValueOnce(metadataChain);
		supabaseMock.storageFrom.mockReturnValue(storage);

		await uploadV05FoodPhoto("profile-1", "2026-08-12", {
			file,
			meal_type: "Lunch",
			note: "Salmon + veggies"
		});
		const uploadCalls = storage.upload.mock.calls as unknown as Array<[string]>;

		expect(dailyChain.upsert).toHaveBeenCalledWith(
			{ user_id: "profile-1", entry_date: "2026-08-12" },
			{ onConflict: "user_id,entry_date" }
		);
		expect(uploadCalls[0][0]).toMatch(/^profile-1\/2026-08-12\/.+\.png$/);
		expect(metadataChain.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				user_id: "profile-1",
				entry_date: "2026-08-12",
				meal_type: "Lunch",
				note: "Salmon + veggies"
			})
		);
		expect(storage.remove).not.toHaveBeenCalled();
	});

	it("cleans up an uploaded Storage object if metadata insertion fails", async () => {
		const dailyChain = upsertSingleChain({ id: "entry-1" });
		const single = vi.fn(async () => ({
			data: null,
			error: { message: "metadata failed" }
		}));
		const metadataChain = {
			insert: vi.fn(() => ({ select: vi.fn(() => ({ single })) }))
		};
		const storage = {
			upload: vi.fn(async () => ({ data: {}, error: null })),
			remove: vi.fn(async () => ({ data: {}, error: null }))
		};
		const file = new File(["tiny"], "snack.jpg", { type: "image/jpeg" });
		supabaseMock.from.mockReturnValueOnce(dailyChain).mockReturnValueOnce(metadataChain);
		supabaseMock.storageFrom.mockReturnValue(storage);

		await expect(
			uploadV05FoodPhoto("profile-1", "2026-08-12", {
				file,
				meal_type: "Snack",
				note: null
			})
		).rejects.toThrow("metadata failed");
		const uploadCalls = storage.upload.mock.calls as unknown as Array<[string]>;

		expect(storage.remove).toHaveBeenCalledWith([uploadCalls[0][0]]);
	});

	it("deletes the Storage object before soft-deleting food-photo metadata", async () => {
		const storage = {
			remove: vi.fn(async () => ({ data: {}, error: null }))
		};
		const chain = updateChain();
		supabaseMock.storageFrom.mockReturnValue(storage);
		supabaseMock.from.mockReturnValue(chain);

		await deleteV05FoodPhoto("profile-1", {
			id: "photo-1",
			user_id: "profile-1",
			entry_date: "2026-08-12",
			storage_path: "profile-1/2026-08-12/photo.jpg",
			meal_type: null,
			note: null,
			deleted_at: null
		});

		expect(storage.remove).toHaveBeenCalledWith(["profile-1/2026-08-12/photo.jpg"]);
		expect(chain.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
		expect(chain.eq).toHaveBeenCalledWith("user_id", "profile-1");
		expect(chain.eq).toHaveBeenCalledWith("id", "photo-1");
	});
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadV05MotivationData, saveV05DailyEntry, setV05ChecklistCompletion } from "./api";

const supabaseMock = vi.hoisted(() => ({
	from: vi.fn()
}));

vi.mock("../../lib/supabase", () => ({
	supabase: {
		from: supabaseMock.from
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
		gte: vi.fn(() => chain),
		lte: vi.fn(() => chain),
		order: vi.fn(() => chain),
		returns: vi.fn(async () => ({ data, error: null }))
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
});

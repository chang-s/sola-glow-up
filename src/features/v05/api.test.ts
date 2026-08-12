import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveV05DailyEntry, setV05ChecklistCompletion } from "./api";

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
});

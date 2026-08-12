import { describe, expect, it } from "vitest";
import { V05_CHECKLIST_ITEMS } from "./checklist";
import {
	calculateChecklistDueDayStreak,
	calculateDailyStreak,
	calculateStreaks,
	createCompletionLookup,
	formatStreakValue,
	getCompletionState
} from "./motivation";
import type { V05ChecklistCompletion, V05DailyEntry } from "./types";

function entry(dateKey: string, overrides: Partial<V05DailyEntry> = {}): V05DailyEntry {
	return {
		id: `entry-${dateKey}`,
		user_id: "profile-1",
		entry_date: dateKey,
		weight: null,
		steps: null,
		sleep_duration_minutes: null,
		bedtime: null,
		wake_time: null,
		previous_day_calories: null,
		worked_out: false,
		workout_activity_type: null,
		workout_duration_minutes: null,
		notes: null,
		...overrides
	};
}

function completion(
	dateKey: string,
	item_key: V05ChecklistCompletion["item_key"],
	completed = true
): V05ChecklistCompletion {
	return {
		id: `${dateKey}-${item_key}`,
		user_id: "profile-1",
		entry_date: dateKey,
		item_key,
		completed
	};
}

describe("V0.5 motivation helpers", () => {
	it("maps completion thresholds to approved calendar states", () => {
		expect(getCompletionState(8, 8)).toBe("great");
		expect(getCompletionState(4, 5)).toBe("great");
		expect(getCompletionState(3, 5)).toBe("good");
		expect(getCompletionState(1, 5)).toBe("some");
		expect(getCompletionState(0, 5)).toBe("none");
	});

	it("keeps pre-tracking and future dates neutral", () => {
		const lookup = createCompletionLookup({
			entries: [entry("2026-08-12")],
			completions: [],
			trackingStartDate: "2026-08-12",
			todayKey: "2026-08-12"
		});

		expect(lookup("2026-08-11")).toMatchObject({
			state: "neutral",
			isBeforeTracking: true
		});
		expect(lookup("2026-08-13")).toMatchObject({
			state: "neutral",
			isFuture: true
		});
	});

	it("classifies a tracked date with no completed due items as no activity", () => {
		const lookup = createCompletionLookup({
			entries: [entry("2026-08-12")],
			completions: [],
			trackingStartDate: "2026-08-12",
			todayKey: "2026-08-12"
		});

		expect(lookup("2026-08-12")).toMatchObject({
			state: "none",
			completedDueItems: 0,
			totalDueItems: 8,
			percentage: 0
		});
	});

	it("uses due checklist items as the denominator on and off the every-other-day anchor", () => {
		const lookup = createCompletionLookup({
			entries: [entry("2026-08-12"), entry("2026-08-13")],
			completions: [
				completion("2026-08-12", "morning_skincare"),
				completion("2026-08-12", "evening_skincare"),
				completion("2026-08-12", "vitamins"),
				completion("2026-08-12", "minoxidil"),
				completion("2026-08-13", "morning_skincare")
			],
			trackingStartDate: "2026-08-12",
			todayKey: "2026-08-13"
		});

		expect(lookup("2026-08-12")).toMatchObject({
			state: "good",
			completedDueItems: 4,
			totalDueItems: 8
		});
		expect(lookup("2026-08-13")).toMatchObject({
			state: "some",
			completedDueItems: 1,
			totalDueItems: 5
		});
	});

	it("calculates visible streaks from canonical entries and completions", () => {
		const streaks = calculateStreaks({
			entries: [
				entry("2026-08-10", { sleep_duration_minutes: 420 }),
				entry("2026-08-11", { sleep_duration_minutes: 450 }),
				entry("2026-08-12", { sleep_duration_minutes: 421 })
			],
			completions: [
				completion("2026-08-11", "workout"),
				completion("2026-08-12", "workout"),
				completion("2026-08-11", "morning_skincare"),
				completion("2026-08-11", "evening_skincare"),
				completion("2026-08-12", "morning_skincare"),
				completion("2026-08-12", "evening_skincare"),
				completion("2026-08-12", "vitamins")
			],
			trackingStartDate: "2026-08-10",
			todayKey: "2026-08-12"
		});

		expect(streaks.find((streak) => streak.id === "workout")?.count).toBe(2);
		expect(streaks.find((streak) => streak.id === "goodSleep")?.count).toBe(3);
		expect(streaks.find((streak) => streak.id === "skincare")?.count).toBe(2);
		expect(streaks.find((streak) => streak.id === "vitamins")?.count).toBe(1);
		expect(streaks.find((streak) => streak.id === "logging")?.count).toBe(3);
	});

	it("does not let an incomplete today prematurely break yesterday's streak", () => {
		const count = calculateDailyStreak(
			{
				entries: [entry("2026-08-10"), entry("2026-08-11"), entry("2026-08-12")],
				completions: [
					completion("2026-08-10", "vitamins"),
					completion("2026-08-11", "vitamins")
				],
				trackingStartDate: "2026-08-10",
				todayKey: "2026-08-12"
			},
			({ completedKeys }) => completedKeys.has("vitamins")
		);

		expect(count).toBe(2);
	});

	it("extends a streak when today succeeds and breaks on historical missed days", () => {
		const withToday = calculateDailyStreak(
			{
				entries: [entry("2026-08-10"), entry("2026-08-11"), entry("2026-08-12")],
				completions: [
					completion("2026-08-10", "workout"),
					completion("2026-08-11", "workout"),
					completion("2026-08-12", "workout")
				],
				trackingStartDate: "2026-08-10",
				todayKey: "2026-08-12"
			},
			({ completedKeys }) => completedKeys.has("workout")
		);
		const broken = calculateDailyStreak(
			{
				entries: [entry("2026-08-10"), entry("2026-08-11"), entry("2026-08-12")],
				completions: [
					completion("2026-08-10", "workout"),
					completion("2026-08-12", "workout")
				],
				trackingStartDate: "2026-08-10",
				todayKey: "2026-08-12"
			},
			({ completedKeys }) => completedKeys.has("workout")
		);

		expect(withToday).toBe(3);
		expect(broken).toBe(1);
	});

	it("calculates logging streaks from daily entry existence", () => {
		const streaks = calculateStreaks({
			entries: [entry("2026-08-10"), entry("2026-08-12")],
			completions: [],
			trackingStartDate: "2026-08-10",
			todayKey: "2026-08-12"
		});

		expect(streaks.find((streak) => streak.id === "logging")?.count).toBe(1);
	});

	it("formats zero and singular/plural streak values gently", () => {
		expect(formatStreakValue(0)).toBe("Start today");
		expect(formatStreakValue(1)).toBe("1 day");
		expect(formatStreakValue(6)).toBe("6 days");
	});

	it("skips non-due days and breaks on missed due dates for every-other-day items", () => {
		const iron = V05_CHECKLIST_ITEMS.find((item) => item.key === "iron")!;

		expect(
			calculateChecklistDueDayStreak({
				item: iron,
				completions: [
					completion("2026-08-12", "iron"),
					completion("2026-08-14", "iron"),
					completion("2026-08-16", "iron")
				],
				trackingStartDate: "2026-08-12",
				todayKey: "2026-08-17"
			})
		).toBe(3);

		expect(
			calculateChecklistDueDayStreak({
				item: iron,
				completions: [
					completion("2026-08-12", "iron"),
					completion("2026-08-16", "iron")
				],
				trackingStartDate: "2026-08-12",
				todayKey: "2026-08-17"
			})
		).toBe(1);
	});
});

import { describe, expect, it } from "vitest";
import { isHabitDueOnDate, validateScheduleDraft } from "./schedule";
import type { HabitSchedule } from "./types";

function schedule(overrides: Partial<HabitSchedule>): HabitSchedule {
	return {
		id: "schedule-1",
		user_id: "profile-1",
		habit_id: "habit-1",
		schedule_type: "daily",
		weekdays: null,
		times_per_week: null,
		times_per_month: null,
		interval_days: null,
		anchor_date: null,
		start_date: "2026-08-10",
		end_date: null,
		archived_at: null,
		...overrides
	};
}

describe("habit schedule expansion", () => {
	it("handles daily, weekdays, and optional schedules", () => {
		expect(isHabitDueOnDate(schedule({ schedule_type: "daily" }), "2026-08-11")).toBe(true);
		expect(
			isHabitDueOnDate(schedule({ schedule_type: "weekdays", weekdays: [1, 3] }), "2026-08-12")
		).toBe(true);
		expect(
			isHabitDueOnDate(schedule({ schedule_type: "weekdays", weekdays: [1, 3] }), "2026-08-14")
		).toBe(false);
		expect(isHabitDueOnDate(schedule({ schedule_type: "optional" }), "2026-08-11")).toBe(false);
	});

	it("uses anchored every-X-days recurrence", () => {
		const everyOtherDay = schedule({
			schedule_type: "every_x_days",
			interval_days: 2,
			anchor_date: "2026-08-10"
		});

		expect(isHabitDueOnDate(everyOtherDay, "2026-08-10")).toBe(true);
		expect(isHabitDueOnDate(everyOtherDay, "2026-08-11")).toBe(false);
		expect(isHabitDueOnDate(everyOtherDay, "2026-08-12")).toBe(true);
	});

	it("treats times-per-week and times-per-month as active target windows", () => {
		expect(
			isHabitDueOnDate(schedule({ schedule_type: "times_per_week", times_per_week: 4 }), "2026-08-11")
		).toBe(true);
		expect(
			isHabitDueOnDate(
				schedule({ schedule_type: "times_per_month", times_per_month: 8 }),
				"2026-08-11"
			)
		).toBe(true);
	});

	it("validates schedule drafts before they reach database constraints", () => {
		expect(
			validateScheduleDraft({
				scheduleType: "every_x_days",
				weekdays: [],
				timesPerWeek: "",
				timesPerMonth: "",
				intervalDays: "2",
				anchorDate: ""
			})
		).toMatch(/anchor/);

		expect(
			validateScheduleDraft({
				scheduleType: "times_per_month",
				weekdays: [],
				timesPerWeek: "",
				timesPerMonth: "4",
				intervalDays: "",
				anchorDate: ""
			})
		).toBeNull();
	});
});

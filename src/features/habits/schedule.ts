import type { HabitSchedule } from "./types";

const MS_PER_DAY = 86_400_000;

export function todayKey(date = new Date()) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
	return new Date(`${dateKey}T00:00:00Z`);
}

function isWithinDateRange(schedule: Pick<HabitSchedule, "start_date" | "end_date">, dateKey: string) {
	return dateKey >= schedule.start_date && (!schedule.end_date || dateKey <= schedule.end_date);
}

export function isHabitDueOnDate(schedule: HabitSchedule | null, dateKey: string) {
	if (!schedule || schedule.archived_at || !isWithinDateRange(schedule, dateKey)) {
		return false;
	}

	switch (schedule.schedule_type) {
		case "daily":
			return true;
		case "weekdays":
			return Boolean(schedule.weekdays?.includes(parseDateKey(dateKey).getUTCDay()));
		case "times_per_week":
		case "times_per_month":
			return true;
		case "every_x_days": {
			if (!schedule.anchor_date || !schedule.interval_days) return false;
			if (dateKey < schedule.anchor_date) return false;
			const elapsedDays = Math.floor(
				(parseDateKey(dateKey).getTime() - parseDateKey(schedule.anchor_date).getTime()) /
					MS_PER_DAY
			);
			return elapsedDays % schedule.interval_days === 0;
		}
		case "optional":
			return false;
	}
}

export function scheduleLabel(schedule: HabitSchedule | null) {
	if (!schedule) return "No schedule";

	switch (schedule.schedule_type) {
		case "daily":
			return "Daily";
		case "weekdays":
			return `Weekdays: ${(schedule.weekdays ?? []).join(", ")}`;
		case "times_per_week":
			return `${schedule.times_per_week}x/week`;
		case "times_per_month":
			return `${schedule.times_per_month}x/month`;
		case "every_x_days":
			return `Every ${schedule.interval_days} days`;
		case "optional":
			return "Optional";
	}
}

export function validateScheduleDraft(input: {
	scheduleType: string;
	weekdays: number[];
	timesPerWeek: string;
	timesPerMonth: string;
	intervalDays: string;
	anchorDate: string;
}) {
	if (input.scheduleType === "weekdays" && input.weekdays.length === 0) {
		return "Choose at least one weekday.";
	}

	if (input.scheduleType === "times_per_week") {
		const value = Number(input.timesPerWeek);
		if (!Number.isInteger(value) || value < 1 || value > 7) {
			return "Times per week must be between 1 and 7.";
		}
	}

	if (input.scheduleType === "times_per_month") {
		const value = Number(input.timesPerMonth);
		if (!Number.isInteger(value) || value < 1 || value > 31) {
			return "Times per month must be between 1 and 31.";
		}
	}

	if (input.scheduleType === "every_x_days") {
		const value = Number(input.intervalDays);
		if (!Number.isInteger(value) || value < 1) {
			return "Every-X-days schedules need an interval of at least 1.";
		}
		if (!input.anchorDate) {
			return "Every-X-days schedules need an anchor date.";
		}
	}

	return null;
}

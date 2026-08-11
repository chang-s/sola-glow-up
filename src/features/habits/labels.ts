import type { ScheduleType, TimeGroup, TrackingType } from "./types";

export const categoryOptions = [
	{ value: "glow_up", label: "Glow Up" },
	{ value: "food", label: "Food" },
	{ value: "fitness", label: "Fitness" },
	{ value: "beauty", label: "Beauty" },
	{ value: "growth", label: "Growth" },
	{ value: "self_care", label: "Self-care" }
] as const;

export const trackingOptions: Array<{ value: TrackingType; label: string; goalLabel: string }> = [
	{ value: "checkbox", label: "Check-off", goalLabel: "" },
	{ value: "numeric", label: "Number", goalLabel: "Goal" },
	{ value: "duration", label: "Minutes / Duration", goalLabel: "Goal minutes" },
	{ value: "quantity", label: "Quantity", goalLabel: "Goal quantity" }
];

export const scheduleOptions: Array<{ value: ScheduleType; label: string }> = [
	{ value: "daily", label: "Daily" },
	{ value: "weekdays", label: "Certain days" },
	{ value: "times_per_week", label: "X times per week" },
	{ value: "times_per_month", label: "X times per month" },
	{ value: "every_x_days", label: "Every X days" },
	{ value: "optional", label: "No schedule / Optional" }
];

export const timeGroupOptions: Array<{ value: TimeGroup; label: string }> = [
	{ value: "morning", label: "Morning" },
	{ value: "afternoon", label: "Afternoon" },
	{ value: "evening", label: "Evening" },
	{ value: "anytime", label: "Anytime" }
];

export function optionLabel<T extends string>(
	options: ReadonlyArray<{ value: T; label: string }>,
	value: T | string | null | undefined
) {
	return options.find((option) => option.value === value)?.label ?? "";
}

export function shouldShowGoalFields(trackingType: TrackingType) {
	return trackingType !== "checkbox";
}

export function goalLabelForTrackingType(trackingType: TrackingType) {
	return trackingOptions.find((option) => option.value === trackingType)?.goalLabel ?? "Goal";
}

export function trackingLabel(trackingType: TrackingType) {
	return optionLabel(trackingOptions, trackingType);
}

export function categoryLabel(category: string) {
	return optionLabel(categoryOptions, category) || category;
}

export function timeGroupLabel(timeGroup: TimeGroup) {
	return optionLabel(timeGroupOptions, timeGroup);
}

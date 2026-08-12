import type { V05ChecklistItemKey } from "./checklist";

export type V05DailyEntry = {
	id: string;
	user_id: string;
	entry_date: string;
	weight: number | null;
	steps: number | null;
	sleep_duration_minutes: number | null;
	bedtime: string | null;
	wake_time: string | null;
	previous_day_calories: number | null;
	worked_out: boolean;
	workout_activity_type: string | null;
	workout_duration_minutes: number | null;
	notes: string | null;
	created_at?: string;
	updated_at?: string;
};

export type V05ChecklistCompletion = {
	id: string;
	user_id: string;
	entry_date: string;
	item_key: V05ChecklistItemKey;
	completed: boolean;
	created_at?: string;
	updated_at?: string;
};

export type V05TodayData = {
	dailyEntry: V05DailyEntry | null;
	checklistCompletions: V05ChecklistCompletion[];
};

export type V05DailyEntryInput = {
	weight: number | null;
	steps: number | null;
	sleep_duration_minutes: number | null;
	bedtime: string | null;
	wake_time: string | null;
	previous_day_calories: number | null;
	worked_out: boolean;
	workout_activity_type: string | null;
	workout_duration_minutes: number | null;
	notes?: string | null;
};

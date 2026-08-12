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

export type V05MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Other";

export type V05FoodPhoto = {
	id: string;
	user_id: string;
	entry_date: string;
	storage_path: string;
	meal_type: V05MealType | null;
	note: string | null;
	created_at?: string;
	updated_at?: string;
	deleted_at?: string | null;
};

export type V05FoodPhotoWithUrl = V05FoodPhoto & {
	signedUrl: string | null;
};

export type V05TodayData = {
	dailyEntry: V05DailyEntry | null;
	checklistCompletions: V05ChecklistCompletion[];
};

export type V05MotivationData = {
	trackingStartDate: string | null;
	dailyEntries: V05DailyEntry[];
	checklistCompletions: V05ChecklistCompletion[];
};

export type V05HistoryData = {
	dailyEntries: V05DailyEntry[];
	checklistCompletions: V05ChecklistCompletion[];
	foodPhotos: V05FoodPhotoWithUrl[];
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

export type V05FoodPhotoInput = {
	file: File;
	meal_type: V05MealType | null;
	note: string | null;
};

export type TrackingType = "checkbox" | "numeric" | "duration" | "quantity";
export type ScheduleType =
	| "daily"
	| "weekdays"
	| "times_per_week"
	| "times_per_month"
	| "every_x_days"
	| "optional";
export type TimeGroup = "morning" | "afternoon" | "evening" | "anytime";

export type Profile = {
	id: string;
	auth_user_id: string;
	display_name: string | null;
	timezone: string;
	unit_system: string;
};

export type Habit = {
	id: string;
	user_id: string;
	name: string;
	description: string | null;
	category: string;
	icon: string | null;
	tracking_type: TrackingType;
	target_value: number | null;
	target_unit: string | null;
	time_group: TimeGroup;
	start_date: string;
	end_date: string | null;
	active: boolean;
	include_in_glow_score: boolean;
	display_order: number;
	archived_at: string | null;
};

export type HabitSchedule = {
	id: string;
	user_id: string;
	habit_id: string;
	schedule_type: ScheduleType;
	weekdays: number[] | null;
	times_per_week: number | null;
	times_per_month: number | null;
	interval_days: number | null;
	anchor_date: string | null;
	start_date: string;
	end_date: string | null;
	archived_at: string | null;
};

export type HabitEntry = {
	id: string;
	user_id: string;
	habit_id: string;
	entry_date: string;
	completed: boolean;
	value_numeric: number | null;
	value_duration_minutes: number | null;
	value_quantity: number | null;
	notes: string | null;
	source: "manual" | "routine_check_all" | "routine_step" | "backfill";
	deleted_at: string | null;
};

export type RoutineGroup = {
	id: string;
	user_id: string;
	name: string;
	category: string | null;
	time_group: TimeGroup;
	display_order: number;
	active: boolean;
	archived_at: string | null;
};

export type RoutineStep = {
	id: string;
	user_id: string;
	routine_group_id: string;
	linked_habit_id: string | null;
	name: string;
	display_order: number;
	active: boolean;
	archived_at: string | null;
};

export type RoutineStepEntry = {
	id: string;
	user_id: string;
	routine_step_id: string;
	entry_date: string;
	completed: boolean;
	notes: string | null;
	source: "manual" | "routine_check_all" | "backfill";
	deleted_at: string | null;
};

export type HabitWithSchedule = Habit & {
	schedule: HabitSchedule | null;
	entry: HabitEntry | null;
};

export type RoutineGroupWithSteps = RoutineGroup & {
	steps: Array<RoutineStep & { entry: RoutineStepEntry | null; habitEntry: HabitEntry | null }>;
};

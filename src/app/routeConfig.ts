import type { LucideIcon } from "lucide-react";
import {
	Apple,
	CalendarDays,
	ChartNoAxesColumnIncreasing,
	Dumbbell,
	Heart,
	Home,
	NotebookTabs,
	Settings,
	Sparkles
} from "lucide-react";

export type RouteSection = {
	path: string;
	label: string;
	description: string;
	Icon: LucideIcon;
};

export const routeSections: RouteSection[] = [
	{
		path: "today",
		label: "Today",
		description: "Daily command center placeholder for Milestone 0.",
		Icon: Home
	},
	{
		path: "glow-up",
		label: "Glow Up",
		description: "Body progress foundation route.",
		Icon: Sparkles
	},
	{
		path: "food",
		label: "Food",
		description: "Food logging foundation route.",
		Icon: Apple
	},
	{
		path: "fitness",
		label: "Fitness",
		description: "Movement and workout foundation route.",
		Icon: Dumbbell
	},
	{
		path: "beauty",
		label: "Beauty",
		description: "Beauty and self-care foundation route.",
		Icon: Heart
	},
	{
		path: "growth",
		label: "Growth",
		description: "Personal-development habit foundation route.",
		Icon: NotebookTabs
	},
	{
		path: "insights",
		label: "Insights",
		description: "Charts and reports foundation route.",
		Icon: ChartNoAxesColumnIncreasing
	},
	{
		path: "calendar",
		label: "Calendar",
		description: "Historical view foundation route.",
		Icon: CalendarDays
	},
	{
		path: "settings",
		label: "Settings",
		description: "Configuration and export foundation route.",
		Icon: Settings
	}
];

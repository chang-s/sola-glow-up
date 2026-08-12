import type { LucideIcon } from "lucide-react";
import { ChartNoAxesColumnIncreasing, ClipboardCheck, Images } from "lucide-react";

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
		description: "Daily check-in, monthly completion, and simple streaks.",
		Icon: ClipboardCheck
	},
	{
		path: "history",
		label: "History",
		description: "Previous entries and food-photo scrapbook.",
		Icon: Images
	},
	{
		path: "progress",
		label: "Progress",
		description: "Weight trend and small progress summaries.",
		Icon: ChartNoAxesColumnIncreasing
	}
];

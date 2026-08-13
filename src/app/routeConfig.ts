import type { PixelIconName } from "../assets/pixelArtAssets";

export type RouteSection = {
	path: string;
	label: string;
	description: string;
	icon: PixelIconName;
};

export const routeSections: RouteSection[] = [
	{
		path: "today",
		label: "Today",
		description: "Daily check-in, monthly completion, and simple streaks.",
		icon: "logging"
	},
	{
		path: "history",
		label: "History",
		description: "Previous entries and food-photo scrapbook.",
		icon: "history"
	},
	{
		path: "progress",
		label: "Progress",
		description: "Weight trend and small progress summaries.",
		icon: "progress"
	}
];

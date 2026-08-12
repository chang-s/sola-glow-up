export type V05ChecklistItemKey =
	| "morning_skincare"
	| "evening_skincare"
	| "vitamins"
	| "minoxidil"
	| "workout"
	| "iron"
	| "irestore_helmet"
	| "irestore_mask";

export type V05ChecklistItem = {
	key: V05ChecklistItemKey;
	label: string;
	cadence: "daily" | "every_other_day";
	anchorDate?: string;
};

export const EVERY_OTHER_DAY_ANCHOR = "2026-08-12";

export const V05_CHECKLIST_ITEMS: V05ChecklistItem[] = [
	{ key: "morning_skincare", label: "Morning Skincare", cadence: "daily" },
	{ key: "evening_skincare", label: "Evening Skincare", cadence: "daily" },
	{ key: "vitamins", label: "Vitamins", cadence: "daily" },
	{ key: "minoxidil", label: "Minoxidil", cadence: "daily" },
	{ key: "workout", label: "Worked Out", cadence: "daily" },
	{
		key: "iron",
		label: "Iron",
		cadence: "every_other_day",
		anchorDate: EVERY_OTHER_DAY_ANCHOR
	},
	{
		key: "irestore_helmet",
		label: "iRestore Helmet",
		cadence: "every_other_day",
		anchorDate: EVERY_OTHER_DAY_ANCHOR
	},
	{
		key: "irestore_mask",
		label: "iRestore Mask",
		cadence: "every_other_day",
		anchorDate: EVERY_OTHER_DAY_ANCHOR
	}
];

function parseDateKey(dateKey: string) {
	const [year, month, day] = dateKey.split("-").map(Number);
	return { year, month, day };
}

export function wholeCalendarDaysBetween(startDateKey: string, endDateKey: string) {
	const start = parseDateKey(startDateKey);
	const end = parseDateKey(endDateKey);
	const startUtc = Date.UTC(start.year, start.month - 1, start.day);
	const endUtc = Date.UTC(end.year, end.month - 1, end.day);
	return Math.floor((endUtc - startUtc) / 86_400_000);
}

export function isChecklistItemDue(item: V05ChecklistItem, dateKey: string) {
	if (item.cadence === "daily") return true;
	if (!item.anchorDate) return false;

	const daysFromAnchor = wholeCalendarDaysBetween(item.anchorDate, dateKey);
	return daysFromAnchor >= 0 && daysFromAnchor % 2 === 0;
}

export function getDueChecklistItems(dateKey: string) {
	return V05_CHECKLIST_ITEMS.filter((item) => isChecklistItemDue(item, dateKey));
}

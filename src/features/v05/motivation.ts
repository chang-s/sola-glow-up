import {
	getDueChecklistItems,
	isChecklistItemDue,
	type V05ChecklistItem,
	type V05ChecklistItemKey
} from "./checklist";
import { addCalendarDays, compareDateKeys } from "./date";
import type { V05ChecklistCompletion, V05DailyEntry } from "./types";

export type CompletionState = "great" | "good" | "some" | "none" | "neutral";

export type CalendarCompletion = {
	dateKey: string;
	state: CompletionState;
	completedDueItems: number;
	totalDueItems: number;
	percentage: number | null;
	hasEntry: boolean;
	isBeforeTracking: boolean;
	isFuture: boolean;
};

export type StreakId = "workout" | "goodSleep" | "skincare" | "vitamins" | "logging";

export type StreakSummary = {
	id: StreakId;
	label: string;
	count: number;
};

type MotivationInput = {
	entries: V05DailyEntry[];
	completions: V05ChecklistCompletion[];
	trackingStartDate: string | null;
	todayKey: string;
};

type DaySnapshot = {
	dateKey: string;
	entry: V05DailyEntry | null;
	completedKeys: Set<V05ChecklistItemKey>;
};

export function getCompletionState(completedDueItems: number, totalDueItems: number) {
	if (totalDueItems <= 0) return "neutral";
	const percentage = completedDueItems / totalDueItems;

	if (percentage >= 0.8) return "great";
	if (percentage >= 0.5) return "good";
	if (percentage > 0) return "some";
	return "none";
}

export function formatStreakValue(count: number) {
	if (count <= 0) return "Start today";
	return count === 1 ? "1 day" : `${count} days`;
}

export function createCompletionLookup({
	entries,
	completions,
	trackingStartDate,
	todayKey
}: MotivationInput) {
	const entryDates = new Set(entries.map((entry) => entry.entry_date));
	const completedByDate = getCompletedKeysByDate(completions);

	return (dateKey: string): CalendarCompletion => {
		const isFuture = compareDateKeys(dateKey, todayKey) > 0;
		const isBeforeTracking =
			trackingStartDate === null || compareDateKeys(dateKey, trackingStartDate) < 0;
		const hasEntry = entryDates.has(dateKey);

		if (isFuture || isBeforeTracking) {
			return {
				dateKey,
				state: "neutral",
				completedDueItems: 0,
				totalDueItems: 0,
				percentage: null,
				hasEntry,
				isBeforeTracking,
				isFuture
			};
		}

		const dueItems = getDueChecklistItems(dateKey);
		const completedKeys = completedByDate.get(dateKey) ?? new Set<V05ChecklistItemKey>();
		const completedDueItems = dueItems.filter((item) => completedKeys.has(item.key)).length;
		const totalDueItems = dueItems.length;

		return {
			dateKey,
			state: hasEntry ? getCompletionState(completedDueItems, totalDueItems) : "none",
			completedDueItems: hasEntry ? completedDueItems : 0,
			totalDueItems,
			percentage: hasEntry && totalDueItems > 0 ? completedDueItems / totalDueItems : 0,
			hasEntry,
			isBeforeTracking,
			isFuture
		};
	};
}

export function calculateStreaks(input: MotivationInput): StreakSummary[] {
	return [
		{
			id: "workout",
			label: "Workout",
			count: calculateDailyStreak(input, ({ completedKeys }) => completedKeys.has("workout"))
		},
		{
			id: "goodSleep",
			label: "Good Sleep",
			count: calculateDailyStreak(
				input,
				({ entry }) => (entry?.sleep_duration_minutes ?? 0) >= 420
			)
		},
		{
			id: "skincare",
			label: "Skincare",
			count: calculateDailyStreak(
				input,
				({ completedKeys }) =>
					completedKeys.has("morning_skincare") && completedKeys.has("evening_skincare")
			)
		},
		{
			id: "vitamins",
			label: "Vitamins",
			count: calculateDailyStreak(input, ({ completedKeys }) => completedKeys.has("vitamins"))
		},
		{
			id: "logging",
			label: "Logging",
			count: calculateDailyStreak(input, ({ entry }) => Boolean(entry))
		}
	];
}

export function calculateDailyStreak(
	{ entries, completions, trackingStartDate, todayKey }: MotivationInput,
	isSuccessful: (snapshot: DaySnapshot) => boolean
) {
	if (!trackingStartDate || compareDateKeys(todayKey, trackingStartDate) < 0) return 0;

	const entryByDate = new Map(entries.map((entry) => [entry.entry_date, entry]));
	const completedByDate = getCompletedKeysByDate(completions);
	const todaySnapshot = getDaySnapshot(todayKey, entryByDate, completedByDate);

	if (isSuccessful(todaySnapshot)) {
		return countDailyStreakEndingAt(
			todayKey,
			trackingStartDate,
			entryByDate,
			completedByDate,
			isSuccessful
		);
	}

	const yesterdayKey = addCalendarDays(todayKey, -1);
	if (compareDateKeys(yesterdayKey, trackingStartDate) < 0) return 0;

	return countDailyStreakEndingAt(
		yesterdayKey,
		trackingStartDate,
		entryByDate,
		completedByDate,
		isSuccessful
	);
}

export function calculateChecklistDueDayStreak({
	item,
	completions,
	trackingStartDate,
	todayKey
}: {
	item: V05ChecklistItem;
	completions: V05ChecklistCompletion[];
	trackingStartDate: string | null;
	todayKey: string;
}) {
	if (!trackingStartDate || compareDateKeys(todayKey, trackingStartDate) < 0) return 0;

	const completedByDate = getCompletedKeysByDate(completions);
	const startDateKey =
		isChecklistItemDue(item, todayKey) && completedByDate.get(todayKey)?.has(item.key)
			? todayKey
			: findPreviousDueDate(item, addCalendarDays(todayKey, -1), trackingStartDate);

	if (!startDateKey) return 0;

	let count = 0;
	let cursor: string | null = startDateKey;

	while (cursor && compareDateKeys(cursor, trackingStartDate) >= 0) {
		if (!completedByDate.get(cursor)?.has(item.key)) break;
		count += 1;
		cursor = findPreviousDueDate(item, addCalendarDays(cursor, -1), trackingStartDate);
	}

	return count;
}

function countDailyStreakEndingAt(
	endDateKey: string,
	trackingStartDate: string,
	entryByDate: Map<string, V05DailyEntry>,
	completedByDate: Map<string, Set<V05ChecklistItemKey>>,
	isSuccessful: (snapshot: DaySnapshot) => boolean
) {
	let count = 0;
	let cursor = endDateKey;

	while (compareDateKeys(cursor, trackingStartDate) >= 0) {
		const snapshot = getDaySnapshot(cursor, entryByDate, completedByDate);
		if (!isSuccessful(snapshot)) break;
		count += 1;
		cursor = addCalendarDays(cursor, -1);
	}

	return count;
}

function getDaySnapshot(
	dateKey: string,
	entryByDate: Map<string, V05DailyEntry>,
	completedByDate: Map<string, Set<V05ChecklistItemKey>>
): DaySnapshot {
	return {
		dateKey,
		entry: entryByDate.get(dateKey) ?? null,
		completedKeys: completedByDate.get(dateKey) ?? new Set<V05ChecklistItemKey>()
	};
}

function getCompletedKeysByDate(completions: V05ChecklistCompletion[]) {
	const completedByDate = new Map<string, Set<V05ChecklistItemKey>>();

	for (const completion of completions) {
		if (!completion.completed) continue;
		const keys = completedByDate.get(completion.entry_date) ?? new Set<V05ChecklistItemKey>();
		keys.add(completion.item_key);
		completedByDate.set(completion.entry_date, keys);
	}

	return completedByDate;
}

function findPreviousDueDate(
	item: V05ChecklistItem,
	startDateKey: string,
	trackingStartDate: string
) {
	let cursor = startDateKey;

	while (compareDateKeys(cursor, trackingStartDate) >= 0) {
		if (isChecklistItemDue(item, cursor)) return cursor;
		cursor = addCalendarDays(cursor, -1);
	}

	return null;
}

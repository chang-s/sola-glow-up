import { addCalendarDays, formatFriendlyDate, parseLocalDateKey } from "./date";
import type { V05WeightEntry } from "./types";

export type WeightSummary = {
	starting: V05WeightEntry | null;
	latest: V05WeightEntry | null;
	change: number | null;
	weighInCount: number;
};

export type ChartPoint = V05WeightEntry & {
	x: number;
	y: number;
};

export type TimelineDay = {
	dateKey: string;
	x: number;
	y?: number;
	isRecorded: boolean;
};

export type ChartModel = {
	mode: ChartMode;
	points: ChartPoint[];
	timelineDays: TimelineDay[];
	missingDays: TimelineDay[];
	chartWidth: number;
	linePoints: string;
	yMin: number;
	yMax: number;
	yTicks: number[];
	xLabels: Array<{ dateKey: string; x: number; label: string; weekday: string | null }>;
	isHorizontallyScrollable: boolean;
	shouldShowMissingMarkers: boolean;
};

export type ChartMode = "detail" | "all-time";

export const CHART_WIDTH = 720;
export const CHART_HEIGHT = 260;
export const CHART_PADDING = {
	top: 24,
	right: 34,
	bottom: 56,
	left: 90
};
const DETAIL_DAY_WIDTH = 52;
const DETAIL_MISSING_MARKER_LIMIT = 120;

function daysBetween(startDateKey: string, endDateKey: string) {
	const start = parseLocalDateKey(startDateKey).getTime();
	const end = parseLocalDateKey(endDateKey).getTime();
	return Math.round((end - start) / 86_400_000);
}

function makeTick(value: number) {
	return Number(value.toFixed(1));
}

function getDailyTimeline(firstDateKey: string, lastDateKey: string) {
	const dayCount = daysBetween(firstDateKey, lastDateKey);
	return Array.from({ length: dayCount + 1 }, (_, index) =>
		addCalendarDays(firstDateKey, index)
	);
}

function getVisibleLabelIndexes(timelineLength: number) {
	if (timelineLength <= 10) {
		return Array.from({ length: timelineLength }, (_, index) => index);
	}

	const interval = Math.ceil((timelineLength - 1) / 4);
	const indexes = Array.from({ length: timelineLength }, (_, index) => index).filter(
		(index) => index === 0 || index === timelineLength - 1 || index % interval === 0
	);

	return Array.from(new Set(indexes));
}

function getAllTimeLabelIndexes(timelineDateKeys: string[]) {
	const timelineLength = timelineDateKeys.length;
	if (timelineLength <= 21) return getVisibleLabelIndexes(timelineLength);

	const indexes = [0, timelineLength - 1];
	const interval =
		timelineLength <= 92 ? 14 : timelineLength <= 370 ? 31 : Math.ceil(timelineLength / 8);

	timelineDateKeys.forEach((_, index) => {
		if (index !== 0 && index !== timelineLength - 1 && index % interval === 0) {
			indexes.push(index);
		}
	});

	return Array.from(new Set(indexes)).sort((left, right) => left - right);
}

function formatAxisLabel(dateKey: string, mode: ChartMode, timelineLength: number) {
	const date = parseLocalDateKey(dateKey);
	if (mode === "all-time" && timelineLength > 370) {
		return {
			label: date.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
			weekday: null
		};
	}
	if (mode === "all-time" && timelineLength > 92) {
		return {
			label: date.toLocaleDateString(undefined, { month: "short" }),
			weekday: null
		};
	}
	return {
		label: formatFriendlyDate(dateKey).replace(/^[^,]+, /, ""),
		weekday:
			mode === "detail" && timelineLength <= 10
				? date.toLocaleDateString(undefined, { weekday: "short" })
				: null
	};
}

export function getWeightSummary(entries: V05WeightEntry[]): WeightSummary {
	const starting = entries[0] ?? null;
	const latest = entries.at(-1) ?? null;

	return {
		starting,
		latest,
		change: starting && latest ? latest.weight - starting.weight : null,
		weighInCount: entries.length
	};
}

export function buildWeightChartModel(
	entries: V05WeightEntry[],
	mode: ChartMode = "detail"
): ChartModel | null {
	if (!entries.length) return null;

	const weights = entries.map((entry) => entry.weight);
	const minWeight = Math.min(...weights);
	const maxWeight = Math.max(...weights);
	const weightRange = maxWeight - minWeight;
	const yPadding = weightRange === 0 ? 5 : Math.max(2, weightRange * 0.18);
	const yMin = makeTick(minWeight - yPadding);
	const yMax = makeTick(maxWeight + yPadding);
	const yRange = yMax - yMin || 1;
	const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
	const firstDate = entries[0].entry_date;
	const lastDate = entries.at(-1)?.entry_date ?? firstDate;
	const dateSpan = Math.max(1, daysBetween(firstDate, lastDate));
	const recordedDates = new Set(entries.map((entry) => entry.entry_date));
	const timelineDateKeys = getDailyTimeline(firstDate, lastDate);
	const timelineSpan = Math.max(1, timelineDateKeys.length - 1);
	const basePlotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
	const detailPlotWidth = Math.max(basePlotWidth, timelineSpan * DETAIL_DAY_WIDTH);
	const plotWidth = mode === "detail" ? detailPlotWidth : basePlotWidth;
	const chartWidth = CHART_PADDING.left + plotWidth + CHART_PADDING.right;
	const timelineDays = timelineDateKeys.map((dateKey): TimelineDay => {
		const x =
			entries.length === 1
				? CHART_PADDING.left + plotWidth / 2
				: CHART_PADDING.left +
					(daysBetween(firstDate, dateKey) / (mode === "detail" ? timelineSpan : dateSpan)) *
						plotWidth;

		return {
			dateKey,
			x: Number(x.toFixed(2)),
			isRecorded: recordedDates.has(dateKey)
		};
	});

	const points = entries.map((entry): ChartPoint => {
		const x = timelineDays.find((day) => day.dateKey === entry.entry_date)?.x ?? CHART_PADDING.left;
		const y =
			CHART_PADDING.top +
			((yMax - entry.weight) / yRange) * plotHeight;

		return {
			...entry,
			x: Number(x.toFixed(2)),
			y: Number(y.toFixed(2))
		};
	});

	const yTicks = Array.from({ length: 4 }, (_, index) =>
		makeTick(yMin + (yRange / 3) * index)
	);
	const missingDays = timelineDays
		.filter((day) => !day.isRecorded)
		.map((day): TimelineDay => {
			const previousPoint = [...points]
				.reverse()
				.find((point) => point.entry_date < day.dateKey);
			const nextPoint = points.find((point) => point.entry_date > day.dateKey);
			if (!previousPoint || !nextPoint) return day;

			const segmentDays = Math.max(1, daysBetween(previousPoint.entry_date, nextPoint.entry_date));
			const elapsedDays = daysBetween(previousPoint.entry_date, day.dateKey);
			const y =
				previousPoint.y +
				(elapsedDays / segmentDays) * (nextPoint.y - previousPoint.y);

			return {
				...day,
				y: Number(y.toFixed(2))
			};
		});
	const labelIndexes =
		mode === "detail"
			? getVisibleLabelIndexes(timelineDays.length)
			: getAllTimeLabelIndexes(timelineDateKeys);
	const xLabels = Array.from(new Set(labelIndexes)).map((index) => {
		const dateKey = timelineDays[index].dateKey;
		const formatted = formatAxisLabel(dateKey, mode, timelineDays.length);

		return {
			dateKey,
			x: timelineDays[index].x,
			label: formatted.label,
			weekday: formatted.weekday
		};
	});

	return {
		mode,
		points,
		timelineDays,
		missingDays,
		chartWidth,
		linePoints: points.map((point) => `${point.x},${point.y}`).join(" "),
		yMin,
		yMax,
		yTicks,
		xLabels,
		isHorizontallyScrollable: mode === "detail" && chartWidth > CHART_WIDTH,
		shouldShowMissingMarkers:
			mode === "detail" && timelineDays.length <= DETAIL_MISSING_MARKER_LIMIT
	};
}

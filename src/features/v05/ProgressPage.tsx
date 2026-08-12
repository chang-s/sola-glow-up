import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, CircleDot, Sparkles, TrendingDown } from "lucide-react";
import { formatFriendlyDate } from "./date";
import {
	buildWeightChartModel,
	CHART_HEIGHT,
	CHART_PADDING,
	getWeightSummary,
	type ChartMode,
	type ChartModel
} from "./progress";
import { useV05Progress } from "./useV05Today";
import type { V05WeightEntry } from "./types";

const EMPTY_WEIGHT_ENTRIES: V05WeightEntry[] = [];

function formatWeight(weight: number | null) {
	if (weight == null) return "--";
	return `${weight.toFixed(1)} lb`;
}

function formatChange(change: number | null) {
	if (change == null) return "--";
	if (Math.abs(change) < 0.05) return "0 lb";
	const direction = change < 0 ? "Down" : "Up";
	return `${direction} ${Math.abs(change).toFixed(1)} lb`;
}

function formatSummaryDate(entry: V05WeightEntry | null) {
	return entry ? formatFriendlyDate(entry.entry_date) : "No weigh-in yet";
}

export function ProgressPage() {
	const { profile, progress } = useV05Progress();
	const [chartMode, setChartMode] = useState<ChartMode>("detail");
	const entries = progress.data?.weightEntries ?? EMPTY_WEIGHT_ENTRIES;
	const summary = useMemo(() => getWeightSummary(entries), [entries]);
	const chartModel = useMemo(
		() => buildWeightChartModel(entries, chartMode),
		[entries, chartMode]
	);

	return (
		<section className="v05-screen" aria-labelledby="progress-title">
			<div className="surface-header">
				<div>
					<p className="eyebrow">Chart board</p>
					<h2 id="progress-title">Progress</h2>
				</div>
			</div>

			<div className="progress-layout">
				<section className="pixel-card metric-strip" aria-label="Weight progress summary">
					<SummaryCard
						label="Starting"
						value={formatWeight(summary.starting?.weight ?? null)}
						detail={formatSummaryDate(summary.starting)}
						accent="rose"
					/>
					<SummaryCard
						label="Latest"
						value={formatWeight(summary.latest?.weight ?? null)}
						detail={formatSummaryDate(summary.latest)}
						accent="butter"
					/>
					<SummaryCard
						label="Total change"
						value={formatChange(summary.change)}
						detail={
							summary.change == null
								? "Waiting for weigh-ins"
								: summary.change < 0
									? "Down from start"
									: summary.change > 0
										? "Up from start"
										: "No change from start"
						}
						tone={summary.change == null ? undefined : summary.change <= 0 ? "positive" : "warm"}
						accent="green"
					/>
				</section>

				<section className="chart-board progress-chart-board" aria-labelledby="weight-chart-title">
					<div className="section-heading compact">
						<div>
							<p className="eyebrow">Weight over time</p>
							<h3 id="weight-chart-title">Weight trend</h3>
						</div>
						<div className="chart-heading-actions">
							<ChartModeToggle mode={chartMode} onChange={setChartMode} />
							<TrendingDown aria-hidden="true" size={22} />
						</div>
					</div>

					{progress.isLoading || profile.isLoading ? (
						<p className="panel-state" role="status">Loading your chart board...</p>
					) : null}

					{progress.error || profile.error ? (
						<p className="panel-state error-state" role="alert">
							Progress could not load. Please try refreshing.
						</p>
					) : null}

					{!progress.isLoading && !profile.isLoading && !progress.error && !profile.error ? (
						<WeightChart entries={entries} chartModel={chartModel} />
					) : null}

				</section>
			</div>
		</section>
	);
}

function ChartModeToggle({
	mode,
	onChange
}: {
	mode: ChartMode;
	onChange: (mode: ChartMode) => void;
}) {
	return (
		<div className="segmented-toggle chart-mode-toggle" aria-label="Chart view mode">
			<button
				type="button"
				className={mode === "detail" ? "active" : ""}
				aria-pressed={mode === "detail"}
				onClick={() => onChange("detail")}
			>
				Detail
			</button>
			<button
				type="button"
				className={mode === "all-time" ? "active" : ""}
				aria-pressed={mode === "all-time"}
				onClick={() => onChange("all-time")}
			>
				All Time
			</button>
		</div>
	);
}

function SummaryCard({
	label,
	value,
	detail,
	tone,
	accent
}: {
	label: string;
	value: string;
	detail: string;
	tone?: "positive" | "warm";
	accent: "rose" | "butter" | "green";
}) {
	return (
		<div className={tone ? `metric-card ${tone}` : "metric-card"}>
			<i className={`metric-card-tab ${accent}`} aria-hidden="true" />
			<span>{label}</span>
			<strong>{value}</strong>
			<small>{detail}</small>
		</div>
	);
}

function WeightChart({
	entries,
	chartModel
}: {
	entries: V05WeightEntry[];
	chartModel: ChartModel | null;
}) {
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const [activeDetail, setActiveDetail] = useState<
		{ type: "recorded"; index: number } | { type: "missing"; dateKey: string }
	>({ type: "recorded", index: 0 });

	useEffect(() => {
		const scroller = scrollRef.current;
		if (!scroller || !chartModel?.isHorizontallyScrollable) return;
		scroller.scrollLeft = scroller.scrollWidth - scroller.clientWidth;
	}, [chartModel?.chartWidth, chartModel?.isHorizontallyScrollable, chartModel?.mode]);

	if (!entries.length || !chartModel) {
		return (
			<div className="progress-empty-state">
				<Activity aria-hidden="true" size={28} />
				<p>Your weight journey will appear here after your first weigh-in.</p>
			</div>
		);
	}

	const activePoint =
		activeDetail.type === "recorded"
			? chartModel.points[activeDetail.index] ?? chartModel.points[0]
			: null;
	const axisLabel = `${formatWeight(chartModel.yMin)} to ${formatWeight(chartModel.yMax)}`;

	return (
		<div className="weight-chart-wrap">
			<div
				ref={scrollRef}
				className={
					chartModel.isHorizontallyScrollable
						? "weight-chart-viewport scrollable"
						: "weight-chart-viewport"
				}
				data-chart-mode={chartModel.mode}
				data-scrollable={chartModel.isHorizontallyScrollable ? "true" : "false"}
				aria-label={
					chartModel.isHorizontallyScrollable
						? "Scrollable daily weight chart"
						: "Weight chart"
				}
				onWheel={(event) => {
					const scroller = scrollRef.current;
					if (!scroller || !chartModel.isHorizontallyScrollable) return;
					if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

					const atStart = scroller.scrollLeft <= 0;
					const atEnd =
						scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1;
					if ((event.deltaY < 0 && atStart) || (event.deltaY > 0 && atEnd)) return;

					event.preventDefault();
					scroller.scrollLeft += event.deltaY;
				}}
			>
				<svg
					className="weight-chart"
					width={chartModel.chartWidth}
					height={CHART_HEIGHT}
					viewBox={`0 0 ${chartModel.chartWidth} ${CHART_HEIGHT}`}
					role="img"
					aria-labelledby="weight-chart-description"
				>
					<title id="weight-chart-description">
						Weight line graph in {chartModel.mode === "detail" ? "Detail" : "All Time"} view with{" "}
						{entries.length} recorded weigh-in
						{entries.length === 1 ? "" : "s"} across {chartModel.timelineDays.length} calendar day
						{chartModel.timelineDays.length === 1 ? "" : "s"}. Y axis ranges from {axisLabel}.
					</title>
					<g className="chart-grid-lines" aria-hidden="true">
						{chartModel.yTicks.map((tick) => {
							const y = Number((
								CHART_PADDING.top +
								((chartModel.yMax - tick) / (chartModel.yMax - chartModel.yMin)) *
									(CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom)
							).toFixed(2));
							return (
								<g key={tick}>
									<line x1={CHART_PADDING.left} x2={chartModel.chartWidth - CHART_PADDING.right} y1={y} y2={y} />
									<text x={CHART_PADDING.left - 14} y={y + 4}>{formatWeight(tick)}</text>
								</g>
							);
						})}
					</g>
					<line
						className="chart-axis"
						x1={CHART_PADDING.left}
						x2={CHART_PADDING.left}
						y1={CHART_PADDING.top}
						y2={CHART_HEIGHT - CHART_PADDING.bottom}
					/>
					<line
						className="chart-axis"
						x1={CHART_PADDING.left}
						x2={chartModel.chartWidth - CHART_PADDING.right}
						y1={CHART_HEIGHT - CHART_PADDING.bottom}
						y2={CHART_HEIGHT - CHART_PADDING.bottom}
					/>
					{entries.length > 1 ? (
						<polyline className="weight-line" points={chartModel.linePoints} />
					) : null}
					{chartModel.shouldShowMissingMarkers
						? chartModel.missingDays.map((day) => (
								<g
									key={day.dateKey}
									className={
										activeDetail.type === "missing" && activeDetail.dateKey === day.dateKey
											? "missing-weight-point active"
											: "missing-weight-point"
									}
									role="button"
									tabIndex={0}
									aria-label={`${formatFriendlyDate(day.dateKey)} no weight recorded`}
									onClick={() => setActiveDetail({ type: "missing", dateKey: day.dateKey })}
									onFocus={() => setActiveDetail({ type: "missing", dateKey: day.dateKey })}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											setActiveDetail({ type: "missing", dateKey: day.dateKey });
										}
									}}
								>
									<circle cx={day.x} cy={day.y ?? CHART_HEIGHT - CHART_PADDING.bottom - 12} r={6} />
								</g>
							))
						: null}
					<g className="chart-date-labels" aria-hidden="true">
						{chartModel.xLabels.map((label) => (
							<text key={label.dateKey} x={label.x} y={CHART_HEIGHT - 18}>
								<tspan x={label.x} dy={label.weekday ? "-0.3em" : "0"}>
									{label.label}
								</tspan>
								{label.weekday ? (
									<tspan className="weekday-label" x={label.x} dy="1.25em">
										{label.weekday}
									</tspan>
								) : null}
							</text>
						))}
					</g>
					{chartModel.points.map((point, index) => (
						<g
							key={point.entry_date}
							className={
								activeDetail.type === "recorded" && index === activeDetail.index
									? "weight-point active"
									: "weight-point"
							}
							role="button"
							tabIndex={0}
							aria-label={`${formatFriendlyDate(point.entry_date)} ${formatWeight(point.weight)}`}
							onClick={() => setActiveDetail({ type: "recorded", index })}
							onFocus={() => setActiveDetail({ type: "recorded", index })}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									setActiveDetail({ type: "recorded", index });
								}
							}}
						>
							<circle cx={point.x} cy={point.y} r={chartModel.mode === "all-time" && entries.length > 60 ? 5 : 8} />
						</g>
					))}
				</svg>
			</div>
			<div className="chart-legend" aria-label="Weight chart legend">
				<span><i className="legend-dot recorded" aria-hidden="true" />Recorded weight</span>
				<span><i className="legend-dot missing" aria-hidden="true" />No entry</span>
				<span><i className="legend-line" aria-hidden="true" />Weight trend</span>
			</div>
			<div className="weight-chart-tooltip" role="status" aria-live="polite">
				<CircleDot aria-hidden="true" size={16} />
				{activePoint ? (
					<span>
						<strong>{formatWeight(activePoint.weight)}</strong>
						{formatFriendlyDate(activePoint.entry_date)}
					</span>
				) : (
					<span>
						<strong>No weight recorded</strong>
						{activeDetail.type === "missing" ? formatFriendlyDate(activeDetail.dateKey) : ""}
					</span>
				)}
			</div>
			{entries.length === 1 ? (
				<p className="empty-note">Add another weigh-in to start seeing your trend.</p>
			) : null}
			<p className="progress-context-note">
				<Sparkles aria-hidden="true" size={22} />
				<span>
					<strong>Tracking since {formatFriendlyDate(entries[0].entry_date)}</strong>
					{entries.length === 1 ? "1 weigh-in recorded" : `${entries.length} weigh-ins recorded`}
				</span>
			</p>
		</div>
	);
}

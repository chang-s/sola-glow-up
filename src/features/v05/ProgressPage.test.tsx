import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import css from "../../styles/global.css?raw";
import { ProgressPage } from "./ProgressPage";
import { buildWeightChartModel, CHART_WIDTH, getWeightSummary } from "./progress";
import type { V05ProgressData } from "./types";

let mockProgressData: V05ProgressData;
let mockProgressError: Error | null;
let mockProgressLoading: boolean;

vi.mock("./useV05Today", () => ({
	useV05Progress: () => ({
		profile: { isLoading: false, error: null, data: { id: "profile-1" } },
		progress: {
			isLoading: mockProgressLoading,
			error: mockProgressError,
			data: mockProgressData
		}
	})
}));

function renderProgress(data: V05ProgressData = { weightEntries: [] }) {
	mockProgressData = data;
	return render(<ProgressPage />);
}

function longRangeEntries() {
	return {
		weightEntries: [
			{ entry_date: "2026-08-01", weight: 184 },
			{ entry_date: "2026-08-11", weight: 182 },
			{ entry_date: "2026-08-31", weight: 179 }
		]
	};
}

describe("V0.5 Progress page", () => {
	beforeEach(() => {
		mockProgressData = { weightEntries: [] };
		mockProgressError = null;
		mockProgressLoading = false;
	});

	it("derives starting, latest, and decrease from chronological weight rows", () => {
		const summary = getWeightSummary([
			{ entry_date: "2026-08-12", weight: 181.6 },
			{ entry_date: "2026-08-14", weight: 180.4 },
			{ entry_date: "2026-08-20", weight: 178.2 }
		]);

		expect(summary.starting?.weight).toBe(181.6);
		expect(summary.latest?.weight).toBe(178.2);
		expect(summary.change).toBeCloseTo(-3.4);
	});

	it("derives increase and no-change values", () => {
		expect(
			getWeightSummary([
				{ entry_date: "2026-08-12", weight: 181 },
				{ entry_date: "2026-08-15", weight: 183.1 }
			]).change
		).toBeCloseTo(2.1);
		expect(
			getWeightSummary([
				{ entry_date: "2026-08-12", weight: 181 },
				{ entry_date: "2026-08-15", weight: 181 }
			]).change
		).toBe(0);
	});

	it("shows a no-weight empty state without fake numbers", () => {
		renderProgress();

		expect(screen.getByText("Your weight journey will appear here after your first weigh-in."))
			.toBeInTheDocument();
		expect(screen.getByText("Starting").closest(".metric-card")).toHaveTextContent("--");
		expect(screen.getByText("Latest").closest(".metric-card")).toHaveTextContent("--");
		expect(screen.getByText("Total change").closest(".metric-card")).toHaveTextContent("--");
	});

	it("shows one recorded weight and a neutral trend prompt", () => {
		renderProgress({
			weightEntries: [{ entry_date: "2026-08-12", weight: 181.6 }]
		});

		expect(screen.getAllByText("181.6 lb").length).toBeGreaterThanOrEqual(2);
		expect(screen.getByText("0 lb")).toBeInTheDocument();
		expect(screen.getAllByText("Wed, Aug 12").length).toBeGreaterThanOrEqual(2);
		expect(screen.getByText("Add another weigh-in to start seeing your trend."))
			.toBeInTheDocument();
		expect(screen.getByText("1 weigh-in recorded")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Wed, Aug 12 181.6 lb/ }))
			.toBeInTheDocument();
	});

	it("renders a multi-point line graph from actual recorded weigh-ins", () => {
		renderProgress({
			weightEntries: [
				{ entry_date: "2026-08-12", weight: 181.6 },
				{ entry_date: "2026-08-14", weight: 180.4 },
				{ entry_date: "2026-08-20", weight: 178.2 }
			]
		});

		const chart = screen.getByRole("img", { name: /Weight line graph/ });
		expect(within(chart).getByText(/3 recorded weigh-ins across 9 calendar days/))
			.toBeInTheDocument();
		expect(chart.querySelector(".weight-line")).toBeInTheDocument();
		expect(screen.getAllByRole("button", { name: /lb/ })).toHaveLength(3);
		expect(screen.getByText("Down 3.4 lb")).toBeInTheDocument();
		expect(screen.getByText("Tracking since Wed, Aug 12")).toBeInTheDocument();
		expect(screen.getByText("3 weigh-ins recorded")).toBeInTheDocument();
	});

	it("represents every calendar date between earliest and latest recorded weight", () => {
		const model = buildWeightChartModel([
			{ entry_date: "2026-08-12", weight: 181.6 },
			{ entry_date: "2026-08-14", weight: 180.4 },
			{ entry_date: "2026-08-15", weight: 179.8 }
		]);

		expect(model?.timelineDays.map((day) => day.dateKey)).toEqual([
			"2026-08-12",
			"2026-08-13",
			"2026-08-14",
			"2026-08-15"
		]);
		expect(model?.points.map((point) => point.entry_date)).toEqual([
			"2026-08-12",
			"2026-08-14",
			"2026-08-15"
		]);
		expect(model?.missingDays.map((day) => day.dateKey)).toEqual(["2026-08-13"]);
		expect(model?.points).toHaveLength(3);
	});

	it("keeps missing dates out of recorded weight points while preserving spacing", () => {
		const model = buildWeightChartModel([
			{ entry_date: "2026-08-12", weight: 181.6 },
			{ entry_date: "2026-08-14", weight: 180.4 }
		]);

		const firstPoint = model?.points[0];
		const missingDay = model?.missingDays[0];
		const secondPoint = model?.points[1];

		expect(missingDay?.dateKey).toBe("2026-08-13");
		expect(missingDay).not.toHaveProperty("weight");
		expect(missingDay?.x).toBeGreaterThan(firstPoint?.x ?? 0);
		expect(missingDay?.x).toBeLessThan(secondPoint?.x ?? 0);
		expect(missingDay?.y).toBeCloseTo(
			((firstPoint?.y ?? 0) + (secondPoint?.y ?? 0)) / 2
		);
	});

	it("scales the y-axis around recorded weights instead of forcing zero", () => {
		const model = buildWeightChartModel([
			{ entry_date: "2026-08-12", weight: 181.6 },
			{ entry_date: "2026-08-20", weight: 178.2 }
		]);

		expect(model?.yMin).toBeGreaterThan(0);
		expect(model?.yMin).toBeLessThan(178.2);
		expect(model?.yMax).toBeGreaterThan(181.6);
		expect(model?.points[0].x).toBeGreaterThanOrEqual(90);
	});

	it("shows short date ranges and thins long date labels while keeping daily spacing", () => {
		const shortModel = buildWeightChartModel([
			{ entry_date: "2026-08-12", weight: 181.6 },
			{ entry_date: "2026-08-14", weight: 180.4 }
		]);
		const longModel = buildWeightChartModel([
			{ entry_date: "2026-08-01", weight: 184 },
			{ entry_date: "2026-08-31", weight: 179 }
		]);

		expect(shortModel?.xLabels.map((label) => label.dateKey)).toEqual([
			"2026-08-12",
			"2026-08-13",
			"2026-08-14"
		]);
		expect(shortModel?.xLabels.map((label) => label.weekday)).toEqual([
			"Wed",
			"Thu",
			"Fri"
		]);
		expect(longModel?.timelineDays).toHaveLength(31);
		expect(longModel?.xLabels.length).toBeLessThan(31);
		expect(longModel?.xLabels.at(0)?.dateKey).toBe("2026-08-01");
		expect(longModel?.xLabels.at(-1)?.dateKey).toBe("2026-08-31");
	});

	it("adds correct local weekday labels for a short Detail date range", () => {
		const model = buildWeightChartModel([
			{ entry_date: "2026-08-09", weight: 206.9 },
			{ entry_date: "2026-08-12", weight: 201.4 }
		]);

		expect(model?.xLabels.map((label) => [label.label, label.weekday])).toEqual([
			["Aug 9", "Sun"],
			["Aug 10", "Mon"],
			["Aug 11", "Tue"],
			["Aug 12", "Wed"]
		]);
	});

	it("keeps Detail non-scrollable for short ranges that fit", () => {
		const model = buildWeightChartModel([
			{ entry_date: "2026-08-12", weight: 181.6 },
			{ entry_date: "2026-08-14", weight: 180.4 }
		]);

		expect(model?.mode).toBe("detail");
		expect(model?.chartWidth).toBe(CHART_WIDTH);
		expect(model?.isHorizontallyScrollable).toBe(false);
	});

	it("makes Detail horizontally scrollable for longer calendar ranges", () => {
		const model = buildWeightChartModel(longRangeEntries().weightEntries);

		expect(model?.timelineDays).toHaveLength(31);
		expect(model?.chartWidth).toBeGreaterThan(CHART_WIDTH);
		expect(model?.isHorizontallyScrollable).toBe(true);
		expect(model?.missingDays.length).toBe(28);
	});

	it("initially scrolls Detail to the latest portion of a long timeline", () => {
		const clientWidth = vi
			.spyOn(HTMLElement.prototype, "clientWidth", "get")
			.mockImplementation(function getClientWidth(this: HTMLElement) {
				return this.classList.contains("weight-chart-viewport") ? 500 : 0;
			});
		const scrollWidth = vi
			.spyOn(HTMLElement.prototype, "scrollWidth", "get")
			.mockImplementation(function getScrollWidth(this: HTMLElement) {
				return this.classList.contains("weight-chart-viewport") ? 1800 : 0;
			});

		try {
			renderProgress(longRangeEntries());
			const viewport = screen.getByLabelText("Scrollable daily weight chart");

			expect(viewport).toHaveAttribute("data-scrollable", "true");
			expect(viewport.scrollLeft).toBe(1300);
			viewport.scrollLeft = 200;
			expect(viewport.scrollLeft).toBe(200);
		} finally {
			clientWidth.mockRestore();
			scrollWidth.mockRestore();
		}
	});

	it("keeps the chart scroll inside its viewport for mobile-friendly overflow", () => {
		renderProgress(longRangeEntries());
		const viewport = screen.getByLabelText("Scrollable daily weight chart");

		expect(viewport).toHaveClass("weight-chart-viewport", "scrollable");
		expect(viewport).toHaveAttribute("data-chart-mode", "detail");
	});

	it("fits All Time into the viewport while preserving elapsed-date positions", () => {
		const model = buildWeightChartModel(longRangeEntries().weightEntries, "all-time");
		const [first, middle, last] = model?.points ?? [];

		expect(model?.chartWidth).toBe(CHART_WIDTH);
		expect(model?.isHorizontallyScrollable).toBe(false);
		expect(middle.x - first.x).toBeLessThan(last.x - middle.x);
		expect(model?.timelineDays).toHaveLength(31);
	});

	it("uses thinned All Time labels and omits excessive missing markers", () => {
		const entries = [
			{ entry_date: "2026-01-01", weight: 184 },
			{ entry_date: "2026-12-31", weight: 176 }
		];
		const model = buildWeightChartModel(entries, "all-time");

		expect(model?.timelineDays).toHaveLength(365);
		expect(model?.xLabels.length).toBeLessThan(20);
		expect(model?.xLabels.some((label) => label.label === "Jan")).toBe(true);
		expect(model?.shouldShowMissingMarkers).toBe(false);
	});

	it("switches Detail and All Time without changing recorded weight data", () => {
		renderProgress(longRangeEntries());

		expect(screen.getByRole("button", { name: "Detail" })).toHaveAttribute(
			"aria-pressed",
			"true"
		);
		expect(screen.getAllByRole("button", { name: /lb/ })).toHaveLength(3);
		fireEvent.click(screen.getByRole("button", { name: "All Time" }));
		expect(screen.getByRole("button", { name: "All Time" })).toHaveAttribute(
			"aria-pressed",
			"true"
		);
		expect(screen.getByLabelText("Weight chart")).toHaveAttribute(
			"data-chart-mode",
			"all-time"
		);
		expect(screen.getAllByRole("button", { name: /lb/ })).toHaveLength(3);
	});

	it("processes hundreds of timeline dates without rendering no-entry markers in All Time", () => {
		renderProgress({
			weightEntries: [
				{ entry_date: "2026-01-01", weight: 184 },
				{ entry_date: "2026-06-01", weight: 180 },
				{ entry_date: "2026-12-31", weight: 176 }
			]
		});

		fireEvent.click(screen.getByRole("button", { name: "All Time" }));
		expect(screen.getByRole("img", { name: /365 calendar days/ })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /no weight recorded/ })).not.toBeInTheDocument();
	});

	it("updates the detail tooltip from pointer and keyboard focus", () => {
		renderProgress({
			weightEntries: [
				{ entry_date: "2026-08-12", weight: 181.6 },
				{ entry_date: "2026-08-20", weight: 178.2 }
			]
		});

		const secondPoint = screen.getByRole("button", { name: /Thu, Aug 20 178.2 lb/ });
		fireEvent.click(secondPoint);
		expect(screen.getByRole("status")).toHaveTextContent("178.2 lb");
		expect(screen.getByRole("status")).toHaveTextContent("Thu, Aug 20");

		const firstPoint = screen.getByRole("button", { name: /Wed, Aug 12 181.6 lb/ });
		fireEvent.focus(firstPoint);
		expect(screen.getByRole("status")).toHaveTextContent("181.6 lb");
	});

	it("shows missing dates as no-entry markers without fake weight tooltips", () => {
		renderProgress({
			weightEntries: [
				{ entry_date: "2026-08-12", weight: 181.6 },
				{ entry_date: "2026-08-14", weight: 180.4 }
			]
		});

		const missingPoint = screen.getByRole("button", {
			name: /Thu, Aug 13 no weight recorded/
		});
		expect(missingPoint).toHaveClass("missing-weight-point");
		fireEvent.click(missingPoint);
		expect(screen.getByRole("status")).toHaveTextContent("No weight recorded");
		expect(screen.getByRole("status")).toHaveTextContent("Thu, Aug 13");
		expect(screen.getByRole("status")).not.toHaveTextContent("181.0 lb");
		expect(screen.getByLabelText("Weight chart legend")).toHaveTextContent("No entry");
	});

	it("renders weekday labels and the sparkle tracking footer", () => {
		renderProgress({
			weightEntries: [
				{ entry_date: "2026-08-09", weight: 206.9 },
				{ entry_date: "2026-08-12", weight: 201.4 }
			]
		});

		expect(screen.getByText("Sun")).toBeInTheDocument();
		expect(screen.getByText("Wed")).toBeInTheDocument();
		expect(screen.getByText("Tracking since Sun, Aug 9")).toBeInTheDocument();
		expect(screen.getByText("2 weigh-ins recorded")).toBeInTheDocument();
	});

	it("shows loading and generic error states without raw Supabase details", () => {
		mockProgressLoading = true;
		renderProgress();
		expect(screen.getByRole("status")).toHaveTextContent("Loading your chart board...");

		mockProgressLoading = false;
		mockProgressError = new Error("raw progress query");
		renderProgress();
		expect(screen.getByRole("alert")).toHaveTextContent("Progress could not load");
		expect(screen.queryByText("raw progress query")).not.toBeInTheDocument();
	});

	it("keeps one graph-paper background layer and left-aligned max-width Progress layout", () => {
		expect(css).toContain(
			".progress-layout {\n\tgrid-template-columns: 1fr;\n\twidth: min(100%, 58rem);\n\tmargin-inline: 0;"
		);
		expect(css).toContain(".progress-chart-board {\n\tdisplay: grid;");
		expect(css).toContain("\tbackground: var(--paper);");
		expect(css).toContain(".weight-chart {\n\tdisplay: block;");
		expect(css).toContain("\tbackground: transparent;");
		expect(css).toContain(
			"linear-gradient(rgba(205, 178, 154, 0.34) 1px, transparent 1px)"
		);
	});

	it("caps Today clipboard width while preserving the compact side column and mobile stack", () => {
		expect(css).toContain(
			"grid-template-columns: minmax(0, 50rem) minmax(17rem, 23rem);"
		);
		expect(css).toContain("width: min(100%, 74rem);");
		expect(css).toContain(
			".today-layout,\n\t.history-layout,\n\t.metric-strip {\n\t\tgrid-template-columns: 1fr;"
		);
	});
});

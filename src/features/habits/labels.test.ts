import { describe, expect, it } from "vitest";
import { moveItem } from "./api";
import {
	categoryLabel,
	goalLabelForTrackingType,
	scheduleOptions,
	shouldShowGoalFields,
	trackingLabel
} from "./labels";

describe("habit UI labels", () => {
	it("maps internal values to friendly labels", () => {
		expect(trackingLabel("checkbox")).toBe("Check-off");
		expect(trackingLabel("duration")).toBe("Minutes / Duration");
		expect(categoryLabel("glow_up")).toBe("Glow Up");
		expect(scheduleOptions.map((option) => option.label)).toContain("Every X days");
		expect(scheduleOptions.map((option) => option.label)).not.toContain("every_x_days");
	});

	it("shows goal fields only when the tracking type needs them", () => {
		expect(shouldShowGoalFields("checkbox")).toBe(false);
		expect(shouldShowGoalFields("numeric")).toBe(true);
		expect(goalLabelForTrackingType("duration")).toBe("Goal minutes");
		expect(goalLabelForTrackingType("quantity")).toBe("Goal quantity");
	});

	it("resequences item order by moving one item within a list", () => {
		expect(moveItem([{ id: "a" }, { id: "b" }, { id: "c" }], 0, 1)).toEqual([
			{ id: "b" },
			{ id: "a" },
			{ id: "c" }
		]);
		expect(moveItem([{ id: "a" }, { id: "b" }], 0, -1)).toEqual([
			{ id: "a" },
			{ id: "b" }
		]);
	});
});

import { describe, expect, it } from "vitest";
import { getDueChecklistItems, isChecklistItemDue, V05_CHECKLIST_ITEMS } from "./checklist";

describe("V0.5 checklist recurrence", () => {
	it("includes every-other-day items on the approved anchor date", () => {
		const dueKeys = getDueChecklistItems("2026-08-12").map((item) => item.key);

		expect(dueKeys).toContain("morning_skincare");
		expect(dueKeys).toContain("workout");
		expect(dueKeys).toContain("iron");
		expect(dueKeys).toContain("irestore_helmet");
		expect(dueKeys).toContain("irestore_mask");
	});

	it("excludes every-other-day items on the day after the anchor", () => {
		const dueKeys = getDueChecklistItems("2026-08-13").map((item) => item.key);

		expect(dueKeys).toContain("morning_skincare");
		expect(dueKeys).toContain("workout");
		expect(dueKeys).not.toContain("iron");
		expect(dueKeys).not.toContain("irestore_helmet");
		expect(dueKeys).not.toContain("irestore_mask");
	});

	it("keeps every-other-day recurrence deterministic after the anchor", () => {
		const iron = V05_CHECKLIST_ITEMS.find((item) => item.key === "iron");

		expect(iron).toBeDefined();
		expect(isChecklistItemDue(iron!, "2026-08-14")).toBe(true);
		expect(isChecklistItemDue(iron!, "2026-08-15")).toBe(false);
		expect(isChecklistItemDue(iron!, "2026-08-16")).toBe(true);
	});
});

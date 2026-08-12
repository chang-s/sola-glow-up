import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TodayPage } from "./TodayPage";
import type { V05TodayData } from "./types";

const mockSaveDailyEntry = vi.fn();
const mockSetChecklistCompletion = vi.fn();
let mockTodayData: V05TodayData;
let mockTodayDataByDate: Record<string, V05TodayData>;

vi.mock("../auth/useAuth", () => ({
	useAuth: () => ({ isConfigured: true })
}));

vi.mock("./useV05Today", () => ({
	useV05Today: (dateKey: string) => ({
		profile: { isLoading: false, error: null, data: { id: "profile-1" } },
		today: {
			isLoading: false,
			error: null,
			data: mockTodayDataByDate[dateKey] ?? mockTodayData
		},
		saveDailyEntry: {
			isPending: false,
			mutateAsync: (input: unknown) => mockSaveDailyEntry({ dateKey, input })
		},
		setChecklistCompletion: {
			isPending: false,
			mutateAsync: (input: unknown) =>
				mockSetChecklistCompletion({ dateKey, ...(input as object) })
		}
	})
}));

function renderToday(
	data: V05TodayData = { dailyEntry: null, checklistCompletions: [] },
	dataByDate: Record<string, V05TodayData> = {}
) {
	mockTodayData = data;
	mockTodayDataByDate = dataByDate;
	return render(<TodayPage />);
}

function setEntryDate(dateKey: string) {
	fireEvent.change(screen.getByLabelText("Entry date"), {
		target: { value: dateKey }
	});
}

describe("V0.5 Today page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockTodayData = { dailyEntry: null, checklistCompletions: [] };
		mockTodayDataByDate = {};
		mockSaveDailyEntry.mockResolvedValue({});
		mockSetChecklistCompletion.mockResolvedValue({});
	});

	it("renders daily and every-other-day due items for August 12", () => {
		renderToday();

		fireEvent.change(screen.getByLabelText("Entry date"), {
			target: { value: "2026-08-12" }
		});

		expect(screen.getByLabelText("Morning Skincare")).toBeInTheDocument();
		expect(screen.getByLabelText("Evening Skincare")).toBeInTheDocument();
		expect(screen.getByLabelText("Vitamins")).toBeInTheDocument();
		expect(screen.getByLabelText("Minoxidil")).toBeInTheDocument();
		expect(screen.getByLabelText("Worked Out")).toBeInTheDocument();
		expect(screen.getByLabelText("Iron")).toBeInTheDocument();
		expect(screen.getByLabelText("iRestore Helmet")).toBeInTheDocument();
		expect(screen.getByLabelText("iRestore Mask")).toBeInTheDocument();
	});

	it("hides every-other-day items when they are not due", () => {
		renderToday();

		fireEvent.change(screen.getByLabelText("Entry date"), {
			target: { value: "2026-08-13" }
		});

		expect(screen.getByLabelText("Morning Skincare")).toBeInTheDocument();
		expect(screen.getByLabelText("Worked Out")).toBeInTheDocument();
		expect(screen.queryByLabelText("Iron")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("iRestore Helmet")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("iRestore Mask")).not.toBeInTheDocument();
	});

	it("loads existing saved values", () => {
		renderToday({
			dailyEntry: {
				id: "entry-1",
				user_id: "profile-1",
				entry_date: "2026-08-12",
				weight: 182.4,
				steps: 8123,
				sleep_duration_minutes: 455,
				bedtime: "23:10:00",
				wake_time: "06:45:00",
				previous_day_calories: 1840,
				worked_out: true,
				workout_activity_type: "Walk",
				workout_duration_minutes: 35,
				notes: "cozy start"
			},
			checklistCompletions: [
				{
					id: "completion-1",
					user_id: "profile-1",
					entry_date: "2026-08-12",
					item_key: "vitamins",
					completed: true
				}
			]
		});

		expect(screen.getByLabelText(/Weight/)).toHaveValue(182.4);
		expect(screen.getByLabelText("Steps")).toHaveValue(8123);
		expect(screen.getByLabelText("Sleep hours")).toHaveValue(7);
		expect(screen.getByLabelText("Sleep minutes")).toHaveValue(35);
		expect(screen.getByLabelText("Bedtime")).toHaveValue("23:10");
		expect(screen.getByLabelText("Wake-up time")).toHaveValue("06:45");
		expect(screen.getByLabelText("Yesterday's calories")).toHaveValue(1840);
		expect(screen.getByLabelText("Activity type")).toHaveValue("Walk");
		expect(screen.getByLabelText(/Duration/)).toHaveValue(35);
		expect(screen.getByLabelText("Tiny note")).toHaveValue("cozy start");
		expect(screen.getByLabelText("Vitamins")).toBeChecked();
	});

	it("persists checklist check and uncheck interactions", async () => {
		renderToday();
		setEntryDate("2026-08-12");

		fireEvent.click(screen.getByLabelText("Vitamins"));

		await waitFor(() => {
			expect(mockSetChecklistCompletion).toHaveBeenCalledWith({
				dateKey: "2026-08-12",
				itemKey: "vitamins",
				completed: true
			});
		});

		fireEvent.click(screen.getByLabelText("Vitamins"));

		await waitFor(() => {
			expect(mockSetChecklistCompletion).toHaveBeenLastCalledWith({
				dateKey: "2026-08-12",
				itemKey: "vitamins",
				completed: false
			});
		});
	});

	it("saves daily input edits with user-friendly sleep minutes", async () => {
		renderToday();
		setEntryDate("2026-08-12");

		fireEvent.change(screen.getByLabelText(/Weight/), { target: { value: "181.6" } });
		fireEvent.change(screen.getByLabelText("Steps"), { target: { value: "7500" } });
		fireEvent.change(screen.getByLabelText("Sleep hours"), { target: { value: "7" } });
		fireEvent.change(screen.getByLabelText("Sleep minutes"), { target: { value: "15" } });
		fireEvent.change(screen.getByLabelText("Bedtime"), { target: { value: "23:30" } });
		fireEvent.change(screen.getByLabelText("Wake-up time"), { target: { value: "06:45" } });
		fireEvent.change(screen.getByLabelText("Yesterday's calories"), {
			target: { value: "1900" }
		});
		fireEvent.change(screen.getByLabelText("Tiny note"), {
			target: { value: "felt good" }
		});
		fireEvent.click(screen.getByRole("button", { name: "Save today's check-in" }));

		await waitFor(() => {
			expect(mockSaveDailyEntry).toHaveBeenCalledWith({
				dateKey: "2026-08-12",
				input: {
					weight: 181.6,
					steps: 7500,
					sleep_duration_minutes: 435,
					bedtime: "23:30",
					wake_time: "06:45",
					previous_day_calories: 1900,
					worked_out: false,
					workout_activity_type: null,
					workout_duration_minutes: null,
					notes: "felt good"
				}
			});
		});
	});

	it("reveals workout details only when Worked Out is checked", async () => {
		renderToday();
		setEntryDate("2026-08-12");

		expect(screen.getByLabelText("Activity type")).toBeDisabled();
		expect(screen.getByLabelText(/Duration/)).toBeDisabled();

		fireEvent.click(screen.getByLabelText("Worked Out"));

		await waitFor(() => {
			expect(mockSetChecklistCompletion).toHaveBeenCalledWith({
				dateKey: "2026-08-12",
				itemKey: "workout",
				completed: true
			});
		});
		expect(screen.getByLabelText("Activity type")).not.toBeDisabled();
		expect(screen.getByLabelText(/Duration/)).not.toBeDisabled();
	});

	it("shows save failure feedback without exposing raw errors", async () => {
		mockSaveDailyEntry.mockRejectedValue(new Error("raw database detail"));
		renderToday();
		setEntryDate("2026-08-12");

		fireEvent.click(screen.getByRole("button", { name: "Save today's check-in" }));

		await waitFor(() => {
			expect(screen.getByRole("alert")).toHaveTextContent(
				"Your check-in could not save. Please try again."
			);
		});
		expect(screen.queryByText("raw database detail")).not.toBeInTheDocument();
	});

	it("selects calendar dates and synchronizes the date control", () => {
		renderToday();
		setEntryDate("2026-08-12");

		fireEvent.click(screen.getByRole("button", { name: "2026-08-11" }));

		expect(screen.getByLabelText("Entry date")).toHaveValue("2026-08-11");
		expect(screen.queryByLabelText("Iron")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "2026-08-11" })).toHaveAttribute(
			"aria-current",
			"date"
		);
	});

	it("loads saved daily entry and checklist completions for a selected past date", () => {
		renderToday(
			{ dailyEntry: null, checklistCompletions: [] },
			{
				"2026-08-11": {
					dailyEntry: {
						id: "entry-past",
						user_id: "profile-1",
						entry_date: "2026-08-11",
						weight: 183.2,
						steps: 6400,
						sleep_duration_minutes: 420,
						bedtime: "22:45:00",
						wake_time: "05:45:00",
						previous_day_calories: 2010,
						worked_out: false,
						workout_activity_type: null,
						workout_duration_minutes: null,
						notes: "backfilled"
					},
					checklistCompletions: [
						{
							id: "completion-past",
							user_id: "profile-1",
							entry_date: "2026-08-11",
							item_key: "morning_skincare",
							completed: true
						}
					]
				}
			}
		);
		setEntryDate("2026-08-12");

		fireEvent.click(screen.getByRole("button", { name: "2026-08-11" }));

		expect(screen.getByLabelText(/Weight/)).toHaveValue(183.2);
		expect(screen.getByLabelText("Steps")).toHaveValue(6400);
		expect(screen.getByLabelText("Sleep hours")).toHaveValue(7);
		expect(screen.getByLabelText("Morning Skincare")).toBeChecked();
		expect(screen.queryByLabelText("Iron")).not.toBeInTheDocument();
	});

	it("saves edits to the selected past date", async () => {
		renderToday();
		setEntryDate("2026-08-12");

		fireEvent.click(screen.getByRole("button", { name: "2026-08-11" }));
		fireEvent.change(screen.getByLabelText(/Weight/), { target: { value: "183" } });
		fireEvent.click(screen.getByRole("button", { name: "Save today's check-in" }));

		await waitFor(() => {
			expect(mockSaveDailyEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					dateKey: "2026-08-11",
					input: expect.objectContaining({ weight: 183 })
				})
			);
		});
	});

	it("disables future calendar dates", () => {
		renderToday();
		setEntryDate("2026-08-12");

		expect(screen.getByRole("button", { name: "2026-08-13" })).toBeDisabled();
	});

	it("changes visible calendar month without changing the active date", () => {
		renderToday();
		setEntryDate("2026-08-12");

		fireEvent.click(screen.getByRole("button", { name: "Previous month" }));

		expect(screen.getByRole("heading", { name: "July 2026" })).toBeInTheDocument();
		expect(screen.getByLabelText("Entry date")).toHaveValue("2026-08-12");
		expect(screen.queryByRole("button", { name: "2026-08-12" })).not.toBeInTheDocument();
	});

	it("renders distinct streak icon slots and keeps field labels accessible", () => {
		const { container } = renderToday();

		expect(container.querySelectorAll(".streak-card .streak-icon")).toHaveLength(5);
		expect(screen.getByLabelText(/Weight/)).toBeInTheDocument();
		expect(screen.getByLabelText("Steps")).toBeInTheDocument();
		expect(screen.getByLabelText("Yesterday's calories")).toBeInTheDocument();
	});
});

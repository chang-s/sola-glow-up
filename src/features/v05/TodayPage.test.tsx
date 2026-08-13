import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import css from "../../styles/global.css?raw";
import { TodayPage } from "./TodayPage";
import type { V05FoodPhotoWithUrl, V05MotivationData, V05TodayData } from "./types";

const mockSaveDailyEntry = vi.fn();
const mockSetChecklistCompletion = vi.fn();
const mockUploadFoodPhoto = vi.fn();
const mockDeleteFoodPhoto = vi.fn();
let mockTodayData: V05TodayData;
let mockTodayDataByDate: Record<string, V05TodayData>;
let mockMotivationData: V05MotivationData;
let mockMotivationError: Error | null;
let mockFoodPhotos: V05FoodPhotoWithUrl[];

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
		motivation: {
			isLoading: false,
			error: mockMotivationError,
			data: mockMotivationData
		},
		foodPhotos: {
			isLoading: false,
			error: null,
			data: mockFoodPhotos
		},
		saveDailyEntry: {
			isPending: false,
			mutateAsync: (input: unknown) => mockSaveDailyEntry({ dateKey, input })
		},
		setChecklistCompletion: {
			isPending: false,
			mutateAsync: (input: unknown) =>
				mockSetChecklistCompletion({ dateKey, ...(input as object) })
		},
		uploadFoodPhoto: {
			isPending: false,
			mutateAsync: (input: unknown) => mockUploadFoodPhoto({ dateKey, input })
		},
		deleteFoodPhoto: {
			isPending: false,
			mutateAsync: (input: unknown) => mockDeleteFoodPhoto({ dateKey, input })
		}
	})
}));

function renderToday(
	data: V05TodayData = { dailyEntry: null, checklistCompletions: [] },
	dataByDate: Record<string, V05TodayData> = {},
	motivationData: V05MotivationData = {
		trackingStartDate: "2026-08-10",
		dailyEntries: [],
		checklistCompletions: []
	}
) {
	mockTodayData = data;
	mockTodayDataByDate = dataByDate;
	mockMotivationData = motivationData;
	return render(
		<MemoryRouter>
			<TodayPage />
		</MemoryRouter>
	);
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
		mockMotivationData = {
			trackingStartDate: "2026-08-10",
			dailyEntries: [],
			checklistCompletions: []
		};
		mockMotivationError = null;
		mockFoodPhotos = [];
		mockSaveDailyEntry.mockResolvedValue({});
		mockSetChecklistCompletion.mockResolvedValue({});
		mockUploadFoodPhoto.mockResolvedValue({});
		mockDeleteFoodPhoto.mockResolvedValue({});
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
			target: { value: "2026-08-11" }
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
		expect(screen.getByLabelText("Sleep")).toHaveValue("07:35");
		expect(screen.getByLabelText("Bedtime")).toHaveValue("23:10");
		expect(screen.getByLabelText("Wake-up time")).toHaveValue("06:45");
		expect(screen.getByLabelText("Today's calories")).toHaveValue(1840);
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

	it("saves daily input edits with user-friendly sleep duration", async () => {
		renderToday();
		setEntryDate("2026-08-12");

		fireEvent.change(screen.getByLabelText(/Weight/), { target: { value: "181.6" } });
		fireEvent.change(screen.getByLabelText("Steps"), { target: { value: "7500" } });
		fireEvent.change(screen.getByLabelText("Sleep"), { target: { value: "07:15" } });
		fireEvent.change(screen.getByLabelText("Bedtime"), { target: { value: "23:30" } });
		fireEvent.change(screen.getByLabelText("Wake-up time"), { target: { value: "06:45" } });
		fireEvent.change(screen.getByLabelText("Today's calories"), {
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

	it("does not save malformed sleep duration values", async () => {
		renderToday();
		setEntryDate("2026-08-12");

		fireEvent.change(screen.getByLabelText("Sleep"), { target: { value: "7.5" } });
		fireEvent.click(screen.getByRole("button", { name: "Save today's check-in" }));

		expect(
			await screen.findByText("Enter sleep as HH:MM, like 07:30.")
		).toBeInTheDocument();
		expect(mockSaveDailyEntry).not.toHaveBeenCalled();
	});

	it("does not save sleep durations with invalid minutes", async () => {
		renderToday();
		setEntryDate("2026-08-12");

		fireEvent.change(screen.getByLabelText("Sleep"), { target: { value: "07:75" } });
		fireEvent.click(screen.getByRole("button", { name: "Save today's check-in" }));

		expect(await screen.findByText("Sleep minutes must be between 00 and 59."))
			.toBeInTheDocument();
		expect(mockSaveDailyEntry).not.toHaveBeenCalled();
	});

	it("reveals workout details only when Worked Out is checked", async () => {
		renderToday();
		setEntryDate("2026-08-12");

		expect(screen.queryByLabelText("Activity type")).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/Duration/)).not.toBeInTheDocument();

		fireEvent.click(screen.getByLabelText("Worked Out"));

		await waitFor(() => {
			expect(mockSetChecklistCompletion).toHaveBeenCalledWith({
				dateKey: "2026-08-12",
				itemKey: "workout",
				completed: true
			});
		});
		expect(screen.getByLabelText("Activity type")).toBeInTheDocument();
		expect(screen.getByLabelText(/Duration/)).toBeInTheDocument();
		expect(screen.getByLabelText("Worked Out")).toHaveAttribute("aria-expanded", "true");
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

		fireEvent.click(screen.getByRole("button", { name: /2026-08-11/ }));

		expect(screen.getByLabelText("Entry date")).toHaveValue("2026-08-11");
		expect(screen.queryByLabelText("Iron")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /2026-08-11/ })).toHaveAttribute(
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

		fireEvent.click(screen.getByRole("button", { name: /2026-08-11/ }));

		expect(screen.getByLabelText(/Weight/)).toHaveValue(183.2);
		expect(screen.getByLabelText("Steps")).toHaveValue(6400);
		expect(screen.getByLabelText("Sleep")).toHaveValue("07:00");
		expect(screen.getByLabelText("Morning Skincare")).toBeChecked();
		expect(screen.queryByLabelText("Iron")).not.toBeInTheDocument();
	});

	it("saves edits to the selected past date", async () => {
		renderToday();
		setEntryDate("2026-08-12");

		fireEvent.click(screen.getByRole("button", { name: /2026-08-11/ }));
		fireEvent.change(screen.getByLabelText(/Weight/), { target: { value: "183" } });
		fireEvent.change(screen.getByLabelText("Today's calories"), {
			target: { value: "1888" }
		});
		fireEvent.click(screen.getByRole("button", { name: "Save today's check-in" }));

		await waitFor(() => {
			expect(mockSaveDailyEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					dateKey: "2026-08-11",
					input: expect.objectContaining({
						weight: 183,
						previous_day_calories: 1888
					})
				})
			);
		});
	});

	it("disables future calendar dates", () => {
		renderToday();
		setEntryDate("2026-08-12");

		expect(screen.getByRole("button", { name: /2026-08-13/ })).toBeDisabled();
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
		expect(container.querySelectorAll(".field-icon .pixel-art-icon").length).toBeGreaterThan(8);
		expect(container.querySelector(".today-mascot")).not.toBeInTheDocument();
		expect(screen.getByLabelText(/Weight/)).toBeInTheDocument();
		expect(screen.getByLabelText("Steps")).toBeInTheDocument();
		expect(screen.getByLabelText("Sleep")).toHaveAttribute("placeholder", "HH:MM");
		expect(screen.queryByText("HH:MM")).not.toBeInTheDocument();
		expect(screen.getByLabelText("Today's calories")).toBeInTheDocument();
	});

	it("renders Today as checklist, daily details, and food scrapbook sections", () => {
		const { container } = renderToday();

		expect(screen.getByRole("heading", { name: "Checklist" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Daily details" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Food photos" })).toBeInTheDocument();
		expect(container.querySelectorAll(".checkin-section")).toHaveLength(3);
		expect(container.querySelector(".board-clip")).toBeInTheDocument();
	});

	it("uses styled food upload controls while keeping the real file input accessible", () => {
		const { container } = renderToday();
		const file = new File(["tiny"], "somi-photo.jpg", { type: "image/jpeg" });
		const fileInput = screen.getByLabelText("Choose photo");
		const cameraInput = screen.getByLabelText("Take photo");

		expect(fileInput).toHaveAttribute("type", "file");
		expect(fileInput).toHaveAttribute("accept", expect.stringContaining("image/*"));
		expect(cameraInput).toHaveAttribute("type", "file");
		expect(cameraInput).toHaveAttribute("accept", "image/*");
		expect(cameraInput).toHaveAttribute("capture", "environment");
		expect(container.querySelector(".photo-action-row")).toHaveTextContent("Take photo");
		expect(container.querySelector(".photo-action-row")).toHaveTextContent("Choose photo");
		expect(container.querySelector(".photo-picker-button .pixel-art-icon"))
			.not.toBeInTheDocument();
		expect(screen.getByText("No photo selected yet")).toHaveClass("selected-file-name");
		expect(css).toContain(".selected-file-name {\n\tmargin: 0;");
		expect(css).toContain("\tfont-style: italic;");
		expect(css).toContain("\tfont-weight: 400;");
		expect(css).toContain("\ttext-align: center;");
		expect(css).toContain(".food-upload-button {\n\tjustify-self: start;\n\tfont-weight: 400;");

		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(screen.getByText("Selected: somi-photo.jpg")).toBeInTheDocument();
		expect(screen.getByLabelText("Meal type")).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "Choose one" })).toHaveValue("");
		expect(screen.getByLabelText("Food note")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Salmon + veggies")).toBeInTheDocument();
	});

	it("opens shared photo detail from a Today thumbnail and deletes from it", async () => {
		vi.spyOn(window, "confirm").mockReturnValue(true);
		mockFoodPhotos = [
			{
				id: "photo-1",
				user_id: "profile-1",
				entry_date: "2026-08-12",
				storage_path: "profile-1/2026-08-12/photo.jpg",
				meal_type: "Snack",
				note: "Protein shake",
				signedUrl: "https://signed.example/photo",
				deleted_at: null
			},
			{
				id: "photo-2",
				user_id: "profile-1",
				entry_date: "2026-08-12",
				storage_path: "profile-1/2026-08-12/photo-2.jpg",
				meal_type: "Dinner",
				note: "Second photo",
				signedUrl: "https://signed.example/photo-2",
				deleted_at: null
			}
		];
		renderToday();

		fireEvent.click(screen.getByRole("button", { name: /Open Snack food photo/ }));

		const dialog = screen.getByRole("dialog", { name: "Snack" });
		expect(dialog).toBeInTheDocument();
		expect(within(dialog).getByText("Protein shake")).toBeInTheDocument();
		expect(screen.getByText("1 of 2")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
		expect(screen.getByRole("dialog", { name: "Dinner" })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Delete photo" }));

		await waitFor(() => {
			expect(mockDeleteFoodPhoto).toHaveBeenCalledWith(
				expect.objectContaining({
					dateKey: "2026-08-12",
					input: expect.objectContaining({ id: "photo-2" })
				})
			);
		});
	});

	it("renders real calendar completion states with selected and today states", () => {
		const { container } = renderToday(
			{ dailyEntry: null, checklistCompletions: [] },
			{},
			{
				trackingStartDate: "2026-08-10",
				dailyEntries: [
					{
						id: "entry-12",
						user_id: "profile-1",
						entry_date: "2026-08-12",
						weight: null,
						steps: null,
						sleep_duration_minutes: null,
						bedtime: null,
						wake_time: null,
						previous_day_calories: null,
						worked_out: false,
						workout_activity_type: null,
						workout_duration_minutes: null,
						notes: null
					}
				],
				checklistCompletions: [
					{
						id: "completion-1",
						user_id: "profile-1",
						entry_date: "2026-08-12",
						item_key: "morning_skincare",
						completed: true
					},
					{
						id: "completion-2",
						user_id: "profile-1",
						entry_date: "2026-08-12",
						item_key: "evening_skincare",
						completed: true
					},
					{
						id: "completion-3",
						user_id: "profile-1",
						entry_date: "2026-08-12",
						item_key: "vitamins",
						completed: true
					},
					{
						id: "completion-4",
						user_id: "profile-1",
						entry_date: "2026-08-12",
						item_key: "minoxidil",
						completed: true
					},
					{
						id: "completion-5",
						user_id: "profile-1",
						entry_date: "2026-08-12",
						item_key: "workout",
						completed: true
					},
					{
						id: "completion-6",
						user_id: "profile-1",
						entry_date: "2026-08-12",
						item_key: "iron",
						completed: true
					},
					{
						id: "completion-7",
						user_id: "profile-1",
						entry_date: "2026-08-12",
						item_key: "irestore_helmet",
						completed: true
					}
				]
			}
		);
		setEntryDate("2026-08-12");

		const selectedToday = screen.getByRole("button", {
			name: /2026-08-12, Great day, today/
		});

		expect(selectedToday).toHaveAttribute("aria-current", "date");
		expect(selectedToday).toHaveClass("great");
		expect(selectedToday).toHaveClass("today");
		expect(selectedToday).toHaveClass("selected");
		expect(container.querySelector(".calendar-legend")).toHaveTextContent("Great");
	});

	it("shows real streak values and gentle zero text", () => {
		const { container } = renderToday(
			{ dailyEntry: null, checklistCompletions: [] },
			{},
			{
				trackingStartDate: "2026-08-10",
				dailyEntries: [
					{
						id: "entry-10",
						user_id: "profile-1",
						entry_date: "2026-08-10",
						weight: null,
						steps: null,
						sleep_duration_minutes: null,
						bedtime: null,
						wake_time: null,
						previous_day_calories: null,
						worked_out: false,
						workout_activity_type: null,
						workout_duration_minutes: null,
						notes: null
					},
					{
						id: "entry-11",
						user_id: "profile-1",
						entry_date: "2026-08-11",
						weight: null,
						steps: null,
						sleep_duration_minutes: null,
						bedtime: null,
						wake_time: null,
						previous_day_calories: null,
						worked_out: false,
						workout_activity_type: null,
						workout_duration_minutes: null,
						notes: null
					}
				],
				checklistCompletions: [
					{
						id: "vitamins-10",
						user_id: "profile-1",
						entry_date: "2026-08-10",
						item_key: "vitamins",
						completed: true
					},
					{
						id: "vitamins-11",
						user_id: "profile-1",
						entry_date: "2026-08-11",
						item_key: "vitamins",
						completed: true
					}
				]
			}
		);
		const streakList = container.querySelector<HTMLElement>(".streak-list")!;
		const streaks = within(streakList);

		expect(streaks.getByText("Vitamins").closest(".streak-card")).toHaveTextContent("2 days");
		expect(streaks.getByText("Workout").closest(".streak-card")).toHaveTextContent(
			"Start today"
		);
	});

	it("keeps Today usable if the motivational summary query fails", () => {
		mockMotivationError = new Error("raw progress query");
		renderToday();

		expect(screen.getByLabelText(/Weight/)).toBeInTheDocument();
		expect(screen.getByText("Motivation panel could not refresh. Your check-in still works."))
			.toBeInTheDocument();
		expect(screen.queryByText("raw progress query")).not.toBeInTheDocument();
	});
});

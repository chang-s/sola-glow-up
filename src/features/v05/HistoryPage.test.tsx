import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import css from "../../styles/global.css?raw";
import { HistoryPage } from "./HistoryPage";
import type { V05HistoryData } from "./types";

const mockDeleteFoodPhoto = vi.fn();
let mockHistoryData: V05HistoryData;
let mockHistoryError: Error | null;

vi.mock("./useV05Today", () => ({
	useV05History: () => ({
		profile: { isLoading: false, error: null, data: { id: "profile-1" } },
		history: {
			isLoading: false,
			error: mockHistoryError,
			data: mockHistoryData
		}
	}),
	useV05Today: () => ({
		deleteFoodPhoto: {
			isPending: false,
			error: null,
			mutateAsync: mockDeleteFoodPhoto
		}
	})
}));

function dailyEntry(entry_date: string, overrides = {}) {
	return {
		id: `entry-${entry_date}`,
		user_id: "profile-1",
		entry_date,
		weight: null,
		steps: null,
		sleep_duration_minutes: null,
		bedtime: null,
		wake_time: null,
		previous_day_calories: null,
		worked_out: false,
		workout_activity_type: null,
		workout_duration_minutes: null,
		notes: null,
		...overrides
	};
}

function renderHistory(data: Partial<V05HistoryData> = {}) {
	mockHistoryData = {
		dailyEntries: [],
		checklistCompletions: [],
		foodPhotos: [],
		...data
	};

	return render(
		<MemoryRouter>
			<HistoryPage />
		</MemoryRouter>
	);
}

describe("V0.5 History page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockHistoryError = null;
		mockDeleteFoodPhoto.mockResolvedValue({});
		mockHistoryData = {
			dailyEntries: [],
			checklistCompletions: [],
			foodPhotos: []
		};
	});

	it("shows an empty daily history state", () => {
		const { container } = renderHistory();

		expect(screen.getByRole("heading", { name: "Daily entries" })).toBeInTheDocument();
		expect(container.querySelector(".icon-eyebrow .pixel-art-icon")).toBeInTheDocument();
		expect(screen.getByText("Your first page starts with today's check-in."))
			.toBeInTheDocument();
	});

	it("loads historical daily entries with compact summaries", () => {
		renderHistory({
			dailyEntries: [
				dailyEntry("2026-08-12", {
					weight: 181.6,
					steps: 7500,
					sleep_duration_minutes: 435,
					worked_out: true,
					workout_activity_type: "Walk"
				})
			],
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

		const card = screen.getByRole("button", { name: /Wed, Aug 12/ });
		expect(card).toHaveTextContent("181.6 lb");
		expect(card).toHaveTextContent("7,500 steps");
		expect(card).toHaveTextContent("7h 15m");
		expect(card).toHaveTextContent("Workout: Walk");
		expect(card).toHaveTextContent("1/8 checks");
		expect(screen.getByLabelText("Completed checklist items")).toHaveTextContent("Vitamins");
		expect(screen.getByLabelText("Completed checklist items")).not.toHaveTextContent(
			"Morning Skincare"
		);
	});

	it("shows a neutral state when no checklist items were completed", () => {
		renderHistory({
			dailyEntries: [dailyEntry("2026-08-12")],
			checklistCompletions: []
		});

		expect(screen.getByText("No checklist items completed.")).toBeInTheDocument();
		expect(screen.getByText("0/8 done")).toBeInTheDocument();
	});

	it("supports selected-day navigation and future-day protection", () => {
		renderHistory();

		fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
		expect(screen.getByLabelText("Selected history date")).toHaveValue("2026-08-11");
		expect(screen.getByRole("button", { name: "Next day" })).not.toBeDisabled();

		fireEvent.click(screen.getByRole("button", { name: "Next day" }));
		expect(screen.getByLabelText("Selected history date")).toHaveValue("2026-08-12");
		expect(screen.getByRole("button", { name: "Next day" })).toBeDisabled();
	});

	it("links editing to Today with the selected date", () => {
		renderHistory();

		fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
		expect(screen.getByRole("link", { name: "Edit this day" })).toHaveAttribute(
			"href",
			"/today?date=2026-08-11"
		);
	});

	it("shows active food photos newest-first and excludes soft-deleted fixtures", () => {
		renderHistory({
			foodPhotos: [
				{
					id: "photo-new",
					user_id: "profile-1",
					entry_date: "2026-08-12",
					storage_path: "profile-1/2026-08-12/new.jpg",
					meal_type: "Lunch",
					note: "Salmon + veggies",
					signedUrl: "https://signed.example/new",
					deleted_at: null
				},
				{
					id: "photo-old",
					user_id: "profile-1",
					entry_date: "2026-08-11",
					storage_path: "profile-1/2026-08-11/old.jpg",
					meal_type: "Snack",
					note: null,
					signedUrl: "https://signed.example/old",
					deleted_at: null
				}
			]
		});

		fireEvent.click(screen.getByRole("button", { name: "Food Gallery" }));
		const gallery = screen.getByLabelText("Food photo gallery");
		const cards = within(gallery).getAllByRole("button");

		expect(document.querySelector(".history-mascot")).not.toBeInTheDocument();
		expect(cards[0]).toHaveTextContent("Lunch");
		expect(cards[0]).toHaveTextContent("Salmon + veggies");
		expect(cards[1]).toHaveTextContent("Snack");
		expect(screen.queryByText("deleted")).not.toBeInTheDocument();
	});

	it("opens and closes the food-photo detail dialog", () => {
		renderHistory({
			foodPhotos: [
				{
					id: "photo-1",
					user_id: "profile-1",
					entry_date: "2026-08-12",
					storage_path: "profile-1/2026-08-12/photo.jpg",
					meal_type: "Dinner",
					note: "Korean food with mom",
					signedUrl: "https://signed.example/photo",
					deleted_at: null
				},
				{
					id: "photo-2",
					user_id: "profile-1",
					entry_date: "2026-08-12",
					storage_path: "profile-1/2026-08-12/photo-2.jpg",
					meal_type: "Lunch",
					note: "Same day only",
					signedUrl: "https://signed.example/photo-2",
					deleted_at: null
				},
				{
					id: "photo-other",
					user_id: "profile-1",
					entry_date: "2026-08-11",
					storage_path: "profile-1/2026-08-11/photo.jpg",
					meal_type: "Dinner",
					note: "Other day",
					signedUrl: "https://signed.example/other",
					deleted_at: null
				}
			]
		});

		fireEvent.click(screen.getByRole("button", { name: "Food Gallery" }));
		fireEvent.click(screen.getByRole("button", { name: /Korean food with mom/ }));

		const dialog = screen.getByRole("dialog", { name: "Dinner" });
		expect(dialog).toBeInTheDocument();
		expect(within(dialog).getByText("Korean food with mom")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("navigates Food Gallery photos in loaded newest-first order", () => {
		vi.spyOn(window, "confirm").mockReturnValue(true);
		renderHistory({
			foodPhotos: [
				{
					id: "photo-1",
					user_id: "profile-1",
					entry_date: "2026-08-12",
					storage_path: "profile-1/2026-08-12/one.jpg",
					meal_type: "Lunch",
					note: "First",
					signedUrl: "https://signed.example/one",
					deleted_at: null
				},
				{
					id: "photo-2",
					user_id: "profile-1",
					entry_date: "2026-08-11",
					storage_path: "profile-1/2026-08-11/two.jpg",
					meal_type: "Dinner",
					note: "Second",
					signedUrl: "https://signed.example/two",
					deleted_at: null
				}
			]
		});

		fireEvent.click(screen.getByRole("button", { name: "Food Gallery" }));
		fireEvent.click(screen.getByRole("button", { name: /Lunch/ }));

		expect(screen.getByText("1 of 2")).toBeInTheDocument();
		const previousButton = screen.getByRole("button", { name: "Previous photo" });
		const nextButton = screen.getByRole("button", { name: "Next photo" });
		expect(previousButton).toHaveClass("photo-dialog-arrow", "previous");
		expect(nextButton).toHaveClass("photo-dialog-arrow", "next");
		expect(previousButton.closest(".photo-dialog-shell")).toBe(
			screen.getByRole("dialog").closest(".photo-dialog-shell")
		);
		expect(previousButton.closest(".photo-dialog")).toBeNull();
		expect(screen.getByRole("dialog").querySelector(".detail-photo-image")).toHaveAttribute(
			"alt",
			"Lunch food photo from Wed, Aug 12"
		);
		expect(previousButton).toBeDisabled();
		fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
		expect(screen.getByRole("dialog", { name: "Dinner" })).toBeInTheDocument();
		expect(screen.getByText("2 of 2")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Next photo" })).toBeDisabled();

		fireEvent.keyDown(window, { key: "ArrowLeft" });
		expect(screen.getByRole("dialog", { name: "Lunch" })).toBeInTheDocument();
		fireEvent.keyDown(window, { key: "ArrowRight" });
		fireEvent.click(screen.getByRole("button", { name: "Delete photo" }));
		expect(mockDeleteFoodPhoto).toHaveBeenCalledWith(
			expect.objectContaining({ id: "photo-2" })
		);
	});

	it("opens the shared photo detail from Daily Entries thumbnails", () => {
		renderHistory({
			foodPhotos: [
				{
					id: "photo-1",
					user_id: "profile-1",
					entry_date: "2026-08-12",
					storage_path: "profile-1/2026-08-12/photo.jpg",
					meal_type: "Breakfast",
					note: "Protein shake",
					signedUrl: "https://signed.example/photo",
					deleted_at: null
				},
				{
					id: "photo-2",
					user_id: "profile-1",
					entry_date: "2026-08-12",
					storage_path: "profile-1/2026-08-12/photo-2.jpg",
					meal_type: "Lunch",
					note: "Same day only",
					signedUrl: "https://signed.example/photo-2",
					deleted_at: null
				},
				{
					id: "photo-other",
					user_id: "profile-1",
					entry_date: "2026-08-11",
					storage_path: "profile-1/2026-08-11/photo.jpg",
					meal_type: "Dinner",
					note: "Other day",
					signedUrl: "https://signed.example/other",
					deleted_at: null
				}
			]
		});

		fireEvent.click(screen.getByRole("button", { name: /Open Breakfast food photo/ }));

		const dialog = screen.getByRole("dialog", { name: "Breakfast" });
		expect(dialog).toBeInTheDocument();
		expect(within(dialog).getByText("Protein shake")).toBeInTheDocument();
		expect(screen.getByText("1 of 2")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
		expect(screen.getByRole("dialog", { name: "Lunch" })).toBeInTheDocument();
		expect(screen.queryByRole("dialog", { name: "Dinner" })).not.toBeInTheDocument();
		fireEvent.keyDown(window, { key: "Escape" });
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("confirms delete before invoking the food-photo mutation", () => {
		vi.spyOn(window, "confirm").mockReturnValue(true);
		renderHistory({
			foodPhotos: [
				{
					id: "photo-1",
					user_id: "profile-1",
					entry_date: "2026-08-12",
					storage_path: "profile-1/2026-08-12/photo.jpg",
					meal_type: "Dinner",
					note: null,
					signedUrl: "https://signed.example/photo",
					deleted_at: null
				}
			]
		});

		fireEvent.click(screen.getByRole("button", { name: "Food Gallery" }));
		fireEvent.click(screen.getByRole("button", { name: /Dinner/ }));
		fireEvent.click(screen.getByRole("button", { name: "Delete photo" }));

		expect(mockDeleteFoodPhoto).toHaveBeenCalledWith(
			expect.objectContaining({ id: "photo-1" })
		);
	});

	it("keeps detail photos in full-image contain mode", () => {
		renderHistory({
			foodPhotos: [
				{
					id: "photo-1",
					user_id: "profile-1",
					entry_date: "2026-08-12",
					storage_path: "profile-1/2026-08-12/photo.jpg",
					meal_type: "Dinner",
					note: null,
					signedUrl: "https://signed.example/photo",
					deleted_at: null
				}
			]
		});

		fireEvent.click(screen.getByRole("button", { name: "Food Gallery" }));
		fireEvent.click(screen.getByRole("button", { name: /Dinner/ }));

		expect(within(screen.getByRole("dialog")).getByRole("img")).toHaveClass(
			"detail-photo-image"
		);
		expect(css).toContain("image-rendering: auto;");
		expect(css).toContain(".detail-photo-image {\n\tdisplay: block;");
		expect(css).toContain("\tobject-fit: contain;");
		expect(css).toContain(".photo-thumb-button img {\n\twidth: 100%;\n\theight: 100%;\n\timage-rendering: auto;");
		expect(css).toContain(".food-photo-frame img,\n.photo-dialog-image img {\n\twidth: 100%;\n\theight: 100%;\n\timage-rendering: auto;");
	});
});

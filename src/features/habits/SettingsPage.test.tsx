import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsPage } from "./SettingsPage";
import type { HabitWithSchedule, RoutineGroupWithSteps } from "./types";

const mocks = vi.hoisted(() => ({
	createHabit: vi.fn(async () => {}),
	createRoutine: vi.fn(async () => {}),
	archiveRecord: vi.fn(async () => {}),
	restoreRecord: vi.fn(async () => {}),
	reorderRecords: vi.fn(async () => {}),
	updateHabitDetails: vi.fn(async () => {}),
	updateRoutineGroupDetails: vi.fn(async () => {}),
	updateRoutineStepDetails: vi.fn(async () => {}),
	dashboard: {
		habits: [] as HabitWithSchedule[],
		routineGroups: [] as RoutineGroupWithSteps[]
	}
}));

vi.mock("../auth/useAuth", () => ({
	useAuth: () => ({ isConfigured: true })
}));

vi.mock("./useHabitDashboard", () => ({
	useHabitDashboard: () => ({
		profile: { isLoading: false, error: null, data: { id: "profile-1" } },
		dashboard: { isLoading: false, error: null, data: mocks.dashboard }
	})
}));

vi.mock("./api", async () => {
	const actual = await vi.importActual<typeof import("./api")>("./api");
	return {
		...actual,
		createHabit: mocks.createHabit,
		createRoutine: mocks.createRoutine,
		archiveRecord: mocks.archiveRecord,
		restoreRecord: mocks.restoreRecord,
		reorderRecords: mocks.reorderRecords,
		updateHabitDetails: mocks.updateHabitDetails,
		updateRoutineGroupDetails: mocks.updateRoutineGroupDetails,
		updateRoutineStepDetails: mocks.updateRoutineStepDetails
	};
});

function habit(overrides: Partial<HabitWithSchedule>): HabitWithSchedule {
	return {
		id: "habit-1",
		user_id: "profile-1",
		name: "Minoxidil",
		description: null,
		category: "beauty",
		icon: null,
		tracking_type: "checkbox",
		target_value: null,
		target_unit: null,
		time_group: "evening",
		start_date: "2026-08-10",
		end_date: null,
		active: true,
		include_in_glow_score: true,
		display_order: 0,
		archived_at: null,
		schedule: null,
		entry: null,
		...overrides
	};
}

function group(overrides: Partial<RoutineGroupWithSteps>): RoutineGroupWithSteps {
	return {
		id: "group-1",
		user_id: "profile-1",
		name: "PM Skincare",
		category: "beauty",
		time_group: "evening",
		display_order: 0,
		active: true,
		archived_at: null,
		steps: [],
		...overrides
	};
}

function renderSettings() {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return render(
		<QueryClientProvider client={queryClient}>
			<SettingsPage />
		</QueryClientProvider>
	);
}

beforeEach(() => {
	for (const mock of [
		mocks.createHabit,
		mocks.createRoutine,
		mocks.archiveRecord,
		mocks.restoreRecord,
		mocks.reorderRecords,
		mocks.updateHabitDetails,
		mocks.updateRoutineGroupDetails,
		mocks.updateRoutineStepDetails
	]) {
		mock.mockClear();
	}
	mocks.dashboard.habits = [];
	mocks.dashboard.routineGroups = [];
});

describe("Settings Milestone 1 UX", () => {
	it("uses friendly habit labels and hides goal fields for check-off habits", () => {
		renderSettings();

		expect(screen.getByLabelText(/Track by/i)).toHaveDisplayValue("Check-off");
		expect(screen.getByLabelText(/Frequency/i)).toHaveDisplayValue("Daily");
		expect(screen.queryByLabelText(/Goal/i)).not.toBeInTheDocument();

		fireEvent.change(screen.getByLabelText(/Track by/i), { target: { value: "duration" } });
		expect(screen.getByLabelText(/Goal minutes/i)).toBeInTheDocument();
		expect(screen.queryByText("times_per_week")).not.toBeInTheDocument();
	});

	it("reorders habits by sending the whole resequenced list", async () => {
		mocks.dashboard.habits = [
			habit({ id: "a", name: "Alpha", display_order: 0 }),
			habit({ id: "b", name: "Beta", display_order: 1 })
		];

		renderSettings();
		fireEvent.click(screen.getByRole("button", { name: "Move Alpha down" }));

		await waitFor(() => expect(mocks.reorderRecords).toHaveBeenCalled());
		const calls = mocks.reorderRecords.mock.calls as unknown as Array<
			["habits", Array<{ id: string }>]
		>;
		expect(calls[0][0]).toBe("habits");
		expect(calls[0][1].map((item) => item.id)).toEqual(["b", "a"]);
	});

	it("creates routines with unlinked and existing-habit steps", async () => {
		mocks.dashboard.habits = [habit({ id: "habit-minoxidil", name: "Minoxidil" })];

		renderSettings();
		const routineForm = screen.getByRole("heading", { name: "Create Routine" }).closest("form")!;
		fireEvent.change(within(routineForm).getByLabelText(/^Name/i), {
			target: { value: "PM Skincare" }
		});
		fireEvent.change(within(routineForm).getByLabelText(/Step name/i), {
			target: { value: "Cleanser" }
		});
		fireEvent.click(within(routineForm).getByRole("button", { name: "Add step" }));

		const stepNameInputs = within(routineForm).getAllByLabelText(/Step name/i);
		const connectedHabitSelects = within(routineForm).getAllByLabelText(/Connect to an existing habit/i);
		fireEvent.change(connectedHabitSelects[1], { target: { value: "habit-minoxidil" } });
		expect(stepNameInputs[1]).toHaveValue("Minoxidil");

		fireEvent.click(within(routineForm).getByRole("button", { name: "Add routine" }));

		await waitFor(() =>
			expect(mocks.createRoutine).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "PM Skincare",
					steps: [
						{ name: "Cleanser", linkedHabitId: null },
						{ name: "Minoxidil", linkedHabitId: "habit-minoxidil" }
					]
				})
			)
		);
	});

	it("lets archived habits and routine steps be restored", async () => {
		mocks.dashboard.habits = [
			habit({ id: "archived-habit", name: "Old Habit", active: false, archived_at: "2026-08-11T00:00:00Z" })
		];
		mocks.dashboard.routineGroups = [
			group({
				steps: [
					{
						id: "archived-step",
						user_id: "profile-1",
						routine_group_id: "group-1",
						linked_habit_id: null,
						name: "Old Step",
						display_order: 0,
						active: false,
						archived_at: "2026-08-11T00:00:00Z",
						entry: null,
						habitEntry: null
					}
				]
			})
		];

		renderSettings();
		fireEvent.click(screen.getByText("Archived habits (1)"));
		fireEvent.click(screen.getByRole("button", { name: "Restore Old Habit" }));
		await waitFor(() => expect(mocks.restoreRecord).toHaveBeenCalledWith("habits", "archived-habit"));

		fireEvent.click(screen.getByText("Archived routines (1)"));
		const routineArchive = screen.getByText("Archived routines (1)").closest("details")!;
		fireEvent.click(within(routineArchive).getByRole("button", { name: "Restore Old Step" }));
		await waitFor(() =>
			expect(mocks.restoreRecord).toHaveBeenCalledWith("routine_steps", "archived-step")
		);
	});
});

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TodayPage } from "./TodayPage";
import type { HabitWithSchedule, RoutineGroupWithSteps } from "./types";

const mocks = vi.hoisted(() => ({
	updateHabitEntry: vi.fn(async () => {}),
	updateRoutineStepEntry: vi.fn(async () => {}),
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

vi.mock("./api", () => ({
	updateHabitEntry: mocks.updateHabitEntry,
	updateRoutineStepEntry: mocks.updateRoutineStepEntry
}));

function schedule(overrides: Partial<HabitWithSchedule["schedule"]> = {}) {
	return {
		id: "schedule-1",
		user_id: "profile-1",
		habit_id: "habit-1",
		schedule_type: "daily",
		weekdays: null,
		times_per_week: null,
		times_per_month: null,
		interval_days: null,
		anchor_date: null,
		start_date: "2026-08-10",
		end_date: null,
		archived_at: null,
		...overrides
	} satisfies HabitWithSchedule["schedule"];
}

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
		schedule: schedule(),
		entry: null,
		...overrides
	};
}

function renderToday() {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return render(
		<QueryClientProvider client={queryClient}>
			<TodayPage />
		</QueryClientProvider>
	);
}

beforeEach(() => {
	mocks.updateHabitEntry.mockClear();
	mocks.updateRoutineStepEntry.mockClear();
	mocks.dashboard.habits = [];
	mocks.dashboard.routineGroups = [];
});

describe("Today Milestone 1 UX", () => {
	it("uses tracking-type-specific controls instead of checkboxes for value habits", () => {
		mocks.dashboard.habits = [
			habit({ id: "duration", name: "Farsi", tracking_type: "duration", target_unit: "minutes" })
		];

		renderToday();

		expect(screen.getByLabelText("Farsi minutes")).toBeInTheDocument();
		expect(screen.queryByRole("checkbox", { name: /Farsi/i })).not.toBeInTheDocument();
	});

	it("allows multi-digit numeric entry and saves the final value on blur", async () => {
		mocks.dashboard.habits = [
			habit({ id: "duration", name: "Farsi", tracking_type: "duration", target_unit: "minutes" })
		];

		renderToday();
		const input = screen.getByLabelText("Farsi minutes");

		fireEvent.change(input, { target: { value: "2" } });
		fireEvent.change(input, { target: { value: "20" } });
		expect(input).toHaveValue(20);

		fireEvent.blur(input);

		await waitFor(() => expect(mocks.updateHabitEntry).toHaveBeenCalled());
		const calls = mocks.updateHabitEntry.mock.calls as unknown as Array<[unknown]>;
		expect(calls[0][0]).toEqual(
			expect.objectContaining({ habitId: "duration", completed: true, value: 20 })
		);
	});

	it("moves checkbox habits from To Do to Done and back", async () => {
		mocks.dashboard.habits = [habit({ id: "check", name: "Minoxidil" })];

		renderToday();
		const toDo = screen.getByRole("heading", { name: "To Do" }).closest("section")!;
		const done = screen.getByRole("heading", { name: "Done" }).closest("section")!;

		expect(within(toDo).getByText("Minoxidil")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("checkbox", { name: /Minoxidil/i }));

		await waitFor(() => expect(within(done).getByText("Minoxidil")).toBeInTheDocument());
		fireEvent.click(within(done).getByRole("checkbox", { name: /Minoxidil/i }));

		await waitFor(() => expect(within(toDo).getByText("Minoxidil")).toBeInTheDocument());
	});
});

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { AuthContext, type AuthContextValue } from "../features/auth/authContext";

function renderApp(
	initialPath = "/today",
	authOverrides: Partial<AuthContextValue> = {}
) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false }
		}
	});

	const authValue: AuthContextValue = {
		isConfigured: false,
		isLoading: false,
		user: null,
		signIn: vi.fn(async () => ({})),
		signOut: vi.fn(async () => {}),
		...authOverrides
	};

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter initialEntries={[initialPath]}>
				<AuthContext.Provider value={authValue}>
					<App />
				</AuthContext.Provider>
			</MemoryRouter>
		</QueryClientProvider>
	);
}

describe("App foundation", () => {
	it("renders the V0.5 Today shell when Supabase is not configured", () => {
		const { container } = renderApp();

		expect(
			screen.getByRole("heading", { name: "Sola Glow-Up" })
		).toBeInTheDocument();
		expect(screen.getAllByRole("navigation", { name: "Primary" })[0]).toBeInTheDocument();
		expect(container.querySelector(".route-mascot-image")).toHaveAttribute(
			"src",
			expect.stringContaining("sola-today")
		);
		expect(container.querySelector(".route-mascot > .pixel-art-icon"))
			.not.toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Daily check-in" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Checklist" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Current streaks" })).toBeInTheDocument();
	});

	it("exposes only the active V0.5 destinations", () => {
		const { container } = renderApp("/today");

		expect(screen.getAllByRole("link", { name: "Today" })).toHaveLength(2);
		expect(screen.getAllByRole("link", { name: "History" })).toHaveLength(2);
		expect(screen.getAllByRole("link", { name: "Progress" })).toHaveLength(2);
		expect(container.querySelectorAll(".nav-item .pixel-art-icon")).toHaveLength(6);
		expect(screen.queryByRole("link", { name: "Glow Up" })).not.toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Food" })).not.toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Fitness" })).not.toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Beauty" })).not.toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Growth" })).not.toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Insights" })).not.toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Calendar" })).not.toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
	});

	it("renders the History shell", () => {
		const { container } = renderApp("/history");

		expect(container.querySelector(".route-mascot-image")).toHaveAttribute(
			"src",
			expect.stringContaining("sola-history")
		);
		expect(screen.getByRole("heading", { name: "History" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Daily entries" })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Food Gallery" }));
		expect(screen.getByRole("heading", { name: "Food gallery" })).toBeInTheDocument();
	});

	it("renders the Progress shell", () => {
		const { container } = renderApp("/progress");

		expect(container.querySelector(".route-mascot-image")).toHaveAttribute(
			"src",
			expect.stringContaining("sola-progress")
		);
		expect(screen.getByRole("heading", { name: "Progress" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Weight trend" })).toBeInTheDocument();
	});

	it("redirects dormant V1 routes out of the active product surface", () => {
		renderApp("/settings");

		expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Settings" })).not.toBeInTheDocument();
	});

	it("redirects protected routes to login when Supabase is configured without a session", () => {
		renderApp("/today", { isConfigured: true });

		expect(
			screen.getByRole("heading", { name: "Sola Glow-Up" })
		).toBeInTheDocument();
		expect(screen.getByLabelText("Email")).toBeInTheDocument();
		expect(screen.getByLabelText("Password")).toBeInTheDocument();
	});
});

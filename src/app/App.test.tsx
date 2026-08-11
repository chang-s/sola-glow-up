import { render, screen } from "@testing-library/react";
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
	it("renders the application shell when Supabase is not configured", () => {
		renderApp();

		expect(
			screen.getByRole("heading", { name: "Sola Glow-Up" })
		).toBeInTheDocument();
		expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
	});

	it("exposes all primary milestone routes as placeholders", () => {
		renderApp("/beauty");

		expect(screen.getByRole("link", { name: "Today" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Glow Up" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Food" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Fitness" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Beauty" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Growth" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Insights" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Calendar" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Beauty" })).toBeInTheDocument();
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

import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { AuthRoute } from "../features/auth/AuthRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { SettingsPage } from "../features/habits/SettingsPage";
import { TodayPage } from "../features/habits/TodayPage";
import { routeSections } from "./routeConfig";
import { PlaceholderPage } from "./routes";

export function App() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route element={<AuthRoute />}>
				<Route element={<AppShell />}>
					<Route index element={<Navigate to="/today" replace />} />
					{routeSections.map((section) => (
						<Route
							key={section.path}
							path={section.path}
							element={
								section.path === "today" ? (
									<TodayPage />
								) : section.path === "settings" ? (
									<SettingsPage />
								) : (
									<PlaceholderPage section={section} />
								)
							}
						/>
					))}
				</Route>
			</Route>
			<Route path="*" element={<Navigate to="/today" replace />} />
		</Routes>
	);
}

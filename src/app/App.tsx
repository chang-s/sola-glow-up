import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { AuthRoute } from "../features/auth/AuthRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { TodayPage } from "../features/v05/TodayPage";
import { routeSections } from "./routeConfig";
import { HistoryShell, ProgressShell } from "./routes";

function getRouteElement(path: string) {
	if (path === "history") return <HistoryShell />;
	if (path === "progress") return <ProgressShell />;
	return <TodayPage />;
}

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
							element={getRouteElement(section.path)}
						/>
					))}
					<Route path="*" element={<Navigate to="/today" replace />} />
				</Route>
			</Route>
			<Route path="*" element={<Navigate to="/today" replace />} />
		</Routes>
	);
}

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export function AuthRoute() {
	const { isConfigured, isLoading, user } = useAuth();
	const location = useLocation();

	if (!isConfigured) {
		return <Outlet />;
	}

	if (isLoading) {
		return (
			<div className="centered-state" role="status">
				Loading your glow-up space...
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	return <Outlet />;
}

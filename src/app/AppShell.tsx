import { Outlet, NavLink } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { routeSections } from "./routeConfig";
import { useAuth } from "../features/auth/useAuth";

export function AppShell() {
	const { signOut, user, isConfigured } = useAuth();

	return (
		<div className="app-shell">
			<header className="topbar">
				<div className="brand-lockup" aria-label="Sola Glow-Up">
					<div className="pixel-sola" aria-hidden="true">
						<Sparkles size={26} strokeWidth={2.4} />
					</div>
					<div>
						<p className="eyebrow">Daily tracker</p>
						<h1>Sola Glow-Up</h1>
					</div>
				</div>
				<div className="session-actions">
					<span className="session-label">
						{isConfigured && user ? user.email : "Private cozy log"}
					</span>
					{user ? (
						<button type="button" className="text-button" onClick={signOut}>
							Sign out
						</button>
					) : null}
				</div>
			</header>

			<div className="layout">
				<nav className="primary-nav" aria-label="Primary">
					{routeSections.map(({ path, label, Icon }) => (
						<NavLink key={path} to={`/${path}`} className="nav-item">
							<Icon aria-hidden="true" size={20} />
							<span>{label}</span>
						</NavLink>
					))}
				</nav>
				<main className="main-panel">
					<Outlet />
				</main>
			</div>
		</div>
	);
}

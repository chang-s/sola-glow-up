import { Outlet, NavLink, useLocation } from "react-router-dom";
import { PixelIcon } from "../assets/pixelArt";
import { pixelMascots } from "../assets/pixelArtAssets";
import { routeSections } from "./routeConfig";
import { useAuth } from "../features/auth/useAuth";

function PrimaryNav({ className }: { className: string }) {
	return (
		<nav className={className} aria-label="Primary">
			{routeSections.map(({ path, label, icon }) => (
				<NavLink key={path} to={`/${path}`} className="nav-item">
					<PixelIcon name={icon} aria-hidden="true" />
					<span>{label}</span>
				</NavLink>
			))}
		</nav>
	);
}

export function AppShell() {
	const { signOut, user, isConfigured } = useAuth();
	const location = useLocation();
	const activePath = location.pathname.split("/")[1] || "today";
	const activeSection = routeSections.find((section) => section.path === activePath) ?? routeSections[0];
	const activeMascot =
		activeSection.path === "history"
			? pixelMascots.history
			: activeSection.path === "progress"
				? pixelMascots.progress
				: pixelMascots.today;

	return (
		<div className="app-shell">
			<header className="topbar">
				<div className="brand-lockup" aria-label="Sola Glow-Up">
					<div className="pixel-sola" aria-hidden="true">
						<PixelIcon name="sparkles" uiSize="medium" />
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
				<aside className="sidebar-rail">
					<PrimaryNav className="primary-nav desktop-nav" />
					<div className="route-mascot" aria-hidden="true">
						<img
							className="mascot-art route-mascot-image"
							src={activeMascot}
							alt=""
							loading="lazy"
							decoding="async"
						/>
					</div>
				</aside>
				<main className="main-panel">
					<Outlet />
				</main>
			</div>
			<PrimaryNav className="mobile-bottom-nav" />
		</div>
	);
}

import type { RouteSection } from "./routeConfig";

export function PlaceholderPage({ section }: { section: RouteSection }) {
	return (
		<section className="placeholder-page" aria-labelledby={`${section.path}-title`}>
			<div className="page-kicker">
				<section.Icon aria-hidden="true" size={22} />
				<span>Milestone 0 route</span>
			</div>
			<h2 id={`${section.path}-title`}>{section.label}</h2>
			<p>{section.description}</p>
			<p className="scope-note">
				Feature implementation starts in later approved milestones.
			</p>
		</section>
	);
}

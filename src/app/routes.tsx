import { Camera, Check, Moon, TrendingDown, Trophy } from "lucide-react";

const previewChecklist = [
	"Morning skincare",
	"Vitamins",
	"Minoxidil",
	"Worked out"
];

const previewCalendarDays = Array.from({ length: 35 }, (_, index) => {
	if (index < 4) return "calendar-day neutral";
	if ([8, 11, 12, 16, 17, 23, 24, 25].includes(index)) {
		return "calendar-day great";
	}
	if ([5, 6, 10, 15, 22].includes(index)) return "calendar-day good";
	if ([7, 14, 21].includes(index)) return "calendar-day some";
	if (index === 18) return "calendar-day today";
	if (index > 28) return "calendar-day future";
	return "calendar-day empty";
});

export function TodayShell() {
	return (
		<section className="v05-screen today-screen" aria-labelledby="today-title">
			<div className="surface-header">
				<div>
					<p className="eyebrow">Daily quest board</p>
					<h2 id="today-title">Today</h2>
				</div>
				<p className="pixel-date">Aug 12</p>
			</div>

			<div className="today-layout">
				<section className="quest-board" aria-labelledby="checkin-title">
					<div className="board-clip" aria-hidden="true" />
					<div className="section-heading compact">
						<div>
							<p className="eyebrow">Clipboard</p>
							<h3 id="checkin-title">Daily check-in</h3>
						</div>
						<span className="status-chip">Shell preview</span>
					</div>

					<div className="check-preview-list" aria-label="Checklist preview">
						{previewChecklist.map((item) => (
							<div className="check-preview" key={item}>
								<span className="tiny-checkbox" aria-hidden="true">
									<Check size={14} />
								</span>
								<span>{item}</span>
							</div>
						))}
					</div>

					<div className="field-preview-grid" aria-label="Daily data areas">
						<div>Weight</div>
						<div>Steps</div>
						<div>Sleep</div>
						<div>Calories</div>
						<div>Workout details</div>
						<div>Food photos</div>
					</div>
				</section>

				<aside className="side-stack" aria-label="Today motivation">
					<section className="pixel-card" aria-labelledby="calendar-title">
						<p className="eyebrow">Month view</p>
						<h3 id="calendar-title">Completion calendar</h3>
						<div className="calendar-grid" aria-label="Completion calendar preview">
							{previewCalendarDays.map((className, index) => (
								<span
									key={`${className}-${index}`}
									className={className}
									aria-hidden="true"
								/>
							))}
						</div>
						<p className="mini-note">Due items only. Future days stay neutral.</p>
					</section>

					<section className="pixel-card" aria-labelledby="streaks-title">
						<p className="eyebrow">Tiny cheers</p>
						<h3 id="streaks-title">Current streaks</h3>
						<div className="streak-list">
							<div className="streak-card">
								<Trophy aria-hidden="true" size={18} />
								<span>Workout</span>
							</div>
							<div className="streak-card">
								<Moon aria-hidden="true" size={18} />
								<span>7+ hr sleep</span>
							</div>
						</div>
					</section>
				</aside>
			</div>
		</section>
	);
}

export function HistoryShell() {
	return (
		<section className="v05-screen" aria-labelledby="history-title">
			<div className="surface-header">
				<div>
					<p className="eyebrow">Notebook</p>
					<h2 id="history-title">History</h2>
				</div>
			</div>

			<div className="history-layout">
				<section className="pixel-card notebook-panel" aria-labelledby="entries-title">
					<p className="eyebrow">Past pages</p>
					<h3 id="entries-title">Daily entries</h3>
					<p className="empty-note">
						Previous check-ins will live here once daily logging is wired up.
					</p>
				</section>

				<section className="pixel-card scrapbook-panel" aria-labelledby="gallery-title">
					<div className="section-heading compact">
						<div>
							<p className="eyebrow">Scrapbook</p>
							<h3 id="gallery-title">Food gallery</h3>
						</div>
						<Camera aria-hidden="true" size={20} />
					</div>
					<div className="scrapbook-grid" aria-label="Food photo gallery preview">
						<span className="photo-placeholder" />
						<span className="photo-placeholder tilted" />
						<span className="photo-placeholder" />
					</div>
				</section>
			</div>
		</section>
	);
}

export function ProgressShell() {
	return (
		<section className="v05-screen" aria-labelledby="progress-title">
			<div className="surface-header">
				<div>
					<p className="eyebrow">Chart board</p>
					<h2 id="progress-title">Progress</h2>
				</div>
			</div>

			<div className="progress-layout">
				<section className="pixel-card metric-strip" aria-label="Weight summary preview">
					<div>
						<span>Starting</span>
						<strong>--</strong>
					</div>
					<div>
						<span>Latest</span>
						<strong>--</strong>
					</div>
					<div>
						<span>Total change</span>
						<strong>--</strong>
					</div>
				</section>

				<section className="chart-board" aria-labelledby="weight-chart-title">
					<div className="section-heading compact">
						<div>
							<p className="eyebrow">Weight over time</p>
							<h3 id="weight-chart-title">Trend preview</h3>
						</div>
						<TrendingDown aria-hidden="true" size={22} />
					</div>
					<div className="chart-placeholder" aria-hidden="true">
						<span />
						<span />
						<span />
						<span />
					</div>
					<p className="empty-note">
						The real graph appears here after V0.5 daily entries are connected.
					</p>
				</section>
			</div>
		</section>
	);
}

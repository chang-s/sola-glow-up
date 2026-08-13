import { useState } from "react";
import { Link } from "react-router-dom";
import {
	ChevronLeft,
	ChevronRight,
	ImageOff,
	PencilLine
} from "lucide-react";
import { PixelIcon } from "../../assets/pixelArt";
import { getDueChecklistItems } from "./checklist";
import { addCalendarDays, formatFriendlyDate, toLocalDateKey } from "./date";
import { FoodPhotoDialog } from "./FoodPhotoDialog";
import { foodPhotoAlt } from "./foodPhoto";
import { useV05History, useV05Today } from "./useV05Today";
import type {
	V05ChecklistCompletion,
	V05DailyEntry,
	V05FoodPhotoWithUrl
} from "./types";

type HistoryMode = "entries" | "gallery";
type PhotoContext = {
	photoId: string;
	photos: V05FoodPhotoWithUrl[];
};

export function HistoryPage() {
	const todayKey = toLocalDateKey();
	const [mode, setMode] = useState<HistoryMode>("entries");
	const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
	const [photoContext, setPhotoContext] = useState<PhotoContext | null>(null);
	const { profile, history } = useV05History();
	const { deleteFoodPhoto } = useV05Today(selectedDateKey, selectedDateKey, todayKey);
	const data = history.data;
	const entries = data?.dailyEntries ?? [];
	const completions = data?.checklistCompletions ?? [];
	const photos = data?.foodPhotos ?? [];
	const selectedEntry = entries.find((entry) => entry.entry_date === selectedDateKey) ?? null;
	const selectedDayPhotos = photos.filter((photo) => photo.entry_date === selectedDateKey);
	const selectedPhotoIndex =
		photoContext?.photos.findIndex((photo) => photo.id === photoContext.photoId) ?? -1;
	const selectedPhoto =
		photoContext && selectedPhotoIndex >= 0 ? photoContext.photos[selectedPhotoIndex] : null;

	function moveSelectedDate(offset: number) {
		const nextDate = addCalendarDays(selectedDateKey, offset);
		if (nextDate > todayKey) return;
		setSelectedDateKey(nextDate);
	}

	async function handleDelete(photo: V05FoodPhotoWithUrl) {
		const confirmed = window.confirm("Remove this food photo from your scrapbook?");
		if (!confirmed) return;

		try {
			await deleteFoodPhoto.mutateAsync(photo);
			setPhotoContext(null);
		} catch {
			// The visible status below stays generic; Supabase details are intentionally hidden.
		}
	}

	return (
		<section className="v05-screen" aria-labelledby="history-title">
			<div className="surface-header history-header">
				<div>
					<p className="eyebrow icon-eyebrow">
						<PixelIcon name="history" aria-hidden="true" />
						Notebook
					</p>
					<h2 id="history-title">History</h2>
				</div>
				<div className="notebook-tabs" aria-label="History sections">
					<button
						type="button"
						className={mode === "entries" ? "active" : ""}
						onClick={() => setMode("entries")}
					>
						Daily Entries
					</button>
					<button
						type="button"
						className={mode === "gallery" ? "active" : ""}
						onClick={() => setMode("gallery")}
					>
						Food Gallery
					</button>
				</div>
			</div>

			{history.isLoading || profile.isLoading ? (
				<section className="panel-state" role="status">
					Loading your notebook...
				</section>
			) : null}

			{history.error || profile.error ? (
				<section className="panel-state error-state" role="alert">
					History could not load. Please try refreshing.
				</section>
			) : null}

			{mode === "entries" ? (
				<DailyEntriesHistory
					entries={entries}
					completions={completions}
					selectedDateKey={selectedDateKey}
					selectedEntry={selectedEntry}
					selectedDayPhotos={selectedDayPhotos}
					todayKey={todayKey}
					onSelectDate={setSelectedDateKey}
					onMoveDate={moveSelectedDate}
					onOpenPhoto={(photo) =>
						setPhotoContext({ photoId: photo.id, photos: selectedDayPhotos })
					}
				/>
			) : (
				<FoodGallery
					photos={photos}
					isDeleting={deleteFoodPhoto.isPending}
					onOpenPhoto={(photo) => setPhotoContext({ photoId: photo.id, photos })}
				/>
			)}

			{deleteFoodPhoto.error ? (
				<p className="form-error" role="alert">
					Food photo could not be deleted. Please try again.
				</p>
			) : null}

			{selectedPhoto && photoContext ? (
				<FoodPhotoDialog
					photo={selectedPhoto}
					isDeleting={deleteFoodPhoto.isPending}
					onClose={() => setPhotoContext(null)}
					onDelete={() => void handleDelete(selectedPhoto)}
					position={selectedPhotoIndex + 1}
					total={photoContext.photos.length}
					canGoPrevious={selectedPhotoIndex > 0}
					canGoNext={selectedPhotoIndex < photoContext.photos.length - 1}
					onPrevious={() =>
						setPhotoContext({
							photos: photoContext.photos,
							photoId: photoContext.photos[selectedPhotoIndex - 1]?.id ?? photoContext.photoId
						})
					}
					onNext={() =>
						setPhotoContext({
							photos: photoContext.photos,
							photoId: photoContext.photos[selectedPhotoIndex + 1]?.id ?? photoContext.photoId
						})
					}
				/>
			) : null}
		</section>
	);
}

function DailyEntriesHistory({
	entries,
	completions,
	selectedDateKey,
	selectedEntry,
	selectedDayPhotos,
	todayKey,
	onSelectDate,
	onMoveDate,
	onOpenPhoto
}: {
	entries: V05DailyEntry[];
	completions: V05ChecklistCompletion[];
	selectedDateKey: string;
	selectedEntry: V05DailyEntry | null;
	selectedDayPhotos: V05FoodPhotoWithUrl[];
	todayKey: string;
	onSelectDate: (dateKey: string) => void;
	onMoveDate: (offset: number) => void;
	onOpenPhoto: (photo: V05FoodPhotoWithUrl) => void;
}) {
	const completionSummary = getCompletionSummary(selectedDateKey, completions);
	const completedItems = getCompletedChecklistItems(selectedDateKey, completions);

	return (
		<div className="history-layout">
			<section className="pixel-card notebook-panel" aria-labelledby="entries-title">
				<p className="eyebrow icon-eyebrow">
					<PixelIcon name="calendar" aria-hidden="true" />
					Past pages
				</p>
				<h3 id="entries-title">Daily entries</h3>
				{entries.length ? (
					<div className="entry-list">
						{entries.map((entry) => (
							<button
								type="button"
								key={entry.id}
								className={`entry-card ${
									entry.entry_date === selectedDateKey ? "selected" : ""
								}`}
								onClick={() => onSelectDate(entry.entry_date)}
							>
								<strong>{formatFriendlyDate(entry.entry_date)}</strong>
								<EntrySummary entry={entry} completions={completions} />
							</button>
						))}
					</div>
				) : (
					<p className="empty-note">Your first page starts with today's check-in.</p>
				)}
			</section>

			<section className="pixel-card scrapbook-panel" aria-labelledby="day-detail-title">
				<div className="day-picker">
					<button
						type="button"
						aria-label="Previous day"
						onClick={() => onMoveDate(-1)}
					>
						<ChevronLeft aria-hidden="true" size={18} />
					</button>
					<label>
						<span className="sr-only">Selected history date</span>
						<input
							type="date"
							value={selectedDateKey}
							max={todayKey}
							onChange={(event) => onSelectDate(event.target.value)}
						/>
					</label>
					<button
						type="button"
						aria-label="Next day"
						disabled={selectedDateKey >= todayKey}
						onClick={() => onMoveDate(1)}
					>
						<ChevronRight aria-hidden="true" size={18} />
					</button>
				</div>
				<div className="section-heading compact">
					<div>
						<p className="eyebrow">{formatFriendlyDate(selectedDateKey)}</p>
						<h3 id="day-detail-title">Day page</h3>
					</div>
					<Link className="text-button" to={`/today?date=${selectedDateKey}`}>
						<PencilLine aria-hidden="true" size={16} />
						Edit this day
					</Link>
				</div>

				{selectedEntry ? (
					<div className="day-detail-grid">
						<Metric label="Weight" value={formatMaybe(selectedEntry.weight, " lb")} />
						<Metric label="Steps" value={formatMaybe(selectedEntry.steps)} />
						<Metric
							label="Sleep"
							value={
								selectedEntry.sleep_duration_minutes == null
									? null
									: formatSleep(selectedEntry.sleep_duration_minutes)
							}
						/>
						<Metric
							label="Checklist"
							value={`${completionSummary.completed}/${completionSummary.total} done`}
						/>
						{selectedEntry.worked_out ? (
							<Metric
								label="Workout"
								value={selectedEntry.workout_activity_type ?? "Completed"}
							/>
						) : null}
						{selectedEntry.notes ? <Metric label="Note" value={selectedEntry.notes} /> : null}
					</div>
				) : (
					<p className="empty-note">No saved page for this date yet.</p>
				)}
				{selectedEntry ? (
					<div className="completed-checklist-summary" aria-label="Completed checklist items">
						{completedItems.length ? (
							completedItems.map((item) => (
								<span key={item.key} className="completed-chip">
									<PixelIcon name="completed" aria-hidden="true" />
									{item.label}
								</span>
							))
						) : (
							<p className="mini-note">No checklist items completed.</p>
						)}
					</div>
				) : null}

				{selectedDayPhotos.length ? (
					<div className="day-photo-strip" aria-label="Food photos for selected day">
						{selectedDayPhotos.map((photo) => (
							<button
								type="button"
								key={photo.id}
								className="day-photo-thumb"
								aria-label={`Open ${foodPhotoAlt(photo)}`}
								onClick={() => onOpenPhoto(photo)}
							>
								{photo.signedUrl ? (
									<img src={photo.signedUrl} alt={foodPhotoAlt(photo)} />
								) : (
									<ImageOff aria-hidden="true" size={16} />
								)}
							</button>
						))}
					</div>
				) : null}
			</section>
		</div>
	);
}

function FoodGallery({
	photos,
	isDeleting,
	onOpenPhoto
}: {
	photos: V05FoodPhotoWithUrl[];
	isDeleting: boolean;
	onOpenPhoto: (photo: V05FoodPhotoWithUrl) => void;
}) {
	return (
		<section
			className="pixel-card scrapbook-panel full-history-panel"
			aria-labelledby="gallery-title"
		>
			<div className="section-heading compact">
				<div>
					<p className="eyebrow">Scrapbook</p>
					<h3 id="gallery-title">Food gallery</h3>
				</div>
				<span className="section-pixel-icon" aria-hidden="true">
					<PixelIcon name="camera" />
				</span>
			</div>
			{photos.length ? (
				<div className="scrapbook-grid food-gallery-grid" aria-label="Food photo gallery">
					{photos.map((photo) => (
						<button
							type="button"
							key={photo.id}
							className="food-photo-card"
							disabled={isDeleting}
							onClick={() => onOpenPhoto(photo)}
						>
							<span className="food-photo-frame">
								{photo.signedUrl ? (
									<img src={photo.signedUrl} alt={foodPhotoAlt(photo)} />
								) : (
									<span className="photo-fallback">
										<ImageOff aria-hidden="true" size={22} />
									</span>
								)}
							</span>
							<strong>{formatFriendlyDate(photo.entry_date)}</strong>
							{photo.meal_type ? <small>{photo.meal_type}</small> : null}
							{photo.note ? <span className="photo-note-preview">{photo.note}</span> : null}
						</button>
					))}
				</div>
			) : (
				<p className="empty-note">Your food scrapbook is waiting for its first photo.</p>
			)}
		</section>
	);
}

function EntrySummary({
	entry,
	completions
}: {
	entry: V05DailyEntry;
	completions: V05ChecklistCompletion[];
}) {
	const summary = getCompletionSummary(entry.entry_date, completions);
	const chips = [
		entry.weight == null ? null : `${entry.weight} lb`,
		entry.steps == null ? null : `${entry.steps.toLocaleString()} steps`,
		entry.sleep_duration_minutes == null ? null : formatSleep(entry.sleep_duration_minutes),
		entry.worked_out ? `Workout${entry.workout_activity_type ? `: ${entry.workout_activity_type}` : ""}` : null,
		`${summary.completed}/${summary.total} checks`
	].filter(Boolean);

	return (
		<span className="entry-chip-row">
			{chips.map((chip) => (
				<small key={chip}>{chip}</small>
			))}
		</span>
	);
}

function Metric({ label, value }: { label: string; value: string | null }) {
	if (!value) return null;

	return (
		<div className="metric-note">
			<span>{label}</span>
			<strong>{value}</strong>
		</div>
	);
}

function getCompletionSummary(dateKey: string, completions: V05ChecklistCompletion[]) {
	const completedKeys = new Set(
		completions
			.filter((completion) => completion.entry_date === dateKey && completion.completed)
			.map((completion) => completion.item_key)
	);
	const dueItems = getDueChecklistItems(dateKey);

	return {
		completed: dueItems.filter((item) => completedKeys.has(item.key)).length,
		total: dueItems.length
	};
}

function getCompletedChecklistItems(dateKey: string, completions: V05ChecklistCompletion[]) {
	const completedKeys = new Set(
		completions
			.filter((completion) => completion.entry_date === dateKey && completion.completed)
			.map((completion) => completion.item_key)
	);

	return getDueChecklistItems(dateKey).filter((item) => completedKeys.has(item.key));
}

function formatMaybe(value: number | null, suffix = "") {
	return value == null ? null : `${value.toLocaleString()}${suffix}`;
}

function formatSleep(minutes: number) {
	const hours = Math.floor(minutes / 60);
	const remainder = minutes % 60;
	return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

import { type FormEvent, type ReactNode, useId, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
	Bed,
	CalendarDays,
	Camera,
	Check,
	ChevronLeft,
	ChevronRight,
	Dumbbell,
	ImageOff,
	Moon,
	PencilLine,
	Pill,
	ShieldCheck,
	Sparkles,
	SportShoe,
	Sun,
	Timer,
	Utensils,
	Weight
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { getDueChecklistItems, type V05ChecklistItemKey } from "./checklist";
import {
	formatFriendlyDate,
	formatMonthYear,
	addCalendarMonths,
	getCalendarDays,
	getCalendarLeadingBlanks,
	toMonthKey,
	toLocalDateKey
} from "./date";
import { FoodPhotoDialog } from "./FoodPhotoDialog";
import { foodPhotoAlt } from "./foodPhoto";
import { useV05Today } from "./useV05Today";
import {
	calculateStreaks,
	createCompletionLookup,
	formatStreakValue,
	type CompletionState,
	type StreakId
} from "./motivation";
import type {
	V05DailyEntryInput,
	V05FoodPhotoWithUrl,
	V05MealType,
	V05MotivationData,
	V05TodayData
} from "./types";

type TodayFormState = {
	weight: string;
	steps: string;
	sleepHours: string;
	sleepMinutes: string;
	bedtime: string;
	wakeTime: string;
	previousDayCalories: string;
	workoutActivityType: string;
	workoutDurationMinutes: string;
	notes: string;
};

const emptyForm: TodayFormState = {
	weight: "",
	steps: "",
	sleepHours: "",
	sleepMinutes: "",
	bedtime: "",
	wakeTime: "",
	previousDayCalories: "",
	workoutActivityType: "",
	workoutDurationMinutes: "",
	notes: ""
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const mealTypes: V05MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack", "Other"];
const completionLabels: Record<CompletionState, string> = {
	great: "Great day",
	good: "Good day",
	some: "Some progress",
	none: "No activity",
	neutral: "Neutral"
};
const completionMarkers: Record<CompletionState, string> = {
	great: "++",
	good: "+",
	some: ".",
	none: "x",
	neutral: ""
};

const streakIcons: Record<StreakId, LucideIcon> = {
	workout: Dumbbell,
	goodSleep: Moon,
	skincare: Sparkles,
	vitamins: Pill,
	logging: CalendarDays
};

function FieldLabel({
	Icon,
	children
}: {
	Icon: LucideIcon;
	children: ReactNode;
}) {
	return (
		<span className="field-label">
			<span className="field-icon" aria-hidden="true">
				<Icon size={14} />
			</span>
			<span>{children}</span>
		</span>
	);
}

function toNumberOrNull(value: string, allowDecimal = false) {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const parsed = allowDecimal ? Number(trimmed) : Number.parseInt(trimmed, 10);
	return Number.isFinite(parsed) ? parsed : null;
}

function toTimeOrNull(value: string) {
	return value ? value : null;
}

function toFormState(data: V05TodayData | undefined): TodayFormState {
	const entry = data?.dailyEntry;
	if (!entry) return emptyForm;

	const sleepDuration = entry.sleep_duration_minutes;

	return {
		weight: entry.weight == null ? "" : String(entry.weight),
		steps: entry.steps == null ? "" : String(entry.steps),
		sleepHours: sleepDuration == null ? "" : String(Math.floor(sleepDuration / 60)),
		sleepMinutes: sleepDuration == null ? "" : String(sleepDuration % 60),
		bedtime: entry.bedtime?.slice(0, 5) ?? "",
		wakeTime: entry.wake_time?.slice(0, 5) ?? "",
		previousDayCalories:
			entry.previous_day_calories == null ? "" : String(entry.previous_day_calories),
		workoutActivityType: entry.workout_activity_type ?? "",
		workoutDurationMinutes:
			entry.workout_duration_minutes == null ? "" : String(entry.workout_duration_minutes),
		notes: entry.notes ?? ""
	};
}

function getChecklistState(data: V05TodayData | undefined) {
	const state: Partial<Record<V05ChecklistItemKey, boolean>> = {};

	for (const completion of data?.checklistCompletions ?? []) {
		state[completion.item_key] = completion.completed;
	}

	if (data?.dailyEntry?.worked_out && state.workout === undefined) {
		state.workout = true;
	}

	return state;
}

function toDailyEntryInput(
	form: TodayFormState,
	workedOut: boolean
): V05DailyEntryInput {
	const sleepHours = toNumberOrNull(form.sleepHours) ?? 0;
	const sleepMinutes = toNumberOrNull(form.sleepMinutes) ?? 0;
	const hasSleepDuration = form.sleepHours.trim() || form.sleepMinutes.trim();

	return {
		weight: toNumberOrNull(form.weight, true),
		steps: toNumberOrNull(form.steps),
		sleep_duration_minutes: hasSleepDuration ? sleepHours * 60 + sleepMinutes : null,
		bedtime: toTimeOrNull(form.bedtime),
		wake_time: toTimeOrNull(form.wakeTime),
		previous_day_calories: toNumberOrNull(form.previousDayCalories),
		worked_out: workedOut,
		workout_activity_type: workedOut ? form.workoutActivityType.trim() || null : null,
		workout_duration_minutes: workedOut
			? toNumberOrNull(form.workoutDurationMinutes)
			: null,
		notes: form.notes.trim() || null
	};
}

function statusText(
	isSavingFields: boolean,
	isSavingChecklist: boolean,
	hasEntry: boolean,
	saveStatus: "idle" | "saved" | "error"
) {
	if (isSavingFields || isSavingChecklist) return "Saving...";
	if (saveStatus === "saved") return "Saved";
	if (saveStatus === "error") return "Could not save";
	return hasEntry ? "Saved entry loaded" : "No saved check-in yet";
}

type TodayHook = ReturnType<typeof useV05Today>;

type TodayCheckInProps = {
	dateKey: string;
	isConfigured: boolean;
	isLoading: boolean;
	hasLoadError: boolean;
	hasEntry: boolean;
	todayData: V05TodayData | undefined;
	saveDailyEntry: TodayHook["saveDailyEntry"];
	setChecklistCompletion: TodayHook["setChecklistCompletion"];
	foodPhotos: TodayHook["foodPhotos"];
	uploadFoodPhoto: TodayHook["uploadFoodPhoto"];
	deleteFoodPhoto: TodayHook["deleteFoodPhoto"];
};

function TodayCheckIn({
	dateKey,
	isConfigured,
	isLoading,
	hasLoadError,
	hasEntry,
	todayData,
	saveDailyEntry,
	setChecklistCompletion,
	foodPhotos,
	uploadFoodPhoto,
	deleteFoodPhoto
}: TodayCheckInProps) {
	const [form, setForm] = useState<TodayFormState>(() => toFormState(todayData));
	const [checklistState, setChecklistState] = useState<
		Partial<Record<V05ChecklistItemKey, boolean>>
	>(() => getChecklistState(todayData));
	const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
	const dueItems = useMemo(() => getDueChecklistItems(dateKey), [dateKey]);
	const workedOut = Boolean(checklistState.workout);
	const isSavingFields = saveDailyEntry.isPending;
	const isSavingChecklist = setChecklistCompletion.isPending;

	function updateForm<Field extends keyof TodayFormState>(
		field: Field,
		value: TodayFormState[Field]
	) {
		setForm((current) => ({ ...current, [field]: value }));
		setSaveStatus("idle");
	}

	async function handleChecklistChange(itemKey: V05ChecklistItemKey, completed: boolean) {
		const previous = checklistState[itemKey] ?? false;
		setChecklistState((current) => ({ ...current, [itemKey]: completed }));
		setSaveStatus("idle");

		if (itemKey === "workout" && !completed) {
			setForm((current) => ({
				...current,
				workoutActivityType: "",
				workoutDurationMinutes: ""
			}));
		}

		try {
			await setChecklistCompletion.mutateAsync({ itemKey, completed });
			setSaveStatus("saved");
		} catch {
			setChecklistState((current) => ({ ...current, [itemKey]: previous }));
			setSaveStatus("error");
		}
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			await saveDailyEntry.mutateAsync(toDailyEntryInput(form, workedOut));
			setSaveStatus("saved");
		} catch {
			setSaveStatus("error");
		}
	}

	return (
		<form className="quest-board" aria-labelledby="checkin-title" onSubmit={handleSubmit}>
					<div className="board-clip" aria-hidden="true" />
					<div className="section-heading compact">
						<div>
							<p className="eyebrow">{formatFriendlyDate(dateKey)}</p>
							<h3 id="checkin-title">Daily check-in</h3>
						</div>
						<span className={`status-chip ${saveStatus === "error" ? "error-chip" : ""}`}>
							{statusText(isSavingFields, isSavingChecklist, hasEntry, saveStatus)}
						</span>
					</div>

					{!isConfigured ? (
						<section className="setup-panel" role="status">
							<strong>Supabase setup pending</strong>
							<span>Sign-in data will save here once Supabase is configured.</span>
						</section>
					) : null}

					{isLoading ? (
						<section className="panel-state" role="status">
							Loading today's saved check-in...
						</section>
					) : null}

					{hasLoadError ? (
						<section className="panel-state error-state" role="alert">
							Today's check-in could not load. Please try refreshing.
						</section>
					) : null}

					<fieldset className="checklist-fieldset" disabled={!isConfigured || isLoading}>
						<legend>Checklist</legend>
						<div className="check-preview-list">
							{dueItems.map((item) => (
								<label className="check-preview real-check" key={item.key}>
									<input
										type="checkbox"
										checked={Boolean(checklistState[item.key])}
										onChange={(event) =>
											void handleChecklistChange(item.key, event.target.checked)
										}
									/>
									<span className="tiny-checkbox" aria-hidden="true">
										<Check size={14} />
									</span>
									<span>{item.label}</span>
								</label>
							))}
						</div>
					</fieldset>

					<div className="daily-input-grid">
						<label>
							<FieldLabel Icon={Weight}>
								Weight <em>lb</em>
							</FieldLabel>
							<input
								type="number"
								inputMode="decimal"
								min="0"
								step="0.1"
								value={form.weight}
								onChange={(event) => updateForm("weight", event.target.value)}
							/>
						</label>
						<label>
							<FieldLabel Icon={SportShoe}>Steps</FieldLabel>
							<input
								type="number"
								inputMode="numeric"
								min="0"
								step="1"
								value={form.steps}
								onChange={(event) => updateForm("steps", event.target.value)}
							/>
						</label>
						<label>
							<FieldLabel Icon={Moon}>Sleep hours</FieldLabel>
							<input
								type="number"
								inputMode="numeric"
								min="0"
								step="1"
								value={form.sleepHours}
								onChange={(event) => updateForm("sleepHours", event.target.value)}
							/>
						</label>
						<label>
							<FieldLabel Icon={Moon}>Sleep minutes</FieldLabel>
							<input
								type="number"
								inputMode="numeric"
								min="0"
								max="59"
								step="1"
								value={form.sleepMinutes}
								onChange={(event) => updateForm("sleepMinutes", event.target.value)}
							/>
						</label>
						<label>
							<FieldLabel Icon={Bed}>Bedtime</FieldLabel>
							<input
								type="time"
								value={form.bedtime}
								onChange={(event) => updateForm("bedtime", event.target.value)}
							/>
						</label>
						<label>
							<FieldLabel Icon={Sun}>Wake-up time</FieldLabel>
							<input
								type="time"
								value={form.wakeTime}
								onChange={(event) => updateForm("wakeTime", event.target.value)}
							/>
						</label>
						<label>
							<FieldLabel Icon={Utensils}>Yesterday's calories</FieldLabel>
							<input
								type="number"
								inputMode="numeric"
								min="0"
								step="1"
								value={form.previousDayCalories}
								onChange={(event) =>
									updateForm("previousDayCalories", event.target.value)
								}
							/>
						</label>
						<label className="wide-field">
							<FieldLabel Icon={PencilLine}>Tiny note</FieldLabel>
							<input
								type="text"
								value={form.notes}
								onChange={(event) => updateForm("notes", event.target.value)}
							/>
						</label>
					</div>

					<section
						className={`workout-details ${workedOut ? "" : "inactive"}`}
						aria-labelledby="workout-details-title"
					>
						<div>
							<p className="eyebrow">Workout</p>
							<h4 id="workout-details-title">Activity details</h4>
						</div>
						<div className="daily-input-grid two-column">
							<label>
								<FieldLabel Icon={Dumbbell}>Activity type</FieldLabel>
								<input
									type="text"
									value={form.workoutActivityType}
									disabled={!workedOut}
									onChange={(event) =>
										updateForm("workoutActivityType", event.target.value)
									}
								/>
							</label>
							<label>
								<FieldLabel Icon={Timer}>
									Duration <em>minutes</em>
								</FieldLabel>
								<input
									type="number"
									inputMode="numeric"
									min="0"
									step="1"
									value={form.workoutDurationMinutes}
									disabled={!workedOut}
									onChange={(event) =>
										updateForm("workoutDurationMinutes", event.target.value)
									}
								/>
							</label>
						</div>
						{!workedOut ? (
							<p className="mini-note">Check Worked Out to add activity details.</p>
						) : null}
					</section>

					<section className="food-photo-preview" aria-labelledby="food-photo-title">
						<FoodPhotoSection
							dateKey={dateKey}
							isConfigured={isConfigured}
							isLoading={foodPhotos.isLoading}
							hasLoadError={Boolean(foodPhotos.error)}
							photos={foodPhotos.data ?? []}
							uploadFoodPhoto={uploadFoodPhoto}
							deleteFoodPhoto={deleteFoodPhoto}
						/>
					</section>

					{saveStatus === "error" ? (
						<p className="form-error" role="alert">
							Your check-in could not save. Please try again.
						</p>
					) : null}

					<button
						type="submit"
						className="save-checkin-button"
						disabled={!isConfigured || isLoading || isSavingFields}
					>
						<ShieldCheck aria-hidden="true" size={18} />
						{isSavingFields ? "Saving..." : "Save today's check-in"}
					</button>
				</form>
	);
}

function FoodPhotoSection({
	dateKey,
	isConfigured,
	isLoading,
	hasLoadError,
	photos,
	uploadFoodPhoto,
	deleteFoodPhoto
}: {
	dateKey: string;
	isConfigured: boolean;
	isLoading: boolean;
	hasLoadError: boolean;
	photos: V05FoodPhotoWithUrl[];
	uploadFoodPhoto: TodayHook["uploadFoodPhoto"];
	deleteFoodPhoto: TodayHook["deleteFoodPhoto"];
}) {
	const [file, setFile] = useState<File | null>(null);
	const [mealType, setMealType] = useState<"" | V05MealType>("");
	const [note, setNote] = useState("");
	const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
	const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
	const fileInputId = useId();
	const isUploading = uploadFoodPhoto.isPending;
	const isDeleting = deleteFoodPhoto.isPending;
	const selectedPhotoIndex = photos.findIndex((photo) => photo.id === selectedPhotoId);
	const selectedPhoto = selectedPhotoIndex >= 0 ? photos[selectedPhotoIndex] : null;

	async function handleUpload() {
		if (!file) {
			setStatus("error");
			return;
		}

		try {
			await uploadFoodPhoto.mutateAsync({
				file,
				meal_type: mealType || null,
				note: note.trim() || null
			});
			setFile(null);
			setMealType("");
			setNote("");
			setStatus("saved");
		} catch {
			setStatus("error");
		}
	}

	async function handleDelete(photo: V05FoodPhotoWithUrl) {
		const confirmed = window.confirm("Remove this food photo from your scrapbook?");
		if (!confirmed) return;

		try {
			await deleteFoodPhoto.mutateAsync(photo);
			setSelectedPhotoId(null);
			setStatus("saved");
		} catch {
			setStatus("error");
		}
	}

	return (
		<div className="food-upload-panel">
			<div className="section-heading compact">
				<div>
					<p className="eyebrow">Food scrapbook</p>
					<h4 id="food-photo-title">Food photos</h4>
				</div>
				<Camera aria-hidden="true" size={18} />
			</div>

			<div className="food-upload-grid">
				<div className="food-field-card photo-picker-card">
					<FieldLabel Icon={Camera}>Photo</FieldLabel>
					<input
						id={fileInputId}
						className="native-file-input"
						type="file"
						accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
						disabled={!isConfigured || isUploading}
						onChange={(event) => {
							setFile(event.target.files?.[0] ?? null);
							setStatus("idle");
						}}
					/>
					<label className="photo-picker-button" htmlFor={fileInputId}>
						<Camera aria-hidden="true" size={16} />
						Choose or take photo
					</label>
					<p className={`selected-file-name ${file ? "has-file" : ""}`}>
						{file ? `Selected: ${file.name}` : "No photo selected yet"}
					</p>
				</div>
				<label className="food-field-card">
					<FieldLabel Icon={Utensils}>Meal type</FieldLabel>
					<select
						value={mealType}
						disabled={!isConfigured || isUploading}
						onChange={(event) => setMealType(event.target.value as "" | V05MealType)}
					>
						<option value="">Choose one</option>
						{mealTypes.map((type) => (
							<option key={type} value={type}>
								{type}
							</option>
						))}
					</select>
				</label>
				<label className="food-field-card">
					<FieldLabel Icon={PencilLine}>Food note</FieldLabel>
					<input
						type="text"
						value={note}
						disabled={!isConfigured || isUploading}
						onChange={(event) => {
							setNote(event.target.value);
							setStatus("idle");
						}}
						placeholder="Salmon + veggies"
					/>
				</label>
			</div>

			<button
				type="button"
				className="save-checkin-button food-upload-button"
				disabled={!isConfigured || !file || isUploading}
				onClick={() => void handleUpload()}
			>
				<ShieldCheck aria-hidden="true" size={18} />
				{isUploading ? "Uploading..." : `Add photo for ${formatFriendlyDate(dateKey)}`}
			</button>

			{status === "saved" ? <p className="mini-note">Food photo saved.</p> : null}
			{status === "error" ? (
				<p className="form-error" role="alert">
					Food photo could not save. Please choose an image and try again.
				</p>
			) : null}
			{hasLoadError ? (
				<p className="mini-note error-copy" role="status">
					Food thumbnails could not load. Your check-in still works.
				</p>
			) : null}
			{isLoading ? <p className="mini-note">Loading food photos...</p> : null}

			{photos.length ? (
				<div className="today-photo-strip" aria-label="Food photos for this day">
					{photos.map((photo) => (
						<div className="today-photo-chip" key={photo.id}>
							<button
								type="button"
								className="photo-thumb-button"
								aria-label={`Open ${foodPhotoAlt(photo)}`}
								onClick={() => setSelectedPhotoId(photo.id)}
							>
								{photo.signedUrl ? (
									<img src={photo.signedUrl} alt={foodPhotoAlt(photo)} />
								) : (
									<span className="photo-fallback" aria-label="Photo preview unavailable">
										<ImageOff size={18} />
									</span>
								)}
							</button>
							<div>
								<strong>{photo.meal_type ?? "Food photo"}</strong>
								{photo.note ? <small>{photo.note}</small> : null}
							</div>
							<button
								type="button"
								className="icon-button danger"
								aria-label={`Delete ${foodPhotoAlt(photo)}`}
								disabled={isDeleting}
								onClick={() => void handleDelete(photo)}
							>
								Delete
							</button>
						</div>
					))}
				</div>
			) : (
				<p className="mini-note">Your food scrapbook is waiting for its first photo.</p>
			)}
			{selectedPhoto ? (
				<FoodPhotoDialog
					photo={selectedPhoto}
					isDeleting={isDeleting}
					onClose={() => setSelectedPhotoId(null)}
					onDelete={() => void handleDelete(selectedPhoto)}
					position={selectedPhotoIndex + 1}
					total={photos.length}
					canGoPrevious={selectedPhotoIndex > 0}
					canGoNext={selectedPhotoIndex < photos.length - 1}
					onPrevious={() => setSelectedPhotoId(photos[selectedPhotoIndex - 1]?.id ?? null)}
					onNext={() => setSelectedPhotoId(photos[selectedPhotoIndex + 1]?.id ?? null)}
				/>
			) : null}
		</div>
	);
}

function TodayMotivation({
	displayMonthKey,
	selectedDateKey,
	todayKey,
	motivationData,
	isLoading,
	hasError,
	onSelectDate,
	onChangeMonth
}: {
	displayMonthKey: string;
	selectedDateKey: string;
	todayKey: string;
	motivationData: V05MotivationData | undefined;
	isLoading: boolean;
	hasError: boolean;
	onSelectDate: (dateKey: string) => void;
	onChangeMonth: (monthOffset: number) => void;
}) {
	const calendarDays = useMemo(
		() => getCalendarDays(displayMonthKey, todayKey),
		[displayMonthKey, todayKey]
	);
	const calendarBlanks = useMemo(
		() => getCalendarLeadingBlanks(displayMonthKey),
		[displayMonthKey]
	);
	const completionLookup = useMemo(
		() =>
			createCompletionLookup({
				entries: motivationData?.dailyEntries ?? [],
				completions: motivationData?.checklistCompletions ?? [],
				trackingStartDate: motivationData?.trackingStartDate ?? null,
				todayKey
			}),
		[motivationData, todayKey]
	);
	const streaks = useMemo(
		() =>
			calculateStreaks({
				entries: motivationData?.dailyEntries ?? [],
				completions: motivationData?.checklistCompletions ?? [],
				trackingStartDate: motivationData?.trackingStartDate ?? null,
				todayKey
			}),
		[motivationData, todayKey]
	);

	return (
				<aside className="side-stack" aria-label="Today motivation">
					<section className="pixel-card" aria-labelledby="calendar-title">
						<div className="calendar-heading">
							<button
								type="button"
								aria-label="Previous month"
								onClick={() => onChangeMonth(-1)}
							>
								<ChevronLeft aria-hidden="true" size={18} />
							</button>
							<h3 id="calendar-title">{formatMonthYear(displayMonthKey)}</h3>
							<button
								type="button"
								aria-label="Next month"
								onClick={() => onChangeMonth(1)}
							>
								<ChevronRight aria-hidden="true" size={18} />
							</button>
						</div>
						<div className="weekday-row" aria-hidden="true">
							{weekdays.map((day) => (
								<span key={day}>{day}</span>
							))}
						</div>
						<div className="calendar-grid numbered-calendar" aria-label="Calendar preview">
							{Array.from({ length: calendarBlanks }, (_, index) => (
								<span key={`blank-${index}`} className="calendar-day spacer" />
							))}
							{calendarDays.map((day) => {
								const completion = completionLookup(day.key);
								const stateLabel = day.isFuture
									? "Future date"
									: completionLabels[completion.state];
								const stateClass =
									completion.state === "none" ? "empty" : completion.state;

								return (
									<button
										type="button"
										key={day.key}
										className={`calendar-day ${stateClass} ${
											day.isToday ? "today" : ""
										} ${day.isFuture ? "future" : ""} ${
											day.key === selectedDateKey ? "selected" : ""
										}`}
										aria-label={`${day.key}, ${stateLabel}${
											day.isToday ? ", today" : ""
										}`}
										aria-current={day.key === selectedDateKey ? "date" : undefined}
										disabled={day.isFuture}
										onClick={() => onSelectDate(day.key)}
									>
										<span className="calendar-number">{day.dayNumber}</span>
										<span className="calendar-marker" aria-hidden="true">
											{completionMarkers[completion.state]}
										</span>
									</button>
								);
							})}
						</div>
						<div className="calendar-legend" aria-label="Calendar completion legend">
							{(["great", "good", "some", "none"] as CompletionState[]).map((state) => (
								<span key={state}>
									<span className={`legend-swatch ${state}`} aria-hidden="true" />
									{completionLabels[state].replace(" day", "")}
								</span>
							))}
						</div>
						{isLoading ? (
							<p className="mini-note" role="status">
								Loading month progress...
							</p>
						) : null}
						{hasError ? (
							<p className="mini-note error-copy" role="status">
								Motivation panel could not refresh. Your check-in still works.
							</p>
						) : null}
						{!isLoading && !hasError && !motivationData?.trackingStartDate ? (
							<p className="mini-note">Save a first check-in to begin tracking.</p>
						) : null}
					</section>

					<section className="pixel-card" aria-labelledby="streaks-title">
						<p className="eyebrow">Tiny cheers</p>
						<h3 id="streaks-title">Current streaks</h3>
						<div className="streak-list">
							{streaks.map((streak) => {
								const Icon = streakIcons[streak.id];

								return (
									<div className="streak-card" key={streak.id}>
										<span className="streak-icon" aria-hidden="true">
											<Icon size={18} />
										</span>
										<span>{streak.label}</span>
										<small>{formatStreakValue(streak.count)}</small>
									</div>
								);
							})}
						</div>
					</section>
				</aside>
	);
}

export function TodayPage() {
	const { isConfigured } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const todayKey = toLocalDateKey();
	const initialDateKey = searchParams.get("date");
	const [dateKey, setDateKey] = useState(() =>
		initialDateKey && initialDateKey <= todayKey ? initialDateKey : todayKey
	);
	const [displayMonthKey, setDisplayMonthKey] = useState(() => toMonthKey(todayKey));
	const {
		profile,
		today,
		motivation,
		foodPhotos,
		saveDailyEntry,
		setChecklistCompletion,
		uploadFoodPhoto,
		deleteFoodPhoto
	} = useV05Today(dateKey, displayMonthKey, todayKey);
	const isLoading = profile.isLoading || today.isLoading;
	const hasLoadError = Boolean(profile.error || today.error);
	const hasEntry = Boolean(today.data?.dailyEntry);
	const formKey = [
		dateKey,
		today.data?.dailyEntry?.id ?? "new",
		today.data?.dailyEntry?.updated_at ?? "empty",
		...(today.data?.checklistCompletions ?? []).map(
			(completion) =>
				`${completion.item_key}:${completion.completed}:${completion.updated_at ?? ""}`
		)
	].join("|");

	function handleActiveDateChange(nextDateKey: string) {
		const safeDateKey = nextDateKey > todayKey ? todayKey : nextDateKey;
		setDateKey(safeDateKey);
		setDisplayMonthKey(toMonthKey(safeDateKey));
		setSearchParams(safeDateKey === todayKey ? {} : { date: safeDateKey });
	}

	return (
		<section className="v05-screen today-screen" aria-labelledby="today-title">
			<div className="surface-header today-header">
				<div>
					<p className="eyebrow">Daily quest board</p>
					<h2 id="today-title">Today</h2>
				</div>
				<label className="date-pill">
					<span>Entry date</span>
					<input
						type="date"
						value={dateKey}
						max={todayKey}
						onChange={(event) => handleActiveDateChange(event.target.value)}
					/>
				</label>
			</div>

			<div className="today-layout">
				<TodayCheckIn
					key={formKey}
					dateKey={dateKey}
					isConfigured={isConfigured}
					isLoading={isLoading}
					hasLoadError={hasLoadError}
					hasEntry={hasEntry}
					todayData={today.data}
					saveDailyEntry={saveDailyEntry}
					setChecklistCompletion={setChecklistCompletion}
					foodPhotos={foodPhotos}
					uploadFoodPhoto={uploadFoodPhoto}
					deleteFoodPhoto={deleteFoodPhoto}
				/>
				<TodayMotivation
					displayMonthKey={displayMonthKey}
					selectedDateKey={dateKey}
					todayKey={todayKey}
					motivationData={motivation.data}
					isLoading={motivation.isLoading}
					hasError={Boolean(motivation.error)}
					onSelectDate={handleActiveDateChange}
					onChangeMonth={(monthOffset) =>
						setDisplayMonthKey((current) => addCalendarMonths(current, monthOffset))
					}
				/>
			</div>
		</section>
	);
}

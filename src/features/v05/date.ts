const monthFormatter = new Intl.DateTimeFormat(undefined, {
	month: "long",
	year: "numeric"
});

export type CalendarDay = {
	key: string;
	dayNumber: number;
	isToday: boolean;
	isFuture: boolean;
};

function pad(value: number) {
	return String(value).padStart(2, "0");
}

export function toLocalDateKey(date = new Date()) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseLocalDateKey(dateKey: string) {
	const [year, month, day] = dateKey.split("-").map(Number);
	return new Date(year, month - 1, day);
}

export function formatFriendlyDate(dateKey: string) {
	return parseLocalDateKey(dateKey).toLocaleDateString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric"
	});
}

export function formatMonthYear(dateKey: string) {
	return monthFormatter.format(parseLocalDateKey(dateKey));
}

export function toMonthKey(dateKey: string) {
	const date = parseLocalDateKey(dateKey);
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-01`;
}

export function addCalendarMonths(dateKey: string, monthOffset: number) {
	const date = parseLocalDateKey(dateKey);
	return toLocalDateKey(new Date(date.getFullYear(), date.getMonth() + monthOffset, 1));
}

export function getCalendarLeadingBlanks(dateKey: string) {
	const selected = parseLocalDateKey(dateKey);
	return new Date(selected.getFullYear(), selected.getMonth(), 1).getDay();
}

export function getCalendarDays(dateKey: string, todayKey = toLocalDateKey()) {
	const selected = parseLocalDateKey(dateKey);
	const year = selected.getFullYear();
	const month = selected.getMonth();
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	return Array.from({ length: daysInMonth }, (_, index): CalendarDay => {
		const dayNumber = index + 1;
		const key = `${year}-${pad(month + 1)}-${pad(dayNumber)}`;

		return {
			key,
			dayNumber,
			isToday: key === todayKey,
			isFuture: key > todayKey
		};
	});
}

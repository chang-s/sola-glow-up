import achievementIcon from "./icons/achievement.png";
import arrowLeftIcon from "./icons/arrow-left.png";
import arrowRightIcon from "./icons/arrow-right.png";
import bedtimeIcon from "./icons/bedtime.png";
import calendarIcon from "./icons/calendar.png";
import caloriesIcon from "./icons/calories.png";
import cameraIcon from "./icons/camera.png";
import coffeeIcon from "./icons/coffee.png";
import completedIcon from "./icons/completed.png";
import faceMaskIcon from "./icons/face-mask.png";
import heartIcon from "./icons/heart.png";
import heartsIcon from "./icons/hearts.png";
import historyIcon from "./icons/history.png";
import homeIcon from "./icons/home.png";
import irestoreIcon from "./icons/irestore.png";
import loggingIcon from "./icons/logging.png";
import mealIcon from "./icons/meal.png";
import medicationIcon from "./icons/medication.png";
import menuIcon from "./icons/menu.png";
import moonIcon from "./icons/moon.png";
import noteIcon from "./icons/note.png";
import notificationIcon from "./icons/notification.png";
import pawIcon from "./icons/paw.png";
import plantIcon from "./icons/plant.png";
import progressIcon from "./icons/progress.png";
import settingsIcon from "./icons/settings.png";
import skincareIcon from "./icons/skincare.png";
import sleepIcon from "./icons/sleep.png";
import sparklesIcon from "./icons/sparkles.png";
import stepsIcon from "./icons/steps.png";
import streakIcon from "./icons/streak.png";
import vitaminsIcon from "./icons/vitamins.png";
import wakeUpIcon from "./icons/wake-up.png";
import weightIcon from "./icons/weight.png";
import weightTrendIcon from "./icons/weight-trend.png";
import workoutIcon from "./icons/workout.png";
import solaCelebrate from "./mascot/sola-celebrate.png";
import solaHistory from "./mascot/sola-history.png";
import solaProgress from "./mascot/sola-progress.png";
import solaToday from "./mascot/sola-today.png";

export const pixelIconMasters = {
	achievement: achievementIcon,
	arrowLeft: arrowLeftIcon,
	arrowRight: arrowRightIcon,
	bedtime: bedtimeIcon,
	calendar: calendarIcon,
	calories: caloriesIcon,
	camera: cameraIcon,
	coffee: coffeeIcon,
	completed: completedIcon,
	faceMask: faceMaskIcon,
	heart: heartIcon,
	hearts: heartsIcon,
	history: historyIcon,
	home: homeIcon,
	irestore: irestoreIcon,
	logging: loggingIcon,
	meal: mealIcon,
	medication: medicationIcon,
	menu: menuIcon,
	moon: moonIcon,
	note: noteIcon,
	notification: notificationIcon,
	paw: pawIcon,
	plant: plantIcon,
	progress: progressIcon,
	settings: settingsIcon,
	skincare: skincareIcon,
	sleep: sleepIcon,
	sparkles: sparklesIcon,
	steps: stepsIcon,
	streak: streakIcon,
	vitamins: vitaminsIcon,
	wakeUp: wakeUpIcon,
	weight: weightIcon,
	weightTrend: weightTrendIcon,
	workout: workoutIcon
} as const;

export type PixelIconName = keyof typeof pixelIconMasters;
export type PixelIconUiSize = "tiny" | "standard" | "medium";

const uiIconModules = import.meta.glob("./icons/ui/*/*.png", {
	eager: true,
	query: "?url",
	import: "default"
});

function buildUiIconSet(size: "24" | "32" | "40") {
	const entries = Object.entries(pixelIconMasters).map(([name, masterSrc]) => {
		const fileName = `${name.replace(/[A-Z]/g, "-$&").toLowerCase()}.png`;
		const match = Object.entries(uiIconModules).find(([path]) =>
			path.endsWith(`/ui/${size}/${fileName}`)
		);

		return [name, (match?.[1] as string | undefined) ?? masterSrc];
	});

	return Object.fromEntries(entries) as Record<PixelIconName, string>;
}

export const pixelIcons = {
	tiny: buildUiIconSet("24"),
	standard: buildUiIconSet("32"),
	medium: buildUiIconSet("40")
} as const satisfies Record<PixelIconUiSize, Record<PixelIconName, string>>;

export const pixelMascots = {
	today: solaToday,
	history: solaHistory,
	progress: solaProgress,
	celebrate: solaCelebrate
} as const;

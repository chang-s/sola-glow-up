import { formatFriendlyDate } from "./date";
import type { V05FoodPhotoWithUrl } from "./types";

export function foodPhotoAlt(photo: V05FoodPhotoWithUrl) {
	const meal = photo.meal_type ? `${photo.meal_type} ` : "";
	return `${meal}food photo from ${formatFriendlyDate(photo.entry_date)}`;
}

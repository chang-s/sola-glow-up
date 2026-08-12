import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrCreateProfile } from "../habits/api";
import { useAuth } from "../auth/useAuth";
import {
	deleteV05FoodPhoto,
	loadV05FoodPhotos,
	loadV05HistoryData,
	loadV05MotivationData,
	loadV05ProgressData,
	loadV05TodayData,
	saveV05DailyEntry,
	setV05ChecklistCompletion,
	uploadV05FoodPhoto
} from "./api";
import { getMonthRange } from "./date";
import type { V05ChecklistItemKey } from "./checklist";
import type { V05DailyEntryInput, V05FoodPhoto, V05FoodPhotoInput } from "./types";

export function useV05Profile() {
	const { user, isConfigured } = useAuth();

	return useQuery({
		queryKey: ["profile", user?.id],
		enabled: isConfigured && Boolean(user),
		queryFn: () => {
			if (!user) throw new Error("A signed-in user is required.");
			return getOrCreateProfile(user);
		}
	});
}

export function useV05Today(dateKey: string, displayMonthKey: string, todayKey: string) {
	const queryClient = useQueryClient();
	const profile = useV05Profile();
	const todayQueryKey = ["v05-today", profile.data?.id, dateKey];
	const motivationQueryKey = ["v05-motivation", profile.data?.id, displayMonthKey, todayKey];
	const foodPhotosQueryKey = ["v05-food-photos", profile.data?.id, dateKey];

	const today = useQuery({
		queryKey: todayQueryKey,
		enabled: Boolean(profile.data?.id),
		queryFn: () => loadV05TodayData(profile.data!.id, dateKey)
	});

	const motivation = useQuery({
		queryKey: motivationQueryKey,
		enabled: Boolean(profile.data?.id),
		queryFn: () => {
			const monthRange = getMonthRange(displayMonthKey);
			const rangeStart = monthRange.start < todayKey ? monthRange.start : todayKey;
			const rangeEnd = monthRange.end > todayKey ? monthRange.end : todayKey;
			return loadV05MotivationData(profile.data!.id, rangeStart, rangeEnd);
		}
	});

	const foodPhotos = useQuery({
		queryKey: foodPhotosQueryKey,
		enabled: Boolean(profile.data?.id),
		queryFn: () => loadV05FoodPhotos(profile.data!.id, dateKey)
	});

	const saveDailyEntry = useMutation({
		mutationFn: (input: V05DailyEntryInput) => {
			if (!profile.data?.id) throw new Error("Profile is not ready.");
			return saveV05DailyEntry(profile.data.id, dateKey, input);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: todayQueryKey });
			void queryClient.invalidateQueries({
				queryKey: ["v05-motivation", profile.data?.id]
			});
			void queryClient.invalidateQueries({
				queryKey: ["v05-history", profile.data?.id]
			});
			void queryClient.invalidateQueries({
				queryKey: ["v05-progress", profile.data?.id]
			});
		}
	});

	const setChecklistCompletion = useMutation({
		mutationFn: (input: { itemKey: V05ChecklistItemKey; completed: boolean }) => {
			if (!profile.data?.id) throw new Error("Profile is not ready.");
			return setV05ChecklistCompletion(
				profile.data.id,
				dateKey,
				input.itemKey,
				input.completed
			);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: todayQueryKey });
			void queryClient.invalidateQueries({
				queryKey: ["v05-motivation", profile.data?.id]
			});
			void queryClient.invalidateQueries({
				queryKey: ["v05-history", profile.data?.id]
			});
		}
	});

	const uploadFoodPhoto = useMutation({
		mutationFn: (input: V05FoodPhotoInput) => {
			if (!profile.data?.id) throw new Error("Profile is not ready.");
			return uploadV05FoodPhoto(profile.data.id, dateKey, input);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: todayQueryKey });
			void queryClient.invalidateQueries({ queryKey: foodPhotosQueryKey });
			void queryClient.invalidateQueries({
				queryKey: ["v05-motivation", profile.data?.id]
			});
			void queryClient.invalidateQueries({
				queryKey: ["v05-history", profile.data?.id]
			});
		}
	});

	const deleteFoodPhoto = useMutation({
		mutationFn: (photo: V05FoodPhoto) => {
			if (!profile.data?.id) throw new Error("Profile is not ready.");
			return deleteV05FoodPhoto(profile.data.id, photo);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: foodPhotosQueryKey });
			void queryClient.invalidateQueries({
				queryKey: ["v05-history", profile.data?.id]
			});
		}
	});

	return {
		profile,
		today,
		motivation,
		foodPhotos,
		saveDailyEntry,
		setChecklistCompletion,
		uploadFoodPhoto,
		deleteFoodPhoto
	};
}

export function useV05History() {
	const profile = useV05Profile();

	const history = useQuery({
		queryKey: ["v05-history", profile.data?.id],
		enabled: Boolean(profile.data?.id),
		queryFn: () => loadV05HistoryData(profile.data!.id)
	});

	return { profile, history };
}

export function useV05Progress() {
	const profile = useV05Profile();

	const progress = useQuery({
		queryKey: ["v05-progress", profile.data?.id],
		enabled: Boolean(profile.data?.id),
		queryFn: () => loadV05ProgressData(profile.data!.id)
	});

	return { profile, progress };
}

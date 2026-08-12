import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrCreateProfile } from "../habits/api";
import { useAuth } from "../auth/useAuth";
import {
	loadV05MotivationData,
	loadV05TodayData,
	saveV05DailyEntry,
	setV05ChecklistCompletion
} from "./api";
import { getMonthRange } from "./date";
import type { V05ChecklistItemKey } from "./checklist";
import type { V05DailyEntryInput } from "./types";

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
		}
	});

	return {
		profile,
		today,
		motivation,
		saveDailyEntry,
		setChecklistCompletion
	};
}

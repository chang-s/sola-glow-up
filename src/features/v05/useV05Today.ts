import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrCreateProfile } from "../habits/api";
import { useAuth } from "../auth/useAuth";
import {
	loadV05TodayData,
	saveV05DailyEntry,
	setV05ChecklistCompletion
} from "./api";
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

export function useV05Today(dateKey: string) {
	const queryClient = useQueryClient();
	const profile = useV05Profile();
	const todayQueryKey = ["v05-today", profile.data?.id, dateKey];

	const today = useQuery({
		queryKey: todayQueryKey,
		enabled: Boolean(profile.data?.id),
		queryFn: () => loadV05TodayData(profile.data!.id, dateKey)
	});

	const saveDailyEntry = useMutation({
		mutationFn: (input: V05DailyEntryInput) => {
			if (!profile.data?.id) throw new Error("Profile is not ready.");
			return saveV05DailyEntry(profile.data.id, dateKey, input);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: todayQueryKey });
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
		}
	});

	return {
		profile,
		today,
		saveDailyEntry,
		setChecklistCompletion
	};
}

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { getOrCreateProfile, loadHabitDashboard } from "./api";

export function useProfile() {
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

export function useHabitDashboard(dateKey: string) {
	const profile = useProfile();

	const dashboard = useQuery({
		queryKey: ["habit-dashboard", profile.data?.id, dateKey],
		enabled: Boolean(profile.data?.id),
		queryFn: () => loadHabitDashboard(profile.data!.id, dateKey)
	});

	return { profile, dashboard };
}

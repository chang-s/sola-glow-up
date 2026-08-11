import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigStatus } from "../../lib/supabase";
import { AuthContext, type AuthContextValue } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthContextValue["user"]>(null);
	const [isLoading, setIsLoading] = useState(Boolean(supabase));

	useEffect(() => {
		if (!supabase) {
			return;
		}

		let isMounted = true;

		supabase.auth.getSession().then(({ data }) => {
			if (!isMounted) return;
			setUser(data.session?.user ?? null);
			setIsLoading(false);
		});

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
			setIsLoading(false);
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, []);

	const signIn = useCallback(async (email: string, password: string) => {
		if (!supabase) {
			return {
				error: "Supabase environment variables are not configured yet."
			};
		}

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		return { error: error?.message };
	}, []);

	const signOut = useCallback(async () => {
		if (!supabase) return;
		await supabase.auth.signOut();
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			isConfigured: supabaseConfigStatus.isConfigured,
			isLoading,
			user,
			signIn,
			signOut
		}),
		[isLoading, signIn, signOut, user]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

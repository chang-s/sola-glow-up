import { createContext } from "react";
import type { User } from "@supabase/supabase-js";

export type AuthContextValue = {
	isConfigured: boolean;
	isLoading: boolean;
	user: User | null;
	signIn: (email: string, password: string) => Promise<{ error?: string }>;
	signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

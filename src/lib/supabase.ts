import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseEnv } from "./env";

export const supabaseConfigStatus = {
	isConfigured: hasSupabaseEnv
};

export const supabase = hasSupabaseEnv
	? createClient(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_ANON_KEY!)
	: null;

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, ".", "");
	const defaultBasePath = mode === "production" ? "/sola-glow-up/" : "/";
	const basePath = env.VITE_BASE_PATH || defaultBasePath;

	return {
		base: basePath,
		plugins: [
			react(),
			VitePWA({
				registerType: "autoUpdate",
				includeAssets: ["icons/icon.svg"],
				manifest: {
					name: "Sola Glow-Up",
					short_name: "Glow-Up",
					description: "Private, cozy personal growth and wellness tracker.",
					theme_color: "#f7a7b8",
					background_color: "#fff7ed",
					display: "standalone",
					orientation: "portrait-primary",
					scope: basePath,
					start_url: basePath,
					icons: [
						{
							src: `${basePath}icons/icon.svg`,
							sizes: "any",
							type: "image/svg+xml",
							purpose: "any maskable"
						}
					]
				},
				workbox: {
					globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
					navigateFallbackDenylist: [/^\/auth/]
				}
			})
		]
	};
});

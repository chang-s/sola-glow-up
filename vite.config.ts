import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
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
				scope: "/",
				start_url: "/",
				icons: [
					{
						src: "/icons/icon.svg",
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
});

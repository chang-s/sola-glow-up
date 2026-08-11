import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/browser",
	timeout: 30_000,
	expect: {
		timeout: 5_000
	},
	use: {
		baseURL: "http://127.0.0.1:4173",
		trace: "on-first-retry"
	},
	projects: [
		{
			name: "desktop",
			use: { ...devices["Desktop Chrome"] }
		},
		{
			name: "android-mobile",
			use: { ...devices["Pixel 7"] }
		}
	]
});

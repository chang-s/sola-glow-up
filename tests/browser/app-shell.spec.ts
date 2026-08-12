import { expect, test, type Page } from "@playwright/test";

async function expectFoundationEntry(page: Page) {
	const loginButton = page.getByRole("button", { name: "Sign in" });
	const navigation = page.getByRole("navigation", { name: "Primary" });

	await expect(loginButton.or(navigation)).toBeVisible();

	return {
		isLogin: await loginButton.isVisible()
	};
}

test("renders the responsive app shell", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("heading", { name: "Sola Glow-Up" })).toBeVisible();
	const { isLogin } = await expectFoundationEntry(page);

	if (isLogin) {
		await expect(page.getByLabel("Email")).toBeVisible();
		await expect(page.getByLabel("Password")).toBeVisible();
		await expect(page.getByText("Sign in to your tiny cozy check-in space.")).toBeVisible();
		return;
	}

	await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Today" })).toBeVisible();
	await expect(page.getByRole("link", { name: "History" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Progress" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Food" })).toHaveCount(0);
	await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);
	await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
});

test("supports V0.5 shell navigation without tracker data", async ({ page }) => {
	await page.goto("/");
	const { isLogin } = await expectFoundationEntry(page);

	if (isLogin) {
		await expect(page.getByRole("heading", { name: "Sola Glow-Up" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
		return;
	}

	await page.getByRole("link", { name: "History" }).click();

	await expect(page).toHaveURL(/\/history$/);
	await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Food gallery" })).toBeVisible();

	await page.getByRole("link", { name: "Progress" }).click();

	await expect(page).toHaveURL(/\/progress$/);
	await expect(page.getByRole("heading", { name: "Progress" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Trend preview" })).toBeVisible();
});

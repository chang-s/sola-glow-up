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
		await expect(
			page.getByText("Sign in with the approved V1 email/password flow")
		).toBeVisible();
		return;
	}

	await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Today" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
});

test("supports placeholder navigation without implementing later features", async ({
	page
}) => {
	await page.goto("/");
	const { isLogin } = await expectFoundationEntry(page);

	if (isLogin) {
		await expect(page.getByRole("heading", { name: "Sola Glow-Up" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
		return;
	}

	await page.getByRole("link", { name: "Food" }).click();

	await expect(page).toHaveURL(/\/food$/);
	await expect(page.getByRole("heading", { name: "Food" })).toBeVisible();
	await expect(page.getByText("Feature implementation starts")).toBeVisible();
});

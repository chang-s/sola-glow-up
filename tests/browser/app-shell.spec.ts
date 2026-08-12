import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
	await page.getByLabel(/Weight/).fill("181.6");
	await expect(page.getByLabel(/Weight/)).toHaveValue("181.6");

	if ((page.viewportSize()?.width ?? 0) < 800) {
		const navBefore = await page.locator(".mobile-bottom-nav").boundingBox();
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		const navAfter = await page.locator(".mobile-bottom-nav").boundingBox();
		const mobileNavMetrics = await page.evaluate(() => {
			const nav = document.querySelector(".mobile-bottom-nav");
			const layout = document.querySelector(".layout");
			const navRect = nav?.getBoundingClientRect();
			const layoutStyle = layout ? getComputedStyle(layout) : null;
			const navStyle = nav ? getComputedStyle(nav) : null;

			return {
				navPosition: navStyle?.position,
				navBottom: navStyle?.bottom,
				navZIndex: Number(navStyle?.zIndex),
				layoutPaddingBottom: layoutStyle ? Number.parseFloat(layoutStyle.paddingBottom) : 0,
				navHeight: navRect?.height ?? 0,
				viewportHeight: window.innerHeight
			};
		});

		expect(mobileNavMetrics.navPosition).toBe("fixed");
		expect(mobileNavMetrics.navBottom).toBe("0px");
		expect(mobileNavMetrics.navZIndex).toBeGreaterThanOrEqual(1000);
		expect(mobileNavMetrics.layoutPaddingBottom).toBeGreaterThan(
			mobileNavMetrics.navHeight
		);
		expect(navBefore?.y).toBeCloseTo(navAfter?.y ?? 0, 1);
		expect((navAfter?.y ?? 0) + (navAfter?.height ?? 0)).toBeCloseTo(
			mobileNavMetrics.viewportHeight,
			1
		);
	}
});

test("keeps the mobile tab bar fixed to the viewport bottom while Today scrolls", async ({
	page
}) => {
	test.skip((page.viewportSize()?.width ?? 0) >= 800, "mobile-only fixed nav check");

	const css = readFileSync(resolve("src/styles/global.css"), "utf8");
	await page.setContent(`
		<!doctype html>
		<html>
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<style>${css}</style>
			</head>
			<body>
				<div class="app-shell">
					<header class="topbar">
						<div class="brand-lockup"><div class="pixel-sola"></div><div><p class="eyebrow">Daily tracker</p><h1>Sola Glow-Up</h1></div></div>
					</header>
					<div class="layout">
						<nav class="primary-nav desktop-nav" aria-label="Primary">
							<a class="nav-item active" href="/today"><span>Today</span></a>
							<a class="nav-item" href="/history"><span>History</span></a>
							<a class="nav-item" href="/progress"><span>Progress</span></a>
						</nav>
						<main class="main-panel">
							<section class="v05-screen today-screen">
								<div class="surface-header today-header"><div><p class="eyebrow">Daily quest board</p><h2>Today</h2></div></div>
								<div class="today-layout">
									<form class="quest-board">
										<div class="board-clip"></div>
										<div class="section-heading compact"><h3>Daily check-in</h3></div>
										<div class="check-preview-list">
											${Array.from({ length: 18 }, (_, index) => `<label class="check-preview real-check"><input type="checkbox" /><span>Checklist ${index + 1}</span></label>`).join("")}
										</div>
										<div class="daily-input-grid">
											${Array.from({ length: 8 }, (_, index) => `<label><span class="field-label">Field ${index + 1}</span><input /></label>`).join("")}
										</div>
										<button type="button" class="save-checkin-button">Save today's check-in</button>
									</form>
								</div>
							</section>
						</main>
					</div>
					<nav class="mobile-bottom-nav" aria-label="Primary">
						<a class="nav-item active" href="/today"><span>Today</span></a>
						<a class="nav-item" href="/history"><span>History</span></a>
						<a class="nav-item" href="/progress"><span>Progress</span></a>
					</nav>
				</div>
			</body>
		</html>
	`);

	const nav = page.locator(".mobile-bottom-nav");
	const lastButton = page.locator(".save-checkin-button");
	const before = await nav.boundingBox();
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	const after = await nav.boundingBox();
	await lastButton.scrollIntoViewIfNeeded();
	const lastButtonBox = await lastButton.boundingBox();
	const navBox = await nav.boundingBox();
	const metrics = await page.evaluate(() => {
		const navElement = document.querySelector(".mobile-bottom-nav");
		const layoutElement = document.querySelector(".layout");
		const navRect = navElement?.getBoundingClientRect();
		return {
			viewportHeight: window.innerHeight,
			navPosition: navElement ? getComputedStyle(navElement).position : "",
			navBottom: navElement ? getComputedStyle(navElement).bottom : "",
			layoutPaddingBottom: layoutElement
				? Number.parseFloat(getComputedStyle(layoutElement).paddingBottom)
				: 0,
			navHeight: navRect?.height ?? 0
		};
	});

	expect(metrics.navPosition).toBe("fixed");
	expect(metrics.navBottom).toBe("0px");
	expect(metrics.layoutPaddingBottom).toBeGreaterThan(metrics.navHeight);
	expect(before?.y).toBeCloseTo(after?.y ?? 0, 1);
	expect((after?.y ?? 0) + (after?.height ?? 0)).toBeCloseTo(
		metrics.viewportHeight,
		1
	);
	expect((lastButtonBox?.y ?? 0) + (lastButtonBox?.height ?? 0)).toBeLessThan(
		navBox?.y ?? metrics.viewportHeight
	);
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

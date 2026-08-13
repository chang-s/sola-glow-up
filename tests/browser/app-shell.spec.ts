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
	await expect(page.getByRole("heading", { name: "Weight trend" })).toBeVisible();
});

test("wraps Today detail grids within the clipboard at intermediate widths", async ({
	page
}) => {
	const css = readFileSync(resolve("src/styles/global.css"), "utf8");
	await page.setViewportSize({ width: 980, height: 760 });
	await page.setContent(`
		<!doctype html>
		<html>
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<style>${css}</style>
			</head>
			<body>
				<div class="layout">
					<aside class="sidebar-rail"><nav class="primary-nav desktop-nav"></nav></aside>
					<main class="main-panel">
						<section class="v05-screen today-screen">
							<div class="today-layout">
								<form class="quest-board">
									<div class="board-clip"></div>
									<section class="checkin-section daily-details-section">
										<div class="daily-input-grid">
											${["Weight", "Steps", "Sleep Hours", "Sleep Minutes", "Bedtime", "Wake-up Time", "Yesterday's Calories", "Tiny Note"].map((label) => `<label><span class="field-label">${label}</span><input /></label>`).join("")}
										</div>
									</section>
									<section class="checkin-section food-photo-preview">
										<div class="food-upload-grid">
											<div class="food-field-card"><span class="field-label">Photo</span><label class="photo-picker-button">Choose or take photo</label></div>
											<label class="food-field-card"><span class="field-label">Meal type</span><select></select></label>
											<label class="food-field-card"><span class="field-label">Food note</span><input /></label>
										</div>
									</section>
								</form>
								<aside class="side-stack"><section class="pixel-card"></section></aside>
							</div>
						</section>
					</main>
				</div>
			</body>
		</html>
	`);

	const metrics = await page.evaluate(() => {
		const board = document.querySelector(".quest-board")!.getBoundingClientRect();
		const detailItems = [...document.querySelectorAll(".daily-input-grid label")].map((item) =>
			item.getBoundingClientRect()
		);
		const foodItems = [...document.querySelectorAll(".food-upload-grid > *")].map((item) =>
			item.getBoundingClientRect()
		);
		const button = document.querySelector(".photo-picker-button")!;

		return {
			boardLeft: board.left,
			boardRight: board.right,
			detailColumnsFirstRow: new Set(
				detailItems.filter((item) => item.top === detailItems[0].top).map((item) => item.left)
			).size,
			foodColumnsFirstRow: new Set(
				foodItems.filter((item) => item.top === foodItems[0].top).map((item) => item.left)
			).size,
			overflows: [...detailItems, ...foodItems].some(
				(item) => item.left < board.left - 1 || item.right > board.right + 1
			),
			photoButtonText: button.textContent?.trim(),
			photoButtonWhiteSpace: getComputedStyle(button).whiteSpace
		};
	});

	expect(metrics.overflows).toBe(false);
	expect(metrics.detailColumnsFirstRow).toBeLessThanOrEqual(3);
	expect(metrics.foodColumnsFirstRow).toBeLessThanOrEqual(3);
	expect(metrics.photoButtonText).toBe("Choose or take photo");
	expect(metrics.photoButtonWhiteSpace).toBe("nowrap");
});

test("keeps photo viewer navigation outside the dialog image on desktop", async ({
	page
}) => {
	const css = readFileSync(resolve("src/styles/global.css"), "utf8");
	await page.setViewportSize({ width: 1280, height: 820 });
	await page.setContent(`
		<!doctype html>
		<html>
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<style>${css}</style>
			</head>
			<body>
				<div class="modal-backdrop">
					<div class="photo-dialog-shell">
						<button class="photo-dialog-arrow previous" type="button">&lt;</button>
						<section class="photo-dialog" role="dialog" aria-modal="true">
							<div class="section-heading compact"><h3>Food photo</h3></div>
							<div class="photo-dialog-nav"><span>2 of 4</span></div>
							<div class="photo-dialog-viewer">
								<div class="photo-dialog-image">
									<img class="detail-photo-image" alt="Landscape meal" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='700'%3E%3Crect width='1200' height='700' fill='%239fd3d2'/%3E%3C/svg%3E" />
								</div>
							</div>
							<button class="text-button danger-button" type="button">Delete photo</button>
						</section>
						<button class="photo-dialog-arrow next" type="button">&gt;</button>
					</div>
				</div>
			</body>
		</html>
	`);

	const landscape = await page.evaluate(() => {
		const dialog = document.querySelector(".photo-dialog")!.getBoundingClientRect();
		const image = document.querySelector(".photo-dialog-image")!.getBoundingClientRect();
		const previous = document.querySelector(".photo-dialog-arrow.previous")!.getBoundingClientRect();
		const next = document.querySelector(".photo-dialog-arrow.next")!.getBoundingClientRect();
		return {
			previousOutsideDialog: previous.right < dialog.left,
			nextOutsideDialog: next.left > dialog.right,
			previousOverlapsImage: previous.right > image.left && previous.left < image.right,
			nextOverlapsImage: next.right > image.left && next.left < image.right,
			previousY: previous.y,
			nextY: next.y
		};
	});

	await page.locator(".detail-photo-image").evaluate((image) => {
		image.setAttribute(
			"src",
			"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='1000'%3E%3Crect width='600' height='1000' fill='%23f7a7b8'/%3E%3C/svg%3E"
		);
	});

	const portrait = await page.evaluate(() => {
		const image = document.querySelector(".photo-dialog-image")!.getBoundingClientRect();
		const previous = document.querySelector(".photo-dialog-arrow.previous")!.getBoundingClientRect();
		const next = document.querySelector(".photo-dialog-arrow.next")!.getBoundingClientRect();
		return {
			previousOverlapsImage: previous.right > image.left && previous.left < image.right,
			nextOverlapsImage: next.right > image.left && next.left < image.right,
			previousY: previous.y,
			nextY: next.y
		};
	});

	expect(landscape.previousOutsideDialog).toBe(true);
	expect(landscape.nextOutsideDialog).toBe(true);
	expect(landscape.previousOverlapsImage).toBe(false);
	expect(landscape.nextOverlapsImage).toBe(false);
	expect(portrait.previousOverlapsImage).toBe(false);
	expect(portrait.nextOverlapsImage).toBe(false);
	expect(portrait.previousY).toBeCloseTo(landscape.previousY, 1);
	expect(portrait.nextY).toBeCloseTo(landscape.nextY, 1);
});

test("contains Progress chart overflow by mode at narrow widths", async ({ page }) => {
	const css = readFileSync(resolve("src/styles/global.css"), "utf8");
	await page.setViewportSize({ width: 430, height: 760 });
	await page.setContent(`
		<!doctype html>
		<html>
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<style>${css}</style>
			</head>
			<body>
				<section class="v05-screen">
					<div class="progress-layout">
						<section class="chart-board progress-chart-board">
					<div class="weight-chart-wrap">
						<div class="weight-chart-viewport scrollable" data-chart-mode="detail" data-scrollable="true">
							<div class="weight-chart-canvas" style="width: 1684px; min-width: 1684px;">
								<svg class="weight-chart" width="1684" height="260" viewBox="0 0 1684 260">
									<g class="chart-date-labels">
										<text x="90" y="242">Aug 1</text>
										<text x="610" y="242">Aug 11</text>
										<text x="1650" y="242">Aug 31</text>
									</g>
									<polyline class="weight-line" points="90,120 610,100 1650,80"></polyline>
								</svg>
							</div>
						</div>
								<div class="chart-legend">
									<span><i class="legend-dot recorded"></i>Recorded weight</span>
									<span><i class="legend-dot missing"></i>No entry</span>
									<span><i class="legend-line"></i>Weight trend</span>
								</div>
								<div class="weight-chart-tooltip"><span><strong>181.6 lb</strong> Wed, Aug 12</span></div>
							</div>
						</section>
					</div>
				</section>
			</body>
		</html>
	`);

	const detail = await page.evaluate(() => {
		const viewport = document.querySelector(".weight-chart-viewport") as HTMLDivElement;
		const body = document.documentElement;
		const canvas = document.querySelector(".weight-chart-canvas") as HTMLDivElement;
		viewport.scrollLeft = viewport.scrollWidth - viewport.clientWidth;
		const initialScrollLeft = viewport.scrollLeft;
		const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
		viewport.scrollLeft = 0;
		const afterZero = viewport.scrollLeft;
		const oldestLabel = [...document.querySelectorAll(".chart-date-labels text")][0]!;
		const oldestRect = oldestLabel.getBoundingClientRect();
		const leftViewportRect = viewport.getBoundingClientRect();
		const oldestVisibleAtZero =
			oldestRect.left >= leftViewportRect.left && oldestRect.right <= leftViewportRect.right;
		viewport.scrollLeft = 250;
		const changedScrollLeft = viewport.scrollLeft;
		viewport.scrollLeft = maxScrollLeft;
		const latestLabel = [...document.querySelectorAll(".chart-date-labels text")].at(-1)!;
		const latestRect = latestLabel.getBoundingClientRect();
		const viewportRect = viewport.getBoundingClientRect();

		return {
			canScroll: viewport.scrollWidth > viewport.clientWidth,
			clientWidth: viewport.clientWidth,
			scrollWidth: viewport.scrollWidth,
			canvasWidth: canvas.getBoundingClientRect().width,
			initialScrollLeft,
			maxScrollLeft,
			afterZero,
			changedScrollLeft,
			oldestVisibleAtZero,
			latestVisibleAtMax: latestRect.left >= viewportRect.left && latestRect.right <= viewportRect.right,
			pageOverflows: body.scrollWidth > body.clientWidth,
			viewportOverflowX: getComputedStyle(viewport).overflowX
		};
	});

	await page.locator(".weight-chart-viewport").evaluate((viewport) => {
		viewport.classList.remove("scrollable");
		viewport.setAttribute("data-chart-mode", "all-time");
		viewport.setAttribute("data-scrollable", "false");
		const canvas = viewport.querySelector(".weight-chart-canvas") as HTMLDivElement;
		canvas.style.width = "100%";
		canvas.style.minWidth = "0";
		const svg = viewport.querySelector("svg")!;
		svg.setAttribute("width", `${viewport.clientWidth}`);
		svg.setAttribute("viewBox", `0 0 ${viewport.clientWidth} 260`);
	});

	const allTime = await page.evaluate(() => {
		const viewport = document.querySelector(".weight-chart-viewport") as HTMLDivElement;
		const svg = document.querySelector(".weight-chart") as SVGElement;
		return {
			canScroll: viewport.scrollWidth > viewport.clientWidth + 1,
			svgWidth: Math.round(svg.getBoundingClientRect().width),
			viewportWidth: Math.round(viewport.getBoundingClientRect().width),
			pageOverflows: document.documentElement.scrollWidth > document.documentElement.clientWidth
		};
	});

	expect(detail.canScroll).toBe(true);
	expect(detail.scrollWidth).toBeGreaterThan(detail.clientWidth);
	expect(detail.canvasWidth).toBeGreaterThan(detail.clientWidth);
	expect(detail.initialScrollLeft).toBe(detail.maxScrollLeft);
	expect(detail.afterZero).toBe(0);
	expect(detail.changedScrollLeft).toBe(250);
	expect(detail.oldestVisibleAtZero).toBe(true);
	expect(detail.latestVisibleAtMax).toBe(true);
	expect(detail.pageOverflows).toBe(false);
	expect(detail.viewportOverflowX).toBe("auto");
	expect(allTime.canScroll).toBe(false);
	expect(allTime.svgWidth).toBeLessThanOrEqual(allTime.viewportWidth);
	expect(allTime.viewportWidth - allTime.svgWidth).toBeLessThanOrEqual(8);
	expect(allTime.pageOverflows).toBe(false);
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const GAMES = [
  {
    id: 1, date: "2026-10-29", season: 2026,
    tipoffAt: "2026-10-29T22:00:00Z", status: "in_progress", statusText: "2nd Qtr",
    period: 2, clock: "05:43", postseason: false,
    homeScore: 50, awayScore: 48,
    homeTeam: { id: 1, fullName: "Boston Celtics", name: "Celtics", abbreviation: "BOS",
      city: "Boston", conference: "Eastern", division: "Atlantic" },
    awayTeam: { id: 2, fullName: "Los Angeles Lakers", name: "Lakers", abbreviation: "LAL",
      city: "Los Angeles", conference: "Western", division: "Pacific" },
  },
  {
    id: 2, date: "2026-10-29", season: 2026,
    tipoffAt: "2026-10-30T01:30:00Z", status: "scheduled", statusText: "9:30 pm ET",
    period: 0, clock: null, postseason: false,
    homeScore: null, awayScore: null,
    homeTeam: { id: 3, fullName: "New York Knicks", name: "Knicks", abbreviation: "NYK",
      city: "New York", conference: "Eastern", division: "Atlantic" },
    awayTeam: { id: 4, fullName: "Miami Heat", name: "Heat", abbreviation: "MIA",
      city: "Miami", conference: "Eastern", division: "Southeast" },
  },
  {
    id: 3, date: "2026-10-29", season: 2026,
    tipoffAt: "2026-10-29T18:00:00Z", status: "final", statusText: "Final",
    period: 4, clock: null, postseason: false,
    homeScore: 108, awayScore: 99,
    homeTeam: { id: 5, fullName: "Denver Nuggets", name: "Nuggets", abbreviation: "DEN",
      city: "Denver", conference: "Western", division: "Northwest" },
    awayTeam: { id: 6, fullName: "Golden State Warriors", name: "Warriors", abbreviation: "GSW",
      city: "Golden State", conference: "Western", division: "Pacific" },
  },
];

async function mockGames(page, handler) {
  await page.route(/\/api\/games(?:\?.*)?$/, async (route) => {
    const date = new URL(route.request().url()).searchParams.get("date");
    await handler(route, date);
  });
}

async function serveMockGames(page) {
  await mockGames(page, async (route, date) => {
    await route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({
        date,
        source: "balldontlie",
        fetchedAt: "2026-10-29T12:00:00.000Z",
        stale: false,
        refreshAfterSeconds: 900,
        games: date === "2026-10-29" ? GAMES : [],
      }),
    });
  });
}

test("homepage shows provider-backed cards without overflowing narrow viewports", async ({ page }) => {
  await serveMockGames(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Stay close.*game/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Today.s games/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /All 30.*Your one/ })).toBeVisible();
  await expect.poll(() =>
    page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
});

test("team directory search, conference filter and game navigation", async ({ page }) => {
  await serveMockGames(page);
  await page.goto("/teams");
  await expect(page.getByText("Showing 30 of 30 teams")).toBeVisible();
  await page.getByRole("searchbox", { name: "Find a team" }).fill("celtics");
  await expect(page.getByText("Showing 1 of 30 teams")).toBeVisible();
  await page.getByRole("link", { name: /Boston Celtics/ }).click();
  await expect(page).toHaveURL(/\/games\?team=BOS/);
  await expect(page.getByText("Team:")).toBeVisible();
  await expect(page.getByRole("link", { name: "All teams" })).toBeVisible();
});

test("game filters, score states, and keyboard-accessible date navigation", async ({ page }) => {
  await serveMockGames(page);
  await page.goto("/games?date=2026-10-29");
  await expect(page.getByRole("article")).toHaveCount(3);
  await page.getByRole("button", { name: /^Live 1$/ }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("article")).toContainText("BOS");
  await page.getByRole("button", { name: /^Upcoming 1$/ }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("article")).toContainText("Scheduled");
  await page.getByRole("button", { name: "Next NBA day" }).click();
  await expect(page).toHaveURL(/date=2026-10-30/);
  await expect(page.getByRole("heading", { name: "No games scheduled" })).toBeVisible();
});

test("provider errors are communicated and can recover on retry", async ({ page }) => {
  let attempts = 0;
  await mockGames(page, async (route, date) => {
    attempts++;
    if (attempts === 1) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "RATE_LIMIT" } }),
        headers: { "Retry-After": "60" },
      });
    } else {
      await route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ date, games: GAMES, source: "balldontlie",
          fetchedAt: "2026-10-29T12:00:00.000Z", refreshAfterSeconds: 900 }),
      });
    }
  });
  await page.goto("/games?date=2026-10-29");
  await expect(page.getByRole("heading", { name: "Scores unavailable" })).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("article")).toHaveCount(3);
});

test("pages have accessible structure and no automated WCAG A/AA violations", async ({ page }) => {
  await serveMockGames(page);
  for (const path of ["/", "/teams", "/games?date=2026-10-29", "/standings"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(audit.violations, `Accessibility violations on ${path}: ${JSON.stringify(audit.violations)}`).toEqual([]);
  }
});

test("production responses include security headers and omit the framework banner", async ({ request }) => {
  const response = await request.get("/teams");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(response.headers()["permissions-policy"]).toContain("camera=()");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});

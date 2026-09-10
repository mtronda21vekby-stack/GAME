import { expect, test } from "@playwright/test";

test("@off BREAKOUT route is independently reachable from BLACKCROWN", async ({ page }) => {
  await page.goto("/games/breakout/");
  await expect(page).toHaveTitle(/BLACKCROWN \/\/ BREAKOUT/i);
  await expect(page.getByRole("heading", { name: "BREAKOUT" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ВОЙТИ В СЕКТОР 17" })).toBeVisible();
  await expect(page.locator(".boIntro")).toContainText("Сектор 17");
});

test("@off BREAKOUT starts its Three.js runtime in Chromium", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Headless WebKit WebGL availability is runner-dependent; route coverage still runs there.");

  await page.goto("/games/breakout/");
  await page.getByRole("button", { name: "ВОЙТИ В СЕКТОР 17" }).click();

  await expect(page.locator("canvas.breakoutCanvas")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".boClock")).toContainText("ДЕНЬ 1");
  await expect(page.locator(".boObjectives")).toContainText("Первый выход");
  await expect(page.locator(".boInventory")).toContainText("КАРМАНЫ");
  await expect(page.locator(".boFatal")).toHaveCount(0);
});

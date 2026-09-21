import { expect, test, type Page } from "@playwright/test";
import { installApiAdapter, makeOrder } from "../e2e/apiAdapter";

// Real compiled UI and authored assets; only server state is a controlled fixture.
// External network is blocked so QA cannot place real orders or alter live data.
test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.hostname === "127.0.0.1" ? route.continue() : route.abort("blockedbyclient");
  });
});

async function enterHome(page: Page) {
  await page.goto("/");
  const shell = page.locator("[data-bc-nexus-shell]");
  await expect(shell).toHaveCount(1);
  await expect(shell).toHaveAttribute("data-boot-stage", /^(ready|fallback|error)$/, { timeout: 50_000 });
  const enter = page.getByRole("button", { name: /^ENTER$/ });
  if (await enter.isVisible()) await enter.click();
  await expect(page.locator(".bcExperienceBoot")).toHaveCount(0);
  return shell;
}

async function snapshot(page: Page, name: string) {
  await page.screenshot({ path: test.info().outputPath(`${name}.png`), fullPage: false });
}

test("production home uses a single real WebGL runtime and survives returning to the top", async ({ page }) => {
  await installApiAdapter(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const shell = await enterHome(page);
  await expect(shell).toHaveAttribute("data-boot-stage", "ready");
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
  await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await snapshot(page, "home-top");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.45));
  await page.waitForTimeout(1000);
  await snapshot(page, "home-middle");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("menu fits the actual viewport, owns focus and links to the real store", async ({ page }) => {
  await installApiAdapter(page);
  await enterHome(page);
  const trigger = page.getByRole("button", { name: "MENU", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "BlackCrown worlds menu" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
  const store = dialog.getByRole("link", { name: "STORE", exact: true });
  const bounds = await store.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  await snapshot(page, "home-menu");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("link", { name: "STORE", exact: true }).click();
  await expect(page).toHaveURL(/\/store$/);
  await expect(page.getByRole("heading", { name: "Store", exact: true })).toBeVisible();
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  await snapshot(page, "store");
});

test("query-only order navigation and browser history refresh the actual order page", async ({ page }) => {
  await installApiAdapter(page, { orders: [makeOrder("ord-first"), makeOrder("ord-second")] });
  await page.goto("/checkout/success?order=ord-first");
  await expect(page.getByText("ORDER / ord-first", { exact: true })).toBeVisible();
  // An ordinary in-document anchor exercises the installed Router click handler.
  await page.evaluate(() => {
    const a = document.createElement("a");
    a.id = "qa-order-link";
    a.href = "/checkout/success?order=ord-second";
    a.textContent = "Следующий тестовый заказ";
    document.querySelector("main")!.prepend(a);
  });
  await page.locator("#qa-order-link").click();
  await expect(page.getByText("ORDER / ord-second", { exact: true })).toBeVisible();
  await expect(page.getByText("ORDER / ord-first", { exact: true })).toHaveCount(0);
  await page.goBack();
  await expect(page.getByText("ORDER / ord-first", { exact: true })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://blackcrown.work/checkout/success");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", "https://blackcrown.work/checkout/success");
});

test("new visitors receive the intended audio default while explicit zero is preserved", async ({ page }) => {
  await installApiAdapter(page);
  await page.goto("/store");
  const audio = page.locator(".bcSiteMusic audio");
  await expect(audio).toHaveCount(1);
  expect(await audio.evaluate((element: HTMLAudioElement) => element.volume)).toBeCloseTo(0.42, 2);
  await page.evaluate(() => localStorage.setItem("bc.siteMusic.volume.v9", "0"));
  await page.reload();
  await expect(audio).toHaveCount(1);
  expect(await audio.evaluate((element: HTMLAudioElement) => element.volume)).toBe(0);
});

test("mock checkout reaches fulfillment and the real account renders server ownership", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("blackcrown:commerce.cart.v1", JSON.stringify([{ itemId: "skin_aurora", quantity: 1 }])));
  const api = await installApiAdapter(page, { entitlements: ["skin_aurora"] });
  await page.goto("/checkout");
  const pay = page.getByRole("button", { name: /Оплатить/ });
  await expect(pay).toBeEnabled();
  await pay.click();
  await expect(page).toHaveURL(/\/checkout\/success\?order=ord-e2e-1$/);
  await expect(page.getByRole("heading", { name: "Предметы выданы" })).toBeVisible();
  expect(api.orders.size).toBe(1);
  await page.getByRole("button", { name: "Открыть профиль" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText("OWNERSHIP SYNCED")).toBeVisible();
  await expect(page.getByText("Aurora Skin")).toBeVisible();
  await snapshot(page, "account");
});

test("WebGL-unavailable visitors can enter and use the site menu", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith("webgl") || args[0] === "experimental-webgl") return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await installApiAdapter(page);
  const shell = await enterHome(page);
  await expect(shell).toHaveAttribute("data-webgl", "fallback");
  await page.getByRole("button", { name: "MENU", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "BlackCrown worlds menu" });
  await expect(dialog.getByRole("link", { name: "STORE", exact: true })).toBeVisible();
  await snapshot(page, "webgl-fallback");
});

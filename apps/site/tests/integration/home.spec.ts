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

async function enterHome(page: Page, href = "/") {
  await page.goto(href);
  const shell = page.locator("[data-bc-nexus-shell]");
  await expect(shell).toHaveCount(1);
  await expect(shell).toHaveAttribute("data-boot-stage", /^(ready|fallback|error)$/, { timeout: 50_000 });
  const enter = page.getByRole("button", { name: /^ENTER$/ });
  if (await enter.isVisible()) {
    await expect(page.locator(".bcSiteMusic")).toBeHidden();
    await expect(page.locator(".bcDockV2")).toBeHidden();
    await enter.click();
  }
  await expect(page.locator(".bcExperienceBoot")).toHaveCount(0);
  return shell;
}

async function snapshot(page: Page, name: string) {
  await page.screenshot({ path: test.info().outputPath(`${name}.png`), fullPage: false });
}

test("production home uses a single real WebGL runtime and survives returning to the top", async ({ page }) => {
  test.setTimeout(120_000);
  await installApiAdapter(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const shell = await enterHome(page);
  await expect(shell).toHaveAttribute("data-boot-stage", "ready");
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
  await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await snapshot(page, "home-top");
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  await expect(runtime).toHaveAttribute("data-bc-crown-backend", "glb", { timeout: 30_000 });
  const chapters = [
    [0.10, "crown-chamber"], [0.27, "world-gate"], [0.42, "evofish-abyss"],
    [0.60, "crown-front-reactor"], [0.73, "network-core"],
    [0.86, "collection-vault"], [0.96, "identity-enter"],
  ] as const;
  for (const [progress, chapter] of chapters) {
    await page.evaluate((target) => {
      const story = document.querySelector<HTMLElement>("#bc-experience-story")!;
      const top = story.getBoundingClientRect().top + window.scrollY;
      const height = window.visualViewport?.height ?? window.innerHeight;
      window.scrollTo(0, top + target * Math.max(1, story.offsetHeight - height));
    }, progress);
    await expect(runtime).toHaveAttribute("data-bc-experience-chapter", chapter);
    const actions = page.locator(`[data-chapter="${chapter}"] .bcExperienceAction`);
    if (await actions.count()) await actions.first().click({ trial: true, timeout: 10_000 });
    await snapshot(page, `home-${chapter}`);
  }
  await test.info().attach("runtime-diagnostics", {
    body: JSON.stringify(await runtime.evaluate((element: HTMLElement) => ({ ...element.dataset })), null, 2),
    contentType: "application/json",
  });
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
  await expect(page.locator(".bcSiteMusic")).toBeHidden();
  await expect(page.locator(".bcDockV2")).toBeHidden();
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
  const shell = await enterHome(page, "/#evofish");
  await expect(shell).toHaveAttribute("data-webgl", "fallback");
  const story = page.locator("#bc-experience-story");
  await expect(story).toHaveAttribute("data-bc-static-mode", "true");
  await expect(page.getByRole("heading", { name: "EVOLUTION BEGINS IN THE DEEP" })).toBeInViewport();
  expect(await story.locator('section:not([data-chapter="boot"])[inert]').count()).toBe(0);
  await page.getByRole("button", { name: "MENU", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "BlackCrown worlds menu" });
  await expect(dialog.getByRole("link", { name: "STORE", exact: true })).toBeVisible();
  await dialog.locator('a[href="#evofish"]').click();
  await expect(page.getByRole("heading", { name: "EVOLUTION BEGINS IN THE DEEP" })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await snapshot(page, "webgl-fallback");
});


test("context loss exposes readable chapters and restoration keeps one renderer", async ({ page }) => {
  await installApiAdapter(page);
  const shell = await enterHome(page);
  const canvas = page.locator("canvas[data-bc-nexus-canvas]");
  await expect(canvas).toHaveCount(1);
  await canvas.dispatchEvent("webglcontextlost", { cancelable: true });
  await expect(shell).toHaveAttribute("data-webgl", "fallback");
  await expect(page.locator("#bc-experience-story")).toHaveAttribute("data-bc-static-mode", "true");
  await expect(page.getByRole("heading", { name: "EVOLUTION BEGINS IN THE DEEP" })).toBeVisible();
  await canvas.dispatchEvent("webglcontextrestored");
  await expect(shell).toHaveAttribute("data-webgl", "ready");
  await expect(page.locator("#bc-experience-story")).not.toHaveAttribute("data-bc-static-mode", "true");
  await expect(canvas).toHaveCount(1);
});

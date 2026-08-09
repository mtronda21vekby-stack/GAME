import { expect, test, type Page } from "@playwright/test";
import { installApiAdapter, makeOrder } from "./apiAdapter";

const CART_KEY = "blackcrown:commerce.cart.v1";

async function seedCart(page: Page, itemId = "skin_aurora", quantity = 1) {
  await page.addInitScript(({ key, lines }) => localStorage.setItem(key, JSON.stringify(lines)), {
    key: CART_KEY,
    lines: [{ itemId, quantity }],
  });
}

async function enterNexus(page: Page) {
  await expect.poll(async () => page.locator(".bcNexusLab").getAttribute("data-boot-stage")).toMatch(/ready|fallback/);
  const enter = page.getByRole("button", { name: "ENTER THE NEXUS" });
  if (await enter.isVisible()) await enter.click();
}

async function setNexusProgress(page: Page, progress: number) {
  await page.evaluate((targetProgress) => {
    const story = document.querySelector<HTMLElement>(".bcNexusStory");
    if (!story) throw new Error("Nexus story is unavailable");
    const experienceTop = story.getBoundingClientRect().top + window.scrollY;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const scrollableDistance = Math.max(1, story.offsetHeight - viewportHeight);
    window.scrollTo(0, experienceTop + targetProgress * scrollableDistance);
  }, progress);
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  await expect.poll(async () => Math.abs(Number(await runtime.getAttribute("data-bc-experience-progress")) - progress)).toBeLessThan(0.004);
}

test("@off Home preserves key art, CTA and fast-scroll stability", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await installApiAdapter(page);
  await page.goto("/");
  const root = page.locator(".bcCinematicExperience");
  await expect(root).toBeVisible();
  await expect.poll(() => root.getAttribute("data-key-art-status")).toBe("ready");
  expect(await page.locator('.bcCinematicExperience img[data-key-art-status="ready"]').count()).toBe(2);
  expect(await page.locator(".bcCinematicExperience img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  const cta = page.getByRole("button", { name: "Играть", exact: true });
  await cta.click({ trial: true });
  expect(await cta.evaluate((button) => {
    const rect = button.getBoundingClientRect();
    return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest("button") === button;
  })).toBe(true);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(root).toBeVisible();
  expect(requests.filter((url) => /NexusLabPage|ExperienceRuntime|nexus-three|node_modules\/three/i.test(url))).toEqual([]);
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(0);
});

test("@off Nexus route is inactive and unknown URLs render NotFound", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await installApiAdapter(page);
  await page.goto("/nexus-lab");
  await expect(page.getByRole("heading", { name: "Маршрут не найден" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(requests.filter((url) => /ExperienceRuntime|node_modules\/three/i.test(url))).toEqual([]);
  await page.goto("/unknown-test-route");
  await expect(page).toHaveTitle("Страница не найдена — BlackCrown");
  await expect(page.getByText("/unknown-test-route")).toBeVisible();
  await expect(page.locator(".bcCinematicExperience")).toHaveCount(0);
});

test("@off Store, Cart and mock Checkout remain authoritative and idempotent", async ({ page }) => {
  await seedCart(page);
  const api = await installApiAdapter(page, { entitlements: ["skin_aurora"] });
  await page.goto("/store");
  await expect(page.getByRole("heading", { name: "Store" })).toBeVisible();
  await expect(page.getByText("SERVER OWNERSHIP")).toBeVisible();
  const category = page.getByLabel("Категория");
  expect(await category.evaluate((control) => {
    const rect = control.getBoundingClientRect();
    return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === control;
  })).toBe(true);
  await page.locator("article").filter({ hasText: "Neon Rush" }).getByRole("button", { name: "В корзину" }).click();
  await expect(page.getByText("Neon Rush добавлен в корзину.")).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByText("Aurora Skin")).toBeVisible();
  await page.getByLabel("Увеличить количество").click();
  await expect(page.locator(".bcCommerceQuantity output")).toHaveText("2");
  await page.goto("/checkout");
  await expect(page.getByText("BlackCrown Mock Gateway")).toBeVisible();
  await expect(page.getByText("Реальное списание денег не выполняется.", { exact: false })).toBeVisible();
  const pay = page.getByRole("button", { name: /Оплатить/u });
  await pay.evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page).toHaveURL(/\/checkout\/success\?order=ord-e2e-1/u);
  expect(new Set(api.checkoutKeys).size).toBe(1);
  expect(api.orders.size).toBe(1);
});

test("@off Order ownership states and Account entitlements are explicit", async ({ page }) => {
  await installApiAdapter(page, { entitlements: ["skin_aurora"], orders: [makeOrder()] });
  await page.goto("/checkout/success?order=ord-valid");
  await expect(page.getByRole("heading", { name: "Предметы выданы" })).toBeVisible();
  await page.goto("/checkout/success?order=ord-foreign");
  await expect(page.getByRole("heading", { name: "Заказ не найден" })).toBeVisible();
  await page.goto("/account");
  await expect(page.getByText("OWNERSHIP SYNCED")).toBeVisible();
  await expect(page.getByText("Aurora Skin")).toBeVisible();
});

test("@lab Nexus boots one runtime and scroll is reversible", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.addInitScript(() => sessionStorage.clear());
  await installApiAdapter(page);
  await page.goto("/nexus-lab");
  await enterNexus(page);
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
  await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveCount(1);
  await expect(page.locator(".bcDockV2, .bcSiteMusic")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  const canvasBox = await page.locator("canvas[data-bc-nexus-canvas]").boundingBox();
  expect(canvasBox?.width).toBeGreaterThan(0);
  expect(canvasBox?.height).toBeGreaterThan(0);

  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  for (const [progress, chapter] of [
    [0, "awakening"],
    [0.18, "assembly"],
    [0.34, "inspection"],
    [0.52, "core-reveal"],
    [0.68, "crown-front"],
    [0.84, "ecosystem"],
    [0.96, "enter"],
  ] as const) {
    await setNexusProgress(page, progress);
    await expect(runtime).toHaveAttribute("data-bc-experience-chapter", chapter);
    await expect(page.locator(`[data-chapter="${chapter}"]`)).toHaveAttribute("data-active", "true");
  }

  if (test.info().project.name === "chromium-lab") {
    await page.getByTitle("low quality").click();
    await expect(page.getByTitle("low quality")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator(".bcNexusDebug dd").nth(3)).toHaveText("low");
    await page.getByTitle("high quality").click();
    await expect(page.locator(".bcNexusDebug dd").nth(3)).toHaveText("high");
  }

  await setNexusProgress(page, 0);
  await expect(runtime).toHaveAttribute("data-bc-experience-chapter", "awakening");
  expect(errors).toEqual([]);
});

test("@lab Nexus mobile layouts keep native scroll and CTA hit targets", async ({ page }) => {
  await installApiAdapter(page);
  await page.goto("/nexus-lab");
  await enterNexus(page);
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 393, height: 852 },
    { width: 430, height: 932 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveAttribute("data-bc-experience-chapter", "enter", { timeout: 5_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    const cta = page.locator('[data-nexus-primary-cta="true"]');
    await expect(cta).toBeVisible();
    await expect(cta.locator("xpath=ancestor::section")).toHaveAttribute("data-active", "true");
    await expect.poll(async () => cta.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest("a") === element;
    }), { message: `Primary CTA is not the hit target at ${viewport.width}x${viewport.height}` }).toBe(true);
  }
});

test("@lab route leave disposes and re-entry creates one clean runtime", async ({ page }) => {
  await installApiAdapter(page);
  await page.goto("/nexus-lab");
  await enterNexus(page);
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
  await page.evaluate(() => { history.pushState(null, "", "/about"); dispatchEvent(new PopStateEvent("popstate")); });
  await expect(page.getByRole("heading", { name: "BlackCrown — хаб, где игры и сервисы работают вместе." })).toBeVisible();
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(0);
  await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveCount(0);
  await page.evaluate(() => { history.pushState(null, "", "/nexus-lab"); dispatchEvent(new PopStateEvent("popstate")); });
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
  await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveCount(1);
});

test("@lab reduced motion remains accessible and idles the RAF", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installApiAdapter(page);
  await page.goto("/nexus-lab");
  await expect.poll(async () => page.locator(".bcNexusLab").getAttribute("data-boot-stage")).toMatch(/ready|fallback/);
  await expect(page.locator(".bcNexusBoot")).toHaveCount(0);
  expect(await page.locator(".bcNexusStory").evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(5_000);
  await expect(page.getByRole("heading", { name: "BLACKCROWN SYSTEM ONLINE" })).toBeVisible();
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  if (await runtime.count()) await expect(runtime).toHaveAttribute("data-bc-experience-raf", "0", { timeout: 5_000 });
});

import { expect, test, type Page } from "@playwright/test";
import { installApiAdapter, makeOrder } from "./apiAdapter";
import { createTestCrownGlb } from "../helpers/crownFixture";

const CART_KEY = "blackcrown:commerce.cart.v1";

async function seedCart(page: Page, itemId = "skin_aurora", quantity = 1) {
  await page.addInitScript(({ key, lines }) => localStorage.setItem(key, JSON.stringify(lines)), {
    key: CART_KEY,
    lines: [{ itemId, quantity }],
  });
}

async function enterNexus(page: Page) {
  await expect.poll(async () => page.locator(".bcNexusLab").getAttribute("data-boot-stage")).toMatch(/ready|fallback/);
  const enter = page.getByRole("button", { name: /^ENTER(?: THE NEXUS)?$/u });
  if (await enter.isVisible()) await enter.click();
  await expect(page.locator(".bcNexusBoot")).toHaveCount(0);
}

async function installCrownFixture(page: Page, fixture = createTestCrownGlb()) {
  let requests = 0;
  await page.route("**/__test__/blackcrown-crown-fixture.glb", async (route) => {
    requests += 1;
    await route.fulfill({ status: 200, contentType: "model/gltf-binary", body: Buffer.from(fixture) });
  });
  return () => requests;
}

async function setNexusProgress(page: Page, progress: number) {
  const effectiveProgress = await page.evaluate((targetProgress) => {
    const story = document.querySelector<HTMLElement>(".bcNexusStory");
    if (!story) throw new Error("Nexus story is unavailable");
    const experienceTop = story.getBoundingClientRect().top + window.scrollY;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const scrollableDistance = Math.max(1, story.offsetHeight - viewportHeight);
    window.scrollTo(0, experienceTop + targetProgress * scrollableDistance);
    return Math.min(1, Math.max(0, (window.scrollY - experienceTop) / scrollableDistance));
  }, progress);
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  await expect.poll(async () => Math.abs(Number(await runtime.getAttribute("data-bc-experience-target")) - effectiveProgress)).toBeLessThan(0.0005);
  await expect.poll(async () => {
    const current = Number(await runtime.getAttribute("data-bc-experience-progress"));
    const target = Number(await runtime.getAttribute("data-bc-experience-target"));
    return Math.abs(current - target);
  }, { timeout: 10_000 }).toBeLessThan(0.0005);
}

function expectStableCandidateLod(requests: string[], candidate: "a" | "b", lod: string | null) {
  const glbs = [...new Set(requests.filter((url) => new RegExp(`crown-candidate-${candidate}-lod\\d\\.glb$`, "u").test(url)))];
  const expected = lod === "high" ? "lod0" : lod === "medium" ? "lod1" : "lod2";
  expect(glbs.length).toBeGreaterThanOrEqual(1);
  // Auto quality is allowed one absolute LOD replacement on a slow device;
  // repeated requests would indicate churn or a disposal leak.
  expect(glbs.length).toBeLessThanOrEqual(2);
  expect(glbs.some((url) => url.includes(expected))).toBe(true);
}

async function lockDesktopReviewQuality(page: Page) {
  if (test.info().project.name !== "chromium-lab") return;
  await page.getByTitle("high quality").click();
  await expect(page.getByTitle("high quality")).toHaveAttribute("aria-checked", "true");
}

test("@off Home preserves the current cinematic, key art, CTA and fast-scroll stability", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await installApiAdapter(page);
  await page.goto("/");
  const root = page.locator(".bcCinematic");
  await expect(root).toBeVisible();
  await expect.poll(() => root.getAttribute("data-key-art-status")).toBe("ready");
  expect(await page.locator('.bcCinematic img[data-key-art-status="ready"]').count()).toBe(4);
  expect(await page.locator(".bcCinematic img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
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
  expect(requests.filter((url) => /NexusLabPage|ExperienceRuntime|nexus-three|nexus-gltf-loader|crown\.manifest\.json|candidate-[ab]|\.glb(?:\?|$)|node_modules\/three/i.test(url))).toEqual([]);
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(0);
});

test("@off reduced motion exposes the current cinematic without a long scroll stage", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installApiAdapter(page);
  await page.goto("/");
  const root = page.locator(".bcCinematic");
  await expect(root).toHaveAttribute("data-reduced-motion", "true");
  await expect(root).toHaveAttribute("data-progress", "reduced");
  expect(await root.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(5_000);
  expect(await page.locator(".bcCinematic__scene[inert]").count()).toBe(0);
  expect(await page.locator(".bcCinematic button").count()).toBeGreaterThan(5);
});

test("@off Nexus route is inactive and unknown URLs render NotFound", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await installApiAdapter(page);
  await page.goto("/nexus-lab");
  await expect(page.getByRole("heading", { name: "Маршрут не найден" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(requests.filter((url) => /ExperienceRuntime|nexus-gltf-loader|crown\.manifest\.json|candidate-[ab]|\.glb(?:\?|$)|node_modules\/three/i.test(url))).toEqual([]);
  await page.goto("/unknown-test-route");
  await expect(page).toHaveTitle("Страница не найдена — BlackCrown");
  await expect(page.getByText("/unknown-test-route")).toBeVisible();
  await expect(page.locator(".bcCinematic")).toHaveCount(0);
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

test("@off Checkout blocks an empty cart", async ({ page }) => {
  await installApiAdapter(page);
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Нечего оформлять" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Оплатить/u })).toHaveCount(0);
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

  await page.unroute("**/api/**");
  await installApiAdapter(page, { entitlementsError: true });
  await page.reload();
  await expect(page.getByText("Локальные покупки не используются как источник владения.", { exact: false })).toBeVisible();
});

test("@lab Nexus boots one runtime and scroll is reversible", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.addInitScript(() => sessionStorage.clear());
  await installApiAdapter(page);
  await page.goto("/nexus-lab");
  await enterNexus(page);
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
  await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveCount(1);
  await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveAttribute("data-bc-crown-backend", "procedural");
  await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveAttribute("data-bc-crown-reason", "manifest_disabled");
  await expect(page.locator(".bcDockV2, .bcSiteMusic")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  const canvasBox = await page.locator("canvas[data-bc-nexus-canvas]").boundingBox();
  expect(canvasBox?.width).toBeGreaterThan(0);
  expect(canvasBox?.height).toBeGreaterThan(0);

  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  for (const [progress, chapter] of [
    [0, "boot"],
    [0.1, "crown-chamber"],
    [0.31, "world-gate"],
    [0.5, "evofish-abyss"],
    [0.72, "crown-front-reactor"],
    [0.86, "network-core"],
    [0.935, "collection-vault"],
    [0.98, "identity-enter"],
  ] as const) {
    await setNexusProgress(page, progress);
    await expect(runtime).toHaveAttribute("data-bc-experience-chapter", chapter);
    await expect(page.locator(`[data-chapter="${chapter}"]`)).toHaveAttribute("data-active", "true");
    expect(Number(await runtime.getAttribute("data-bc-experience-active-scenes"))).toBeLessThanOrEqual(2);
  }

  for (const progress of [0.3325, 0.3975, 0.635, 0.865, 0.935, 0.98]) {
    await setNexusProgress(page, progress);
    expect(Number(await runtime.getAttribute("data-bc-experience-active-scenes"))).toBe(2);
    await expect(page.locator("canvas[data-bc-nexus-canvas]")).toBeVisible();
  }

  await setNexusProgress(page, 0.935);
  await expect(page.locator(".bcExperienceCollectionIndex")).toContainText("Aurora Skin");
  await expect(page.locator(".bcExperienceCollectionIndex")).toContainText("Founder Badge");
  await expect(page.locator(".bcExperienceCollectionIndex")).toContainText("Starter Bundle");

  await setNexusProgress(page, 0.98);
  await expect(page.locator(".bcExperienceShell")).toHaveAttribute("data-final-phase", "true");
  await expect(page.locator(".bcExperienceShell")).toHaveAttribute("data-final-blackout", "false");
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toBeVisible();
  await expect(page.locator('[data-final-copy="true"]')).toBeHidden();

  await setNexusProgress(page, 0.999);
  await expect(page.locator(".bcExperienceShell")).toHaveAttribute("data-final-blackout", "true");
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toBeHidden();
  await expect(page.locator(".bcExperienceChrome")).toBeHidden();
  await expect(page.getByRole("heading", { name: "ONE CROWN. ALL WORLDS.", exact: true })).toBeVisible();
  await expect(page.locator('[data-final-copy="true"] [data-nexus-primary-cta="true"]')).toHaveCount(1);

  await setNexusProgress(page, 0.935);
  await expect(page.locator(".bcExperienceShell")).toHaveAttribute("data-final-phase", "false");
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toBeVisible();

  if (test.info().project.name === "chromium-lab") {
    await page.getByTitle("low quality").click();
    await expect(page.getByTitle("low quality")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator(".bcNexusDebug dd").nth(3)).toHaveText("low");
    await page.getByTitle("high quality").click();
    await expect(page.locator(".bcNexusDebug dd").nth(3)).toHaveText("high");
  }

  await setNexusProgress(page, 0);
  await expect(runtime).toHaveAttribute("data-bc-experience-chapter", "boot");
  expect(await page.locator('[data-chapter]:not([data-active="true"]) a').evaluateAll((anchors) => anchors.every((anchor) => anchor.getAttribute("tabindex") === "-1"))).toBe(true);
  expect(errors).toEqual([]);
});

test("@lab spatial deep-links and browser history stay inside the experience", async ({ page }) => {
  await installApiAdapter(page);
  await page.goto("/nexus-lab#network");
  await enterNexus(page);
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  await expect(runtime).toHaveAttribute("data-bc-experience-chapter", "network-core");
  await page.getByRole("button", { name: "MENU" }).click();
  const spatialMenu = page.getByRole("dialog", { name: "BlackCrown worlds menu" });
  await expect(spatialMenu).toBeVisible();
  await spatialMenu.getByRole("link", { name: /COLLECTION/u }).click();
  await expect(page).toHaveURL(/\/nexus-lab#store$/u);
  await expect(runtime).toHaveAttribute("data-bc-experience-chapter", "collection-vault");
  await page.goBack();
  await expect(page).toHaveURL(/\/nexus-lab#network$/u);
  await expect(runtime).toHaveAttribute("data-bc-experience-chapter", "network-core");

  const menuButton = page.getByRole("button", { name: "MENU" });
  await menuButton.click();
  await expect(page.getByRole("dialog", { name: "BlackCrown worlds menu" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "BlackCrown worlds menu" })).toHaveCount(0);
  await expect(menuButton).toBeFocused();
});

test("@lab authored Blender environments lazy-load without replacing the runtime", async ({ page }) => {
  test.setTimeout(180_000);
  test.skip(test.info().project.name === "webkit-lab", "WebKit lab uses the LOW mobile policy and keeps procedural environments.");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await installApiAdapter(page);
  await page.goto("/nexus-lab?nexuscrown=candidate-b&bcdebug=1&bcenv=blender");
  await enterNexus(page);
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
  await page.getByTitle("high quality").click();
  await expect(page.getByTitle("high quality")).toHaveAttribute("aria-checked", "true");
  await expect(page.locator(".bcNexusDebug dd").nth(3)).toHaveText("high");

  for (const [progress, expectedModels] of [[0.3325, 1], [0.635, 2], [0.865, 3], [0.935, 4]] as const) {
    await setNexusProgress(page, progress);
    await expect.poll(
      async () => Number(await runtime.getAttribute("data-bc-experience-authored-models")),
      { timeout: 30_000, intervals: [250, 500, 1_000] },
    ).toBe(expectedModels);
    expect(Number(await runtime.getAttribute("data-bc-experience-active-scenes"))).toBeLessThanOrEqual(2);
  }

  expect(requests.filter((url) => /\/experience\/environments\/blender-v1\/[^/]+\.glb$/u.test(url))).toHaveLength(4);
  expect(Number(await runtime.getAttribute("data-bc-experience-draw-calls"))).toBeLessThanOrEqual(75);
  await page.evaluate(() => { history.pushState(null, "", "/about"); dispatchEvent(new PopStateEvent("popstate")); });
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(0);
});

test("@lab Nexus mobile layouts keep native scroll and CTA hit targets", async ({ page }) => {
  await installApiAdapter(page);
  await page.goto("/nexus-lab");
  await enterNexus(page);
  if (test.info().project.name === "webkit-lab") await expect(page.locator(".bcNexusDebug dd").nth(3)).toHaveText("low");
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 393, height: 852 },
    { width: 430, height: 932 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveAttribute("data-bc-experience-chapter", "identity-enter", { timeout: 5_000 });
    if (test.info().project.name === "webkit-lab") {
      await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveAttribute("data-bc-crown-lod", "low");
    }
    expect(Number(await page.locator('[data-bc-experience-runtime="active"]').getAttribute("data-bc-experience-draw-calls"))).toBeLessThanOrEqual(70);
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
  for (let cycle = 0; cycle < 5; cycle += 1) {
    await page.evaluate(() => { history.pushState(null, "", "/about"); dispatchEvent(new PopStateEvent("popstate")); });
    await expect(page.getByRole("heading", { name: "BlackCrown — хаб, где игры и сервисы работают вместе." })).toBeVisible();
    await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(0);
    await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveCount(0);
    await page.evaluate(() => { history.pushState(null, "", "/nexus-lab"); dispatchEvent(new PopStateEvent("popstate")); });
    await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
    await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveCount(1);
  }
});

test("@lab reduced motion remains accessible and idles the RAF", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installApiAdapter(page);
  await page.goto("/nexus-lab");
  await expect.poll(async () => page.locator(".bcNexusLab").getAttribute("data-boot-stage")).toMatch(/ready|fallback/);
  await expect(page.locator(".bcNexusBoot")).toHaveCount(0);
  expect(await page.locator(".bcNexusStory").evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(5_000);
  await expect(page.getByRole("heading", { name: "BLACKCROWN" })).toBeVisible();
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  if (await runtime.count()) {
    await expect(runtime).toHaveAttribute("data-bc-experience-raf", "0", { timeout: 5_000 });
    await expect(runtime).toHaveAttribute("data-bc-crown-lod", "low");
  }
});

test("@lab forced GLB with disabled production asset keeps the procedural Crown", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await installApiAdapter(page);
  await page.goto("/nexus-lab?bcasset=glb&bcdebug=1");
  await enterNexus(page);
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  await expect(runtime).toHaveAttribute("data-bc-crown-backend", "procedural");
  await expect(runtime).toHaveAttribute("data-bc-crown-reason", "manifest_disabled");
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
  expect(requests.filter((url) => /\.glb(?:\?|$)|nexus-gltf-loader/iu.test(url))).toEqual([]);
});

test("@lab test-only GLB fixture activates lazy bindings and disposes on route exit", async ({ page }) => {
  const fixtureRequests = await installCrownFixture(page);
  await installApiAdapter(page);
  await page.goto("/nexus-lab?bcasset=fixture&bcdebug=1");
  await enterNexus(page);
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  await expect(runtime).toHaveAttribute("data-bc-crown-backend", "glb", { timeout: 10_000 });
  await expect(runtime).toHaveAttribute("data-bc-crown-status", "ready");
  expect(fixtureRequests()).toBe(1);
  await setNexusProgress(page, 0.56);
  await setNexusProgress(page, 0.18);
  await setNexusProgress(page, 0.56);
  await page.evaluate(() => { history.pushState(null, "", "/about"); dispatchEvent(new PopStateEvent("popstate")); });
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(0);
});

test("@lab Candidate A uses one allowlisted LOD and reverses its absolute pose", async ({ page }) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await installApiAdapter(page);
  await page.goto("/nexus-lab?nexuscrown=candidate-a");
  await enterNexus(page);
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  await expect(runtime).toHaveAttribute("data-bc-crown-backend", "glb", { timeout: 15_000 });
  await expect(runtime).toHaveAttribute("data-bc-crown-asset-id", "blackcrown-digital-crown-candidate-a-v1");
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
  await lockDesktopReviewQuality(page);
  const lod = await runtime.getAttribute("data-bc-crown-lod");
  expectStableCandidateLod(requests, "a", lod);

  await setNexusProgress(page, 0.315);
  const opened = await runtime.getAttribute("data-bc-crown-pose");
  expect(opened).not.toBe("procedural");
  await setNexusProgress(page, 0.18);
  expect(await runtime.getAttribute("data-bc-crown-pose")).not.toBe(opened);
  await setNexusProgress(page, 0.315);
  const restored = (await runtime.getAttribute("data-bc-crown-pose"))!.split(":").map(Number);
  opened.split(":").map(Number).forEach((value, index) => expect(restored[index]).toBeCloseTo(value, 2));
  await setNexusProgress(page, 1);
  const cta = page.locator('[data-nexus-primary-cta="true"]');
  await expect(cta).toBeVisible();
  await expect.poll(async () => cta.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest("a") === element;
  })).toBe(true);

  await page.evaluate(() => { history.pushState(null, "", "/about"); dispatchEvent(new PopStateEvent("popstate")); });
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(0);
  await page.evaluate(() => { history.pushState(null, "", "/nexus-lab?nexuscrown=candidate-a"); dispatchEvent(new PopStateEvent("popstate")); });
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("@lab Candidate B uses one allowlisted LOD, drives its iris and reverses its absolute pose", async ({ page }) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await installApiAdapter(page);
  await page.goto("/nexus-lab?nexuscrown=candidate-b");
  await enterNexus(page);
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  await expect(runtime).toHaveAttribute("data-bc-crown-backend", "glb", { timeout: 15_000 });
  await expect(runtime).toHaveAttribute("data-bc-crown-asset-id", "blackcrown-digital-crown-candidate-b-v1");
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
  await lockDesktopReviewQuality(page);
  const lod = await runtime.getAttribute("data-bc-crown-lod");
  expectStableCandidateLod(requests, "b", lod);

  await setNexusProgress(page, 0.68);
  const portalPose = (await runtime.getAttribute("data-bc-crown-pose"))!.split(":").map(Number);
  expect(portalPose[5]).toBeGreaterThan(0);
  expect(Math.abs(portalPose[6])).toBeGreaterThan(0);
  await setNexusProgress(page, 0.18);
  const closedPose = (await runtime.getAttribute("data-bc-crown-pose"))!.split(":").map(Number);
  expect(closedPose[5]).toBeLessThan(portalPose[5]);
  expect(Math.abs(closedPose[6])).toBeLessThan(Math.abs(portalPose[6]));
  await setNexusProgress(page, 0.68);
  const restored = (await runtime.getAttribute("data-bc-crown-pose"))!.split(":").map(Number);
  portalPose.forEach((value, index) => expect(restored[index]).toBeCloseTo(value, 2));
  expect(errors).toEqual([]);
});

test("@lab local Crown selector disposes each A/B backend and keeps one renderer", async ({ page }) => {
  test.skip(test.info().project.name === "webkit-lab", "The desktop debug selector is intentionally hidden by the mobile HUD composition.");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await installApiAdapter(page);
  await page.goto("/nexus-lab?bcdebug=1");
  await enterNexus(page);
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  await page.getByTitle("high quality").click();
  await expect(page.getByTitle("high quality")).toHaveAttribute("aria-checked", "true");
  await page.locator(".bcNexusDebug").getByText("DEBUG", { exact: true }).click();
  const selector = page.getByRole("radiogroup", { name: "Local Crown review candidate" });
  await expect(selector).toBeVisible();

  for (const [label, assetId] of [
    ["CANDIDATE A", "blackcrown-digital-crown-candidate-a-v1"],
    ["CANDIDATE B", "blackcrown-digital-crown-candidate-b-v1"],
    ["PROCEDURAL", "procedural-digital-crown-v2"],
    ["CANDIDATE A", "blackcrown-digital-crown-candidate-a-v1"],
  ] as const) {
    await selector.getByRole("radio", { name: label }).click();
    await expect(runtime).toHaveAttribute("data-bc-crown-asset-id", assetId, { timeout: 15_000 });
    await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
    await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveCount(1);
  }

  expect(requests.filter((url) => /crown-candidate-a-lod\d\.glb$/u.test(url))).toHaveLength(2);
  expect(requests.filter((url) => /crown-candidate-b-lod\d\.glb$/u.test(url))).toHaveLength(1);
});

test("@lab review candidates are not requested by Home or an invalid override", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await installApiAdapter(page);
  await page.goto("/");
  await expect(page.locator(".bcCinematic")).toBeVisible();
  expect(requests.filter((url) => /candidate-[ab]/iu.test(url))).toEqual([]);
  requests.length = 0;
  await page.goto("/nexus-lab?nexuscrown=https://example.test/crown.glb");
  await enterNexus(page);
  await expect(page.locator('[data-bc-experience-runtime="active"]')).toHaveAttribute("data-bc-crown-backend", "procedural");
  expect(requests.filter((url) => url.startsWith("https://example.test") || /\/experience\/crown\/candidate-[ab]\//iu.test(url))).toEqual([]);
});

test("@lab context loss exposes DOM fallback and restores one canvas", async ({ page }) => {
  await installApiAdapter(page);
  await page.goto("/nexus-lab");
  await enterNexus(page);
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  const canvas = page.locator("canvas[data-bc-nexus-canvas]");
  await canvas.dispatchEvent("webglcontextlost", { cancelable: true });
  await expect(runtime).toHaveAttribute("data-bc-experience-context", "lost");
  await expect(page.getByRole("heading", { name: "BLACKCROWN" })).toBeVisible();
  await canvas.dispatchEvent("webglcontextrestored");
  await expect(runtime).toHaveAttribute("data-bc-experience-context", "ready");
  await expect(canvas).toHaveCount(1);
});

test("@lab local device QA exports a PII-free report and resets the sampler", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => undefined } });
  });
  await installApiAdapter(page);
  await page.goto("/nexus-lab?bcdeviceqa=1");
  await enterNexus(page);
  const panel = page.locator('[data-bc-device-qa="ready"]');
  await expect(panel).toBeVisible();
  await panel.locator("summary").click();
  const report = JSON.parse(await panel.locator("[data-bc-device-report]").textContent() || "{}");
  expect(report).toMatchObject({ schemaVersion: 1, canvasCount: 1 });
  expect(JSON.stringify(report)).not.toMatch(/userAgent|email|token|session|ipAddress/iu);
  await page.getByRole("button", { name: "COPY DEVICE REPORT" }).click();
  await expect(panel.locator("output")).toHaveText("COPIED");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "DOWNLOAD DEVICE REPORT" }).click();
  expect((await download).suggestedFilename()).toMatch(/^blackcrown-device-report-\d+\.json$/u);
  await page.getByRole("button", { name: "RESET QA SAMPLE" }).click();
  await expect(panel.locator("output")).toHaveText("SAMPLE RESET");
});

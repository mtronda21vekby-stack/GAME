import { expect, test, type Page } from "@playwright/test";
import { installApiAdapter, makeOrder } from "./apiAdapter";

const CART_KEY = "blackcrown:commerce.cart.v1";

async function seedCart(page: Page, itemId = "skin_aurora", quantity = 1) {
  await page.addInitScript(
    ({ key, lines }) => localStorage.setItem(key, JSON.stringify(lines)),
    { key: CART_KEY, lines: [{ itemId, quantity }] },
  );
}

test("Home timeline, key art, accessibility, and fast scroll remain stable", async ({ page }) => {
  await installApiAdapter(page);
  await page.goto("/");

  const root = page.locator(".bcCinematic");
  await expect(root).toBeVisible();
  await expect.poll(() => root.getAttribute("data-key-art-status")).toBe("ready");
  expect(await page.locator('.bcCinematic img[data-key-art-status="ready"]').count()).toBe(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  const heroCta = page.getByRole("button", { name: "Играть", exact: true });
  await heroCta.click({ trial: true });
  expect(
    await heroCta.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest("button") === button;
    }),
  ).toBe(true);

  await expect(page.locator('[data-scene="evofish"]')).toHaveAttribute("inert", "");
  await page.evaluate(() => {
    const rootElement = document.querySelector<HTMLElement>(".bcCinematic")!;
    const travel = rootElement.offsetHeight - window.innerHeight;
    window.scrollTo(0, travel * 0.46);
  });
  await expect(root).toHaveAttribute("data-phase", "evofish");
  expect(Number(await root.getAttribute("data-progress"))).toBeGreaterThan(0.4);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute("data-phase", "crown");
});

test("reduced motion exposes a static sequence without a long scroll stage", async ({ page }) => {
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

test("Store uses server ownership and overlays do not cover filters", async ({ page }) => {
  await installApiAdapter(page, { entitlements: ["skin_aurora"] });
  await page.goto("/store");
  await expect(page.getByRole("heading", { name: "Store" })).toBeVisible();
  await expect(page.getByText("SERVER OWNERSHIP")).toBeVisible();
  await expect(page.locator("article").filter({ hasText: "Aurora Skin" }).getByRole("button", { name: "Получено" })).toBeDisabled();

  const category = page.getByLabel("Категория");
  await expect(category).toBeVisible();
  expect(
    await category.evaluate((control) => {
      const rect = control.getBoundingClientRect();
      return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === control;
    }),
  ).toBe(true);

  await page.locator("article").filter({ hasText: "Neon Rush" }).getByRole("button", { name: "В корзину" }).click();
  await expect(page.getByText("Neon Rush добавлен в корзину.")).toBeVisible();
});

test("Cart updates quantity, total, removal, and empty state", async ({ page }) => {
  await seedCart(page);
  await installApiAdapter(page);
  await page.goto("/cart");
  await expect(page.getByText("Aurora Skin")).toBeVisible();
  await page.getByLabel("Увеличить количество").click();
  await expect(page.locator(".bcCommerceQuantity output")).toHaveText("2");
  await expect(page.locator(".bcCommerceSummary__row--total")).toContainText(/1\s?440/u);
  await page.getByRole("button", { name: "Удалить" }).click();
  await expect(page.getByRole("heading", { name: "Корзина пуста" })).toBeVisible();
});

test("Checkout uses server quote, labels mock payment, and reuses one attempt key", async ({ page }) => {
  await seedCart(page);
  const api = await installApiAdapter(page);
  await page.goto("/checkout");
  await expect(page.getByText("BlackCrown Mock Gateway")).toBeVisible();
  await expect(page.getByText("Реальное списание денег не выполняется.", { exact: false })).toBeVisible();
  const pay = page.getByRole("button", { name: /Оплатить/u });
  await expect(pay).toBeEnabled();
  await pay.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(page).toHaveURL(/\/checkout\/success\?order=ord-e2e-1/u);
  expect(new Set(api.checkoutKeys).size).toBe(1);
  expect(api.orders.size).toBe(1);
});

test("Checkout blocks an empty cart", async ({ page }) => {
  await installApiAdapter(page);
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Нечего оформлять" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Оплатить/u })).toHaveCount(0);
});

test("Order success, invalid order, Account entitlement, and degraded state are explicit", async ({ page }) => {
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

test("unknown route renders NotFound and preserves the requested URL", async ({ page }) => {
  await installApiAdapter(page);
  await page.goto("/unknown-blackcrown-route");
  await expect(page).toHaveTitle("Страница не найдена — BlackCrown");
  await expect(page.getByRole("heading", { name: "Маршрут не найден" })).toBeVisible();
  await expect(page.getByText("/unknown-blackcrown-route")).toBeVisible();
  await expect(page.locator(".bcCinematic")).toHaveCount(0);
});

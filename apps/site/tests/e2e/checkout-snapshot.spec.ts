import { expect, test, type Page } from "@playwright/test";
import { installApiAdapter } from "./apiAdapter";

const CART_KEY = "blackcrown:commerce.cart.v1";
const originalCart = [{ itemId: "skin_aurora", quantity: 1 }];
const newerCart = [{ itemId: "skin_neon_rush", quantity: 2 }];

async function openCheckout(page: Page) {
  await page.goto("/cart");
  await page.evaluate(({ key, lines }) => localStorage.setItem(key, JSON.stringify(lines)), {
    key: CART_KEY,
    lines: originalCart,
  });
  await page.goto("/checkout");
  await expect(page.locator(".bcCommerceLines")).toContainText("Aurora Skin × 1");
  await expect(page.getByRole("button", { name: /Оплатить/u })).toBeEnabled();
}

async function changeCartFromAnotherTab(page: Page) {
  const otherTab = await page.context().newPage();
  await installApiAdapter(otherTab);
  await otherTab.goto("/cart");
  await otherTab.evaluate(({ key, lines }) => localStorage.setItem(key, JSON.stringify(lines)), {
    key: CART_KEY,
    lines: newerCart,
  });
  await otherTab.close();
}

async function storedCart(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "[]"), CART_KEY);
}

test("@off Checkout requires a new review when another tab changes the quoted cart", async ({ page }) => {
  const api = await installApiAdapter(page);
  await openCheckout(page);
  await changeCartFromAnotherTab(page);
  await page.getByRole("button", { name: /Оплатить/u }).click();
  await expect(page.getByRole("alert")).toContainText("Корзина изменилась");
  expect(api.checkoutKeys).toEqual([]);
  expect(api.orders.size).toBe(0);
  expect.soft(await storedCart(page)).toEqual(newerCart);
  await page.getByRole("button", { name: "Изменить корзину" }).click();
  await expect(page).toHaveURL(/\/cart$/u);
  await expect(page.locator(".bcCommerceLine__copy")).toContainText("Neon Rush");
});

test("@off Checkout freezes the reviewed items across authentication and preserves a newer cart", async ({ page }) => {
  const api = await installApiAdapter(page);
  let releaseAuth!: () => void;
  let markAuthStarted!: () => void;
  const authStarted = new Promise<void>((resolve) => { markAuthStarted = resolve; });
  const authReleased = new Promise<void>((resolve) => { releaseAuth = resolve; });
  await page.route("**/api/auth/guest", async (route) => {
    markAuthStarted();
    await authReleased;
    await route.fallback();
  });
  await openCheckout(page);
  await page.getByRole("button", { name: /Оплатить/u }).click();
  await authStarted;
  await changeCartFromAnotherTab(page);
  releaseAuth();
  await expect(page).toHaveURL(/\/checkout\/success\?order=ord-e2e-1/u);
  const order = [...api.orders.values()][0];
  expect.soft(order.items.map(({ itemId, quantity }) => ({ itemId, quantity }))).toEqual(originalCart);
  expect.soft(await storedCart(page)).toEqual(newerCart);
});

test("@off Checkout submits one reviewed order and clears only its unchanged cart", async ({ page }) => {
  const api = await installApiAdapter(page);
  await openCheckout(page);
  const displayedTotal = await page.locator(".bcCommerceSummary__row--total strong").textContent();
  const pay = page.getByRole("button", { name: /Оплатить/u });
  await pay.evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page).toHaveURL(/\/checkout\/success\?order=ord-e2e-1/u);
  expect(api.checkoutKeys).toHaveLength(1);
  expect(api.orders.size).toBe(1);
  const order = [...api.orders.values()][0];
  expect(order.items.map(({ itemId, quantity }) => ({ itemId, quantity }))).toEqual(originalCart);
  expect(`${new Intl.NumberFormat("ru-RU").format(order.total)} BC`).toBe(displayedTotal);
  expect(await storedCart(page)).toEqual([]);
  await page.goBack();
  await expect(page).toHaveURL(/\/checkout$/u);
  await expect(page.getByRole("heading", { name: "Нечего оформлять" })).toBeVisible();
});

test("@off Checkout retries an unavailable request with the same idempotency key", async ({ page }) => {
  const api = await installApiAdapter(page);
  const attemptKeys: string[] = [];
  await page.route("**/api/commerce/checkout", async (route) => {
    attemptKeys.push(route.request().headers()["idempotency-key"]);
    if (attemptKeys.length === 1) {
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, reason: "checkout_unavailable" }) });
      return;
    }
    await route.fallback();
  });
  await openCheckout(page);
  await page.getByRole("button", { name: /Оплатить/u }).click();
  await expect(page.getByRole("alert")).toContainText("checkout_unavailable");
  expect(await storedCart(page)).toEqual(originalCart);
  await page.getByRole("button", { name: /Оплатить/u }).click();
  await expect(page).toHaveURL(/\/checkout\/success\?order=ord-e2e-1/u);
  expect(attemptKeys).toHaveLength(2);
  expect(new Set(attemptKeys).size).toBe(1);
  expect(api.orders.size).toBe(1);
  expect(await storedCart(page)).toEqual([]);
});

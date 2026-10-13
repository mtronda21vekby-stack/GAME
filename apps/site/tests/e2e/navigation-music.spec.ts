import { expect, test, type Page } from "@playwright/test";
import { installApiAdapter, makeOrder } from "./apiAdapter";

const VOLUME_KEY = "bc.siteMusic.volume.v9";

async function clickQueryLink(page: Page, href: string) {
  await page.evaluate((target) => {
    const link = document.createElement("a");
    link.id = "bc-query-regression-link";
    link.href = target;
    link.textContent = "Inspect another order";
    Object.assign(link.style, { position: "fixed", top: "8px", left: "8px", zIndex: "2147483647" });
    document.body.append(link);
  }, href);
  await page.locator("#bc-query-regression-link").click();
  await page.locator("#bc-query-regression-link").evaluate((link) => link.remove());
}

test("@off query-only anchor navigation and history show the requested order", async ({ page }) => {
  await installApiAdapter(page, { orders: [makeOrder()] });
  await page.goto("/checkout/success?order=ord-valid");
  await expect(page.getByRole("heading", { name: "Предметы выданы" })).toBeVisible();
  await expect(page.getByText("ORDER / ord-valid", { exact: true })).toBeVisible();
  await page.evaluate(() => { document.documentElement.dataset.bcNavigationRegression = "same-document"; });

  await clickQueryLink(page, "/checkout/success?order=ord-foreign");
  await expect(page).toHaveURL(/\/checkout\/success\?order=ord-foreign$/u);
  await expect(page.getByRole("heading", { name: "Заказ не найден" })).toBeVisible();
  await expect(page.getByText("ORDER / ord-valid", { exact: true })).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-bc-navigation-regression", "same-document");

  await page.goBack();
  await expect(page).toHaveURL(/\/checkout\/success\?order=ord-valid$/u);
  await expect(page.getByRole("heading", { name: "Предметы выданы" })).toBeVisible();
  await expect(page.getByText("ORDER / ord-valid", { exact: true })).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL(/\/checkout\/success\?order=ord-foreign$/u);
  await expect(page.getByRole("heading", { name: "Заказ не найден" })).toBeVisible();
  await expect(page.getByText("ORDER / ord-valid", { exact: true })).toHaveCount(0);
});

test("@off hash-only history keeps the mounted route", async ({ page }) => {
  await installApiAdapter(page, { orders: [makeOrder()] });
  await page.goto("/checkout/success?order=ord-valid");
  await expect(page.getByRole("heading", { name: "Предметы выданы" })).toBeVisible();
  await page.locator(".bcRouteView").evaluate((route) => { (route as HTMLElement).dataset.bcMountRegression = "original"; });
  await page.evaluate(() => {
    history.pushState(null, "", `${location.pathname}${location.search}#order-details`);
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page).toHaveURL(/#order-details$/u);
  await expect(page.locator(".bcRouteView")).toHaveAttribute("data-bc-mount-regression", "original");
  await page.goBack();
  await expect(page).toHaveURL(/\?order=ord-valid$/u);
  await expect(page.locator(".bcRouteView")).toHaveAttribute("data-bc-mount-regression", "original");
});

for (const storedVolume of [null, "", "0"] as const) {
  const label = storedVolume === null ? "missing" : storedVolume === "" ? "empty" : "saved zero";
  const expectedVolume = storedVolume === "0" ? 0 : 0.42;
  test(`@off music volume respects ${label} storage`, async ({ page }) => {
    await installApiAdapter(page);
    await page.route("https://cdn1.suno.ai/**", (route) => route.abort());
    await page.addInitScript(({ key, value }) => {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }, { key: VOLUME_KEY, value: storedVolume });
    await page.goto("/about");
    const audio = page.locator(".bcSiteMusic audio");
    await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).volume)).toBe(expectedVolume);
    const expand = page.getByRole("button", { name: "Настроить громкость" });
    const volume = page.locator(".bcSiteMusic input[type=range]");
    await expand.click();
    await expect(expand).toHaveAttribute("aria-expanded", "true");
    await expect(volume).toHaveValue(String(expectedVolume));
    await expand.click();
    await expect(expand).toHaveAttribute("aria-expanded", "false");
    await expect(volume).toHaveCount(0);
    await expand.click();
    await expect(expand).toHaveAttribute("aria-expanded", "true");
    await expect(volume).toHaveValue(String(expectedVolume));
  });
}

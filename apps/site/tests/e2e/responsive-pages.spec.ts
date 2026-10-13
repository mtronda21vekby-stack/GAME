import { expect, test, type Page } from "@playwright/test";
import { installApiAdapter } from "./apiAdapter";

const sizes = [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 844, height: 390 }];

async function changeRoute(page: Page, path: string) {
  await page.evaluate((target) => {
    history.pushState(null, "", target);
    dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo(0, 0);
  }, path);
  await expect(page.locator(".bcRouteView")).toHaveAttribute("data-route", path);
}

test("@off account forms and preferences fit narrow screens and save on re-entry", async ({ page }) => {
  await installApiAdapter(page);
  for (const viewport of sizes) {
    await page.setViewportSize(viewport);
    await page.goto("/account");
    const grid = page.locator(".bcAccountGrid");
    await expect(grid).toBeVisible();
    for (const control of [page.getByPlaceholder("Введите никнейм"), page.getByPlaceholder("Короткая подпись"), page.getByRole("button", { name: "Мягкие", exact: true })]) {
      await control.scrollIntoViewIfNeeded();
      await expect.poll(() => control.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= innerWidth + 1 && rect.width > 40;
      })).toBe(true);
      await control.click({ trial: true });
    }
    const cards = await grid.locator(":scope > div").evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    }));
    expect(cards.every((card) => card.left >= 0 && card.right <= viewport.width + 1)).toBe(true);
    if (viewport.width <= 760) expect(cards[1].top).toBeGreaterThan(cards[0].bottom);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByPlaceholder("Введите никнейм").fill("QA Crown");
  await page.getByRole("button", { name: "Сохранить профиль", exact: true }).click();
  await changeRoute(page, "/store");
  await expect(page.getByRole("heading", { name: "Store", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByPlaceholder("Введите никнейм")).toHaveValue("QA Crown");
});

test("@off checkout headings and commerce touch controls stay usable", async ({ page }) => {
  await installApiAdapter(page);
  await page.addInitScript(() => localStorage.setItem("blackcrown:commerce.cart.v1", JSON.stringify([{ itemId: "skin_aurora", quantity: 1 }])));
  for (const viewport of sizes.slice(0, 3)) {
    await page.setViewportSize(viewport);
    await page.goto("/checkout");
    const heading = page.getByRole("heading", { name: "Оформление", exact: true });
    await expect(heading).toBeVisible();
    expect(await heading.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return [...range.getClientRects()].every((rect) => rect.left >= 0 && rect.right <= innerWidth);
    })).toBe(true);
    await page.goto("/store");
    const filter = page.getByLabel("Категория");
    await expect(filter).toBeVisible();
    expect((await filter.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect((await page.locator(".bcCommerceBrand").boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.goto("/cart");
    const plus = page.getByRole("button", { name: "Увеличить количество", exact: true });
    await expect(plus).toBeVisible();
    const bounds = (await plus.boundingBox())!;
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    await plus.click();
    await expect(page.locator(".bcCommerceQuantity output")).not.toHaveText("1");
  }
});

test("@off content pages do not change Home, Store or shared chrome after navigation", async ({ page }) => {
  await installApiAdapter(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const appearance = () => page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    const shell = getComputedStyle(document.querySelector(".bcAppShell")!);
    const dock = getComputedStyle(document.querySelector(".bcDockV2__item")!);
    return { accent: root.getPropertyValue("--bc-accent"), body: body.background, font: body.fontFamily, spacing: body.letterSpacing, shell: shell.background, dock: dock.color };
  });
  await page.goto("/store");
  await expect(page.getByRole("heading", { name: "Store", exact: true })).toBeVisible();
  const store = await appearance();
  await changeRoute(page, "/");
  await expect(page.locator(".bcCinematic")).toBeVisible();
  const home = await appearance();
  for (const path of ["/account", "/support", "/privacy", "/terms", "/about"]) {
    await changeRoute(page, path);
    await expect(page.locator(".bcSiteRoot")).toBeVisible();
    await changeRoute(page, "/store");
    await expect(page.getByRole("heading", { name: "Store", exact: true })).toBeVisible();
    expect(await appearance()).toEqual(store);
    await changeRoute(page, "/");
    await expect(page.locator(".bcCinematic")).toBeVisible();
    expect(await appearance()).toEqual(home);
  }
});

test("@off content navigation fits small and landscape screens with visible keyboard focus", async ({ page }) => {
  await installApiAdapter(page);
  for (const viewport of [sizes[0], sizes[3]]) {
    await page.setViewportSize(viewport);
    for (const path of ["/about", "/support", "/privacy", "/terms", "/account"]) {
      await page.goto(path);
      const header = page.locator(".bcTop");
      await expect(header).toBeVisible();
      const controls = header.locator("button,a");
      for (const control of await controls.all()) {
        if (!await control.isVisible()) continue;
        expect(await control.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return rect.left >= 0 && rect.right <= innerWidth + 1;
        })).toBe(true);
        await control.click({ trial: true });
      }
    }
  }
  await page.goto("/support");
  const faq = page.getByRole("button", { name: /Где хранится профиль/u });
  await faq.focus();
  expect(await faq.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(faq).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Enter");
  await expect(faq).toHaveAttribute("aria-expanded", "false");
});


test("@off every cinematic world keeps its text and actions inside the viewport", async ({ page }) => {
  await installApiAdapter(page);
  for (const viewport of [{ width: 1440, height: 900 }, ...sizes]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const cinematic = page.locator(".bcCinematic");
    await expect(cinematic).toHaveAttribute("data-key-art-status", "ready");
    for (const [progress, sceneId] of [[0, "crown"], [0.27, "gate"], [0.46, "evofish"], [0.68, "crown-front"], [0.92, "network"]] as const) {
      await cinematic.evaluate((element, target) => {
        const root = element as HTMLElement;
        window.scrollTo(0, root.getBoundingClientRect().top + scrollY + (root.offsetHeight - innerHeight) * target);
      }, progress);
      await expect(cinematic).toHaveAttribute("data-phase", sceneId);
      const active = page.locator(`.bcCinematic__scene[data-scene="${sceneId}"]`);
      expect(await active.locator("h1,h2").evaluate((heading) => {
        const copy = heading.closest(".bcCinematic__copy")!.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(heading);
        return [...range.getClientRects()].every((rect) => rect.left >= copy.left - 1 && rect.right <= copy.right + 1 && rect.top >= 0 && rect.bottom <= innerHeight);
      })).toBe(true);
      for (const button of await active.locator("button").all()) {
        expect(await button.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight && document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest("button") === element;
        })).toBe(true);
      }
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(cinematic).toHaveAttribute("data-phase", "crown");
    await page.getByRole("button", { name: "О вселенной", exact: true }).click();
    await expect(page).toHaveURL(/\/about$/u);
    await page.goBack();
    await expect(cinematic).toBeVisible();
    await expect(cinematic).toHaveAttribute("data-key-art-status", "ready");
  }
});

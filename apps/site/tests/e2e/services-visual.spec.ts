import { expect, test } from "@playwright/test";
import { installApiAdapter } from "./apiAdapter";

test.use({ screenshot: "off" });

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

test("@off Home services use the full surface and keep readable touch controls", async ({ page }) => {
  await installApiAdapter(page);
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    for (const selector of [".bcStoreV3", ".bcCoachV3", ".bcLiveFeedV3"]) {
      const section = page.locator(selector);
      await section.scrollIntoViewIfNeeded();
      expect(await section.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.left >= 0 && bounds.right <= innerWidth + 1 && element.scrollWidth <= element.clientWidth;
      })).toBe(true);
      for (const control of await section.locator("button,a").all()) {
        await control.scrollIntoViewIfNeeded();
        const bounds = (await control.boundingBox())!;
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(bounds.width).toBeGreaterThanOrEqual(44);
        await control.click({ trial: true });
      }
      expect(await section.locator("h2").evaluate((heading) => {
        const bounds = heading.closest("section")!.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(heading);
        return [...range.getClientRects()].every((rect) => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1);
      })).toBe(true);
    }

    for (const prefix of ["bcStoreV3", "bcCoachV3"]) {
      const geometry = await page.locator(`.${prefix}__shell`).evaluate((shell, name) => {
        const rect = (selector: string) => {
          const bounds = shell.querySelector(selector)!.getBoundingClientRect();
          return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom, width: bounds.width };
        };
        return { content: rect(".bcGlassSurface__content"), copy: rect(`.${name}__copy`), visual: rect(`.${name}__visual`) };
      }, prefix);
      if (viewport.width > 900) {
        expect(geometry.content.width).toBeGreaterThan(geometry.copy.width + geometry.visual.width);
        const [left, right] = prefix === "bcStoreV3" ? [geometry.copy, geometry.visual] : [geometry.visual, geometry.copy];
        expect(right.left).toBeGreaterThan(left.right);
      } else {
        expect(geometry.visual.top).toBeGreaterThan(geometry.copy.bottom);
      }
      const secondary = page.locator(`.${prefix}__actions button`).last();
      const readability = await secondary.evaluate((button) => {
        const style = getComputedStyle(button);
        const rgb = style.color.match(/[\d.]+/gu)!.slice(0, 3).map(Number);
        const luminance = (values: number[]) => values.map((value) => {
          const channel = value / 255;
          return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
        }).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
        return { contrast: (luminance(rgb) + .05) / (luminance([16, 28, 40]) + .05), fontSize: parseFloat(style.fontSize) };
      });
      expect(readability.contrast).toBeGreaterThanOrEqual(4.5);
      expect(readability.fontSize).toBeGreaterThanOrEqual(14);
      const image = page.locator(`.${prefix}__visual img`);
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
      expect(await image.evaluate((element) => element.clientWidth / element.clientHeight)).toBeCloseTo(5 / 3, 1);
    }

    const feedWidth = (await page.locator(".bcLiveFeedV3").boundingBox())!.width;
    const blockWidth = (await page.locator(".bcLiveFeedV3__block").boundingBox())!.width;
    expect(blockWidth).toBeCloseTo(feedWidth, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});

for (const count of [1, 2]) {
  test(`@off Home feed wraps long editorial text with ${count} blocks`, async ({ page }) => {
    await installApiAdapter(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const word = "BlackCrown".repeat(12);
    await page.route("**/api/content", (route) => route.fulfill({ json: {
      blocks: Array.from({ length: count }, (_, index) => ({
        id: `remote-${index}`,
        title: word,
        subtitle: word,
        cards: [{ tag: word, title: word, desc: word, href: "/store" }],
      })),
    } }));
    for (const viewport of [viewports[0], viewports[4]]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      const feed = page.locator(".bcLiveFeedV3");
      await expect(feed).toHaveAttribute("data-source", "remote");
      await expect(feed.locator(".bcLiveFeedV3__block")).toHaveCount(count);
      expect(await feed.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await feed.locator("article").evaluateAll((cards) => cards.every((card) => card.scrollWidth <= card.clientWidth))).toBe(true);
    }
  });
}

test("@off Home service actions support navigation, back and repeated entry", async ({ page }) => {
  await installApiAdapter(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize(viewports[1]);
  await page.goto("/");
  const targets = [
    [".bcStoreV3__actions button:first-child", "/store"],
    [".bcStoreV3__actions button:last-child", "/account"],
    [".bcCoachV3__actions button:last-child", "/support"],
    [".bcStoreV3__actions button:first-child", "/store"],
    [".bcLiveFeedV3__cards a", "/store"],
  ];
  for (const [selector, path] of targets) {
    await page.locator(selector).first().click();
    await expect(page.locator(".bcRouteView")).toHaveAttribute("data-route", path);
    await page.goBack();
    await expect(page.locator(".bcRouteView")).toHaveAttribute("data-route", "/");
    await expect(page.locator(".bcStoreV3")).toBeVisible();
  }

  await page.evaluate(() => {
    const state = window as Window & { bcTestTelegramTarget?: unknown[] };
    window.open = (...args) => { state.bcTestTelegramTarget = args; return null; };
  });
  await page.locator(".bcCoachV3__actions button:first-child").click();
  expect(await page.evaluate(() => (window as Window & { bcTestTelegramTarget?: unknown[] }).bcTestTelegramTarget)).toEqual([
    "https://t.me/GGBF6_WARZON_BOT", "_blank", "noopener,noreferrer",
  ]);
  await expect(page.locator(".bcRouteView")).toHaveAttribute("data-route", "/");
});

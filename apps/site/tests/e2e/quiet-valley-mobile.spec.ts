import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const runtimePath = path.resolve(here, "../../../lobby/public/runtime/quiet-valley/index.html");
const iPhoneUserAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

test("Quiet Valley boots its premium-safe renderer on an iPhone-sized touch viewport", async ({ browser }) => {
  expect(fs.existsSync(runtimePath), `Quiet Valley generated runtime missing at ${runtimePath}`).toBe(true);
  const html = fs.readFileSync(runtimePath, "utf8");

  const context = await browser.newContext({
    userAgent: iPhoneUserAgent,
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();

  await page.setContent(html, { waitUntil: "domcontentloaded" });

  await expect(page.locator("#loading")).toBeHidden({ timeout: 5_000 });
  await expect(page.locator("#error")).toBeHidden();
  await expect(page.locator("#world")).toBeVisible();
  await expect.poll(async () => page.evaluate(() => Boolean((window as any).FarmApp?.inspect?.())), { timeout: 5_000 }).toBe(true);

  const runtime = await page.evaluate(() => (window as any).FarmApp.inspect());
  expect(runtime.version).toBe("0.5.2-blackcrown.3");
  expect(runtime.webgl).toContain("WebGL 2");
  expect(runtime.graphics.quality).toBe("low");
  expect(runtime.graphics.shadow).toBe(false);
  expect(runtime.graphics.post).toBe(false);

  const mobileContract = await page.evaluate(() => {
    const css = [...document.styleSheets].flatMap((sheet) => {
      try {
        return [...sheet.cssRules].map((rule) => rule.cssText);
      } catch {
        return [];
      }
    }).join("\n");
    return {
      compactHud: css.includes("nth-child(2)"),
      rendererMarker: document.documentElement.innerHTML.includes("mobile-premium-v1"),
    };
  });
  expect(mobileContract.compactHud).toBe(true);
  expect(mobileContract.rendererMarker).toBe(true);

  await context.close();
});

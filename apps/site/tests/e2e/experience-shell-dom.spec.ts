import { expect, test, type Page } from "@playwright/test";
import { installApiAdapter } from "./apiAdapter";

async function openExperience(page: Page, hash = "crown") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installApiAdapter(page);
  await page.goto(`/nexus-lab#${hash}`);
  await expect(page.locator(".bcExperienceBoot")).toHaveCount(0);
  await expect(page.locator(".bcExperienceShell")).toHaveAttribute("data-entered", "true");
}

test("@lab short landscape menu keeps every chapter reachable and returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await openExperience(page);
  const trigger = page.getByRole("button", { name: "MENU", exact: true });
  await trigger.click();
  const panel = page.locator(".bcExperienceMenu__panel");
  expect((await panel.boundingBox())!.height).toBeLessThanOrEqual(390);
  for (const link of await panel.locator("nav a").all()) {
    await link.scrollIntoViewIfNeeded();
    await link.click({ trial: true });
  }
  await panel.locator('nav a[href="#profile"]').click();
  await expect(page.locator(".bcExperienceMenu")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator(".bcExperienceShell")).toHaveAttribute("data-active-chapter", "identity-enter");
  await page.goBack();
  await expect(page.locator(".bcExperienceShell")).toHaveAttribute("data-active-chapter", "crown-chamber");
  await trigger.click();
  await panel.locator('nav a[href="#network"]').click();
  await expect(page.locator(".bcExperienceShell")).toHaveAttribute("data-active-chapter", "network-core");
  const lobbyAction = page.locator('[id="network"] .bcExperienceSceneActions a');
  expect(await lobbyAction.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
  })).toBe(true);
});

test("@lab menu close paths restore focus and prevent background scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await openExperience(page);
  const trigger = page.getByRole("button", { name: "MENU", exact: true });
  await trigger.click();
  const initialScroll = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(initialScroll);
  await page.locator(".bcExperienceMenu__panel header button").click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator(".bcExperienceMenu__backdrop").click({ position: { x: 12, y: 180 } });
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe("hidden");
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("@lab narrow chapter titles preserve whole words and external actions remain hit-safe", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 568 });
  await openExperience(page);
  const chapters = ["crown", "gate", "evofish", "crown-front", "network", "store", "profile"];
  for (const hash of chapters) {
    await page.getByRole("button", { name: "MENU", exact: true }).click();
    await page.locator(`.bcExperienceMenu__panel nav a[href="#${hash}"]`).click();
    await expect(page.locator(`[id="${hash}"][data-active="true"]`)).toHaveCount(1);
    const copy = page.locator(`[id="${hash}"] .bcExperienceSceneCopy`);
    const splitWords = await copy.locator("h1,h2").evaluate((heading) => {
      const text = heading.firstChild;
      if (!text) return [];
      return [...(text.textContent ?? "").matchAll(/\S+/gu)].filter((word) => {
        const range = document.createRange();
        range.setStart(text, word.index!);
        range.setEnd(text, word.index! + word[0].length);
        return [...range.getClientRects()].filter((rect) => rect.width > 0).length > 1;
      }).map((word) => word[0]);
    });
    expect(splitWords, hash).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), hash).toBe(0);
    for (const action of await copy.locator(".bcExperienceSceneActions a").all()) {
      await action.scrollIntoViewIfNeeded();
      await action.click({ trial: true });
    }
  }
  await page.locator('[id="profile"] .bcExperienceFooter a[href="/support"]').click();
  await expect(page).toHaveURL(/\/support$/u);
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(0);
  await page.goBack();
  await expect(page.locator(".bcExperienceShell")).toHaveAttribute("data-active-chapter", "identity-enter");
  await expect(page.locator("canvas[data-bc-nexus-canvas]")).toHaveCount(1);
});

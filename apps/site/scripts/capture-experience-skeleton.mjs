import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const output = "/tmp/blackcrown-experience-skeleton-v1";
const baseUrl = process.env.BC_CAPTURE_URL || "http://127.0.0.1:5194";
const chapters = [
  ["01-crown", 0.26],
  ["02-gate", 0.365],
  ["03-evofish", 0.5],
  ["04-crown-front", 0.76],
  ["05-network", 0.865],
  ["06-collection", 0.935],
  ["07-final-pass", 0.98],
  ["08-identity", 0.999],
];

await mkdir(output, { recursive: true });

async function waitForRuntime(page) {
  const root = page.locator('[data-bc-experience-runtime="active"]');
  await root.waitFor({ state: "attached", timeout: 15_000 });
  await page.locator("canvas[data-bc-nexus-canvas]").waitFor({ state: "visible", timeout: 15_000 });
  return root;
}

async function enter(page) {
  const button = page.getByRole("button", { name: /^ENTER(?: THE NEXUS)?$/u });
  if (await button.isVisible()) await button.click();
}

async function setProgress(page, progress) {
  await page.evaluate((targetProgress) => {
    const story = document.querySelector(".bcExperienceStory");
    if (!(story instanceof HTMLElement)) throw new Error("Experience story is unavailable");
    const top = story.getBoundingClientRect().top + window.scrollY;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const travel = Math.max(1, story.offsetHeight - viewportHeight);
    window.scrollTo(0, top + targetProgress * travel);
  }, progress);

  const root = page.locator('[data-bc-experience-runtime="active"]');
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    const values = await root.evaluate((element) => ({
      progress: Number(element.getAttribute("data-bc-experience-progress")),
      target: Number(element.getAttribute("data-bc-experience-target")),
    }));
    if (Math.abs(values.progress - progress) < 0.0015 && Math.abs(values.target - progress) < 0.0015) break;
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function readMetrics(root, label, viewport) {
  return root.evaluate((element, args) => ({
    label: args.label,
    viewport: args.viewport,
    chapter: element.getAttribute("data-bc-experience-chapter"),
    scene: element.getAttribute("data-bc-experience-scene"),
    activeScenes: Number(element.getAttribute("data-bc-experience-active-scenes")),
    frameP50: Number(element.getAttribute("data-bc-experience-frame-p50")),
    frameP95: Number(element.getAttribute("data-bc-experience-frame-p95")),
    worstFrame: Number(element.getAttribute("data-bc-experience-worst-frame")),
    drawCalls: Number(element.getAttribute("data-bc-experience-draw-calls")),
    triangles: Number(element.getAttribute("data-bc-experience-triangles")),
    textures: Number(element.getAttribute("data-bc-experience-textures")),
    crownBackend: element.getAttribute("data-bc-crown-backend"),
    crownLod: element.getAttribute("data-bc-crown-lod"),
    canvasCount: document.querySelectorAll("canvas[data-bc-nexus-canvas]").length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }), { label, viewport });
}

async function resetSample(page) {
  const button = page.getByRole("button", { name: "RESET QA SAMPLE" });
  if (await button.count()) await button.evaluate((element) => element.click());
}

async function captureViewport(browser, prefix, viewport, options = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: options.reducedMotion ? "reduce" : "no-preference" });
  const page = await context.newPage();
  const query = "nexuscrown=candidate-b&bcdeviceqa=1";
  await page.goto(`${baseUrl}/nexus-lab?${query}`, { waitUntil: "domcontentloaded" });
  const root = await waitForRuntime(page);
  const hiddenDebug = await page.addStyleTag({ content: ".bcExperienceSkeletonDebug,.bcNexusDebug,.bcNexusDeviceQa{display:none!important}" });

  if (prefix === "desktop") {
    await page.locator(".bcNexusLab").waitFor({ state: "visible" });
    await page.screenshot({ path: `${output}/desktop-00-boot.png` });
  }
  await enter(page);
  if (options.autoQuality) {
    const auto = page.getByTitle("auto quality");
    await auto.evaluate((element) => element.click());
  }

  const selected = options.selected ?? chapters;
  const metrics = [];
  for (const [label, progress] of selected) {
    await setProgress(page, progress);
    await resetSample(page);
    await page.waitForTimeout(options.reducedMotion ? 250 : 1_250);
    await page.screenshot({ path: `${output}/${prefix}-${label}.png` });
    metrics.push(await readMetrics(root, label, viewport));
  }

  if (!options.reducedMotion) {
    await page.screenshot({ path: `${output}/${prefix}-full-page.png`, fullPage: true });
    if (prefix === "desktop") {
      await hiddenDebug.evaluate((element) => element.remove());
      const debugPanels = page.locator(".bcExperienceSkeletonDebug, .bcNexusDebug");
      for (const panel of await debugPanels.all()) {
        await panel.evaluate((element) => { element.open = true; });
      }
      await page.screenshot({ path: `${output}/desktop-debug.png` });
    } else if (prefix === "mobile") {
      await hiddenDebug.evaluate((element) => element.remove());
      const qa = page.locator(".bcNexusDeviceQa");
      if (await qa.count()) await qa.evaluate((element) => { element.open = true; });
      await page.screenshot({ path: `${output}/mobile-debug.png` });
    }
  }
  await context.close();
  return metrics;
}

const browser = await chromium.launch({ headless: true });
const desktopMetrics = await captureViewport(browser, "desktop", { width: 1440, height: 900 });
const mobileMetrics = await captureViewport(browser, "mobile", { width: 390, height: 844 }, { autoQuality: true });
await captureViewport(browser, "reduced", { width: 1440, height: 900 }, {
  reducedMotion: true,
  autoQuality: true,
  selected: [["crown", 0.26], ["network", 0.865], ["final", 0.999]],
});

const galleryFiles = [
  "desktop-00-boot.png",
  ...chapters.map(([label]) => `desktop-${label}.png`),
  ...chapters.map(([label]) => `mobile-${label}.png`),
  "reduced-crown.png",
  "reduced-network.png",
  "reduced-final.png",
];
const gallery = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:20px;background:#020406;color:#eefbfc;font:12px system-ui;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
figure{margin:0;border:1px solid #17313a;background:#050a0e}img{display:block;width:100%;height:auto}figcaption{padding:10px;color:#7ddde7}
</style>${galleryFiles.map((file) => `<figure><img src="${file}"><figcaption>${file}</figcaption></figure>`).join("")}`;
await writeFile(`${output}/contact-sheet.html`, gallery);
const contactContext = await browser.newContext({ viewport: { width: 1800, height: 1100 } });
const contactPage = await contactContext.newPage();
await contactPage.goto(pathToFileURL(`${output}/contact-sheet.html`).href, { waitUntil: "load" });
await contactPage.screenshot({ path: `${output}/blackcrown-experience-skeleton-contact-sheet.png`, fullPage: true });
await contactPage.close();
await contactContext.close();
await browser.close();

const report = { generatedAt: new Date().toISOString(), baseUrl, desktop: desktopMetrics, mobile: mobileMetrics };
await writeFile(`${output}/performance.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

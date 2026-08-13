import { chromium } from "@playwright/test";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const phase = process.argv[2] || "before";
const captureScope = process.env.BC_CAPTURE_SCOPE || "all";
const rootOutput = "/tmp/blackcrown-experience-art-direction-v3";
const output = `${rootOutput}/${phase}`;
const baseUrl = process.env.BC_CAPTURE_URL || "http://127.0.0.1:5194";

const chapters = [
  ["crown", 0.26],
  ["gate", 0.365],
  ["evofish", 0.5],
  ["crown-front", 0.76],
  ["network", 0.865],
  ["collection", 0.935],
  ["final-pass", 0.98],
  ["identity", 0.999],
];

const transitions = [
  ["crown-to-gate", 0.3325],
  ["gate-to-evofish", 0.3975],
  ["evofish-to-crown-front", 0.635],
  ["reactor-to-network", 0.865],
  ["network-to-collection", 0.935],
  ["collection-to-identity", 0.98],
];

await mkdir(output, { recursive: true });

async function waitForRuntime(page) {
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  await runtime.waitFor({ state: "attached", timeout: 20_000 });
  await page.locator("canvas[data-bc-nexus-canvas]").waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('[data-bc-experience-runtime="active"]')?.getAttribute("data-bc-crown-backend") === "glb");
  return runtime;
}

async function enter(page) {
  const button = page.getByRole("button", { name: /^ENTER(?: THE NEXUS)?$/u });
  if (await button.isVisible()) await button.click();
}

async function setProgress(page, progress) {
  await page.evaluate((target) => {
    const story = document.querySelector(".bcExperienceStory");
    if (!(story instanceof HTMLElement)) throw new Error("story_missing");
    const top = story.getBoundingClientRect().top + window.scrollY;
    const viewport = window.visualViewport?.height ?? window.innerHeight;
    window.scrollTo(0, top + target * Math.max(1, story.offsetHeight - viewport));
  }, progress);
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  await page.waitForFunction((target) => {
    const root = document.querySelector('[data-bc-experience-runtime="active"]');
    if (!root) return false;
    const smoothed = Number(root.getAttribute("data-bc-experience-progress"));
    const requested = Number(root.getAttribute("data-bc-experience-target"));
    return Math.abs(smoothed - target) < 0.0015 && Math.abs(requested - target) < 0.0015;
  }, progress, { timeout: 10_000 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return runtime;
}

async function resetSample(page) {
  const button = page.getByRole("button", { name: "RESET QA SAMPLE" });
  if (await button.count()) await button.evaluate((element) => element.click());
}

async function readMetrics(page, runtime, label, viewport) {
  const reportNode = page.locator("[data-bc-device-report]");
  const report = await reportNode.count() ? JSON.parse(await reportNode.textContent()) : {};
  return runtime.evaluate((element, args) => ({
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
    estimatedTextureMemory: args.report.estimatedTextureMemory ?? 0,
    geometries: args.report.geometries ?? 0,
  }), { label, viewport, report });
}

async function openExperience(browser, viewport, reducedMotion = false, autoQuality = false) {
  const context = await browser.newContext({ viewport, reducedMotion: reducedMotion ? "reduce" : "no-preference" });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/nexus-lab?nexuscrown=candidate-b&bcdeviceqa=1`, { waitUntil: "domcontentloaded" });
  const runtime = await waitForRuntime(page);
  await enter(page);
  if (autoQuality) {
    const auto = page.getByTitle("auto quality");
    await auto.evaluate((element) => element.click());
    await page.waitForFunction(() => document.querySelector('[data-bc-experience-runtime="active"]')?.getAttribute("data-bc-crown-lod") === "low");
  }
  const hiddenDebug = await page.addStyleTag({ content: ".bcExperienceSkeletonDebug,.bcNexusDebug,.bcNexusDeviceQa{display:none!important}" });
  return { context, page, runtime, hiddenDebug };
}

async function captureSet(browser, prefix, viewport, points, options = {}) {
  const session = await openExperience(browser, viewport, options.reducedMotion, options.autoQuality);
  const metrics = [];
  if (options.prewarm !== false) {
    for (const [, progress] of points) {
      await setProgress(session.page, progress);
      await session.page.waitForTimeout(90);
    }
    await setProgress(session.page, points[0][1]);
    await session.page.waitForTimeout(180);
  }
  for (const [label, progress] of points) {
    await setProgress(session.page, progress);
    await resetSample(session.page);
    await session.page.waitForTimeout(options.reducedMotion ? 350 : 1_300);
    await session.page.screenshot({ path: `${output}/${prefix}-${label}.png` });
    metrics.push(await readMetrics(session.page, session.runtime, label, viewport));
  }
  await session.context.close();
  return metrics;
}

const browser = await chromium.launch({ headless: true });
const desktop = captureScope === "all"
  ? await captureSet(browser, "desktop", { width: 1440, height: 900 }, chapters)
  : [];
const desktopTransitions = captureScope === "all" || captureScope === "transitions"
  ? await captureSet(browser, "desktop", { width: 1440, height: 900 }, transitions)
  : [];
const mobile = captureScope === "all"
  ? await captureSet(browser, "mobile", { width: 390, height: 844 }, chapters, { autoQuality: true })
  : [];
if (captureScope === "all") {
  await captureSet(browser, "mobile430", { width: 430, height: 932 }, chapters, { autoQuality: true });
  await captureSet(browser, "landscape", { width: 844, height: 390 }, chapters, { autoQuality: true });
  await captureSet(browser, "reduced", { width: 1440, height: 900 }, [chapters[0], chapters[3], chapters[7]], { reducedMotion: true, autoQuality: true });

  const debugSession = await openExperience(browser, { width: 1440, height: 900 });
  await debugSession.hiddenDebug.evaluate((element) => element.remove());
  for (const [label, progress] of [["performance-crown-front", 0.76], ["performance-collection", 0.935]]) {
    await setProgress(debugSession.page, progress);
    for (const panel of await debugSession.page.locator(".bcExperienceSkeletonDebug,.bcNexusDebug,.bcNexusDeviceQa").all()) {
      await panel.evaluate((element) => { element.open = true; });
    }
    const debugPath = `${output}/debug-${label}.png`;
    await debugSession.page.screenshot({ path: debugPath });
    await copyFile(debugPath, `${rootOutput}/debug/${phase}-${label}.png`);
  }
  await debugSession.context.close();

const galleryFiles = [
  ...chapters.map(([label]) => `desktop-${label}.png`),
  ...transitions.map(([label]) => `desktop-${label}.png`),
  ...chapters.map(([label]) => `mobile-${label}.png`),
  "landscape-crown-front.png",
  "landscape-collection.png",
  "reduced-crown.png",
  "reduced-crown-front.png",
  "reduced-identity.png",
];
const gallery = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:18px;background:#020406;color:#dffcff;font:12px system-ui;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
figure{margin:0;border:1px solid #17313a;background:#05090d}img{display:block;width:100%;height:auto}figcaption{padding:9px;color:#7ddde7}
</style>${galleryFiles.map((file) => `<figure><img src="${file}"><figcaption>${file}</figcaption></figure>`).join("")}`;
  await writeFile(`${output}/contact-sheet.html`, gallery);
  const galleryContext = await browser.newContext({ viewport: { width: 1800, height: 1100 } });
  const galleryPage = await galleryContext.newPage();
  await galleryPage.goto(pathToFileURL(`${output}/contact-sheet.html`).href, { waitUntil: "load" });
  await galleryPage.screenshot({ path: `${output}/blackcrown-art-direction-v3-${phase}-contact-sheet.png`, fullPage: true });
  await galleryContext.close();

  if (phase === "after") {
    const comparisonFiles = [
      ...chapters.map(([label]) => `desktop-${label}.png`),
      ...chapters.map(([label]) => `mobile-${label}.png`),
    ];
    const comparison = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:18px;background:#020406;color:#dffcff;font:12px system-ui}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}.pair h2{grid-column:1/-1;margin:0;color:#7ddde7;font-size:13px}.pair figure{margin:0;border:1px solid #17313a;background:#05090d}.pair img{display:block;width:100%;height:auto}.pair figcaption{padding:8px;color:#9bbbc0}
</style>${comparisonFiles.map((file) => `<section class="pair"><h2>${file}</h2><figure><img src="../before/${file}"><figcaption>BEFORE / 86ee009</figcaption></figure><figure><img src="../after/${file}"><figcaption>AFTER / V3</figcaption></figure></section>`).join("")}`;
    const comparisonPath = `${rootOutput}/comparisons/contact-sheet.html`;
    await writeFile(comparisonPath, comparison);
    const comparisonContext = await browser.newContext({ viewport: { width: 1800, height: 1100 } });
    const comparisonPage = await comparisonContext.newPage();
    await comparisonPage.goto(pathToFileURL(comparisonPath).href, { waitUntil: "load" });
    await comparisonPage.screenshot({ path: `${rootOutput}/comparisons/blackcrown-art-direction-v3-before-after.png`, fullPage: true });
    await comparisonContext.close();
  }
}
await browser.close();

const report = { generatedAt: new Date().toISOString(), phase, captureScope, baseUrl, desktop, desktopTransitions, mobile };
await writeFile(`${output}/performance-${captureScope}.json`, `${JSON.stringify(report, null, 2)}\n`);
if (captureScope === "all") await writeFile(`${output}/performance.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

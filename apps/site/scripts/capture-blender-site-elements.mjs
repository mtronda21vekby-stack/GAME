import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const baseUrl = process.env.BC_CAPTURE_URL || "http://127.0.0.1:5194";
const output = "/tmp/blackcrown-blender-site-elements-v1/site";
const chapters = [
  ["world-gate", 0.3325, 1],
  ["crown-front-reactor", 0.635, 2],
  ["network-architecture", 0.865, 3],
  ["collection-vault", 0.935, 4],
];

await mkdir(output, { recursive: true });

async function openExperience(browser, viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/nexus-lab?nexuscrown=candidate-b&bcdeviceqa=1&bcenv=blender`, { waitUntil: "domcontentloaded" });
  const runtime = page.locator('[data-bc-experience-runtime="active"]');
  await runtime.waitFor({ state: "attached", timeout: 20_000 });
  await page.locator("canvas[data-bc-nexus-canvas]").waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('[data-bc-experience-runtime="active"]')?.getAttribute("data-bc-crown-backend") === "glb");
  const enter = page.getByRole("button", { name: /^ENTER(?: THE NEXUS)?$/u });
  if (await enter.isVisible()) await enter.click();
  await page.addStyleTag({ content: ".bcExperienceSkeletonDebug,.bcNexusDebug,.bcNexusDeviceQa{display:none!important}" });
  return { context, page, runtime };
}

async function setProgress(page, progress) {
  await page.evaluate((target) => {
    const story = document.querySelector(".bcExperienceStory");
    if (!(story instanceof HTMLElement)) throw new Error("story_missing");
    const top = story.getBoundingClientRect().top + window.scrollY;
    const viewport = window.visualViewport?.height ?? window.innerHeight;
    window.scrollTo(0, top + target * Math.max(1, story.offsetHeight - viewport));
  }, progress);
  await page.waitForFunction((target) => {
    const runtime = document.querySelector('[data-bc-experience-runtime="active"]');
    const value = Number(runtime?.getAttribute("data-bc-experience-progress"));
    const requested = Number(runtime?.getAttribute("data-bc-experience-target"));
    return Math.abs(value - target) < 0.0015 && Math.abs(requested - target) < 0.0015;
  }, progress, { timeout: 12_000 });
}

const browser = await chromium.launch({ headless: true });
const desktop = await openExperience(browser, { width: 1440, height: 900 });
const metrics = [];
for (const [label, progress, expectedModels] of chapters) {
  await setProgress(desktop.page, progress);
  await desktop.page.waitForFunction((expected) => {
    const runtime = document.querySelector('[data-bc-experience-runtime="active"]');
    return Number(runtime?.getAttribute("data-bc-experience-authored-models")) >= expected;
  }, expectedModels, { timeout: 12_000 });
  const resetSample = desktop.page.getByRole("button", { name: "RESET QA SAMPLE" });
  if (await resetSample.count()) await resetSample.evaluate((element) => element.click());
  await desktop.page.waitForTimeout(1_300);
  await desktop.page.screenshot({ path: `${output}/desktop-${label}.png` });
  metrics.push(await desktop.runtime.evaluate((element, scene) => ({
    scene,
    authoredModels: Number(element.getAttribute("data-bc-experience-authored-models")),
    activeScenes: Number(element.getAttribute("data-bc-experience-active-scenes")),
    frameP50: Number(element.getAttribute("data-bc-experience-frame-p50")),
    frameP95: Number(element.getAttribute("data-bc-experience-frame-p95")),
    drawCalls: Number(element.getAttribute("data-bc-experience-draw-calls")),
    triangles: Number(element.getAttribute("data-bc-experience-triangles")),
    canvasCount: document.querySelectorAll("canvas[data-bc-nexus-canvas]").length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }), label));
}
await desktop.context.close();

const mobile = await openExperience(browser, { width: 390, height: 844 });
const auto = mobile.page.getByTitle("auto quality");
if (await auto.count()) await auto.evaluate((element) => element.click());
await mobile.page.waitForFunction(() => document.querySelector('[data-bc-experience-runtime="active"]')?.getAttribute("data-bc-crown-lod") === "low");
await setProgress(mobile.page, 0.76);
await mobile.page.waitForTimeout(450);
await mobile.page.screenshot({ path: `${output}/mobile-low-procedural-fallback.png` });
const mobileMetrics = await mobile.runtime.evaluate((element) => ({
  authoredModels: Number(element.getAttribute("data-bc-experience-authored-models")),
  drawCalls: Number(element.getAttribute("data-bc-experience-draw-calls")),
  triangles: Number(element.getAttribute("data-bc-experience-triangles")),
  crownLod: element.getAttribute("data-bc-crown-lod"),
  canvasCount: document.querySelectorAll("canvas[data-bc-nexus-canvas]").length,
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
}));
await mobile.context.close();

const files = [...chapters.map(([label]) => `desktop-${label}.png`), "mobile-low-procedural-fallback.png"];
const gallery = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:18px;background:#020406;color:#dffcff;font:12px system-ui;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
figure{margin:0;border:1px solid #17313a;background:#05090d}img{display:block;width:100%;height:auto}figcaption{padding:9px;color:#7ddde7}
</style>${files.map((file) => `<figure><img src="${file}"><figcaption>${file}</figcaption></figure>`).join("")}`;
const galleryPath = `${output}/contact-sheet.html`;
await writeFile(galleryPath, gallery);
const galleryContext = await browser.newContext({ viewport: { width: 1800, height: 1100 } });
const galleryPage = await galleryContext.newPage();
await galleryPage.goto(pathToFileURL(galleryPath).href, { waitUntil: "load" });
await galleryPage.screenshot({ path: `${output}/blackcrown-blender-elements-site-contact-sheet.png`, fullPage: true });
await galleryContext.close();
await browser.close();

const report = { generatedAt: new Date().toISOString(), baseUrl, metrics, mobile: mobileMetrics };
await writeFile(`${output}/performance.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = new Map(process.argv.slice(2).map((entry) => {
  const [key, ...value] = entry.split("=");
  return [key, value.join("=")];
}));
const highBaseUrl = args.get("--high-base-url") || "http://127.0.0.1:5196";
const autoBaseUrl = args.get("--auto-base-url") || "http://127.0.0.1:5197";
const outputDir = path.resolve(args.get("--output-dir") || "/tmp/blackcrown-production-crown-candidate-b");
const expectedAssets = {
  "candidate-a": "blackcrown-digital-crown-candidate-a-v1",
  "candidate-b": "blackcrown-digital-crown-candidate-b-v1",
};
const chapters = [
  ["inspection", 0.34],
  ["core-reveal", 0.52],
  ["crown-front", 0.68],
  ["ecosystem", 0.84],
  ["enter", 0.96],
];

async function enterNexus(page) {
  await page.waitForFunction(() => /ready|fallback/.test(document.querySelector(".bcNexusLab")?.getAttribute("data-boot-stage") || ""));
  const enter = page.getByRole("button", { name: "ENTER THE NEXUS" });
  if (await enter.isVisible()) await enter.click();
  await page.locator(".bcNexusBoot").waitFor({ state: "detached" });
}

async function waitForCandidate(page, candidate) {
  await page.waitForFunction((assetId) => {
    const runtime = document.querySelector('[data-bc-experience-runtime="active"]');
    return runtime?.getAttribute("data-bc-crown-backend") === "glb"
      && runtime.getAttribute("data-bc-crown-asset-id") === assetId;
  }, expectedAssets[candidate], { timeout: 20_000 });
}

async function setProgress(page, progress) {
  await page.evaluate((targetProgress) => {
    const story = document.querySelector(".bcNexusStory");
    if (!(story instanceof HTMLElement)) throw new Error("Nexus story is unavailable");
    const experienceTop = story.getBoundingClientRect().top + window.scrollY;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const distance = Math.max(1, story.offsetHeight - viewportHeight);
    window.scrollTo(0, experienceTop + targetProgress * distance);
  }, progress);
  await page.waitForFunction((targetProgress) => {
    const runtime = document.querySelector('[data-bc-experience-runtime="active"]');
    const actual = Number(runtime?.getAttribute("data-bc-experience-progress"));
    return Number.isFinite(actual) && Math.abs(actual - targetProgress) < 0.0005;
  }, progress, { timeout: 10_000 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function readDeviceReport(page) {
  return JSON.parse(await page.locator("[data-bc-device-report]").textContent() || "{}");
}

async function resetFrameSample(page) {
  const panel = page.locator('[data-bc-device-qa="ready"]');
  if (!(await panel.getAttribute("open"))) await panel.locator("summary").click();
  await panel.getByRole("button", { name: "RESET QA SAMPLE" }).click();
  await panel.locator("summary").click();
}

async function openCandidate(page, baseUrl, candidate) {
  await page.goto(`${baseUrl}/nexus-lab?nexuscrown=${candidate}&bcdeviceqa=1&bcdebug=1`, { waitUntil: "networkidle" });
  await enterNexus(page);
  await waitForCandidate(page, candidate);
  const canvasCount = await page.locator("canvas[data-bc-nexus-canvas]").count();
  if (canvasCount !== 1) throw new Error(`${candidate} mounted ${canvasCount} canvases`);
}

async function captureChapterSet(browser, candidate, baseUrl, viewport, prefix) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await openCandidate(page, baseUrl, candidate);
  await page.addStyleTag({ content: ".bcNexusDebug,.bcNexusDeviceQa{display:none!important}" });
  for (const [chapter, progress] of chapters.filter(([name]) => name !== "ecosystem")) {
    await setProgress(page, progress);
    await page.screenshot({ path: path.join(outputDir, `${candidate.at(-1)}-${prefix}-${chapter}.png`) });
  }
  const state = {
    asset: (await readDeviceReport(page)).manifestAssetId,
    lod: (await readDeviceReport(page)).crownLod,
    quality: (await readDeviceReport(page)).qualityResolved,
    overflow: await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    canvasCount: await page.locator("canvas[data-bc-nexus-canvas]").count(),
  };
  await context.close();
  return state;
}

async function captureReduced(browser, candidate) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await openCandidate(page, autoBaseUrl, candidate);
  await page.addStyleTag({ content: ".bcNexusDebug,.bcNexusDeviceQa{display:none!important}" });
  await setProgress(page, 0.96);
  await page.screenshot({ path: path.join(outputDir, `${candidate.at(-1)}-reduced-final.png`) });
  const report = await readDeviceReport(page);
  await context.close();
  return report;
}

async function profileCandidate(browser, candidate) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await openCandidate(page, highBaseUrl, candidate);
  const samples = {};
  for (const [chapter, progress] of chapters) {
    await setProgress(page, progress);
    await resetFrameSample(page);
    await page.waitForTimeout(3_750);
    samples[chapter] = await readDeviceReport(page);
  }
  const load = samples.inspection;
  await page.evaluate(() => {
    history.pushState(null, "", "/about");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.getByRole("heading", { name: "BlackCrown — хаб, где игры и сервисы работают вместе." }).waitFor();
  const canvasAfterExit = await page.locator("canvas[data-bc-nexus-canvas]").count();
  await page.evaluate((nextCandidate) => {
    history.pushState(null, "", `/nexus-lab?nexuscrown=${nextCandidate}&bcdeviceqa=1&bcdebug=1`);
    dispatchEvent(new PopStateEvent("popstate"));
  }, candidate);
  await enterNexus(page);
  await waitForCandidate(page, candidate);
  const lifecycle = await readDeviceReport(page);
  const candidateGlbs = requests.filter((url) => url.includes(`/experience/crown/${candidate}/`) && /\.glb(?:\?|$)/u.test(url));
  await context.close();
  return {
    samples,
    load: {
      fetchTime: load.fetchTime,
      parseTime: load.parseTime,
      bindTime: load.bindTime,
      crownFirstFrameTime: load.crownFirstFrameTime,
      assetBytes: load.assetBytes,
    },
    requests: { glb: candidateGlbs, selectedLodFetchesPerEntry: candidateGlbs.length / 2 },
    lifecycle: {
      canvasAfterExit,
      canvasAfterReentry: lifecycle.canvasCount,
      routeEntryCount: lifecycle.routeEntryCount,
      routeDisposeCount: lifecycle.routeDisposeCount,
      rafOwnerCount: lifecycle.rafOwnerCount,
      loader: lifecycle.loader,
    },
  };
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch();
try {
  const results = { generatedAt: new Date().toISOString(), highBaseUrl, autoBaseUrl, candidates: {} };
  for (const candidate of Object.keys(expectedAssets)) {
    results.candidates[candidate] = {
      desktop: await captureChapterSet(browser, candidate, highBaseUrl, { width: 1440, height: 900 }, "desktop"),
      mobile390: await captureChapterSet(browser, candidate, autoBaseUrl, { width: 390, height: 844 }, "mobile"),
      reduced: await captureReduced(browser, candidate),
      performance: null,
    };
  }

  const context = await browser.newContext({ viewport: { width: 430, height: 932 } });
  const page = await context.newPage();
  await openCandidate(page, autoBaseUrl, "candidate-b");
  await page.addStyleTag({ content: ".bcNexusDebug,.bcNexusDeviceQa{display:none!important}" });
  await setProgress(page, 0.96);
  await page.screenshot({ path: path.join(outputDir, "b-mobile-430-enter.png") });
  results.candidateB430 = await readDeviceReport(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await setProgress(page, 0.96);
  await page.screenshot({ path: path.join(outputDir, "b-landscape-844-enter.png") });
  results.candidateBLandscape = await readDeviceReport(page);
  await context.close();

  // Each candidate gets a fresh Chromium process so shader caches and a long-running
  // shared GPU process do not bias the candidate measured second.
  for (const candidate of ["candidate-b", "candidate-a"]) {
    const profilingBrowser = await chromium.launch();
    try {
      results.candidates[candidate].performance = await profileCandidate(profilingBrowser, candidate);
    } finally {
      await profilingBrowser.close();
    }
    await new Promise((resolve) => setTimeout(resolve, 1_500));
  }

  await writeFile(path.join(outputDir, "candidate-a-b-runtime-report.json"), `${JSON.stringify(results, null, 2)}\n`);
  console.log(`Candidate A/B review captured in ${outputDir}`);
} finally {
  await browser.close();
}

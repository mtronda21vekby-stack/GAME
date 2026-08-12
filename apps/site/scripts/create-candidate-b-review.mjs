import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(process.argv[2] || "/tmp/blackcrown-production-crown-candidate-b");
const reviewDir = path.join(root, "review");
await mkdir(reviewDir, { recursive: true });

const comparisons = [
  ["front", "baseline-a/candidate-a-front.png", "candidate-b-front.png"],
  ["front-3q", "baseline-a/candidate-a-front-3q.png", "candidate-b-front-3q.png"],
  ["silhouette", "baseline-a/candidate-a-silhouette.png", "candidate-b-silhouette.png"],
  ["grayscale", "baseline-a/candidate-a-front.png", "candidate-b-grayscale.png", true],
  ["core-open", "baseline-a/candidate-a-core-open.png", "candidate-b-core-open.png"],
  ["portal-open", "baseline-a/candidate-a-portal-open.png", "candidate-b-portal-open.png"],
  ["material-closeup", "baseline-a/candidate-a-material-closeup.png", "candidate-b-material-closeup.png"],
  ["wireframe", "baseline-a/candidate-a-wireframe.png", "candidate-b-wireframe.png"],
];

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1000 }, deviceScaleFactor: 1 });
  const comparisonSource = path.join(reviewDir, "comparison-source.html");
  for (const [name, a, b, grayscaleA] of comparisons) {
    const aUrl = pathToFileURL(path.join(root, a)).href;
    const bUrl = pathToFileURL(path.join(root, b)).href;
    await writeFile(comparisonSource, `<!doctype html><style>
      *{box-sizing:border-box}body{margin:0;background:#080b0e;color:#edf7fa;font-family:Arial,sans-serif}
      main{display:grid;grid-template-columns:1fr 1fr;height:100vh;gap:2px;background:#1b262d}
      figure{margin:0;position:relative;background:#11171b;overflow:hidden}img{width:100%;height:100%;object-fit:contain;${grayscaleA ? "filter:grayscale(1);" : ""}}
      figure+figure img{filter:none}figcaption{position:absolute;left:24px;top:22px;padding:9px 12px;background:#05080bcc;border:1px solid #45616f;font:700 18px monospace;letter-spacing:0}
    </style><main><figure><img src="${aUrl}"><figcaption>CANDIDATE A / ${name.toUpperCase()}</figcaption></figure><figure><img src="${bUrl}"><figcaption>CANDIDATE B / ${name.toUpperCase()}</figcaption></figure></main>`);
    await page.goto(pathToFileURL(comparisonSource).href);
    await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
    await page.screenshot({ path: path.join(root, `compare-a-b-${name}.png`) });
  }
} finally {
  await browser.close();
}

const section = (title, items) => `<section><h2>${title}</h2><div class="grid">${items.map(([caption, image]) => `<figure><a href="../${image}"><img loading="lazy" src="../${image}" alt="${caption}"></a><figcaption>${caption}</figcaption></figure>`).join("")}</div></section>`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BLACKCROWN Candidate A/B Review</title><style>
  :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#070a0d;color:#e9f6f9;font-family:Arial,sans-serif}header{padding:32px 5vw;border-bottom:1px solid #24323a}h1{margin:0 0 8px;font-size:clamp(26px,4vw,54px);letter-spacing:0}p{margin:0;color:#95aab3}section{padding:28px 5vw;border-bottom:1px solid #182229}h2{font-size:18px;letter-spacing:0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}figure{margin:0;background:#0d1317;border:1px solid #24343d}img{display:block;width:100%;height:auto;max-height:78vh;object-fit:contain;background:#090d10}figcaption{padding:10px 12px;font:600 13px monospace;letter-spacing:0;color:#b9d6de}@media(max-width:760px){.grid{grid-template-columns:1fr}}
</style></head><body><header><h1>BLACKCROWN CROWN A/B REVIEW</h1><p>Local, offline review package. Candidate B is not production-approved.</p></header>
${section("Silhouette", [["A/B front", "compare-a-b-front.png"], ["A/B silhouette", "compare-a-b-silhouette.png"], ["A/B three-quarter", "compare-a-b-front-3q.png"], ["A/B grayscale", "compare-a-b-grayscale.png"]])}
${section("Materials", [["A/B material close-up", "compare-a-b-material-closeup.png"], ["Candidate B turntable", "candidate-b-turntable-contact-sheet.png"]])}
${section("Core", [["A/B core open", "compare-a-b-core-open.png"]])}
${section("Portal", [["A/B portal open", "compare-a-b-portal-open.png"]])}
${section("Desktop Nexus", [["A inspection", "a-desktop-inspection.png"], ["B inspection", "b-desktop-inspection.png"], ["A core reveal", "a-desktop-core-reveal.png"], ["B core reveal", "b-desktop-core-reveal.png"], ["A CROWN//FRONT", "a-desktop-crown-front.png"], ["B CROWN//FRONT", "b-desktop-crown-front.png"], ["A enter", "a-desktop-enter.png"], ["B enter", "b-desktop-enter.png"]])}
${section("Mobile Nexus", [["A inspection", "a-mobile-inspection.png"], ["B inspection", "b-mobile-inspection.png"], ["A core reveal", "a-mobile-core-reveal.png"], ["B core reveal", "b-mobile-core-reveal.png"], ["A CROWN//FRONT", "a-mobile-crown-front.png"], ["B CROWN//FRONT", "b-mobile-crown-front.png"], ["A enter", "a-mobile-enter.png"], ["B enter", "b-mobile-enter.png"], ["B 430x932", "b-mobile-430-enter.png"], ["B 844x390", "b-landscape-844-enter.png"]])}
${section("Reduced Motion", [["A reduced final", "a-reduced-final.png"], ["B reduced final", "b-reduced-final.png"]])}
${section("Wireframe", [["A/B wireframe", "compare-a-b-wireframe.png"], ["Candidate B wireframe", "candidate-b-wireframe.png"]])}
</body></html>`;
await writeFile(path.join(reviewDir, "index.html"), html);
console.log(`Review gallery created at ${path.join(reviewDir, "index.html")}`);

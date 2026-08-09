import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { gzipSync } from "node:zlib";

export const BUNDLE_BUDGETS = Object.freeze({
  initialJs: 350 * 1024,
  initialCss: 120 * 1024,
  initialChunk: 500 * 1024,
  nexusAsyncChunk: 500 * 1024,
});

export function collectInitialAssets(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
  const styles = [...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map(
    (match) => match[1],
  );
  return { scripts, styles };
}

export function normalizeAssetPath(assetUrl) {
  return assetUrl.replace(/^\//, "").split("?")[0].split("#")[0];
}

export function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

async function getAssetMetric(distDir, assetUrl) {
  const filePath = path.join(distDir, normalizeAssetPath(assetUrl));
  const contents = await readFile(filePath);
  return {
    asset: normalizeAssetPath(assetUrl),
    bytes: contents.byteLength,
    gzipBytes: gzipSync(contents).byteLength,
  };
}

async function listFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(absolute)));
    else files.push(absolute);
  }
  return files;
}

export async function inspectBundle({ distDir, sourceDir }) {
  const html = await readFile(path.join(distDir, "index.html"), "utf8");
  const initialAssets = collectInitialAssets(html);
  const js = await Promise.all(initialAssets.scripts.map((asset) => getAssetMetric(distDir, asset)));
  const css = await Promise.all(initialAssets.styles.map((asset) => getAssetMetric(distDir, asset)));
  const distFiles = await listFiles(path.join(distDir, "assets"));
  const jsFiles = distFiles.filter((file) => file.endsWith(".js"));
  const jsMetrics = await Promise.all(jsFiles.map(async (file) => ({
    file: path.basename(file),
    bytes: (await stat(file)).size,
  })));
  const jsSources = await Promise.all(jsFiles.map((file) => readFile(file, "utf8")));
  const initialJsSources = await Promise.all(initialAssets.scripts.map((asset) => readFile(path.join(distDir, normalizeAssetPath(asset)), "utf8")));
  const sourceFiles = await listFiles(sourceDir);
  const sourceJs = sourceFiles.filter((file) => /\.(?:ts|tsx|js|jsx|mjs)$/.test(file));
  const sourceContents = await Promise.all(sourceJs.map((file) => readFile(file, "utf8")));

  return {
    js,
    css,
    allJsFiles: jsFiles.map((file) => path.basename(file)),
    allJsMetrics: jsMetrics,
    embedsCssInline: sourceContents.some((source) => /\.css\?inline["']/.test(source)),
    embedsRasterDataUri: jsSources.some((source) => /data:image\/(?:avif|webp|jpe?g|png);base64,[a-z0-9+/=]{1024,}/i.test(source)),
    embedsGlbData: jsSources.some((source) => /data:(?:model\/gltf-binary|application\/octet-stream);base64,/i.test(source) || /Z2xURgAAAA/i.test(source)),
    initialContainsGltfLoader: initialJsSources.some((source) => /GLTFLoader|nexus-gltf-loader/i.test(source)),
    initialContainsCrownAsset: initialJsSources.some((source) => /crown\.manifest\.json|\.glb(?:["'`?])/i.test(source)),
  };
}

export function validateBundle(report) {
  const errors = [];
  const initialJs = report.js.reduce((total, asset) => total + asset.bytes, 0);
  const initialCss = report.css.reduce((total, asset) => total + asset.bytes, 0);

  if (initialJs > BUNDLE_BUDGETS.initialJs) {
    errors.push(`Initial JS ${formatBytes(initialJs)} exceeds ${formatBytes(BUNDLE_BUDGETS.initialJs)}.`);
  }
  if (initialCss > BUNDLE_BUDGETS.initialCss) {
    errors.push(`Initial CSS ${formatBytes(initialCss)} exceeds ${formatBytes(BUNDLE_BUDGETS.initialCss)}.`);
  }
  for (const asset of report.js) {
    if (asset.bytes > BUNDLE_BUDGETS.initialChunk) {
      errors.push(`Initial chunk ${asset.asset} is ${formatBytes(asset.bytes)}; limit is ${formatBytes(BUNDLE_BUDGETS.initialChunk)}.`);
    }
  }
  for (const asset of report.allJsMetrics.filter((candidate) => /^(?:ExperienceRuntime|nexus-three|nexus-gltf-loader)-/.test(candidate.file))) {
    if (asset.bytes > BUNDLE_BUDGETS.nexusAsyncChunk) {
      errors.push(`Nexus async chunk ${asset.file} is ${formatBytes(asset.bytes)}; limit is ${formatBytes(BUNDLE_BUDGETS.nexusAsyncChunk)}.`);
    }
  }
  if (report.embedsCssInline) errors.push("A source module imports a full stylesheet through ?inline.");
  if (report.embedsRasterDataUri) errors.push("A raster key-art candidate is embedded as a data URI in JavaScript.");
  if (report.embedsGlbData) errors.push("A GLB or glTF binary candidate is embedded as a data URI in JavaScript.");
  if (report.initialContainsGltfLoader) errors.push("The mode=off initial entry references GLTFLoader.");
  if (report.initialContainsCrownAsset) errors.push("The mode=off initial entry references a Crown manifest or GLB asset.");

  for (const routeName of ["Account", "Admin", "Checkout"]) {
    if (!report.allJsFiles.some((file) => file.startsWith(`${routeName}-`))) {
      errors.push(`Expected lazy route chunk ${routeName}-*.js was not emitted.`);
    }
  }

  return { errors, initialJs, initialCss };
}

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const siteDir = path.resolve(scriptDir, "..");
  const distDir = path.join(siteDir, "dist");
  const distStats = await stat(distDir).catch(() => null);
  if (!distStats?.isDirectory()) throw new Error("apps/site/dist is missing. Run the site build first.");

  const report = await inspectBundle({ distDir, sourceDir: path.join(siteDir, "src") });
  const result = validateBundle(report);

  console.log("BlackCrown site bundle budget");
  console.log(`- initial JS: ${formatBytes(result.initialJs)} (${report.js.map((asset) => asset.asset).join(", ")})`);
  console.log(`- initial CSS: ${formatBytes(result.initialCss)} (${report.css.map((asset) => asset.asset).join(", ")})`);
  console.log(`- lazy route chunks: ${report.allJsFiles.filter((file) => /^(?:Account|Admin|Checkout)-/.test(file)).join(", ")}`);
  console.log(`- Nexus async chunks: ${report.allJsMetrics.filter((asset) => /^(?:ExperienceRuntime|nexus-three|nexus-gltf-loader)-/.test(asset.file)).map((asset) => `${asset.file} ${formatBytes(asset.bytes)}`).join(", ") || "not emitted in this mode"}`);

  if (result.errors.length) {
    for (const error of result.errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
  } else {
    console.log("PASS: all bundle budgets are satisfied.");
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

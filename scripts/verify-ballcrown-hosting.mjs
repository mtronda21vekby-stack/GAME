import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { validateTransportManifest } from "./lib/ballcrown-transport.mjs";

const origin = new URL(process.argv[2] || "http://127.0.0.1:5267");
assert.ok(["http:", "https:"].includes(origin.protocol), "Use a local or hosted HTTP(S) origin");
const root = path.resolve(import.meta.dirname, "..");
const manifestBytes = readFileSync(path.join(root, "functions/games/ballcrown/play/Build/transport-manifest.json"));
const manifest = JSON.parse(manifestBytes);
validateTransportManifest(manifest);
assert.equal(manifest.sourceArchiveSHA256, "bca48fdbeba199708b7801c4deb7bf781402846b2b09892821e162f3416c16d5");
const results = [];
const virtual = new Map(manifest.virtualFiles.map(file => [file.path, file]));
// Declare the same operations client as the existing Quiet Valley and ecosystem
// gates. Keep CDN challenges fatal and verify the requested production origin.
const headers = {
  "Accept": "*/*", "Accept-Encoding": "identity", "Cache-Control": "no-cache",
  "Pragma": "no-cache", "User-Agent": "BLACK-CROWN-OPS/production-smoke-v44",
};

const launcherPath = "/games/ballcrown/";
const launcherSource = readFileSync(path.join(root, "apps/site/public/games/ballcrown/index.html"));
const launcher = await fetch(new URL(launcherPath, origin), { headers, signal: AbortSignal.timeout(20_000) });
assert.equal(launcher.status, 200, `Ballcrown launcher HTTP; mitigation=${launcher.headers.get("cf-mitigated") || "none"}`);
assert.ok(launcher.headers.get("content-type")?.startsWith("text/html"), "Launcher HTML MIME");
assert.deepEqual(Buffer.from(await launcher.arrayBuffer()), launcherSource, "Hosted launcher matches the release source");
const releaseSource = readFileSync(path.join(root, "apps/site/public/games/ballcrown/release.json"));
const expectedRelease = JSON.parse(releaseSource);
assert.equal(expectedRelease.schemaVersion, 1);
assert.equal(expectedRelease.available, true);
assert.equal(expectedRelease.entry, "./play/");
assert.equal(expectedRelease.revision, manifest.revision);
assert.equal(expectedRelease.archiveSHA256, manifest.sourceArchiveSHA256);
assert.equal(expectedRelease.wasmSHA256, manifest.virtualFiles.find(file => file.path.endsWith(".wasm")).sha256);
const release = await fetch(new URL(launcherPath + "release.json", origin), { headers, signal: AbortSignal.timeout(20_000) });
assert.equal(release.status, 200, "Release metadata is served outside the site SPA");
assert.ok(release.headers.get("content-type")?.startsWith("application/json"), "Release JSON MIME");
assert.deepEqual(Buffer.from(await release.arrayBuffer()), releaseSource, "Hosted release metadata matches the approved release");
for (const urlPath of ["/games/ballcrown", "/games/ballcrown/play"]) {
  const response = await fetch(new URL(urlPath, origin), { redirect: "manual", headers, signal: AbortSignal.timeout(20_000) });
  assert.ok([301, 308].includes(response.status), `${urlPath}: canonical directory redirect`);
  assert.equal(new URL(response.headers.get("location"), origin).pathname, `${urlPath}/`);
}

for (const file of manifest.runtimeFiles) {
  const url = new URL(manifest.publicBase + file.path, origin);
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(120_000) });
  assert.equal(response.status, 200, `${file.path}: HTTP status`);
  const hash = createHash("sha256");
  let bytes = 0;
  for await (const part of response.body) { hash.update(part); bytes += part.byteLength; }
  assert.equal(bytes, file.bytes, `${file.path}: complete source byte length`);
  assert.equal(hash.digest("hex"), file.sha256, `${file.path}: immutable source SHA256`);
  if (virtual.has(file.path)) {
    const source = virtual.get(file.path);
    assert.equal(response.headers.get("content-type"), source.contentType, `${file.path}: MIME`);
    assert.equal(response.headers.get("content-length"), String(source.bytes), `${file.path}: HTTP Content-Length`);
    assert.equal(response.headers.get("x-ballcrown-source-sha256"), source.sha256, `${file.path}: source hash header`);
    assert.equal(response.headers.get("cache-control"), "no-cache, no-transform", `${file.path}: stable URL cache policy`);
    const head = await fetch(url, { method: "HEAD", headers, signal: AbortSignal.timeout(20_000) });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get("content-length"), String(source.bytes));
    const conditional = await fetch(url, {
      headers: { ...headers, "If-None-Match": `"sha256-${source.sha256}"` }, signal: AbortSignal.timeout(20_000),
    });
    assert.equal(conditional.status, 304, `${file.path}: ETag revalidation`);
  }
  results.push({ path: file.path, bytes, sha256: file.sha256, status: response.status });
}
const hostedManifest = await fetch(new URL(manifest.publicBase + "Build/transport.json", origin), {
  headers, signal: AbortSignal.timeout(20_000),
});
assert.equal(hostedManifest.status, 200);
assert.deepEqual(Buffer.from(await hostedManifest.arrayBuffer()), manifestBytes, "Hosted manifest and Functions bundle agree");
console.log(JSON.stringify({
  ok: true, origin: origin.origin, version: manifest.version, revision: manifest.revision,
  sourceArchiveSHA256: manifest.sourceArchiveSHA256,
  transportManifestSHA256: createHash("sha256").update(manifestBytes).digest("hex"),
  filesPassed: results.length, totalBytes: results.reduce((sum, file) => sum + file.bytes, 0),
  launcherSHA256: createHash("sha256").update(launcherSource).digest("hex"),
  nativeHTMLSHA256: manifest.runtimeFiles.find(file => file.path === "index.html").sha256,
  releaseMetadataSHA256: createHash("sha256").update(releaseSource).digest("hex"),
  virtualFiles: results.filter(file => virtual.has(file.path)),
}, null, 2));

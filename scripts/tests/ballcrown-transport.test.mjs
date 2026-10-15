import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createReadStream, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import test from "node:test";
import { createBallcrownTransport, validateTransportManifest } from "../lib/ballcrown-transport.mjs";

const BASE = "/games/ballcrown/play/";
const sha = buffer => createHash("sha256").update(buffer).digest("hex");
const chunks = [Buffer.from("\x00Unity source"), Buffer.from("\xff\x00same exact bytes")];
function fixture() {
  return {
    schemaVersion: 1, publicBase: BASE, version: "0.22.0", revision: "v19-test",
    virtualFiles: ["BuildWeb.data", "BuildWeb.wasm"].map(name => {
      const bytes = Buffer.concat(chunks);
      const hash = sha(bytes);
      let offset = 0;
      return {
        path: `Build/${name}`, bytes: bytes.length, sha256: hash,
        contentType: name.endsWith("wasm") ? "application/wasm" : "application/octet-stream",
        chunks: chunks.map((chunk, index) => {
          const entry = { path: `Build/chunks/${name}.${hash}.${String(index).padStart(3, "0")}.bin`,
            bytes: chunk.length, offset, sha256: sha(chunk) };
          offset += chunk.length;
          return entry;
        }),
      };
    }),
  };
}
function request(file = "BuildWeb.data", options) {
  return new Request(`https://blackcrown.test${BASE}Build/${file}`, options);
}
function fakeAssets(manifest = fixture(), mutate) {
  const paths = new Map(manifest.virtualFiles.flatMap(file => file.chunks.map((chunk, index) =>
    [BASE + chunk.path, { chunk, body: chunks[index] }])));
  const calls = [];
  return { calls, async fetch(req) {
    calls.push(req);
    const item = paths.get(new URL(req.url).pathname);
    assert.ok(item, "Only exact allowlisted same-origin chunk paths are fetched");
    const response = new Response(item.body, {
      headers: { "content-type": "application/octet-stream", "content-length": String(item.chunk.bytes) },
    });
    return mutate?.(response, calls.length) ?? response;
  } };
}

for (const file of ["BuildWeb.data", "BuildWeb.wasm"]) {
  test(`${file}: complete source bytes, MIME, length, validators and source hash`, async () => {
    const manifest = fixture();
    const assets = fakeAssets(manifest);
    const response = await createBallcrownTransport(manifest)(request(file), assets);
    const source = manifest.virtualFiles.find(entry => entry.path.endsWith(file));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), source.contentType);
    assert.equal(response.headers.get("content-length"), String(source.bytes));
    assert.equal(response.headers.get("x-ballcrown-source-sha256"), source.sha256);
    assert.equal(response.headers.get("cache-control"), "no-cache, no-transform");
    assert.equal(response.headers.get("cross-origin-resource-policy"), "same-origin");
    assert.equal(assets.calls.length, 1, "No second asset fetched before reading the response");
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.concat(chunks));
    assert.equal(assets.calls.length, 2);
  });
}

test("Range is safely ignored and returns the full 200 source without forwarded request headers", async () => {
  const assets = fakeAssets();
  const response = await createBallcrownTransport(fixture())(request("BuildWeb.data", {
    headers: { Range: "bytes=0-7", Cookie: "private=1", Authorization: "Bearer private", "If-Range": "old" },
  }), assets);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("accept-ranges"), "none");
  assert.equal(response.headers.get("content-range"), null);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.concat(chunks));
  for (const req of assets.calls) {
    assert.equal(req.headers.get("accept-encoding"), "identity");
    for (const name of ["range", "cookie", "authorization", "if-range"]) assert.equal(req.headers.get(name), null);
    assert.equal(new URL(req.url).origin, "https://blackcrown.test");
  }
});

test("HEAD includes source length and performs no body fetch", async () => {
  const assets = fakeAssets();
  const response = await createBallcrownTransport(fixture())(request("BuildWeb.wasm", { method: "HEAD" }), assets);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-length"), String(Buffer.concat(chunks).length));
  assert.equal(response.body, null);
  assert.equal(assets.calls.length, 0);
});

test("Matching ETag and weak validator return 304 without fetching assets", async () => {
  const manifest = fixture();
  const handler = createBallcrownTransport(manifest);
  for (const tag of ["*", `W/\"sha256-${manifest.virtualFiles[0].sha256}\"`,
    `\"other\", \"sha256-${manifest.virtualFiles[0].sha256}\"`]) {
    const assets = fakeAssets();
    const response = await handler(request("BuildWeb.data", { headers: { "If-None-Match": tag } }), assets);
    assert.equal(response.status, 304);
    assert.equal(response.body, null);
    assert.equal(response.headers.get("content-length"), null);
    assert.equal(assets.calls.length, 0);
  }
});

test("Query strings do not alter manifest selection or propagate to chunk URLs", async () => {
  const assets = fakeAssets();
  const response = await createBallcrownTransport(fixture())(
    new Request(`${request().url}?v=19&path=../../secret`), assets);
  await response.arrayBuffer();
  assert.ok(assets.calls.every(req => new URL(req.url).search === ""));
});

test("Unlisted and encoded paths cannot fetch arbitrary assets", async () => {
  const assets = fakeAssets();
  const handler = createBallcrownTransport(fixture());
  for (const url of [`${BASE}Build/secret`, `${BASE}Build/%42uildWeb.data`, "/api/admin/session", "/BuildWeb.data"]) {
    assert.equal((await handler(new Request(`https://blackcrown.test${url}`), assets)).status, 404);
  }
  assert.equal(assets.calls.length, 0);
});

test("Unsupported method rejects without fetching any chunk", async () => {
  const assets = fakeAssets();
  const response = await createBallcrownTransport(fixture())(request("BuildWeb.data", { method: "POST" }), assets);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
  assert.equal(assets.calls.length, 0);
});

test("Missing assets binding gives a controlled 503", async () => {
  assert.equal((await createBallcrownTransport(fixture())(request(), undefined)).status, 503);
});

for (const [name, mutate] of [
  ["missing chunk", () => new Response("Not Found", { status: 404 })],
  ["SPA HTML fallback", () => new Response("<html>site</html>", { headers: { "content-type": "text/html" } })],
  ["incorrect source size", response => { response.headers.set("content-length", "1"); return response; }],
  ["unexpected compression", response => { response.headers.set("content-encoding", "gzip"); return response; }],
]) {
  test(`First ${name} gives a controlled 502 before source headers`, async () => {
    const response = await createBallcrownTransport(fixture())(request(), fakeAssets(fixture(), mutate));
    assert.equal(response.status, 502);
    assert.equal(response.headers.get("cache-control"), "no-store");
  });
}

test("A missing later chunk aborts the stream rather than returning partial bytes", async () => {
  const response = await createBallcrownTransport(fixture())(request(), fakeAssets(fixture(), (response, count) =>
    count === 2 ? new Response("missing", { status: 404 }) : response));
  assert.equal(response.status, 200);
  await assert.rejects(response.arrayBuffer(), /unavailable or inconsistent/);
});

test("Truncated source is detected by the fixed length stream", async () => {
  const response = await createBallcrownTransport(fixture())(request(), fakeAssets(fixture(), (response, count) =>
    count === 2 ? new Response(chunks[1].subarray(1), { headers: { "content-type": "application/octet-stream" } }) : response));
  await assert.rejects(response.arrayBuffer(), /truncated/);
});

test("Canceling an in-flight asset cancels its source and never fetches the next chunk", { timeout: 5_000 }, async () => {
  // A complete tiny chunk can finish piping before the caller cancels on some
  // Node versions. Keep the first source incomplete until cancellation instead
  // of making an assertion about a particular runtime's microtask scheduling.
  let releasePull;
  let confirmCanceled;
  let cancellationReason;
  const pendingPull = new Promise(resolve => { releasePull = resolve; });
  const sourceCanceled = new Promise(resolve => { confirmCanceled = resolve; });
  const assets = fakeAssets(fixture(), (response, count) => count === 1 ? new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(chunks[0].subarray(0, 1));
    },
    pull() {
      return pendingPull;
    },
    cancel(reason) {
      cancellationReason = reason;
      releasePull();
      confirmCanceled();
    },
  }), { headers: response.headers }) : response);
  const response = await createBallcrownTransport(fixture())(request(), assets);
  const reader = response.body.getReader();
  const first = await reader.read();
  assert.equal(first.done, false);
  assert.deepEqual(Buffer.from(first.value), chunks[0].subarray(0, 1));
  await reader.cancel("client disconnected");
  await sourceCanceled;
  reader.releaseLock();
  assert.equal(cancellationReason, "client disconnected");
  assert.equal(assets.calls.length, 1);
});

test("Invalid manifest paths, lengths, hashes and offsets are rejected at initialization", () => {
  for (const change of [
    manifest => { manifest.publicBase = "/api/"; },
    manifest => { manifest.virtualFiles[0].path = "../../secret"; },
    manifest => { manifest.virtualFiles[0].chunks[0].path = "Build/chunks/../../secret"; },
    manifest => { manifest.virtualFiles[0].chunks[0].bytes = 17 * 1024 * 1024; },
    manifest => { manifest.virtualFiles[0].chunks[0].sha256 = "bad"; },
    manifest => { manifest.virtualFiles[0].chunks[1].offset = 0; },
    manifest => { manifest.virtualFiles[0].bytes += 1; },
  ]) {
    const manifest = fixture();
    change(manifest);
    assert.throws(() => validateTransportManifest(manifest), /Ballcrown/);
  }
});

test("Verified v22 pistol fix14: both complete HTTP streams match the immutable receipt SHA", async () => {
  const root = path.resolve(import.meta.dirname, "../..");
  const runtimeRoot = path.join(root, "apps/site/public/games/ballcrown/play");
  const manifestBytes = readFileSync(path.join(runtimeRoot, "Build/transport.json"));
  assert.deepEqual(manifestBytes, readFileSync(path.join(root, "functions/games/ballcrown/play/Build/transport-manifest.json")));
  const manifest = JSON.parse(manifestBytes);
  assert.equal(manifest.sourceArchiveSHA256, "af4f8e0d8a7e0c76b500363698d84f3a9c11621afb12b6ffea00800e56fc50dc");
  assert.equal(manifest.revision, "v22-pistol-fix-14-includes-user-music13-killfeed12-user11");
  const handler = createBallcrownTransport(manifest);
  const assets = { async fetch(req) {
    const pathname = new URL(req.url).pathname;
    assert.ok(pathname.startsWith(`${BASE}Build/chunks/`));
    const sourcePath = path.join(runtimeRoot, pathname.slice(BASE.length));
    return new Response(Readable.toWeb(createReadStream(sourcePath)), {
      headers: { "content-type": "application/octet-stream", "content-length": String(statSync(sourcePath).size) },
    });
  } };
  for (const file of manifest.virtualFiles) {
    const response = await handler(new Request(`https://blackcrown.test${BASE}${file.path}`), assets);
    const digest = createHash("sha256");
    let bytes = 0;
    for await (const part of response.body) { bytes += part.byteLength; digest.update(part); }
    assert.equal(bytes, file.bytes);
    assert.equal(digest.digest("hex"), file.sha256);
    assert.equal(response.headers.get("content-length"), String(bytes));
  }
});

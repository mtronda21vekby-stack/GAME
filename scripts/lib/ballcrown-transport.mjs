const PUBLIC_BASE = "/games/ballcrown/play/";
const MAX_CHUNK_BYTES = 16 * 1024 * 1024;
const FILE_TYPES = new Map([
  ["Build/BuildWeb.data", "application/octet-stream"],
  ["Build/BuildWeb.wasm", "application/wasm"],
]);

/** Validate the bundled deployment manifest before accepting any request. */
export function validateTransportManifest(manifest) {
  if (manifest?.schemaVersion !== 1 || manifest.publicBase !== PUBLIC_BASE ||
      !Array.isArray(manifest.virtualFiles) || manifest.virtualFiles.length !== 2 ||
      !/^[a-zA-Z0-9._-]+$/.test(manifest.version) || !/^[a-zA-Z0-9._-]+$/.test(manifest.revision)) {
    throw new Error("Invalid Ballcrown transport manifest");
  }
  const files = new Map();
  for (const file of manifest.virtualFiles) {
    if (!FILE_TYPES.has(file.path) || files.has(PUBLIC_BASE + file.path) ||
        file.contentType !== FILE_TYPES.get(file.path) ||
        !Number.isSafeInteger(file.bytes) || file.bytes <= 0 ||
        !/^[a-f0-9]{64}$/.test(file.sha256) ||
        !Array.isArray(file.chunks) || file.chunks.length < 1 || file.chunks.length > 8) {
      throw new Error("Invalid Ballcrown virtual file");
    }
    const name = file.path.slice("Build/".length);
    let bytes = 0;
    for (const [index, chunk] of file.chunks.entries()) {
      const expectedPath = `Build/chunks/${name}.${file.sha256}.${String(index).padStart(3, "0")}.bin`;
      if (chunk.path !== expectedPath || !Number.isSafeInteger(chunk.bytes) ||
          chunk.bytes <= 0 || chunk.bytes > MAX_CHUNK_BYTES ||
          (chunk.offset !== undefined && chunk.offset !== bytes) ||
          !/^[a-f0-9]{64}$/.test(chunk.sha256)) {
        throw new Error("Invalid Ballcrown chunk");
      }
      bytes += chunk.bytes;
    }
    if (bytes !== file.bytes) throw new Error("Ballcrown chunk lengths do not match the source");
    files.set(PUBLIC_BASE + file.path, file);
  }
  return files;
}

function responseHeaders(file, manifest) {
  return new Headers({
    "Content-Type": file.contentType,
    "Content-Length": String(file.bytes),
    "Cache-Control": "no-cache, no-transform",
    "ETag": `"sha256-${file.sha256}"`,
    "Accept-Ranges": "none",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Ballcrown-Source-Sha256": file.sha256,
    "X-Ballcrown-Release": `${manifest.version}/${manifest.revision}`,
  });
}

function failure(status, message, extraHeaders = {}) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function fixedLengthStream(bytes) {
  // Workers needs FixedLengthStream, rather than a manually set header, to emit
  // Content-Length for a streamed response. Native pipeTo preserves backpressure.
  if (typeof globalThis.FixedLengthStream === "function") {
    return new globalThis.FixedLengthStream(bytes);
  }
  // Node-only equivalent for tests. Never allocates a whole runtime file.
  let written = 0;
  return new TransformStream({
    transform(value, controller) {
      written += value.byteLength;
      if (written > bytes) throw new Error("Ballcrown source exceeded its declared length");
      controller.enqueue(value);
    },
    flush() {
      if (written !== bytes) throw new Error("Ballcrown source was truncated");
    },
  });
}

async function fetchChunk(assets, request, chunk) {
  // Build a fresh request: client Range, validators, cookies and Authorization
  // must never reach the static chunk fetch. Unity receives the complete source.
  const url = new URL(PUBLIC_BASE + chunk.path, request.url);
  const response = await assets.fetch(new Request(url, {
    method: "GET",
    headers: { "Accept": "application/octet-stream", "Accept-Encoding": "identity" },
    signal: request.signal,
  }));
  const type = response.headers.get("content-type")?.split(";")[0].trim();
  const length = response.headers.get("content-length");
  const encoding = response.headers.get("content-encoding");
  if (response.status !== 200 || !response.body || type !== "application/octet-stream" ||
      (length !== null && length !== String(chunk.bytes)) ||
      (encoding !== null && encoding !== "identity")) {
    await response.body?.cancel();
    throw new Error("Ballcrown static chunk is unavailable or inconsistent");
  }
  return response;
}

/** Create an allowlisted handler for the two original Unity payload URLs. */
export function createBallcrownTransport(manifest) {
  const files = validateTransportManifest(manifest);
  return async function serveBallcrownTransport(request, assets) {
    const file = files.get(new URL(request.url).pathname);
    if (!file) return failure(404, "Not Found");
    if (request.method !== "GET" && request.method !== "HEAD") {
      return failure(405, "Method Not Allowed", { "Allow": "GET, HEAD" });
    }
    const headers = responseHeaders(file, manifest);
    const validators = request.headers.get("if-none-match")?.split(",").map(value => value.trim());
    if (validators?.some(value => value === "*" || value.replace(/^W\//, "") === headers.get("etag"))) {
      headers.delete("content-length");
      return new Response(null, { status: 304, headers });
    }
    if (request.method === "HEAD") return new Response(null, { headers });
    if (!assets || typeof assets.fetch !== "function") {
      return failure(503, "Game assets are unavailable");
    }

    let first;
    try {
      first = await fetchChunk(assets, request, file.chunks[0]);
    } catch {
      return failure(502, "Game payload is unavailable; please retry");
    }
    const output = fixedLengthStream(file.bytes);
    // Only one chunk is fetched/read at a time. No arrayBuffer(), text(), body
    // accumulation, runtime hash computation, or unbounded enqueue loop at edge.
    const pumping = (async () => {
      for (let index = 0; index < file.chunks.length; index++) {
        const response = index === 0 ? first : await fetchChunk(assets, request, file.chunks[index]);
        await response.body.pipeTo(output.writable, { preventClose: true });
      }
      const writer = output.writable.getWriter();
      try {
        await writer.close();
      } finally {
        writer.releaseLock();
      }
    })();
    // An error after headers aborts the stream, so Unity cannot accept a partial
    // 200 payload. Client cancellation also cancels pipeTo and prevents more fetches.
    void pumping.catch(error => output.writable.abort(error).catch(() => {}));
    return new Response(output.readable, { headers });
  };
}

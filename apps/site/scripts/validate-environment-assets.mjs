import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const siteRoot = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(siteRoot, "public/experience/environments/blender-v1/site-elements.manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

function fail(message) {
  throw new Error(`BlackCrown environment asset validation failed: ${message}`);
}

if (manifest.schemaVersion !== 1) fail("schemaVersion");
if (manifest.enabled !== false || manifest.reviewOnly !== true) fail("review-only policy");
if (manifest.override !== "bcenv=blender") fail("override policy");

for (const [assetId, descriptor] of Object.entries(manifest.assets ?? {})) {
  if (!descriptor.url?.startsWith("/experience/environments/blender-v1/") || descriptor.url.includes("://")) fail(`${assetId}: URL`);
  const filePath = path.join(siteRoot, "public", descriptor.url);
  const buffer = await readFile(filePath);
  if (buffer.toString("ascii", 0, 4) !== "glTF") fail(`${assetId}: magic`);
  if (buffer.readUInt32LE(4) !== 2) fail(`${assetId}: glTF version`);
  if (buffer.readUInt32LE(8) !== buffer.length) fail(`${assetId}: declared length`);
  if (buffer.length > descriptor.maxBytes) fail(`${assetId}: bytes ${buffer.length}`);
  const hash = createHash("sha256").update(buffer).digest("hex");
  if (hash !== descriptor.sha256) fail(`${assetId}: sha256`);

  const jsonLength = buffer.readUInt32LE(12);
  if (buffer.toString("ascii", 16, 20) !== "JSON") fail(`${assetId}: JSON chunk`);
  const gltf = JSON.parse(buffer.toString("utf8", 20, 20 + jsonLength).replace(/\0+|\s+$/g, ""));
  const uris = [...(gltf.buffers ?? []), ...(gltf.images ?? [])].map((entry) => entry.uri).filter(Boolean);
  if (uris.some((uri) => /^(?:https?:|\/\/|data:)/i.test(uri))) fail(`${assetId}: external or embedded URI`);
  if ((gltf.cameras?.length ?? 0) || (gltf.animations?.length ?? 0) || (gltf.skins?.length ?? 0)) fail(`${assetId}: forbidden scene payload`);

  let triangles = 0;
  let drawCalls = 0;
  for (const mesh of gltf.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      drawCalls += 1;
      const accessorIndex = primitive.indices ?? primitive.attributes?.POSITION;
      const count = gltf.accessors?.[accessorIndex]?.count ?? 0;
      triangles += Math.floor(count / 3);
    }
  }
  const materials = gltf.materials?.length ?? 0;
  if (triangles > descriptor.maxTriangles || triangles !== descriptor.triangles) fail(`${assetId}: triangles ${triangles}`);
  if (drawCalls !== descriptor.drawCalls || drawCalls > 5) fail(`${assetId}: draw calls ${drawCalls}`);
  if (materials !== descriptor.materials || materials > 5) fail(`${assetId}: materials ${materials}`);
  console.log(`PASS ${assetId}: ${triangles} triangles / ${drawCalls} calls / ${materials} materials / ${buffer.length} bytes`);
}

console.log("PASS: Blender site elements remain local review assets with procedural fallback.");

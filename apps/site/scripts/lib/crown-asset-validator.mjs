import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const MAX_DATA_URI_BYTES = 64 * 1024;
const REQUIRED_NODES = [
  "BC_CROWN_ROOT",
  "BC_SHELL_ROOT",
  "BC_CORE_ROOT",
  "BC_PORTAL_ROOT",
  "BC_RING_INNER",
  "BC_RING_MIDDLE",
  "BC_RING_OUTER",
];
const ALLOWED_MATERIALS = new Set([
  "BC_MAT_SHELL_TITANIUM",
  "BC_MAT_INNER_GUNMETAL",
  "BC_MAT_CARBON",
  "BC_MAT_CORE_GLASS",
  "BC_MAT_CORE_ENERGY",
  "BC_MAT_ENERGY_CYAN",
  "BC_MAT_ENERGY_ORANGE",
  "BC_MAT_PORTAL",
]);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function integerInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function validateCrownManifest(value) {
  const errors = [];
  if (!isRecord(value)) return { errors: ["Manifest must be a JSON object."], manifest: null };
  if (value.schemaVersion !== 1) errors.push("schemaVersion must be 1.");
  if (typeof value.enabled !== "boolean") errors.push("enabled must be boolean.");
  if (typeof value.assetId !== "string" || !value.assetId.trim()) errors.push("assetId is required.");
  if (value.frontAxis !== "+Z" || value.upAxis !== "+Y" || value.units !== "meters") {
    errors.push("Coordinate contract must be +Z front, +Y up and meters.");
  }
  if (!integerInRange(value.segmentCount, 9, 11)) errors.push("segmentCount must be an integer from 9 to 11.");
  if (!integerInRange(value.spires, 1, 32)) errors.push("spires must be an integer from 1 to 32.");
  if (!isRecord(value.lods)) errors.push("lods object is required.");
  for (const tier of ["high", "medium", "low"]) {
    const lod = isRecord(value.lods) ? value.lods[tier] : null;
    if (!isRecord(lod)) {
      errors.push(`lods.${tier} is required.`);
      continue;
    }
    if (typeof lod.url !== "string" || !lod.url.startsWith("/experience/crown/") || !lod.url.endsWith(".glb")) {
      errors.push(`lods.${tier}.url must be a local Crown .glb path.`);
    }
    for (const budget of ["maxTriangles", "maxBytes", "maxMaterials", "maxDrawCalls"]) {
      if (!Number.isInteger(lod[budget]) || lod[budget] <= 0) errors.push(`lods.${tier}.${budget} must be a positive integer.`);
    }
  }
  if (!isRecord(value.features)) errors.push("features object is required.");
  for (const feature of ["ktx2", "meshopt", "draco"]) {
    if (!isRecord(value.features) || typeof value.features[feature] !== "boolean") errors.push(`features.${feature} must be boolean.`);
  }
  return { errors, manifest: errors.length ? null : value };
}

export function parseGlb(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.byteLength < 20) throw new Error("GLB is shorter than the required header and JSON chunk.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== GLB_MAGIC) throw new Error("Invalid GLB magic; expected glTF.");
  if (view.getUint32(4, true) !== 2) throw new Error("Only glTF 2.0 is supported.");
  const declaredLength = view.getUint32(8, true);
  if (declaredLength !== bytes.byteLength) throw new Error(`GLB declared length ${declaredLength} does not match ${bytes.byteLength}.`);

  let offset = 12;
  let json = null;
  const chunks = [];
  while (offset + 8 <= bytes.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const start = offset + 8;
    const end = start + length;
    if (end > bytes.byteLength) throw new Error("GLB chunk extends beyond the declared file length.");
    chunks.push({ type, length });
    if (type === JSON_CHUNK) {
      const text = new TextDecoder().decode(bytes.subarray(start, end)).replace(/\u0000+$/u, "").trimEnd();
      try { json = JSON.parse(text); } catch { throw new Error("GLB JSON chunk is invalid JSON."); }
    }
    offset = end;
  }
  if (offset !== bytes.byteLength) throw new Error("GLB has trailing or incomplete chunk bytes.");
  if (!json) throw new Error("GLB JSON chunk is missing.");
  return { json, chunks, bytes: bytes.byteLength };
}

function approximateDataUriBytes(uri) {
  const comma = uri.indexOf(",");
  if (comma < 0) return Number.POSITIVE_INFINITY;
  const body = uri.slice(comma + 1);
  return uri.slice(0, comma).includes(";base64") ? Math.floor((body.length * 3) / 4) : decodeURIComponent(body).length;
}

function inspectUris(json, errors) {
  for (const [kind, entries] of [["buffer", json.buffers], ["image", json.images]]) {
    for (const entry of entries ?? []) {
      if (!entry.uri) continue;
      if (/^https?:\/\//iu.test(entry.uri) || entry.uri.startsWith("//")) {
        errors.push(`${kind} contains a forbidden remote URI.`);
      } else if (entry.uri.startsWith("data:")) {
        if (approximateDataUriBytes(entry.uri) > MAX_DATA_URI_BYTES) errors.push(`${kind} data URI exceeds ${MAX_DATA_URI_BYTES} bytes.`);
      } else {
        errors.push(`${kind} references an external file; production GLB must be self-contained.`);
      }
    }
  }
}

function triangleCountForPrimitive(primitive, accessors) {
  const indexAccessor = Number.isInteger(primitive.indices) ? accessors[primitive.indices] : null;
  const positionAccessor = Number.isInteger(primitive.attributes?.POSITION) ? accessors[primitive.attributes.POSITION] : null;
  const count = indexAccessor?.count ?? positionAccessor?.count ?? 0;
  const mode = primitive.mode ?? 4;
  if (mode === 4) return Math.floor(count / 3);
  if (mode === 5 || mode === 6) return Math.max(0, count - 2);
  return 0;
}

function inspectBounds(json) {
  const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (const mesh of json.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      const accessor = json.accessors?.[primitive.attributes?.POSITION];
      if (!accessor?.min || !accessor?.max) continue;
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], accessor.min[axis]);
        max[axis] = Math.max(max[axis], accessor.max[axis]);
      }
    }
  }
  if (!min.every(Number.isFinite) || !max.every(Number.isFinite)) return null;
  return { min, max, size: max.map((value, axis) => value - min[axis]) };
}

export function inspectCrownGlb(buffer, manifest, tier) {
  const errors = [];
  const warnings = [];
  let parsed;
  try { parsed = parseGlb(buffer); } catch (error) {
    return { errors: [error instanceof Error ? error.message : "Invalid GLB."], warnings, metrics: null };
  }
  const { json, bytes } = parsed;
  if (json.asset?.version !== "2.0") errors.push("GLB asset.version must be 2.0.");
  inspectUris(json, errors);

  const names = (json.nodes ?? []).map((node) => node.name).filter((name) => typeof name === "string" && name.length > 0);
  const seen = new Set();
  for (const name of names) {
    if (seen.has(name)) errors.push(`Duplicate node name: ${name}.`);
    seen.add(name);
  }
  for (const name of REQUIRED_NODES) if (!seen.has(name)) errors.push(`Required node is missing: ${name}.`);
  const segments = names.filter((name) => /^BC_SEG_\d{2}$/u.test(name));
  const spires = names.filter((name) => /^BC_SPIRE_\d{2}$/u.test(name));
  if (segments.length !== manifest.segmentCount) errors.push(`Expected ${manifest.segmentCount} segments, found ${segments.length}.`);
  if (spires.length !== manifest.spires) errors.push(`Expected ${manifest.spires} spires, found ${spires.length}.`);

  const materialNames = (json.materials ?? []).map((material) => material.name ?? "");
  for (const name of materialNames) if (!ALLOWED_MATERIALS.has(name)) errors.push(`Material name is outside the contract: ${name || "<unnamed>"}.`);
  const triangles = (json.meshes ?? []).reduce((meshTotal, mesh) => meshTotal + (mesh.primitives ?? []).reduce(
    (primitiveTotal, primitive) => primitiveTotal + triangleCountForPrimitive(primitive, json.accessors ?? []), 0,
  ), 0);
  const drawCalls = (json.meshes ?? []).reduce((total, mesh) => total + (mesh.primitives?.length ?? 0), 0);
  const lod = manifest.lods[tier];
  if (bytes > lod.maxBytes) errors.push(`File is ${bytes} bytes; ${tier} maximum is ${lod.maxBytes}.`);
  if (triangles > lod.maxTriangles) errors.push(`GLB has ${triangles} triangles; ${tier} maximum is ${lod.maxTriangles}.`);
  if (materialNames.length > lod.maxMaterials) errors.push(`GLB has ${materialNames.length} materials; ${tier} maximum is ${lod.maxMaterials}.`);
  if (drawCalls > lod.maxDrawCalls) errors.push(`GLB has approximately ${drawCalls} draw calls; ${tier} maximum is ${lod.maxDrawCalls}.`);

  const bounds = inspectBounds(json);
  if (!bounds) warnings.push("No POSITION accessor min/max values were available for bounding-box validation.");
  else {
    const [width, height, depth] = bounds.size;
    if (height < 1.6 || height > 2 || width < 1.8 || width > 2.4 || depth < 0.65 || depth > 1.1) {
      warnings.push(`Bounds ${width.toFixed(2)} x ${height.toFixed(2)} x ${depth.toFixed(2)} m are outside the target envelope.`);
    }
    if (height < 0.5 || height > 5 || width < 0.5 || width > 6 || depth < 0.1 || depth > 4) {
      errors.push("Bounding box indicates an invalid unit scale for the Crown.");
    }
  }

  if ((json.cameras?.length ?? 0) > 0) warnings.push("Production cameras are present.");
  if ((json.animations?.length ?? 0) > 0) warnings.push("Animations are present; scroll choreography uses node transforms.");
  if ((json.skins?.length ?? 0) > 0) warnings.push("Skins are present but are unsupported by this pipeline version.");
  if ((json.extensionsUsed ?? []).includes("KHR_lights_punctual")) warnings.push("Production lights are present.");
  if ((json.meshes ?? []).some((mesh) => (mesh.primitives ?? []).some((primitive) => (primitive.targets?.length ?? 0) > 0))) {
    warnings.push("Morph targets are present but are unsupported by this pipeline version.");
  }

  return {
    errors,
    warnings,
    metrics: { bytes, nodes: names.length, meshes: json.meshes?.length ?? 0, materials: materialNames.length, triangles, drawCalls, bounds },
  };
}

function publicPathForUrl(siteDir, url) {
  const relative = url.replace(/^\/+/, "");
  const resolved = path.resolve(siteDir, "public", relative);
  const publicRoot = path.resolve(siteDir, "public");
  if (!resolved.startsWith(`${publicRoot}${path.sep}`)) throw new Error(`Asset path escapes public/: ${url}`);
  return resolved;
}

export async function validateCrownAssetAtPath({ manifestPath, siteDir }) {
  const messages = [];
  let raw;
  try { raw = JSON.parse(await readFile(manifestPath, "utf8")); } catch (error) {
    return { ok: false, messages: [`Manifest read failed: ${error instanceof Error ? error.message : "unknown error"}`] };
  }
  const schema = validateCrownManifest(raw);
  if (schema.errors.length) return { ok: false, messages: schema.errors };
  const manifest = schema.manifest;
  if (!manifest.enabled) return { ok: true, disabled: true, messages: [`PASS ${manifest.assetId}: manifest disabled; procedural fallback is authoritative.`] };

  let ok = true;
  for (const tier of ["high", "medium", "low"]) {
    const assetPath = publicPathForUrl(siteDir, manifest.lods[tier].url);
    const assetStat = await stat(assetPath).catch(() => null);
    if (!assetStat?.isFile()) {
      ok = false;
      messages.push(`ERROR ${tier}: missing ${assetPath}.`);
      continue;
    }
    const result = inspectCrownGlb(await readFile(assetPath), manifest, tier);
    for (const warning of result.warnings) messages.push(`WARN ${tier}: ${warning}`);
    for (const error of result.errors) messages.push(`ERROR ${tier}: ${error}`);
    if (result.errors.length) ok = false;
    else messages.push(`PASS ${tier}: ${result.metrics.triangles} triangles, ${result.metrics.drawCalls} draws, ${result.metrics.bytes} bytes.`);
  }
  return { ok, disabled: false, messages };
}

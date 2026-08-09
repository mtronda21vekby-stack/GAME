import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;
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
  if (isRecord(value.features) && value.features.skinnedShell !== undefined && typeof value.features.skinnedShell !== "boolean") {
    errors.push("features.skinnedShell must be boolean when provided.");
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
    chunks.push({ type, length, start, end });
    if (type === JSON_CHUNK) {
      const text = new TextDecoder().decode(bytes.subarray(start, end)).replace(/\u0000+$/u, "").trimEnd();
      try { json = JSON.parse(text); } catch { throw new Error("GLB JSON chunk is invalid JSON."); }
    }
    offset = end;
  }
  if (offset !== bytes.byteLength) throw new Error("GLB has trailing or incomplete chunk bytes.");
  if (!json) throw new Error("GLB JSON chunk is missing.");
  return { json, chunks, bytes: bytes.byteLength, data: bytes };
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

function identityMatrix() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function multiplyMatrices(a, b) {
  const result = new Array(16).fill(0);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      for (let index = 0; index < 4; index += 1) result[column * 4 + row] += a[index * 4 + row] * b[column * 4 + index];
    }
  }
  return result;
}

function nodeMatrix(node) {
  if (Array.isArray(node.matrix) && node.matrix.length === 16) return node.matrix;
  const [x, y, z, w] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const xx = x * x; const yy = y * y; const zz = z * z;
  const xy = x * y; const xz = x * z; const yz = y * z;
  const wx = w * x; const wy = w * y; const wz = w * z;
  return [
    (1 - 2 * (yy + zz)) * sx, (2 * (xy + wz)) * sx, (2 * (xz - wy)) * sx, 0,
    (2 * (xy - wz)) * sy, (1 - 2 * (xx + zz)) * sy, (2 * (yz + wx)) * sy, 0,
    (2 * (xz + wy)) * sz, (2 * (yz - wx)) * sz, (1 - 2 * (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}

function transformPoint(matrix, point) {
  const [x, y, z] = point;
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
  ];
}

function worldNodeMatrices(json) {
  const matrices = new Map();
  const nodes = json.nodes ?? [];
  const visit = (index, parent) => {
    const node = nodes[index];
    if (!node || matrices.has(index)) return;
    const world = multiplyMatrices(parent, nodeMatrix(node));
    matrices.set(index, world);
    for (const child of node.children ?? []) visit(child, world);
  };
  const scene = (json.scenes ?? [])[json.scene ?? 0];
  for (const index of scene?.nodes ?? nodes.map((_, index) => index)) visit(index, identityMatrix());
  return matrices;
}

function inspectBounds(json) {
  const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  const worldMatrices = worldNodeMatrices(json);
  for (const [nodeIndex, node] of (json.nodes ?? []).entries()) {
    if (!Number.isInteger(node.mesh)) continue;
    const mesh = json.meshes?.[node.mesh];
    if (!mesh) continue;
    const matrix = worldMatrices.get(nodeIndex) ?? identityMatrix();
    for (const primitive of mesh.primitives ?? []) {
      const accessor = json.accessors?.[primitive.attributes?.POSITION];
      if (!accessor?.min || !accessor?.max) continue;
      for (const x of [accessor.min[0], accessor.max[0]]) {
        for (const y of [accessor.min[1], accessor.max[1]]) {
          for (const z of [accessor.min[2], accessor.max[2]]) {
            const point = transformPoint(matrix, [x, y, z]);
            for (let axis = 0; axis < 3; axis += 1) {
              min[axis] = Math.min(min[axis], point[axis]);
              max[axis] = Math.max(max[axis], point[axis]);
            }
          }
        }
      }
    }
  }
  if (!min.every(Number.isFinite) || !max.every(Number.isFinite)) return null;
  return { min, max, size: max.map((value, axis) => value - min[axis]) };
}

function inspectEmbeddedImages(parsed) {
  const bin = parsed.chunks.find((chunk) => chunk.type === BIN_CHUNK);
  if (!bin) return [];
  const dimensions = [];
  for (const image of parsed.json.images ?? []) {
    const bufferView = parsed.json.bufferViews?.[image.bufferView];
    if (!bufferView) continue;
    const start = bin.start + (bufferView.byteOffset ?? 0);
    const bytes = parsed.data.subarray(start, start + bufferView.byteLength);
    let width = null; let height = null;
    if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      width = view.getUint32(16, false);
      height = view.getUint32(20, false);
    }
    dimensions.push({ name: image.name ?? "<unnamed>", mimeType: image.mimeType ?? "unknown", width, height, bytes: bytes.length });
  }
  return dimensions;
}

function isIdentityRoot(node) {
  const matrix = nodeMatrix(node);
  const identity = identityMatrix();
  return matrix.every((value, index) => Math.abs(value - identity[index]) < 1e-6);
}

function semanticNodeNames(names) {
  return names.filter((name) => /^(BC_(CROWN_ROOT|SHELL_ROOT|CORE_ROOT|PORTAL_ROOT|RING_(INNER|MIDDLE|OUTER)|SEG_\d{2}|SPIRE_\d{2}|ENERGY_(CYAN|ORANGE)|CORE_(CONTAINMENT|VOLUME|NUCLEUS|CAGE)|PORTAL_(APERTURE|TUNNEL|SHUTTERS)|BASE_FIELD))$/u.test(name)).sort();
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
  const rootNode = (json.nodes ?? []).find((node) => node.name === "BC_CROWN_ROOT");
  if (rootNode && !isIdentityRoot(rootNode)) errors.push("BC_CROWN_ROOT must have an identity transform.");
  for (const node of json.nodes ?? []) {
    const values = [...(node.translation ?? []), ...(node.rotation ?? []), ...(node.scale ?? []), ...(node.matrix ?? [])];
    if (!values.every(Number.isFinite)) errors.push(`Node ${node.name ?? "<unnamed>"} has a non-finite transform.`);
    if ((node.scale ?? []).some((value) => value <= 0)) errors.push(`Node ${node.name ?? "<unnamed>"} has a zero or negative scale.`);
  }
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

  if ((json.cameras?.length ?? 0) > 0) errors.push("Production cameras are forbidden.");
  if ((json.animations?.length ?? 0) > 0) errors.push("Baked animations are forbidden; scroll choreography uses node transforms.");
  if ((json.skins?.length ?? 0) > 0 && manifest.features.skinnedShell !== true) warnings.push("Skins are present without features.skinnedShell opt-in.");
  if ((json.skins?.length ?? 0) > 1) errors.push("Only one draw-call-aware shell skin is allowed.");
  if ((json.extensionsUsed ?? []).includes("KHR_lights_punctual")) errors.push("Production lights are forbidden.");
  if ((json.meshes ?? []).some((mesh) => (mesh.primitives ?? []).some((primitive) => (primitive.targets?.length ?? 0) > 0))) {
    errors.push("Morph targets are forbidden for Candidate A.");
  }

  const textures = inspectEmbeddedImages(parsed);
  const textureLimit = tier === "low" ? 1024 : 2048;
  for (const texture of textures) {
    if (!texture.width || !texture.height) warnings.push(`Could not inspect dimensions for ${texture.name}.`);
    else if (texture.width > textureLimit || texture.height > textureLimit) errors.push(`${texture.name} exceeds the ${textureLimit}px ${tier} texture limit.`);
  }
  const estimatedTextureMemory = textures.reduce((total, texture) => total + (texture.width ?? 0) * (texture.height ?? 0) * 4, 0);

  return {
    errors,
    warnings,
    metrics: {
      bytes,
      nodes: names.length,
      nodeNames: names,
      semanticNodes: semanticNodeNames(names),
      meshes: json.meshes?.length ?? 0,
      materials: materialNames.length,
      materialNames,
      triangles,
      drawCalls,
      bounds,
      textures,
      estimatedTextureMemory,
      skins: json.skins?.length ?? 0,
    },
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
  const inspected = [];
  for (const tier of ["high", "medium", "low"]) {
    const assetPath = publicPathForUrl(siteDir, manifest.lods[tier].url);
    const assetStat = await stat(assetPath).catch(() => null);
    if (!assetStat?.isFile()) {
      ok = false;
      messages.push(`ERROR ${tier}: missing ${assetPath}.`);
      continue;
    }
    const file = await readFile(assetPath);
    const result = inspectCrownGlb(file, manifest, tier);
    inspected.push({ tier, result });
    const declared = manifest.lods[tier];
    if (declared.bytes !== undefined && declared.bytes !== file.byteLength) result.errors.push(`Declared bytes ${declared.bytes} do not match ${file.byteLength}.`);
    if (declared.sha256 !== undefined) {
      const digest = createHash("sha256").update(file).digest("hex");
      if (digest !== declared.sha256) result.errors.push(`SHA-256 mismatch for ${tier}.`);
    }
    for (const warning of result.warnings) messages.push(`WARN ${tier}: ${warning}`);
    for (const error of result.errors) messages.push(`ERROR ${tier}: ${error}`);
    if (result.errors.length) ok = false;
    else messages.push(`PASS ${tier}: ${result.metrics.triangles} triangles, ${result.metrics.drawCalls} draws, ${result.metrics.bytes} bytes.`);
  }
  const reference = inspected[0]?.result.metrics?.semanticNodes;
  if (reference) {
    for (const entry of inspected.slice(1)) {
      if (!entry.result.metrics || JSON.stringify(entry.result.metrics.semanticNodes) !== JSON.stringify(reference)) {
        ok = false;
        messages.push(`ERROR ${entry.tier}: semantic node set differs from high LOD.`);
      }
    }
  }
  return { ok, disabled: false, messages };
}

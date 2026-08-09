import * as THREE from "three";
import type { CrownLODManifest } from "../CrownAssetManifest";

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;

export function inspectGlbContainer(buffer: ArrayBuffer) {
  if (buffer.byteLength < 20) throw new Error("parse_failed:short_glb");
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== GLB_MAGIC || view.getUint32(4, true) !== 2) throw new Error("parse_failed:invalid_glb_header");
  if (view.getUint32(8, true) !== buffer.byteLength) throw new Error("parse_failed:length_mismatch");
  let offset = 12;
  let json: Record<string, unknown> | null = null;
  while (offset + 8 <= buffer.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const start = offset + 8;
    const end = start + length;
    if (end > buffer.byteLength) throw new Error("parse_failed:chunk_bounds");
    if (type === JSON_CHUNK) {
      const text = new TextDecoder().decode(new Uint8Array(buffer, start, length)).replace(/\u0000+$/u, "").trimEnd();
      json = JSON.parse(text) as Record<string, unknown>;
    }
    offset = end;
  }
  if (!json) throw new Error("parse_failed:missing_json");
  const resourceLists = [json.buffers, json.images].filter(Array.isArray) as Array<Array<{ uri?: unknown }>>;
  for (const resources of resourceLists) {
    for (const resource of resources) {
      if (typeof resource.uri !== "string") continue;
      if (/^(?:https?:)?\/\//iu.test(resource.uri)) throw new Error("budget_failed:remote_uri");
      if (!resource.uri.startsWith("data:")) throw new Error("budget_failed:external_uri");
      if (resource.uri.length > 88_000) throw new Error("budget_failed:data_uri");
    }
  }
  return json;
}

export type LoadedSceneMetrics = {
  materials: number;
  textures: number;
  triangles: number;
  drawCalls: number;
  bounds: THREE.Box3;
};

export function inspectLoadedScene(scene: THREE.Group, budget: CrownLODManifest): LoadedSceneMetrics {
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  let triangles = 0;
  let drawCalls = 0;
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const positionCount = mesh.geometry.getAttribute("position")?.count ?? 0;
    triangles += Math.floor((mesh.geometry.index?.count ?? positionCount) / 3);
    const meshMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    drawCalls += Math.max(1, meshMaterials.length);
    for (const material of meshMaterials) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) if ((value as THREE.Texture)?.isTexture) textures.add(value as THREE.Texture);
    }
  });
  if (triangles > budget.maxTriangles || materials.size > budget.maxMaterials || drawCalls > budget.maxDrawCalls) {
    throw new Error(`budget_failed:scene:${triangles}:${materials.size}:${drawCalls}`);
  }
  const bounds = new THREE.Box3().setFromObject(scene);
  const size = bounds.getSize(new THREE.Vector3());
  if (size.y < 0.5 || size.y > 5 || size.x < 0.5 || size.x > 6 || size.z < 0.1 || size.z > 4) {
    throw new Error(`budget_failed:bounds:${size.x.toFixed(2)}:${size.y.toFixed(2)}:${size.z.toFixed(2)}`);
  }
  return { materials: materials.size, textures: textures.size, triangles, drawCalls, bounds };
}

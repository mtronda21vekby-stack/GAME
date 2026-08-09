import type * as THREE from "three";
import type { CrownLoaderCounters } from "./CrownAssetAdapter";

export type CachedCrownAsset = {
  scene: THREE.Group;
  bytes: number;
  fetchTime: number;
  parseTime: number;
};

type CacheEntry = {
  controller: AbortController;
  promise: Promise<CachedCrownAsset>;
  references: number;
  released: boolean;
};

export type CrownAssetLease = {
  value: Promise<CachedCrownAsset>;
  release: () => void;
};

const entries = new Map<string, CacheEntry>();
const counters: CrownLoaderCounters = { fetch: 0, parse: 0, attach: 0, dispose: 0, activeReferences: 0 };

export function getCrownLoaderCounters(): CrownLoaderCounters {
  return { ...counters };
}

export function recordCrownFetch() { counters.fetch += 1; }
export function recordCrownParse() { counters.parse += 1; }
export function recordCrownAttach() { counters.attach += 1; }

function disposeTemplate(scene: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    const meshMaterials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const material of meshMaterials) {
      materials.add(material);
      for (const value of Object.values(material)) if ((value as THREE.Texture)?.isTexture) textures.add(value as THREE.Texture);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}

export function acquireCrownAsset(
  key: string,
  loader: (signal: AbortSignal) => Promise<CachedCrownAsset>,
): CrownAssetLease {
  let entry = entries.get(key);
  if (!entry) {
    const controller = new AbortController();
    entry = { controller, promise: loader(controller.signal), references: 0, released: false };
    entries.set(key, entry);
    void entry.promise.catch(() => {
      if (entries.get(key) === entry && entry?.references === 0) entries.delete(key);
    });
  }
  entry.references += 1;
  counters.activeReferences += 1;
  let released = false;
  return {
    value: entry.promise,
    release: () => {
      if (released) return;
      released = true;
      entry!.references = Math.max(0, entry!.references - 1);
      counters.activeReferences = Math.max(0, counters.activeReferences - 1);
      queueMicrotask(() => {
        if (entry!.references !== 0 || entry!.released || entries.get(key) !== entry) return;
        entry!.released = true;
        entry!.controller.abort();
        entries.delete(key);
        void entry!.promise.then(({ scene }) => disposeTemplate(scene)).catch(() => undefined);
        counters.dispose += 1;
      });
    },
  };
}

export function resetCrownAssetCacheForTests() {
  for (const entry of entries.values()) entry.controller.abort();
  entries.clear();
  counters.fetch = 0;
  counters.parse = 0;
  counters.attach = 0;
  counters.dispose = 0;
  counters.activeReferences = 0;
}

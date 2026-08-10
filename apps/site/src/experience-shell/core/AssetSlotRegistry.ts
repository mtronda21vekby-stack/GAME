import * as THREE from "three";
import { disposeObject3D } from "../../experience/core/Lifecycle";
import type { QualityTier } from "../../experience/types";

export const EXPERIENCE_ASSET_SLOT_IDS = [
  "crown",
  "world-gate",
  "evofish-subject",
  "crown-front-environment",
  "network-environment",
  "collection-item-housings",
  "identity-core",
  "foreground-occluders",
] as const;

export type ExperienceAssetSlotId = (typeof EXPERIENCE_ASSET_SLOT_IDS)[number];
export type AssetSlotStatus = "idle" | "loading" | "ready" | "fallback" | "error";

type AssetSlot = {
  id: ExperienceAssetSlotId;
  status: AssetSlotStatus;
  variants: Partial<Record<QualityTier, string>>;
  fallback: string;
  texture: THREE.Texture | null;
  promise: Promise<THREE.Texture | null> | null;
  error: string;
  model: THREE.Group | null;
  modelPromise: Promise<THREE.Group | null> | null;
};

type AuthoredEnvironmentAssetId = "world-gate" | "crown-front-reactor" | "network-architecture" | "collection-vault" | "identity-frame";

type EnvironmentManifest = {
  schemaVersion: 1;
  enabled: false;
  reviewOnly: true;
  assetId: string;
  assets: Record<AuthoredEnvironmentAssetId, {
    url: string;
    maxBytes: number;
    maxTriangles: number;
    sha256: string;
  }>;
};

const MODEL_SLOT_IDS: Partial<Record<ExperienceAssetSlotId, AuthoredEnvironmentAssetId>> = {
  "world-gate": "world-gate",
  "crown-front-environment": "crown-front-reactor",
  "network-environment": "network-architecture",
  "collection-item-housings": "collection-vault",
  "identity-core": "identity-frame",
};

function assertLocalAssetUrl(url: string) {
  if (!url.startsWith("/") || url.startsWith("//") || /^https?:/i.test(url)) throw new Error("external_asset_url_blocked");
}

export class AssetSlotRegistry {
  private readonly slots = new Map<ExperienceAssetSlotId, AssetSlot>();
  private manifestPromise: Promise<EnvironmentManifest | null> | null = null;
  private disposed = false;

  constructor(private readonly signal: AbortSignal) {
    this.register("crown", {}, "procedural-crown");
    this.register("world-gate", {}, "procedural-gate");
    this.register("evofish-subject", {
      high: "/art/evofish-world.webp",
      medium: "/art/evofish-world.webp",
      low: "/art/evofish-world.webp",
    }, "procedural-evofish-volume");
    this.register("crown-front-environment", {}, "procedural-reactor");
    this.register("network-environment", {}, "procedural-network");
    this.register("collection-item-housings", {}, "procedural-category-vault-housings");
    this.register("identity-core", {}, "procedural-identity-ring");
    this.register("foreground-occluders", {}, "procedural-scene-occlusion");
  }

  private register(id: ExperienceAssetSlotId, variants: Partial<Record<QualityTier, string>>, fallback: string) {
    this.slots.set(id, {
      id,
      variants,
      fallback,
      status: "idle",
      texture: null,
      promise: null,
      error: "",
      model: null,
      modelPromise: null,
    });
  }

  private get authoredReviewEnabled() {
    if (typeof window === "undefined") return false;
    const query = new URLSearchParams(window.location.search);
    const localDebug = import.meta.env.DEV || import.meta.env.VITE_BC_EXPERIENCE_DEBUG === "1";
    return localDebug && import.meta.env.VITE_BC_EXPERIENCE_MODE !== "off" && query.get("bcenv") === "blender";
  }

  async loadTexture(id: ExperienceAssetSlotId, quality: QualityTier) {
    const slot = this.slots.get(id);
    if (!slot || this.disposed) return null;
    if (slot.texture) return slot.texture;
    if (slot.promise) return slot.promise;
    const url = slot.variants[quality] ?? slot.variants.low;
    if (!url) {
      slot.status = "fallback";
      return null;
    }
    assertLocalAssetUrl(url);
    slot.status = "loading";
    slot.promise = this.fetchTexture(url, slot);
    return slot.promise;
  }

  private async fetchTexture(url: string, slot: AssetSlot) {
    try {
      const response = await fetch(url, { signal: this.signal, cache: "force-cache" });
      if (!response.ok) throw new Error(`asset_fetch_${response.status}`);
      const blob = await response.blob();
      if (this.disposed || this.signal.aborted) throw new DOMException("Aborted", "AbortError");
      const objectUrl = URL.createObjectURL(blob);
      try {
        const texture = await new THREE.TextureLoader().loadAsync(objectUrl);
        if (this.disposed || this.signal.aborted) {
          texture.dispose();
          throw new DOMException("Aborted", "AbortError");
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        slot.texture = texture;
        slot.status = "ready";
        return texture;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch (error) {
      slot.status = error instanceof DOMException && error.name === "AbortError" ? "fallback" : "error";
      slot.error = error instanceof Error ? error.message : "asset_load_failed";
      return null;
    } finally {
      slot.promise = null;
    }
  }

  async loadModel(id: ExperienceAssetSlotId, quality: QualityTier) {
    const slot = this.slots.get(id);
    const assetId = MODEL_SLOT_IDS[id];
    if (!slot || !assetId || this.disposed || quality === "low" || !this.authoredReviewEnabled) return null;
    if (slot.model) return slot.model;
    if (slot.modelPromise) return slot.modelPromise;
    slot.status = "loading";
    slot.modelPromise = this.fetchModel(assetId, slot);
    return slot.modelPromise;
  }

  private async loadEnvironmentManifest() {
    if (this.manifestPromise) return this.manifestPromise;
    this.manifestPromise = (async () => {
      const response = await fetch("/experience/environments/blender-v1/site-elements.manifest.json", {
        signal: this.signal,
        cache: "force-cache",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error(`environment_manifest_${response.status}`);
      const manifest = await response.json() as EnvironmentManifest;
      if (manifest.schemaVersion !== 1 || manifest.enabled !== false || manifest.reviewOnly !== true || !manifest.assetId) {
        throw new Error("environment_manifest_invalid");
      }
      return manifest;
    })().catch(() => null);
    return this.manifestPromise;
  }

  private async fetchModel(assetId: AuthoredEnvironmentAssetId, slot: AssetSlot) {
    let parsed: THREE.Group | null = null;
    try {
      const manifest = await this.loadEnvironmentManifest();
      const descriptor = manifest?.assets[assetId];
      if (!descriptor) throw new Error("environment_asset_missing");
      assertLocalAssetUrl(descriptor.url);
      const response = await fetch(descriptor.url, {
        signal: this.signal,
        cache: "force-cache",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error(`environment_asset_${response.status}`);
      const declaredBytes = Number(response.headers.get("content-length") || 0);
      if (declaredBytes > descriptor.maxBytes) throw new Error("environment_asset_budget");
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > descriptor.maxBytes) throw new Error("environment_asset_budget");
      if (this.disposed || this.signal.aborted) throw new DOMException("Aborted", "AbortError");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const gltf = await new GLTFLoader().parseAsync(buffer, "");
      parsed = gltf.scene;
      if (this.disposed || this.signal.aborted) throw new DOMException("Aborted", "AbortError");
      parsed.name = `BlackCrownAuthored:${assetId}`;
      parsed.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = true;
      });
      slot.model = parsed;
      slot.status = "ready";
      return parsed;
    } catch (error) {
      if (parsed) disposeObject3D(parsed);
      slot.status = error instanceof DOMException && error.name === "AbortError" ? "fallback" : "error";
      slot.error = error instanceof Error ? error.message : "environment_asset_load_failed";
      return null;
    } finally {
      slot.modelPromise = null;
    }
  }

  getStatus(id: ExperienceAssetSlotId) {
    const slot = this.slots.get(id);
    return { status: slot?.status ?? "error", fallback: slot?.fallback ?? "missing-slot", error: slot?.error ?? "missing_slot" };
  }

  get textureCount() {
    let count = 0;
    for (const slot of this.slots.values()) if (slot.texture) count += 1;
    return count;
  }

  get modelCount() {
    let count = 0;
    for (const slot of this.slots.values()) if (slot.model) count += 1;
    return count;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const slot of this.slots.values()) {
      slot.texture?.dispose();
      slot.texture = null;
      slot.promise = null;
      slot.model = null;
      slot.modelPromise = null;
    }
    this.manifestPromise = null;
    this.slots.clear();
  }
}

import * as THREE from "three";
import { disposeObject3D } from "../../experience/core/Lifecycle";
import { experienceConfig } from "../../experience/experienceConfig";
import type { QualityTier } from "../../experience/types";

export const EXPERIENCE_ASSET_SLOT_IDS = [
  "crown",
  "blackcrown-hero-plate",
  "blackcrown-final-open-plate",
  "crown-ocean-bridge",
  "world-gate",
  "evofish-subject",
  "evofish-legacy-subject",
  "evofish-backdrop",
  "crown-front-environment",
  "crown-front-backdrop",
  "ocean-vault-bridge",
  "network-environment",
  "network-collection-backdrop",
  "collection-item-housings",
  "collection-aurora-art",
  "collection-founder-art",
  "collection-starter-art",
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
    this.register("blackcrown-hero-plate", {
      high: "/experience/art/cinematic-v2/blackcrown-hero-high.webp",
      medium: "/experience/art/cinematic-v2/blackcrown-hero-medium.webp",
      low: "/experience/art/cinematic-v2/blackcrown-hero-low.webp",
    }, "candidate-b-crown-silhouette");
    this.register("blackcrown-final-open-plate", {
      high: "/experience/art/cinematic-v2/blackcrown-final-open-high.webp",
      medium: "/experience/art/cinematic-v2/blackcrown-final-open-medium.webp",
      low: "/experience/art/cinematic-v2/blackcrown-final-open-low.webp",
    }, "candidate-b-final-core-pass");
    this.register("crown-ocean-bridge", {
      high: "/experience/art/cinematic-v2/crown-ocean-bridge-high.webp",
      medium: "/experience/art/cinematic-v2/crown-ocean-bridge-medium.webp",
      low: "/experience/art/cinematic-v2/crown-ocean-bridge-low.webp",
    }, "procedural-crown-ocean-bridge");
    this.register("world-gate", {}, "procedural-gate");
    this.register("evofish-subject", {
      high: "/experience/art/cinematic-v2/evofish-subject-high.webp",
      medium: "/experience/art/cinematic-v2/evofish-subject-medium.webp",
      low: "/experience/art/cinematic-v2/evofish-subject-low.webp",
    }, "approved-evofish-legacy-subject");
    this.register("evofish-legacy-subject", {
      high: "/art/evofish-world.webp",
      medium: "/art/evofish-world.webp",
      low: "/art/evofish-world.webp",
    }, "procedural-evofish-volume");
    this.register("evofish-backdrop", {
      high: "/experience/art/cinematic-v2/evofish-abyss-high.webp",
      medium: "/experience/art/cinematic-v2/evofish-abyss-medium.webp",
      low: "/experience/art/cinematic-v2/evofish-abyss-low.webp",
    }, "procedural-abyss-depth");
    this.register("crown-front-environment", {}, "procedural-reactor");
    this.register("crown-front-backdrop", {
      high: "/experience/art/cinematic-v2/crown-front-vault-high.webp",
      medium: "/experience/art/cinematic-v2/crown-front-vault-medium.webp",
      low: "/experience/art/cinematic-v2/crown-front-vault-low.webp",
    }, "procedural-military-vault-depth");
    this.register("ocean-vault-bridge", {
      high: "/experience/art/cinematic-v2/ocean-vault-bridge-high.webp",
      medium: "/experience/art/cinematic-v2/ocean-vault-bridge-medium.webp",
      low: "/experience/art/cinematic-v2/ocean-vault-bridge-low.webp",
    }, "procedural-ocean-vault-bridge");
    this.register("network-environment", {}, "procedural-network");
    this.register("network-collection-backdrop", {
      high: "/experience/art/cinematic-v2/network-collection-high.webp",
      medium: "/experience/art/cinematic-v2/network-collection-medium.webp",
      low: "/experience/art/cinematic-v2/network-collection-low.webp",
    }, "procedural-network-depth");
    this.register("collection-item-housings", {}, "procedural-category-vault-housings");
    this.register("collection-aurora-art", {
      high: "/experience/art/cinematic-v2/collection-aurora-high.webp",
      medium: "/experience/art/cinematic-v2/collection-aurora-medium.webp",
      low: "/experience/art/cinematic-v2/collection-aurora-low.webp",
    }, "procedural-aurora-skin");
    this.register("collection-founder-art", {
      high: "/experience/art/cinematic-v2/collection-founder-high.webp",
      medium: "/experience/art/cinematic-v2/collection-founder-medium.webp",
      low: "/experience/art/cinematic-v2/collection-founder-low.webp",
    }, "procedural-founder-badge");
    this.register("collection-starter-art", {
      high: "/experience/art/cinematic-v2/collection-starter-high.webp",
      medium: "/experience/art/cinematic-v2/collection-starter-medium.webp",
      low: "/experience/art/cinematic-v2/collection-starter-low.webp",
    }, "procedural-starter-bundle");
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

  private get authoredEnvironmentEnabled() {
    if (typeof window === "undefined" || experienceConfig.mode === "off") return false;
    if (experienceConfig.environmentAssetMode === "blender") return true;
    const query = new URLSearchParams(window.location.search);
    const localDebug = import.meta.env.DEV || experienceConfig.debug;
    return localDebug && query.get("bcenv") === "blender";
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
    if (!slot || !assetId || this.disposed || quality === "low" || !this.authoredEnvironmentEnabled) return null;
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

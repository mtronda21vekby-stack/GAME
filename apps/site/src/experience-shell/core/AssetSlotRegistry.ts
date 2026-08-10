import * as THREE from "three";
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
};

function assertLocalAssetUrl(url: string) {
  if (!url.startsWith("/") || url.startsWith("//") || /^https?:/i.test(url)) throw new Error("external_asset_url_blocked");
}

export class AssetSlotRegistry {
  private readonly slots = new Map<ExperienceAssetSlotId, AssetSlot>();
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
    this.slots.set(id, { id, variants, fallback, status: "idle", texture: null, promise: null, error: "" });
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

  getStatus(id: ExperienceAssetSlotId) {
    const slot = this.slots.get(id);
    return { status: slot?.status ?? "error", fallback: slot?.fallback ?? "missing-slot", error: slot?.error ?? "missing_slot" };
  }

  get textureCount() {
    let count = 0;
    for (const slot of this.slots.values()) if (slot.texture) count += 1;
    return count;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const slot of this.slots.values()) {
      slot.texture?.dispose();
      slot.texture = null;
      slot.promise = null;
    }
    this.slots.clear();
  }
}

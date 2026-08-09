import type { QualityTier } from "../types";
import { experienceConfig } from "../experienceConfig";
import type { CrownAssetAdapter, CrownAssetLoadOptions, CrownAssetReason, CrownLoadResult, CrownVisual } from "./CrownAssetAdapter";
import { createProceduralDiagnostics } from "./CrownAssetAdapter";
import { createFixtureManifest, fetchCrownAssetManifest, type CrownAssetManifest } from "./CrownAssetManifest";
import { getCrownLoaderCounters } from "./CrownAssetCache";
import { getLodFallbackOrder, readCrownAssetRequest, selectCrownLod, shouldAttemptGlb } from "./CrownBackendSelector";
import { GLBCrownAdapter } from "./glb/GLBCrownAdapter";
import { loadGLBCrown } from "./glb/GLBCrownLoader";
import { ProceduralCrownAdapter } from "./procedural/ProceduralCrownAdapter";

function reasonFromError(error: unknown): CrownAssetReason {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("manifest_fetch_404")) return "asset_missing";
  if (message.includes("manifest_fetch_")) return "fetch_failed";
  if (message.includes("manifest_")) return "budget_failed";
  if (message.includes("binding_failed")) return "binding_failed";
  if (message.includes("budget_failed")) return "budget_failed";
  if (message.includes("asset_missing") || message.includes("404")) return "asset_missing";
  if (message.includes("parse_failed") || message.includes("THREE.GLTFLoader")) return "parse_failed";
  return "fetch_failed";
}

function combineSignals(primary: AbortSignal, secondary: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  primary.addEventListener("abort", abort, { once: true });
  secondary.addEventListener("abort", abort, { once: true });
  if (primary.aborted || secondary.aborted) controller.abort();
  return { signal: controller.signal, dispose: () => {
    primary.removeEventListener("abort", abort);
    secondary.removeEventListener("abort", abort);
  } };
}

export class CrownAssetManager implements CrownAssetAdapter {
  private readonly procedural: ProceduralCrownAdapter;
  private currentVisual: CrownVisual;
  private currentResult: CrownLoadResult;
  private loadController = new AbortController();
  private disposed = false;
  private warned = false;

  constructor(radialSegments: number, initialTier: QualityTier) {
    this.procedural = new ProceduralCrownAdapter(radialSegments);
    this.currentVisual = this.procedural.visual;
    this.currentResult = {
      backend: "procedural",
      visual: this.currentVisual,
      lod: initialTier,
      diagnostics: createProceduralDiagnostics(initialTier, "manifest_disabled"),
    };
  }

  get visual() { return this.currentVisual; }
  get result() { return this.currentResult; }

  async load(options: CrownAssetLoadOptions): Promise<CrownLoadResult> {
    this.loadController.abort();
    this.loadController = new AbortController();
    const combined = combineSignals(options.signal, this.loadController.signal);
    const request = options.requestedMode === "fixture"
      ? "fixture"
      : readCrownAssetRequest(options.requestedMode ?? experienceConfig.crownAssetMode, options.debug);
    const preferred = options.preferredLod ?? selectCrownLod(options.resolvedQuality, options.capabilities);
    if (request === "procedural") {
      combined.dispose();
      return this.fallback(preferred, "procedural_requested");
    }

    let manifest: CrownAssetManifest;
    try {
      manifest = request === "fixture" ? createFixtureManifest() : await fetchCrownAssetManifest(combined.signal);
    } catch (error) {
      combined.dispose();
      if (combined.signal.aborted) throw error;
      return this.failedFallback(preferred, reasonFromError(error), error, options.debug);
    }
    if (!manifest.enabled) {
      combined.dispose();
      return this.fallback(preferred, "manifest_disabled", manifest.assetId);
    }
    if (!shouldAttemptGlb(request, manifest, options.capabilities)) {
      combined.dispose();
      return this.fallback(preferred, "capability_fallback", manifest.assetId);
    }

    let lastError: unknown = new Error("asset_missing");
    for (const lod of getLodFallbackOrder(preferred)) {
      try {
        const loaded = await loadGLBCrown(manifest, lod, options.renderer, combined.signal);
        const visual = new GLBCrownAdapter(loaded, manifest, lod, options.resolvedQuality, options.renderer);
        combined.dispose();
        return { backend: "glb", visual, lod, diagnostics: visual.diagnostics };
      } catch (error) {
        lastError = error;
        if (combined.signal.aborted) {
          combined.dispose();
          throw error;
        }
      }
    }
    combined.dispose();
    return this.failedFallback(preferred, reasonFromError(lastError), lastError, options.debug, manifest.assetId);
  }

  activate(result: CrownLoadResult) {
    if (this.disposed) {
      if (result.visual !== this.currentVisual) result.visual.dispose();
      return null;
    }
    const previous = this.currentVisual;
    this.currentVisual = result.visual;
    this.currentResult = result;
    return previous === result.visual ? null : previous;
  }

  private fallback(lod: QualityTier, reason: CrownAssetReason, assetId = "procedural-digital-crown-v2"): CrownLoadResult {
    const diagnostics = createProceduralDiagnostics(lod, reason, getCrownLoaderCounters());
    diagnostics.assetId = assetId;
    return { backend: "procedural", visual: this.currentVisual, lod, diagnostics };
  }

  private failedFallback(lod: QualityTier, reason: CrownAssetReason, error: unknown, debug: boolean, assetId?: string) {
    const result = this.fallback(lod, reason, assetId);
    result.diagnostics.warnings.push(error instanceof Error ? error.message : String(error));
    if (!this.warned && debug) {
      this.warned = true;
      console.warn(`BlackCrown Crown asset fallback (${reason}):`, result.diagnostics.warnings[0]);
    }
    return result;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.loadController.abort();
    this.currentVisual.dispose();
  }
}

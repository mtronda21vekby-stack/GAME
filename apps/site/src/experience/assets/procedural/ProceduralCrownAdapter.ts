import { CrownPrototype } from "../../scene/CrownPrototype";
import type { CrownAssetAdapter, CrownAssetLoadOptions, CrownLoadResult, CrownVisual } from "../CrownAssetAdapter";
import { createProceduralDiagnostics } from "../CrownAssetAdapter";

export class ProceduralCrownAdapter implements CrownAssetAdapter {
  readonly visual: CrownVisual;
  private disposed = false;

  constructor(radialSegments: number) {
    this.visual = new CrownPrototype(radialSegments);
  }

  async load(options: CrownAssetLoadOptions): Promise<CrownLoadResult> {
    return {
      backend: "procedural",
      visual: this.visual,
      lod: options.resolvedQuality,
      diagnostics: createProceduralDiagnostics(options.resolvedQuality, "procedural_requested"),
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.visual.dispose();
  }
}

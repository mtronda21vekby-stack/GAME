import * as THREE from "three";
import type { QualityPreset } from "../quality/qualityPresets";

type RendererHostOptions = {
  container: HTMLElement;
  preset: QualityPreset;
  onContextState: (state: "ready" | "lost") => void;
};

export class RendererHost {
  readonly renderer: THREE.WebGLRenderer;
  private readonly container: HTMLElement;
  private readonly onContextState: (state: "ready" | "lost") => void;
  private dprCap: number;
  private width = 0;
  private height = 0;

  constructor({ container, preset, onContextState }: RendererHostOptions) {
    this.container = container;
    this.onContextState = onContextState;
    this.dprCap = preset.dprCap;
    this.renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: preset.antialias,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.86;
    this.renderer.setClearColor(0x010205, 1);
    this.renderer.domElement.className = "bcExperienceCanvas";
    this.renderer.domElement.dataset.bcNexusCanvas = "true";
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.renderer.domElement.addEventListener("webglcontextlost", this.handleContextLost);
    this.renderer.domElement.addEventListener("webglcontextrestored", this.handleContextRestored);
    this.container.append(this.renderer.domElement);
  }

  private handleContextLost = (event: Event) => {
    event.preventDefault();
    this.onContextState("lost");
  };

  private handleContextRestored = () => {
    this.renderer.resetState();
    this.onContextState("ready");
  };

  setPreset(preset: QualityPreset) {
    this.dprCap = preset.dprCap;
    this.resize(this.width || window.innerWidth, this.height || window.innerHeight, true);
  }

  setExposure(exposure: number) {
    this.renderer.toneMappingExposure = Math.min(1.06, Math.max(0.78, exposure));
  }

  resize(width: number, height: number, force = false) {
    const safeWidth = Math.max(1, Math.round(width));
    const safeHeight = Math.max(1, Math.round(height));
    if (!force && safeWidth === this.width && safeHeight === this.height) return;
    this.width = safeWidth;
    this.height = safeHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.dprCap));
    this.renderer.setSize(safeWidth, safeHeight, false);
  }

  dispose() {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    canvas.removeEventListener("webglcontextrestored", this.handleContextRestored);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }
}

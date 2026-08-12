export type DeviceCapabilities = {
  reducedMotion: boolean;
  coarsePointer: boolean;
  finePointer: boolean;
  pointerType: "coarse" | "fine" | "none";
  saveData: boolean;
  memory: number | null;
  cores: number;
  mobileViewport: boolean;
  weakProfile: boolean;
  viewportWidth: number;
  viewportHeight: number;
  visualViewportWidth: number | null;
  visualViewportHeight: number | null;
  dpr: number;
  orientation: "portrait" | "landscape";
  webgl2: boolean;
  maxTextureSize: number;
  maxRenderbufferSize: number;
  renderer: string;
};

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

export function readDeviceCapabilities(renderer?: import("three").WebGLRenderer): DeviceCapabilities {
  const hints = navigator as NavigatorWithHints;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const memory = typeof hints.deviceMemory === "number" ? hints.deviceMemory : null;
  const cores = Math.max(1, navigator.hardwareConcurrency || 2);
  const gl = renderer?.getContext();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  return {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    coarsePointer,
    finePointer,
    pointerType: coarsePointer ? "coarse" : finePointer ? "fine" : "none",
    saveData: Boolean(hints.connection?.saveData),
    memory,
    cores,
    mobileViewport: viewportWidth <= 820 || viewportHeight <= 520,
    weakProfile: (memory !== null && memory <= 4) || cores <= 4,
    viewportWidth,
    viewportHeight,
    visualViewportWidth: window.visualViewport?.width ?? null,
    visualViewportHeight: window.visualViewport?.height ?? null,
    dpr: window.devicePixelRatio || 1,
    orientation: viewportWidth >= viewportHeight ? "landscape" : "portrait",
    webgl2: renderer?.capabilities.isWebGL2 ?? false,
    maxTextureSize: gl?.getParameter(gl.MAX_TEXTURE_SIZE) ?? 0,
    maxRenderbufferSize: gl?.getParameter(gl.MAX_RENDERBUFFER_SIZE) ?? 0,
    renderer: renderer ? (renderer.capabilities.isWebGL2 ? "WebGL2" : "WebGL1") : "pending",
  };
}

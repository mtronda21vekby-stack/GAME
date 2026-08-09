export type DeviceCapabilities = {
  reducedMotion: boolean;
  coarsePointer: boolean;
  saveData: boolean;
  memory: number | null;
  cores: number;
  mobileViewport: boolean;
};

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

export function readDeviceCapabilities(): DeviceCapabilities {
  const hints = navigator as NavigatorWithHints;
  return {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    saveData: Boolean(hints.connection?.saveData),
    memory: typeof hints.deviceMemory === "number" ? hints.deviceMemory : null,
    cores: Math.max(1, navigator.hardwareConcurrency || 2),
    mobileViewport: window.innerWidth <= 820,
  };
}

import type { NextRenderQuality } from "../core/engineTypes";

export type ControlMode = "pointer" | "joystick" | "gamepad";
export type StickMode = "fixed" | "floating";
export type LanguageMode = "ru" | "en";

export type ViewSettings = {
  zoom: number;
  autoZoom: boolean;
  controlMode: ControlMode;
  quality: NextRenderQuality;
  stickMode: StickMode;
  stickSize: number;
  stickSensitivity: number;
  language: LanguageMode;
};

export const VIEW_SETTINGS_KEY = "evofish_next_view_settings_v5";
export const TUTORIAL_KEY = "evofish_next_tutorial_done_v1";

export const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  zoom: 0.82,
  autoZoom: true,
  controlMode: "pointer",
  quality: "balanced",
  stickMode: "fixed",
  stickSize: 92,
  stickSensitivity: 1,
  language: "ru"
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeControlMode(value: unknown): ControlMode {
  return value === "joystick" || value === "gamepad" || value === "pointer" ? value : "pointer";
}

export function normalizeQuality(value: unknown): NextRenderQuality {
  return value === "low" || value === "high" || value === "balanced" ? value : "balanced";
}

export function normalizeStickMode(value: unknown): StickMode {
  return value === "floating" || value === "fixed" ? value : "fixed";
}

export function normalizeLanguage(value: unknown): LanguageMode {
  return value === "en" || value === "ru" ? value : "ru";
}

export function normalizeViewSettings(settings?: Partial<ViewSettings> | null): ViewSettings {
  return {
    zoom: clamp(Number(settings?.zoom || DEFAULT_VIEW_SETTINGS.zoom), 0.56, 1.18),
    autoZoom: settings?.autoZoom !== false,
    controlMode: normalizeControlMode(settings?.controlMode),
    quality: normalizeQuality(settings?.quality),
    stickMode: normalizeStickMode(settings?.stickMode),
    stickSize: clamp(Number(settings?.stickSize || DEFAULT_VIEW_SETTINGS.stickSize), 76, 132),
    stickSensitivity: clamp(Number(settings?.stickSensitivity || DEFAULT_VIEW_SETTINGS.stickSensitivity), 0.65, 1.55),
    language: normalizeLanguage(settings?.language)
  };
}

export function loadViewSettings(): ViewSettings {
  try {
    const raw = localStorage.getItem(VIEW_SETTINGS_KEY);
    if (!raw) return DEFAULT_VIEW_SETTINGS;
    return normalizeViewSettings(JSON.parse(raw) as Partial<ViewSettings>);
  } catch {
    return DEFAULT_VIEW_SETTINGS;
  }
}

export function saveViewSettings(settings: ViewSettings) {
  try {
    localStorage.setItem(VIEW_SETTINGS_KEY, JSON.stringify(normalizeViewSettings(settings)));
  } catch {
    // view settings are optional in blocked/private modes
  }
}

export function resetViewSettings() {
  saveViewSettings(DEFAULT_VIEW_SETTINGS);
  return DEFAULT_VIEW_SETTINGS;
}

export function tutorialDone() {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function setTutorialDone(done: boolean) {
  try {
    if (done) localStorage.setItem(TUTORIAL_KEY, "1");
    else localStorage.removeItem(TUTORIAL_KEY);
  } catch {
    // tutorial state is optional
  }
}

import { describe, expect, it } from "vitest";
import { EXPERIENCE_CHAPTERS } from "../../src/experience-shell/experienceShellConfig";
import { getCollectionHousingKind, getFeaturedCollectionItems } from "../../src/experience-shell/featuredCatalog";
import { interpolateLightingProfiles, SCENE_LIGHTING_PROFILES } from "../../src/experience-shell/core/SceneLightingProfiles";
import { foregroundActivation, getForegroundVisibleCount } from "../../src/experience-shell/scenes/ForegroundOcclusionSystem";

describe("Experience art direction V3", () => {
  it("interpolates bounded lighting profiles deterministically in both directions", () => {
    const crown = SCENE_LIGHTING_PROFILES["crown-chamber"];
    const reactor = SCENE_LIGHTING_PROFILES["crown-front-reactor"];
    const forward = interpolateLightingProfiles(crown, reactor, 0.42);
    const restored = interpolateLightingProfiles(reactor, crown, 0.58);

    expect(forward.background).toBe(restored.background);
    expect(forward.fogColor).toBe(restored.fogColor);
    expect(forward.coreColor).toBe(restored.coreColor);
    for (const key of ["exposure", "fogDensity", "keyIntensity", "rimIntensity", "fillIntensity", "coreIntensity", "bloomStrength"] as const) {
      expect(forward[key]).toBeCloseTo(restored[key], 10);
    }
    expect(forward.exposure).toBeGreaterThanOrEqual(0.78);
    expect(forward.exposure).toBeLessThanOrEqual(1.06);
    expect(forward.fogDensity).toBeGreaterThanOrEqual(0.018);
    expect(forward.fogDensity).toBeLessThanOrEqual(0.085);
    expect(forward.bloomStrength).toBeLessThanOrEqual(0.2);
  });

  it("reduces foreground occlusion for mobile quality and reduced motion", () => {
    expect(getForegroundVisibleCount(4, "high", false)).toBe(4);
    expect(getForegroundVisibleCount(4, "medium", false)).toBe(3);
    expect(getForegroundVisibleCount(4, "low", false)).toBe(2);
    expect(getForegroundVisibleCount(4, "high", true)).toBe(1);
    expect(foregroundActivation(0.5, false)).toBeCloseTo(0.6, 5);
    expect(foregroundActivation(0.5, true)).toBe(0.12);
  });

  it("selects one real catalog item per supported housing category", () => {
    const first = getFeaturedCollectionItems(3);
    const second = getFeaturedCollectionItems(3);
    expect(first.map((item) => item.id)).toEqual(second.map((item) => item.id));
    expect(first.map((item) => item.category)).toEqual(["skins", "badges", "bundles"]);
    expect(first.map((item) => getCollectionHousingKind(item.category))).toEqual([
      "armor-display",
      "medallion",
      "multi-cell-vault",
    ]);
  });

  it("maps every visual chapter to a deliberate composition layout", () => {
    const visualChapters = EXPERIENCE_CHAPTERS.filter((chapter) => chapter.id !== "boot");
    expect(visualChapters.map((chapter) => chapter.layout)).toEqual([
      "hero-left",
      "system-minimal",
      "editorial-low-left",
      "tactical-right",
      "network-right",
      "vault-left",
      "final-center",
    ]);
    expect(new Set(visualChapters.map((chapter) => chapter.layout)).size).toBe(visualChapters.length);
  });
});

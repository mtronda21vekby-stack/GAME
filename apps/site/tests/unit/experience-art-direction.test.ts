import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { EXPERIENCE_CHAPTERS, EXPERIENCE_PHASE_RANGES, EXPERIENCE_STORY_HEIGHT } from "../../src/experience-shell/experienceShellConfig";
import { getCollectionHousingKind, getFeaturedCollectionItems } from "../../src/experience-shell/featuredCatalog";
import {
  interpolateLightingProfiles,
  OCEAN_TO_VAULT_NEUTRAL_PROFILE,
  resolveSceneLightingProfile,
  SCENE_LIGHTING_PROFILES,
} from "../../src/experience-shell/core/SceneLightingProfiles";
import { foregroundActivation, getForegroundVisibleCount } from "../../src/experience-shell/scenes/ForegroundOcclusionSystem";
import { EXPERIENCE_ASSET_SLOT_IDS } from "../../src/experience-shell/core/AssetSlotRegistry";
import { CAMERA_KEYFRAMES } from "../../src/experience/camera/CameraKeyframes";
import { CameraRig, getMobileCameraPullback } from "../../src/experience/camera/CameraRig";
import { INITIAL_SCROLL_SNAPSHOT } from "../../src/experience/types";
import {
  getAssemblyFragmentSourceIndex,
  ASSEMBLY_FRAGMENT_COUNTS,
  evaluateAssemblyArc,
  isCloseAssemblyFragmentSource,
  shouldShowAssemblyFragments,
} from "../../src/experience-shell/scenes/CrownChamberScene";

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

  it("keeps the approved ten-phase directing spine contiguous", () => {
    const phases = Object.values(EXPERIENCE_PHASE_RANGES);
    expect(phases).toHaveLength(10);
    expect(phases[0][0]).toBe(0);
    expect(phases.at(-1)?.[1]).toBe(1);
    phases.slice(1).forEach((phase, index) => expect(phase[0]).toBe(phases[index][1]));
  });

  it("provides enough native scroll travel for a 40–60 second cinematic read", () => {
    expect(EXPERIENCE_STORY_HEIGHT.desktopVh).toBeGreaterThanOrEqual(2400);
    expect(EXPERIENCE_STORY_HEIGHT.mobileVh).toBeGreaterThanOrEqual(2000);
    expect(EXPERIENCE_STORY_HEIGHT.landscapeVh).toBeGreaterThanOrEqual(2200);
    expect(EXPERIENCE_STORY_HEIGHT.reducedVh).toBeLessThan(EXPERIENCE_STORY_HEIGHT.mobileVh);
  });

  it("shows assembly fragments only during the 6–22 percent assembly beat", () => {
    expect(shouldShowAssemblyFragments(0, false, true)).toBe(false);
    expect(shouldShowAssemblyFragments(0.059, false, true)).toBe(false);
    expect(shouldShowAssemblyFragments(0.061, false, true)).toBe(true);
    expect(shouldShowAssemblyFragments(0.14, false, true)).toBe(true);
    expect(shouldShowAssemblyFragments(0.22, false, true)).toBe(false);
    expect(shouldShowAssemblyFragments(0.14, true, true)).toBe(false);
  });

  it("samples quality-tier assembly fragments across the full Crown width", () => {
    const lowTierSources = Array.from({ length: ASSEMBLY_FRAGMENT_COUNTS.low }, (_, index) =>
      getAssemblyFragmentSourceIndex(index, ASSEMBLY_FRAGMENT_COUNTS.low, 168));

    expect(lowTierSources[0]).toBe(0);
    expect(lowTierSources.at(-1)).toBe(167);
    expect(new Set(lowTierSources).size).toBe(ASSEMBLY_FRAGMENT_COUNTS.low);
    expect(lowTierSources.some((index) => index >= 80 && index <= 87)).toBe(true);
    const closeFlyingSources = lowTierSources.filter(isCloseAssemblyFragmentSource);
    expect(closeFlyingSources.some((index) => index < 84)).toBe(true);
    expect(closeFlyingSources.some((index) => index >= 84)).toBe(true);
  });

  it("keeps nano assembly within the approved tier budgets and fully reversible", () => {
    expect(ASSEMBLY_FRAGMENT_COUNTS).toEqual({ low: 32, medium: 72, high: 112 });
    const sample = evaluateAssemblyArc(-4.2, 1.1, 1.8, 0.43);
    expect(evaluateAssemblyArc(-4.2, 1.1, 1.8, 0.43)).toBe(sample);
    expect(evaluateAssemblyArc(-4.2, 1.1, 1.8, 0)).toBeCloseTo(-4.2, 8);
    expect(evaluateAssemblyArc(-4.2, 1.1, 1.8, 1)).toBeCloseTo(1.1, 8);
  });

  it("registers unique local slots for the generated cinematic V2 art", () => {
    expect(new Set(EXPERIENCE_ASSET_SLOT_IDS).size).toBe(EXPERIENCE_ASSET_SLOT_IDS.length);
    expect(EXPERIENCE_ASSET_SLOT_IDS).toEqual(expect.arrayContaining([
      "evofish-backdrop",
      "crown-front-backdrop",
      "network-collection-backdrop",
      "collection-aurora-art",
      "collection-founder-art",
      "collection-starter-art",
    ]));
  });

  it("uses strong phase-specific mobile fit without altering the final core crossing", () => {
    expect(getMobileCameraPullback(0.25, false)).toBeGreaterThan(5);
    expect(getMobileCameraPullback(0.5, false)).toBeGreaterThan(7);
    expect(getMobileCameraPullback(0.87, false)).toBeGreaterThan(5);
    expect(getMobileCameraPullback(0.5, true)).toBeLessThan(getMobileCameraPullback(0.5, false));
    expect(getMobileCameraPullback(1, false)).toBe(0);
  });

  it("passes ocean-to-vault lighting through a cold-white midpoint", () => {
    const profile = resolveSceneLightingProfile({
      primary: "crown-front-reactor",
      partner: "evofish-abyss",
      activeSceneIds: ["crown-front-reactor", "evofish-abyss"],
      weights: new Map([["evofish-abyss", 0.5], ["crown-front-reactor", 0.5]]),
      transition: {
        id: "ocean-to-reactor",
        from: "evofish-abyss",
        to: "crown-front-reactor",
        amount: 0.5,
      },
    }, "high", false);
    expect(profile.coreColor).toBe(OCEAN_TO_VAULT_NEUTRAL_PROFILE.coreColor);
    expect(profile.keyColor).toBe(OCEAN_TO_VAULT_NEUTRAL_PROFILE.keyColor);
  });

  it("locks the camera path to the directed chapter boundaries and crosses the final Crown", () => {
    const progress = CAMERA_KEYFRAMES.map((keyframe) => keyframe.progress);
    for (const boundary of [0.06, 0.22, 0.30, 0.43, 0.57, 0.70, 0.82, 0.91, 0.96, 1]) {
      expect(progress).toContain(boundary);
    }
    progress.slice(1).forEach((value, index) => expect(value).toBeGreaterThan(progress[index]));
    CAMERA_KEYFRAMES.forEach((keyframe) => {
      expect([...keyframe.position, ...keyframe.target, keyframe.fov].every(Number.isFinite)).toBe(true);
    });
    expect(CAMERA_KEYFRAMES.find((keyframe) => keyframe.progress === 0.975)?.position[2]).toBeGreaterThan(0);
    expect(CAMERA_KEYFRAMES.at(-1)?.position[2]).toBeLessThan(0);
  });

  it("locks the final mobile camera ray to the live Crown core", () => {
    const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 100);
    const core = new THREE.Vector3(1.18, 1.86, 0.04);
    new CameraRig(camera).update({
      ...INITIAL_SCROLL_SNAPSHOT,
      progress: 0.99,
      targetProgress: 0.99,
      viewportWidth: 390,
      viewportHeight: 844,
    }, { x: 0.5, y: -0.5 }, 3, core);

    const direction = camera.getWorldDirection(new THREE.Vector3());
    const travel = core.clone().sub(camera.position).dot(direction);
    const closestPoint = camera.position.clone().addScaledVector(direction, travel);
    expect(camera.position.x).toBeCloseTo(core.x, 5);
    expect(camera.position.y).toBeCloseTo(core.y, 5);
    expect(closestPoint.distanceTo(core)).toBeLessThan(0.0001);
  });
});

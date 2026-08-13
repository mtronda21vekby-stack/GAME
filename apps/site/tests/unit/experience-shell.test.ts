import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { EXPERIENCE_CHAPTERS, EXPERIENCE_STORY_HEIGHT } from "../../src/experience-shell/experienceShellConfig";
import { getStoryProgress, getTransitionProgress } from "../../src/experience-shell/story/StoryProgress";
import { chapterFromHash, hashForChapter } from "../../src/experience-shell/story/SpatialRouteMap";
import { resolveSceneLifecycle, type SceneEvaluationSnapshot } from "../../src/experience-shell/core/SceneLifecycle";
import { SceneRegistry, type ExperienceScene } from "../../src/experience-shell/core/SceneRegistry";
import { AssetSlotRegistry } from "../../src/experience-shell/core/AssetSlotRegistry";
import type { ExperienceSceneId } from "../../src/experience-shell/experienceShellConfig";

class TestScene implements ExperienceScene {
  readonly root = new THREE.Group();
  active = false;
  weight = 0;
  disposed = false;
  evaluations = 0;

  constructor(readonly id: ExperienceSceneId) {}
  evaluate(_snapshot: SceneEvaluationSnapshot) { this.evaluations += 1; this.root.position.set(0, 0, 0); this.root.scale.setScalar(1); }
  setQuality() {}
  setActive(active: boolean) { this.active = active; this.root.visible = active; }
  setWeight(weight: number) { this.weight = weight; }
  dispose() { this.disposed = true; }
}

describe("Experience Skeleton story", () => {
  it("keeps eight contiguous config-driven chapter ranges", () => {
    expect(EXPERIENCE_CHAPTERS).toHaveLength(8);
    expect(EXPERIENCE_CHAPTERS[0].range[0]).toBe(0);
    expect(EXPERIENCE_CHAPTERS.at(-1)?.range[1]).toBe(1);
    EXPERIENCE_CHAPTERS.slice(1).forEach((chapter, index) => {
      expect(chapter.range[0]).toBe(EXPERIENCE_CHAPTERS[index].range[1]);
    });
    expect(EXPERIENCE_STORY_HEIGHT.desktopVh).toBeGreaterThanOrEqual(900);
    expect(EXPERIENCE_STORY_HEIGHT.mobileVh).toBeGreaterThanOrEqual(600);
    expect(EXPERIENCE_STORY_HEIGHT.reducedVh).toBeLessThan(EXPERIENCE_STORY_HEIGHT.mobileVh);
  });

  it("maps progress and spatial hashes deterministically", () => {
    expect(getStoryProgress(0.31)).toMatchObject({ chapterId: "world-gate", localProgress: expect.closeTo(0.0769, 3) });
    expect(getStoryProgress(0.86).chapterId).toBe("network-core");
    expect(chapterFromHash("#crown-front")).toBe("crown-front-reactor");
    expect(chapterFromHash("#unknown")).toBeNull();
    expect(hashForChapter("collection-vault")).toBe("#store");
    expect(getTransitionProgress(0.3325, [0.30, 0.365])).toBeCloseTo(0.5, 5);
  });

  it("keeps one scene active outside transitions and at most two inside", () => {
    expect(resolveSceneLifecycle(0.1).activeSceneIds).toEqual(["crown-chamber"]);
    const transition = resolveSceneLifecycle(0.3325);
    expect(transition.activeSceneIds).toHaveLength(2);
    expect(transition.transition).toMatchObject({ from: "crown-chamber", to: "world-gate", amount: expect.closeTo(0.5, 5) });
    expect(resolveSceneLifecycle(0.5).activeSceneIds).toEqual(["evofish-abyss"]);
  });

  it("evaluates registry transitions from absolute progress without drift", () => {
    const parent = new THREE.Group();
    const registry = new SceneRegistry(parent, vi.fn());
    const crown = new TestScene("crown-chamber");
    const gate = new TestScene("world-gate");
    registry.register(crown);
    registry.register(gate);
    registry.evaluate(0.3325, 1, false, "high");
    const first = { crownZ: crown.root.position.z, gateZ: gate.root.position.z, crownScale: crown.root.scale.x };
    registry.evaluate(0.1, 2, false, "high");
    registry.evaluate(0.3325, 3, false, "high");
    expect({ crownZ: crown.root.position.z, gateZ: gate.root.position.z, crownScale: crown.root.scale.x }).toEqual(first);
    expect(registry.activeSceneCount).toBe(2);
    registry.dispose();
    expect(crown.disposed).toBe(true);
    expect(gate.disposed).toBe(true);
  });

  it("uses deterministic premium fallbacks for missing semantic assets", async () => {
    const controller = new AbortController();
    const assets = new AssetSlotRegistry(controller.signal);
    await expect(assets.loadTexture("world-gate", "high")).resolves.toBeNull();
    expect(assets.getStatus("world-gate")).toMatchObject({ status: "fallback", fallback: "procedural-gate" });
    assets.dispose();
    expect(assets.textureCount).toBe(0);
  });
});

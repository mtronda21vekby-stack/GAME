import { afterEach, describe, expect, it, vi } from "vitest";
import { createSeededRandom, damp } from "../../src/experience/core/math";
import { getChapterAtProgress } from "../../src/experience/scroll/ScrollChapters";
import { DIRECTION_DEAD_ZONE, getScrollDirection, normalizeScrollVelocity } from "../../src/experience/scroll/ScrollSmoothing";
import { evaluateExperienceTimeline } from "../../src/experience/timeline/timeline";
import { selectAutoQuality } from "../../src/experience/quality/QualityManager";
import { QUALITY_PRESETS } from "../../src/experience/quality/qualityPresets";

function simulateDamping(fps: number, seconds = 1) {
  let value = 0;
  for (let frame = 0; frame < fps * seconds; frame += 1) value = damp(value, 1, 8, 1 / fps);
  return value;
}

afterEach(() => vi.unstubAllGlobals());

describe("deterministic experience math", () => {
  it("keeps damping frame-rate independent", () => {
    expect(simulateDamping(30)).toBeCloseTo(simulateDamping(60), 8);
    expect(simulateDamping(60)).toBeCloseTo(simulateDamping(120), 8);
  });

  it("maps exact chapter boundaries and local progress", () => {
    expect(getChapterAtProgress(0)).toEqual({ chapterId: "boot", chapterProgress: 0 });
    expect(getChapterAtProgress(0.06)).toEqual({ chapterId: "crown-chamber", chapterProgress: 0 });
    expect(getChapterAtProgress(0.3)).toEqual({ chapterId: "world-gate", chapterProgress: 0 });
    expect(getChapterAtProgress(0.43)).toEqual({ chapterId: "evofish-abyss", chapterProgress: 0 });
    expect(getChapterAtProgress(0.82)).toEqual({ chapterId: "network-core", chapterProgress: 0 });
    expect(getChapterAtProgress(0.935)).toMatchObject({ chapterId: "collection-vault", chapterProgress: expect.closeTo(0.5, 3) });
    expect(getChapterAtProgress(1)).toEqual({ chapterId: "identity-enter", chapterProgress: 1 });
  });

  it("uses a dead zone and reversible absolute transforms", () => {
    expect(getScrollDirection(DIRECTION_DEAD_ZONE * 0.5)).toBe(0);
    expect(getScrollDirection(normalizeScrollVelocity(0.8, 0.7, 1 / 60))).toBe(-1);
    expect(evaluateExperienceTimeline(0.56)).toEqual(evaluateExperienceTimeline(0.56));
    expect(evaluateExperienceTimeline(0.08).assembly).toBeLessThan(evaluateExperienceTimeline(0.15).assembly);
    expect(evaluateExperienceTimeline(0.65).tacticalOrange).toBeGreaterThan(0.5);
    expect(evaluateExperienceTimeline(0.91).tacticalOrange).toBe(0);
    expect(evaluateExperienceTimeline(0.65)).toEqual(evaluateExperienceTimeline(0.65));
  });

  it("keeps reduced motion assembled and bounds the shell opening", () => {
    const start = evaluateExperienceTimeline(0, true);
    const core = evaluateExperienceTimeline(0.315, true);
    expect(start.assembly).toBe(1);
    expect(start.idleAmount).toBe(0);
    expect(core.open).toBeGreaterThan(0);
    expect(core.open).toBeLessThanOrEqual(0.58);
  });

  it("initializes seeded geometry deterministically", () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    expect(Array.from({ length: 12 }, () => a())).toEqual(Array.from({ length: 12 }, () => b()));
  });
});

describe("quality selection", () => {
  it("caps every tier DPR", () => {
    expect(QUALITY_PRESETS.low.dprCap).toBe(1);
    expect(QUALITY_PRESETS.medium.dprCap).toBeLessThanOrEqual(1.25);
    expect(QUALITY_PRESETS.high.dprCap).toBeLessThanOrEqual(1.5);
  });

  it("selects low for save-data and high for capable desktop", () => {
    vi.stubGlobal("window", { innerWidth: 1440, matchMedia: () => ({ matches: false }) });
    vi.stubGlobal("navigator", { hardwareConcurrency: 12, deviceMemory: 8, connection: { saveData: true } });
    expect(selectAutoQuality()).toBe("low");
    vi.stubGlobal("navigator", { hardwareConcurrency: 12, deviceMemory: 8, connection: { saveData: false } });
    expect(selectAutoQuality()).toBe("high");
  });
});

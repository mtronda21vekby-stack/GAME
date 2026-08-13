import { describe, expect, it } from "vitest";
import {
  EXPERIENCE_CHAPTERS,
  EXPERIENCE_PHASE_RANGES,
  isExperienceRangeActive,
} from "../../src/experience-shell/experienceShellConfig";
import { getCollectionFinalVisibility } from "../../src/experience-shell/scenes/CollectionVaultScene";
import { getChapterTargetProgress } from "../../src/experience-shell/story/StoryProgress";

describe("locked experience copy direction", () => {
  it("shows the minimal BlackCrown hero copy only during 22–30 percent", () => {
    const hero = EXPERIENCE_CHAPTERS.find((chapter) => chapter.id === "crown-chamber")!;
    expect(hero).toMatchObject({
      eyebrow: "BLACKCROWN",
      title: "DIGITAL CROWN NEXUS",
      body: "ONE CROWN CONNECTS EVERY WORLD.",
      copyRange: EXPERIENCE_PHASE_RANGES.blackcrownHero,
    });
    expect(hero.actions).toEqual([{ label: "EXPLORE", href: "#gate", kind: "primary" }]);
    expect(isExperienceRangeActive(0.2199, hero.copyRange!)).toBe(false);
    expect(isExperienceRangeActive(0.22, hero.copyRange!)).toBe(true);
    expect(isExperienceRangeActive(0.2999, hero.copyRange!)).toBe(true);
    expect(isExperienceRangeActive(0.30, hero.copyRange!)).toBe(false);
    expect(isExperienceRangeActive(getChapterTargetProgress(hero.id), hero.copyRange!)).toBe(true);
  });

  it("shows the minimal Crown Front copy only during 70–82 percent", () => {
    const tactical = EXPERIENCE_CHAPTERS.find((chapter) => chapter.id === "crown-front-reactor")!;
    expect(tactical).toMatchObject({
      eyebrow: "CROWN//FRONT",
      title: "TACTICAL HEIST EXPERIENCE",
      copyRange: EXPERIENCE_PHASE_RANGES.crownFrontVault,
    });
    expect(tactical.body).toBeUndefined();
    expect(tactical.actions).toEqual([
      { label: "ENTER OPERATION", href: "/games/crown-front/", kind: "tactical" },
    ]);
    expect(isExperienceRangeActive(0.6999, tactical.copyRange!)).toBe(false);
    expect(isExperienceRangeActive(0.70, tactical.copyRange!)).toBe(true);
    expect(isExperienceRangeActive(0.8199, tactical.copyRange!)).toBe(true);
    expect(isExperienceRangeActive(0.82, tactical.copyRange!)).toBe(false);
    expect(isExperienceRangeActive(getChapterTargetProgress(tactical.id), tactical.copyRange!)).toBe(true);
  });

  it("clears Collection continuously between final-pass start and core crossing", () => {
    expect(getCollectionFinalVisibility(0.9599)).toBe(1);
    expect(getCollectionFinalVisibility(0.96)).toBe(1);
    expect(getCollectionFinalVisibility(0.97)).toBeCloseTo(0.5, 6);
    expect(getCollectionFinalVisibility(0.9799)).toBeGreaterThan(0);
    expect(getCollectionFinalVisibility(0.98)).toBe(0);
    expect(getCollectionFinalVisibility(1)).toBe(0);
  });
});

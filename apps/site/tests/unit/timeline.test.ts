import { describe, expect, it } from "vitest";
import {
  CINEMATIC_TIMELINE,
  getActiveScene,
  getTimelineVariables,
  rangeOpacity,
} from "../../src/experience/timeline";

describe("cinematic timeline", () => {
  it("keeps the first frame visible and maps progress to all phases", () => {
    expect(rangeOpacity(0, CINEMATIC_TIMELINE[0])).toBe(1);
    expect(getActiveScene(0)).toBe("crown");
    expect(getActiveScene(0.2)).toBe("gate");
    expect(getActiveScene(0.45)).toBe("evofish");
    expect(getActiveScene(0.68)).toBe("crown-front");
    expect(getActiveScene(0.92)).toBe("network");
  });

  it("emits continuous compositor variables", () => {
    const before = getTimelineVariables(0.19);
    const after = getTimelineVariables(0.2);
    expect(Number(after["--cx-gate-opacity"])).toBeGreaterThan(Number(before["--cx-gate-opacity"]));
    expect(after["--cx-gate-shift"]).toMatch(/px$/);
    expect(Number(after["--cx-gate-scale"])).toBeGreaterThan(0.9);
  });
});

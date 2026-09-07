import { describe, expect, it } from "vitest";
import { evaluateExperienceAudioMix } from "../../src/experience/audio/AudioController";

describe("experience audio direction", () => {
  it("gives each authored world its own dominant ambience", () => {
    const crown = evaluateExperienceAudioMix(0.22, false);
    const ocean = evaluateExperienceAudioMix(0.5, false);
    const vault = evaluateExperienceAudioMix(0.76, false);
    const network = evaluateExperienceAudioMix(0.93, false);

    expect(crown.crown).toBeGreaterThan(crown.ocean);
    expect(ocean.ocean).toBeGreaterThan(ocean.crown);
    expect(vault.vault).toBeGreaterThan(vault.ocean);
    expect(network.network).toBeGreaterThan(network.vault);
  });

  it("keeps music stable while reduced motion lowers spatial ambience", () => {
    const standard = evaluateExperienceAudioMix(0.76, false);
    const reduced = evaluateExperienceAudioMix(0.76, true);

    expect(reduced.music).toBe(standard.music);
    expect(reduced.vault).toBeLessThan(standard.vault);
  });

  it("resolves to music alone on the minimal final screen", () => {
    expect(evaluateExperienceAudioMix(0.96, false).crown).toBe(0);
    expect(evaluateExperienceAudioMix(0.98, false).crown).toBeGreaterThan(0);
    expect(evaluateExperienceAudioMix(1, false)).toEqual({
      music: 0.22,
      crown: 0,
      ocean: 0,
      vault: 0,
      network: 0,
    });
  });

  it("is deterministic when revisiting a transition while reverse scrolling", () => {
    const outbound = evaluateExperienceAudioMix(0.635, false);
    evaluateExperienceAudioMix(0.93, false);
    const inbound = evaluateExperienceAudioMix(0.635, false);

    expect(outbound.ocean).toBeGreaterThan(0);
    expect(outbound.vault).toBeGreaterThan(0);
    expect(inbound).toEqual(outbound);
  });
});

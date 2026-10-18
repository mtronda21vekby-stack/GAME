import { describe, expect, it, vi } from "vitest";
import { detailOriginPose, type PanelOrigin } from "../../src/components/spatial/detailTransition";
import { readSpatialReturn, rememberSpatialReturn } from "../../src/components/spatial/spatialNavigation";

describe("Spatial navigation return", () => {
  it("restores the selected game, genre and scroll from the same history entry while preserving other state", () => {
    const history = { state: { otherRouter: { entry: 7 } } as unknown, replaceState(data: unknown) { this.state = data; } };
    rememberSpatialReturn(history, "/", { worldIndex: 2, category: "Симуляторы", scrollY: 844 });
    expect(readSpatialReturn(history.state, "/")).toEqual({ worldIndex: 2, category: "Симуляторы", scrollY: 844 });
    expect(history.state).toMatchObject({ otherRouter: { entry: 7 } });
    expect(readSpatialReturn(history.state, "/store")).toBeUndefined();
  });

  it.each([
    { gameId: "missing", category: "Все игры", scrollY: 844 },
    { gameId: "evofish", category: "Симуляторы", scrollY: 844 },
    { gameId: "ballcrown", category: "unknown", scrollY: 844 },
    { gameId: "ballcrown", category: "Все игры", scrollY: Infinity },
    { gameId: "ballcrown", category: "Все игры", scrollY: -1 },
  ])("ignores a stale or invalid return state: %j", saved => {
    expect(readSpatialReturn({ blackcrownSpatialReturn: { pathname: "/", ...saved } }, "/")).toBeUndefined();
  });

  it("keeps navigation usable when the browser rejects a history write or owns a non-object state", () => {
    expect(() => rememberSpatialReturn({ state: null, replaceState() { throw new Error("History unavailable"); } }, "/", { worldIndex: 0, category: "Все игры", scrollY: 0 })).not.toThrow();
    const replaceState = vi.fn();
    rememberSpatialReturn({ state: 42, replaceState }, "/", { worldIndex: 0, category: "Все игры", scrollY: 0 });
    expect(replaceState).not.toHaveBeenCalled();
  });
});

describe("Reversible detail surface", () => {
  const origin: PanelOrigin = { gameId: "evofish", left: 65, top: 180, width: 260, height: 240, viewportWidth: 390, viewportHeight: 844 };
  const box = { left: 0, top: 150, width: 390, height: 219.375 };

  it("matches the opening panel's center and width without stretching the game image", () => {
    const [x, y, sx, sy] = detailOriginPose(origin, "evofish", 390, 844, box);
    expect(box.width*sx).toBeCloseTo(origin.width);
    expect(sx).toBe(sy);
    expect((box.width*sx)/(box.height*sy)).toBeCloseTo(16/9);
    expect(box.left+box.width/2+x-box.width*sx/2).toBeCloseTo(origin.left);
    expect(box.top+box.height/2+y).toBeCloseTo(origin.top+origin.height/2);
  });

  it("uses a short fade when the game or viewport changed, without returning to an unrelated panel", () => {
    const fade = [0,20,.98,.98,.25];
    expect(detailOriginPose(origin, "quiet-valley", 390, 844, box)).toEqual(fade);
    expect(detailOriginPose(origin, "evofish", 844, 390, box)).toEqual(fade);
    expect(detailOriginPose(origin, "evofish", 390, 640, box)).toEqual(fade);
    expect(detailOriginPose(null, "evofish", 390, 844, box)).toEqual(fade);
  });
});

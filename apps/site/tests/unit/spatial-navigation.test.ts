import { describe, expect, it, vi } from "vitest";
import { detailOriginPose, detailPosterSize, detailReveal, type PanelOrigin } from "../../src/components/spatial/detailTransition";
import { readSpatialReturn, rememberSpatialReturn, spatialReturnForGame } from "../../src/components/spatial/spatialNavigation";

describe("Spatial navigation return", () => {
  it.each([0,1,2,3])("remembers direct launch of card %i even when Ballcrown was selected",worldIndex=>{
    const history={state:null as unknown,replaceState(data:unknown){this.state=data;}};
    const next=spatialReturnForGame(worldIndex,{worldIndex:0,category:"Все игры",scrollY:1900});
    rememberSpatialReturn(history,"/",next);
    expect(readSpatialReturn(history.state,"/")).toEqual({worldIndex,category:"Все игры",scrollY:1900});
  });
  it("keeps the hero's Ballcrown shortcut return valid when another genre was active",()=>{
    const history={state:null as unknown,replaceState(data:unknown){this.state=data;}};
    rememberSpatialReturn(history,"/",spatialReturnForGame(0,{worldIndex:1,category:"Исследование",scrollY:0}));
    expect(readSpatialReturn(history.state,"/")).toEqual({worldIndex:0,category:"Все игры",scrollY:0});
  });

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

  it("matches all four crop edges even when source and destination have different aspects", () => {
    const [x, y, sx, sy] = detailOriginPose(origin, "evofish", 390, 844, box);
    expect(box.width*sx).toBeCloseTo(origin.width);
    expect(box.height*sy).toBeCloseTo(origin.height);
    expect(box.left+box.width/2+x-box.width*sx/2).toBeCloseTo(origin.left);
    expect(box.top+box.height/2+y).toBeCloseTo(origin.top+origin.height/2);
    for(const edge of [-1,1]){
      expect(box.left+box.width/2+x+edge*box.width*sx/2).toBeCloseTo(origin.left+origin.width/2+edge*origin.width/2);
      expect(box.top+box.height/2+y+edge*box.height*sy/2).toBeCloseTo(origin.top+origin.height/2+edge*origin.height/2);
    }
  });

  it("keeps poster pixels at16:9 throughout the cover-to-contain crop",()=>{
    for(const p of [0,.1,.5,.9,1]){
      const fit=detailPosterSize(260,162.5,16/9,p);
      expect(fit.width/fit.height).toBeCloseTo(16/9);
    }
    const source=detailPosterSize(260,162.5,16/9,0),destination=detailPosterSize(304,171,16/9,1);
    expect(source.height).toBe(162.5);expect(source.width).toBeGreaterThan(260);
    expect(destination).toEqual({width:304,height:171});
    expect(detailPosterSize(260,162.5,16/9,0,true)).toEqual(detailPosterSize(260,162.5,16/9,1,true));
  });

  it("reveals the plate before copy on the same progress and reverses without a second clock",()=>{
    expect(detailReveal(0)).toEqual({frame:0,copy:0,source:1});
    expect(detailReveal(1)).toEqual({frame:1,copy:1,source:0});
    let previous=detailReveal(0);
    for(const p of [.05,.15,.3,.5,.75,1]){
      const reveal=detailReveal(p);expect(reveal.frame).toBeGreaterThanOrEqual(previous.frame);expect(reveal.copy).toBeLessThanOrEqual(reveal.frame);expect(reveal.source).toBeLessThanOrEqual(previous.source);previous=reveal;
    }
  });

  it("uses a short fade when the game or viewport changed, without returning to an unrelated panel", () => {
    const fade = [0,20,.98,.98,.25];
    expect(detailOriginPose(origin, "quiet-valley", 390, 844, box)).toEqual(fade);
    expect(detailOriginPose(origin, "evofish", 844, 390, box)).toEqual(fade);
    expect(detailOriginPose(origin, "evofish", 390, 640, box)).toEqual(fade);
    expect(detailOriginPose(null, "evofish", 390, 844, box)).toEqual(fade);
  });
});

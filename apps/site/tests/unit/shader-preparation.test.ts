import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Camera, Scene, WebGLRenderer } from "three";
import { prepareSceneShaders } from "../../src/experience/core/ShaderPreparation";
import { SpatialBloom } from "../../src/components/spatial/SpatialBloom";

let time = 0;
beforeEach(() => {
  vi.useFakeTimers(); time = 0;
  vi.spyOn(performance, "now").mockImplementation(() => time);
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
function advance(milliseconds: number) { time += milliseconds; vi.advanceTimersByTime(milliseconds); }

function readyProgram(ready = false) {
  return { program: {} as object | undefined, isReady: vi.fn(() => ready), getUniforms: vi.fn(() => ({})), getAttributes: vi.fn(() => ({})) };
}
function fixture() {
  const material = {}, program = readyProgram();
  const context = { isContextLost: vi.fn(() => false) }, canvas = new EventTarget();
  const properties = { has: vi.fn(() => true), get: vi.fn(() => ({ currentProgram: program, programs: new Map([["front", program]]) })) };
  const renderer = {
    compile: vi.fn(() => new Set([material])), getContext: vi.fn(() => context), domElement: canvas, properties,
  };
  const controller = new AbortController(), scene = {} as Scene, camera = {} as Camera;
  return { material, program, context, canvas, properties, renderer, controller, scene, camera,
    prepare(options?: { timeoutMs?: number; pollMs?: number }) { return prepareSceneShaders(renderer as unknown as WebGLRenderer, scene, camera, controller.signal, options); },
  };
}

describe("cancellable shader preparation", () => {
  it("does not submit or poll an already aborted/lost owner", async () => {
    const aborted = fixture(); aborted.controller.abort();
    expect(await aborted.prepare()).toBe(false);
    expect(aborted.renderer.compile).not.toHaveBeenCalled();
    const lost = fixture(); lost.context.isContextLost.mockReturnValue(true);
    expect(await lost.prepare()).toBe(false);
    expect(lost.renderer.compile).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("aborts before future polling and removes timers/listeners before disposal", async () => {
    const f = fixture(), removeAbort = vi.spyOn(f.controller.signal, "removeEventListener"), removeContext = vi.spyOn(f.canvas, "removeEventListener");
    const pending = f.prepare();
    expect(f.program.isReady).toHaveBeenCalledTimes(1);
    f.controller.abort();
    f.program.program = undefined;
    f.program.isReady.mockImplementation(() => { throw new Error("disposed GL program touched"); });
    advance(10000);
    expect(await pending).toBe(false);
    expect(f.program.isReady).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(removeAbort).toHaveBeenCalledWith("abort", expect.any(Function));
    expect(removeContext).toHaveBeenCalledWith("webglcontextlost", expect.any(Function));
  });

  it("never consults mutable material properties from a future readiness timer", async () => {
    const f = fixture(), pending = f.prepare();
    expect(f.properties.get).toHaveBeenCalledTimes(1);
    f.properties.get.mockImplementation(() => { throw new Error("material properties removed"); });
    f.program.isReady.mockReturnValue(true);
    advance(10);
    expect(await pending).toBe(true);
    expect(f.properties.get).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("waits for an unfinished back side when the current front side is already ready", async () => {
    const f = fixture(), back = readyProgram();
    f.program.isReady.mockReturnValue(true);
    f.properties.get.mockReturnValue({ currentProgram: f.program, programs: new Map([["back", back], ["front", f.program]]) });
    let resolved = false;
    const pending = f.prepare().then(ready => { resolved = true; return ready; });
    await Promise.resolve();
    expect(resolved).toBe(false);
    expect(back.isReady).toHaveBeenCalledTimes(1);
    expect(f.program.isReady).toHaveBeenCalledTimes(1);
    expect(f.program.getUniforms).toHaveBeenCalledTimes(1);
    expect(back.getUniforms).not.toHaveBeenCalled();
    // Program identities are captured before polling. A later properties lookup
    // would race material replacement/disposal and must never be necessary.
    f.properties.get.mockImplementation(() => { throw new Error("material replaced"); });
    advance(10); await Promise.resolve();
    expect(resolved).toBe(false);
    back.isReady.mockReturnValue(true); advance(10);
    expect(await pending).toBe(true);
    expect(back.isReady).toHaveBeenCalledTimes(3);
    expect(f.program.isReady).toHaveBeenCalledTimes(1);
    expect(f.properties.get).toHaveBeenCalledTimes(1);
    expect(back.getUniforms).toHaveBeenCalledTimes(1);
    expect(back.getAttributes).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reflects a ready program once and cancels before any later reflection touch", async () => {
    const ready = fixture(); ready.program.isReady.mockReturnValue(true);
    expect(await ready.prepare()).toBe(true);
    expect(ready.program.getUniforms).toHaveBeenCalledTimes(1);
    expect(ready.program.getAttributes).toHaveBeenCalledTimes(1);

    const before = fixture();
    before.program.isReady.mockImplementation(() => { before.controller.abort(); return true; });
    expect(await before.prepare()).toBe(false);
    expect(before.program.getUniforms).not.toHaveBeenCalled();
    expect(before.program.getAttributes).not.toHaveBeenCalled();

    const during = fixture(); during.program.isReady.mockReturnValue(true);
    during.program.getUniforms.mockImplementation(() => { during.controller.abort(); during.program.program = undefined; return {}; });
    expect(await during.prepare()).toBe(false);
    expect(during.program.getUniforms).toHaveBeenCalledTimes(1);
    expect(during.program.getAttributes).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("checks loss and destroyed handles before any future program query", async () => {
    const lost = fixture(), pendingLost = lost.prepare();
    lost.context.isContextLost.mockReturnValue(true);
    advance(10);
    expect(await pendingLost).toBe(false);
    expect(lost.program.isReady).toHaveBeenCalledTimes(1);

    const disposed = fixture(), pendingDisposed = disposed.prepare();
    disposed.program.program = undefined;
    advance(10);
    expect(await pendingDisposed).toBe(false);
    expect(disposed.program.isReady).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops immediately on context event or abort inside another program's poll", async () => {
    const event = fixture(), pendingEvent = event.prepare();
    event.canvas.dispatchEvent(new Event("webglcontextlost"));
    expect(await pendingEvent).toBe(false);
    expect(vi.getTimerCount()).toBe(0);

    const f = fixture(), another = readyProgram(true);
    f.renderer.compile.mockReturnValue(new Set([f.material, {}]));
    f.properties.get.mockReturnValueOnce({ currentProgram: f.program, programs: new Map([["front", f.program]]) })
      .mockReturnValueOnce({ currentProgram: another, programs: new Map([["front", another]]) });
    f.program.isReady.mockImplementation(() => { f.controller.abort(); return false; });
    expect(await f.prepare()).toBe(false);
    expect(another.isReady).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("has a finite readiness budget and a safe synchronous-submit fallback", async () => {
    const timeout = fixture(), pending = timeout.prepare({ timeoutMs: 25, pollMs: 10 });
    advance(10); advance(15);
    expect(await pending).toBe(false);
    expect(timeout.program.isReady).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);

    const unsupported = fixture();
    unsupported.properties.get.mockReturnValue({} as { currentProgram: typeof unsupported.program; programs: Map<string, typeof unsupported.program> });
    expect(await unsupported.prepare()).toBe(false);
    expect(unsupported.renderer.compile).toHaveBeenCalledTimes(1);
    expect(unsupported.program.isReady).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("settles readiness/query failures without an uncaught timer error", async () => {
    const ready = fixture(); ready.program.isReady.mockReturnValue(true);
    expect(await ready.prepare()).toBe(true);
    const failed = fixture(), pending = failed.prepare();
    failed.program.isReady.mockImplementation(() => { throw new Error("query failed"); });
    advance(10);
    expect(await pending).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("submits the HDR variant synchronously and restores the prior target while pending", async () => {
    const f = fixture(), previous = {}, hdr = {};
    let current = previous;
    const renderer = Object.assign(f.renderer, { getRenderTarget: () => current, setRenderTarget: vi.fn(target => { current = target; }) });
    f.renderer.compile.mockImplementation(() => { expect(current).toBe(hdr); return new Set([f.material]); });
    const bloom = Object.create(SpatialBloom.prototype) as SpatialBloom;
    Object.assign(bloom, { renderer, scene: f.scene, camera: f.camera, composer: { readBuffer: hdr } });
    const pending = bloom.warmup(f.controller.signal);
    expect(current).toBe(previous);
    expect(f.renderer.compile).toHaveBeenCalledTimes(1);
    f.controller.abort();
    expect(await pending).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("prepares HDR then default-framebuffer SRGB and restores the prior target during both waits", async () => {
    const f = fixture(), previous = {}, hdr = {}, direct = readyProgram();
    let current: object | null = previous;
    const renderer = Object.assign(f.renderer, { getRenderTarget: () => current, setRenderTarget: vi.fn((target: object | null) => { current = target; }) });
    f.renderer.compile.mockImplementation(() => {
      if (current === hdr) f.properties.get.mockReturnValue({ currentProgram: f.program, programs: new Map([["hdr", f.program]]) });
      else {
        expect(current).toBeNull();
        f.properties.get.mockReturnValue({ currentProgram: direct, programs: new Map([["hdr", f.program], ["srgb", direct]]) });
      }
      return new Set([f.material]);
    });
    const bloom = Object.create(SpatialBloom.prototype) as SpatialBloom;
    Object.assign(bloom, { renderer, scene: f.scene, camera: f.camera, composer: { readBuffer: hdr } });
    const pending = bloom.warmup(f.controller.signal);
    expect(current).toBe(previous);expect(f.renderer.compile).toHaveBeenCalledTimes(1);
    f.program.isReady.mockReturnValue(true);advance(10);await Promise.resolve();
    expect(f.renderer.compile).toHaveBeenCalledTimes(2);expect(current).toBe(previous);
    expect(direct.getUniforms).not.toHaveBeenCalled();
    direct.isReady.mockReturnValue(true);advance(10);
    expect(await pending).toBe(true);
    expect(direct.getUniforms).toHaveBeenCalledTimes(1);expect(direct.getAttributes).toHaveBeenCalledTimes(1);
    expect(renderer.setRenderTarget.mock.calls.map(([target]) => target)).toEqual([hdr, previous, null, previous]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not touch the renderer or start SRGB work after abort between output variants", async () => {
    const f = fixture(), previous = {}, hdr = {};
    let current: object | null = previous;
    const renderer = Object.assign(f.renderer, { getRenderTarget: vi.fn(() => current), setRenderTarget: vi.fn((target: object | null) => { current = target; }) });
    f.program.isReady.mockReturnValue(true);
    const bloom = Object.create(SpatialBloom.prototype) as SpatialBloom;
    Object.assign(bloom, { renderer, scene: f.scene, camera: f.camera, composer: { readBuffer: hdr } });
    const pending = bloom.warmup(f.controller.signal);
    // HDR is synchronously ready, but its await continuation has not started the
    // second output. Aborting here models model/context teardown at that boundary.
    f.controller.abort();f.renderer.getContext.mockClear();renderer.getRenderTarget.mockClear();
    expect(await pending).toBe(false);
    expect(f.renderer.getContext).not.toHaveBeenCalled();expect(renderer.getRenderTarget).not.toHaveBeenCalled();
    expect(f.renderer.compile).toHaveBeenCalledTimes(1);
    expect(renderer.setRenderTarget.mock.calls.map(([target]) => target)).toEqual([hdr, previous]);
    expect(current).toBe(previous);expect(vi.getTimerCount()).toBe(0);
  });
});

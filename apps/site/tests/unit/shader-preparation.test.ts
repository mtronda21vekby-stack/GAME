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

function fixture() {
  const material = {}, program: { program: object | undefined; isReady: ReturnType<typeof vi.fn<() => boolean>> } = { program: {}, isReady: vi.fn(() => false) };
  const context = { isContextLost: vi.fn(() => false) }, canvas = new EventTarget();
  const properties = { has: vi.fn(() => true), get: vi.fn(() => ({ currentProgram: program })) };
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

    const f = fixture(), another = { program: {}, isReady: vi.fn(() => true) };
    f.renderer.compile.mockReturnValue(new Set([f.material, {}]));
    f.properties.get.mockReturnValueOnce({ currentProgram: f.program }).mockReturnValueOnce({ currentProgram: another });
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
    unsupported.properties.get.mockReturnValue({} as { currentProgram: typeof unsupported.program });
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
});

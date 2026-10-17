import { afterEach, describe, expect, it, vi } from "vitest";
import { usePlatformParallax } from "../../src/components/platform/usePlatformParallax";

const lifecycle = vi.hoisted(() => ({ mount: undefined as undefined | (() => void | (() => void)) }));
vi.mock("react", () => ({ useEffect: (mount: () => void | (() => void)) => { lifecycle.mount = mount; } }));

/** A small event/RAF harness checks the compositor without a browser or WebGL dependency. */
function mountDepth({ compact = false, systemReduced = false, savedReduced = false, paused = false } = {}) {
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  let time = 0;
  const media = (matches: boolean) => Object.assign(new EventTarget(), { matches });
  const motion = media(systemReduced);
  const mobile = media(compact);
  const pointer = media(!compact);
  const view = Object.assign(new EventTarget(), {
    innerHeight: 900,
    scrollY: 0,
    matchMedia: (query: string) => query.includes("prefers-reduced") ? motion : query.includes("max-width") ? mobile : pointer,
  });
  const html = { dataset: { reducedMotion: savedReduced ? "1" : "0" } };
  const doc = Object.assign(new EventTarget(), { documentElement: html, hidden: false });
  const offsets = new Map<string, string>();
  const layer = {
    dataset: { parallaxScroll: "104", parallaxPointer: "18" },
    style: { setProperty: (name: string, value: string) => offsets.set(name, value), removeProperty: (name: string) => offsets.delete(name) },
  };
  const readLayout = vi.fn(() => ({ top: 108 - view.scrollY, left: 0, width: 1280, height: 660, bottom: 768 - view.scrollY }));
  const scene = Object.assign(new EventTarget(), {
    dataset: { parallaxScene: "hero" },
    querySelectorAll: () => [layer],
    getBoundingClientRect: readLayout,
    toggleAttribute: vi.fn(),
    removeAttribute: vi.fn(),
  });
  const root = Object.assign(new EventTarget(), { dataset: {}, querySelectorAll: () => [scene] });
  const disconnect = vi.fn();
  let notifyPreference = () => {};
  vi.stubGlobal("window", view);
  vi.stubGlobal("document", doc);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect = disconnect; });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect = disconnect; });
  vi.stubGlobal("MutationObserver", class {
    constructor(callback: () => void) { notifyPreference = callback; }
    observe() {}
    disconnect = disconnect;
  });
  usePlatformParallax({ current: root as unknown as HTMLElement }, "", paused);
  const unmount = lifecycle.mount?.();
  function settle() {
    let ticks = 0;
    while (frames.size) {
      if (++ticks > 200) throw new Error("The parallax compositor did not become idle");
      const pending = Array.from(frames.values());
      frames.clear();
      time += 1000 / 60;
      pending.forEach(callback => callback(time));
    }
    return ticks;
  }
  function scrollTo(y: number) {
    view.scrollY = y;
    view.dispatchEvent(new Event("scroll"));
  }
  function moveMouse() {
    root.dispatchEvent(Object.assign(new Event("pointermove"), { pointerType: "mouse", clientX: 1100, clientY: 400 }));
  }
  return { frames, offsets, readLayout, disconnect, html, motion, doc, settle, scrollTo, moveMouse,
    notifyPreference: () => notifyPreference(), unmount: () => { if (typeof unmount === "function") unmount(); } };
}

afterEach(() => { vi.unstubAllGlobals(); lifecycle.mount = undefined; });

describe("Platform parallax lifecycle", () => {
  it("settles to idle, avoids layout reads during scroll, and releases scheduled work", () => {
    const depth = mountDepth();
    depth.settle();
    expect(depth.frames.size).toBe(0);
    const initialY = depth.offsets.get("--depth-y");
    depth.scrollTo(280);
    depth.moveMouse();
    expect(depth.settle()).toBeGreaterThan(1);
    expect(depth.offsets.get("--depth-y")).not.toBe(initialY);
    expect(depth.offsets.get("--depth-x")).not.toBe("0px");
    expect(depth.readLayout).toHaveBeenCalledTimes(1);
    expect(depth.frames.size).toBe(0);
    depth.scrollTo(320);
    depth.doc.hidden = true;
    depth.doc.dispatchEvent(new Event("visibilitychange"));
    expect(depth.frames.size).toBe(0);
    depth.scrollTo(340);
    expect(depth.frames.size).toBe(0);
    depth.doc.hidden = false;
    depth.doc.dispatchEvent(new Event("visibilitychange"));
    depth.settle();
    depth.scrollTo(360);
    depth.unmount();
    expect(depth.frames.size).toBe(0);
    expect(depth.offsets.size).toBe(0);
    expect(depth.disconnect).toHaveBeenCalledTimes(3);
    depth.scrollTo(400);
    expect(depth.frames.size).toBe(0);
  });

  it("respects both motion preferences and ignores cursor movement on compact layouts", () => {
    const depth = mountDepth({ compact: true, systemReduced: true });
    depth.scrollTo(280);
    depth.moveMouse();
    expect(depth.frames.size).toBe(0);
    expect(depth.offsets.get("--depth-y")).toBe("0px");
    depth.motion.matches = false;
    depth.motion.dispatchEvent(new Event("change"));
    depth.settle();
    expect(Number.parseFloat(depth.offsets.get("--depth-y")!)).toBeGreaterThan(0);
    depth.moveMouse();
    depth.settle();
    expect(depth.offsets.get("--depth-x")).toBe("0px");
    depth.html.dataset.reducedMotion = "1";
    depth.notifyPreference();
    expect(depth.frames.size).toBe(0);
    expect(depth.offsets.get("--depth-y")).toBe("0px");
    depth.scrollTo(400);
    expect(depth.frames.size).toBe(0);
    depth.unmount();
  });

  it("keeps the page pause static without changing a saved preference", () => {
    const depth = mountDepth({ paused: true });
    depth.scrollTo(280);
    depth.moveMouse();
    expect(depth.frames.size).toBe(0);
    expect(depth.offsets.get("--depth-y")).toBe("0px");
    expect(depth.html.dataset.reducedMotion).toBe("0");
    depth.unmount();
  });
});

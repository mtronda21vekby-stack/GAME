import { afterEach, describe, expect, it, vi } from "vitest";
import { FrameLoop, type FrameLoopHost } from "../../src/experience/core/FrameLoop";
import { RendererHost } from "../../src/experience/core/RendererHost";
import { RuntimeBudget, type RuntimeBudgetSnapshot } from "../../src/experience/quality/QualityManager";

function fakeHost() {
  let time = 1000, hidden = false, id = 0;
  const frames = new Map<number, (time: number) => void>(), visibility = new Set<() => void>(), errors: unknown[] = [];
  const host: FrameLoopHost = {
    now: () => time,
    request: vi.fn(callback => { const next = id++; frames.set(next, callback); return next; }),
    cancel: vi.fn(frame => { frames.delete(frame); }),
    hidden: () => hidden,
    onVisibilityChange(callback) { visibility.add(callback); return () => { visibility.delete(callback); }; },
    reportError: error => { errors.push(error); },
  };
  return { host, frames, visibility, errors,
    at(value: number) { time = value; },
    visible(value: boolean, at: number) { time = at; hidden = !value; for (const listener of visibility) listener(); },
    fire(at: number) { time = at; const due = [...frames.values()]; frames.clear(); for (const callback of due) callback(at); },
  };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe("shared active frame loop", () => {
  it("lazily coalesces owners into one native frame and uses one active timestamp", () => {
    const fake = fakeHost(), loop = new FrameLoop(fake.host), seen: number[] = [];
    expect(fake.visibility.size).toBe(0);
    loop.request(now => { seen.push(now, loop.now()); loop.request(next => seen.push(next), "LAB"); }, "LAB");
    loop.request(now => seen.push(now), "case");
    expect(fake.visibility.size).toBe(1);
    expect(fake.frames.size).toBe(1);
    fake.fire(1016);
    expect(seen).toEqual([1016, 1016, 1016]);
    expect(fake.frames.size).toBe(1);
    expect(loop.snapshot()).toMatchObject({ queued: 1, labels: ["LAB"], frames: 1, callbacks: 2 });
    fake.fire(1032);
    expect(seen.at(-1)).toBe(1032);
    expect(fake.frames.size).toBe(0);
    loop.dispose();
    expect(fake.visibility.size).toBe(0);
  });

  it("keeps queued owners across hidden time without a resume jump", () => {
    const fake = fakeHost(), loop = new FrameLoop(fake.host), seen: number[] = [];
    loop.request(now => seen.push(now), "case");
    fake.visible(false, 1200);
    expect(fake.frames.size).toBe(0);
    fake.at(6200);
    expect(loop.now()).toBe(1200);
    loop.request(now => seen.push(now), "LAB");
    expect(fake.frames.size).toBe(0);
    fake.visible(true, 6200);
    expect(fake.frames.size).toBe(1);
    fake.fire(6216);
    expect(seen).toEqual([1216, 1216]);
    expect(loop.snapshot()).toMatchObject({ queued: 0, hidden: false, callbacks: 2 });
    loop.dispose();
  });

  it("cancels another due owner and isolates failures without losing future work", () => {
    const fake = fakeHost(), loop = new FrameLoop(fake.host), second = vi.fn(), last = vi.fn();
    let canceled = 0;
    loop.request(() => { loop.cancel(canceled); throw new Error("owner failed"); }, "broken");
    canceled = loop.request(second, "canceled");
    loop.request(last, "native-case");
    fake.fire(1016);
    expect(second).not.toHaveBeenCalled();
    expect(last).toHaveBeenCalledWith(1016);
    expect(fake.errors).toHaveLength(1);
    expect(fake.frames.size).toBe(0);
    const id = loop.request(last);
    loop.cancel(id);
    expect(fake.frames.size).toBe(0);
    loop.dispose();
  });
});

describe("renderer viewport identity", () => {
  it("updates a DPR-only backing change, while stable CSS size and DPR do no resize work", () => {
    vi.stubGlobal("window", { devicePixelRatio: 3 });
    const renderer = { setPixelRatio: vi.fn(), setSize: vi.fn() };
    const host = Object.create(RendererHost.prototype) as RendererHost;
    Object.assign(host, { renderer, width: 0, height: 0, pixelRatio: 0, dprCap: 1.5 });
    host.resize(393, 852);
    expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(1.5);
    Object.assign(window, { devicePixelRatio: 1 });
    host.resize(393, 852);
    expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(1);
    expect(renderer.setSize).toHaveBeenCalledTimes(2);
    host.resize(393, 852);
    expect(renderer.setSize).toHaveBeenCalledTimes(2);
  });
});

function budgetFixture() {
  const budget = new RuntimeBudget({ warmupMs: 0, windowMs: 100, cooldownMs: 500, minimumSamples: 4, recoveryWindows: 3 });
  let now = 1000;
  budget.reset(now);
  const changes: Array<{ now: number; snapshot: RuntimeBudgetSnapshot }> = [];
  return { budget, changes, get now() { return now; },
    feed(delta: number, count: number) { for (let index = 0; index < count; index++) { now += delta; const snapshot = budget.sample(delta, now); if (snapshot) changes.push({ now, snapshot }); } },
    skip(milliseconds: number) { now += milliseconds; },
  };
}

describe("bounded runtime budget", () => {
  it("ignores one bad frame but steps through bounded levels for sustained slow windows", () => {
    const isolated = budgetFixture();
    isolated.feed(16, 20); isolated.feed(150, 1); isolated.feed(16, 40);
    expect(isolated.budget.level).toBe(0);
    expect(isolated.changes).toEqual([]);

    const sustained = budgetFixture();
    sustained.feed(40, 500);
    expect(sustained.changes.map(change => change.snapshot.level)).toEqual([1, 2, 3]);
    expect(sustained.changes[0].snapshot.completedWindows).toBe(2);
    expect(sustained.budget.level).toBe(3);
    for (let index = 1; index < sustained.changes.length; index++) expect(sustained.changes[index].now - sustained.changes[index - 1].now).toBeGreaterThanOrEqual(500);
  });

  it("requires cooldown and longer fast evidence before recovering one level", () => {
    const fixture = budgetFixture();
    fixture.feed(40, 8);
    expect(fixture.budget.level).toBe(1);
    fixture.feed(16, 20);
    expect(fixture.budget.level).toBe(1);
    expect(fixture.budget.snapshot().phase).toBe("cooldown");
    fixture.feed(16, 64);
    expect(fixture.budget.level).toBe(0);
    expect(fixture.changes.map(change => change.snapshot.reason)).toEqual(["sustained-pressure", "stable-recovery"]);
  });

  it("discards partial evidence on suspension and retains quality across reset", () => {
    const fixture = budgetFixture();
    fixture.feed(40, 4);
    expect(fixture.budget.snapshot().pressureWindows).toBe(1);
    fixture.budget.suspend(true, fixture.now);
    fixture.skip(5000); fixture.feed(1000, 1);
    expect(fixture.budget.level).toBe(0);
    expect(fixture.budget.snapshot()).toMatchObject({ suspended: true, pressureWindows: 0, frame: { count: 0 } });
    fixture.budget.suspend(false, fixture.now);
    fixture.feed(40, 4);
    expect(fixture.budget.level).toBe(0);
    fixture.feed(40, 4);
    expect(fixture.budget.level).toBe(1);
    fixture.budget.reset(fixture.now);
    expect(fixture.budget.snapshot()).toMatchObject({ level: 1, pressureWindows: 0, recoveryWindows: 0, frame: { count: 0 } });
  });
});

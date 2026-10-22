import { describe, expect, it } from "vitest";
import { FrameSampler } from "../../src/experience/quality/FrameSampler";

describe("recent bounded frame samples", () => {
  it("replaces the initial480 intervals instead of freezing early performance forever", () => {
    const sampler = new FrameSampler(0, 100);
    for (let index = 0; index < 480; index++) sampler.add(16, index * 16);
    for (let index = 0; index < 480; index++) sampler.add(40, 8000 + index * 40);
    expect(sampler.snapshot(30000)).toMatchObject({ count: 480, p50: 40, p95: 40, worst: 40, droppedFrames: 480, complete: true });
  });

  it("accepts a zero origin, respects warmup and resets the rolling cursor", () => {
    const sampler = new FrameSampler(600, 100);
    sampler.add(16, 0); sampler.add(16, 100); sampler.add(20, 600);
    expect(sampler.snapshot(700)).toMatchObject({ count: 1, p50: 20, complete: true });
    sampler.reset(1000);
    sampler.add(40, 1599); sampler.add(12, 1600);
    expect(sampler.snapshot(1700)).toMatchObject({ count: 1, p50: 12, worst: 12, complete: true });
  });

  it("does not let invalid intervals poison later percentiles", () => {
    const sampler = new FrameSampler(0, 100);
    for (const value of [NaN, Infinity, -1, 0]) sampler.add(value, 1);
    sampler.add(16, NaN); sampler.add(16, 0); sampler.add(20, 100);
    expect(sampler.snapshot(100)).toMatchObject({ count: 2, p50: 16, p95: 20, complete: true });
  });
});

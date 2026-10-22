export type FrameSample = {
  count: number;
  duration: number;
  p50: number;
  p95: number;
  worst: number;
  droppedFrames: number;
  repeatedSlowFrames: number;
  complete: boolean;
};

const EMPTY_SAMPLE: FrameSample = { count: 0, duration: 0, p50: 0, p95: 0, worst: 0, droppedFrames: 0, repeatedSlowFrames: 0, complete: false };

function percentile(sorted: number[], amount: number) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * amount) - 1))];
}

export class FrameSampler {
  private readonly warmupMs: number;
  private readonly sampleMs: number;
  private startedAt: number | null = null;
  private samples: number[] = [];
  private nextSample = 0;

  constructor(warmupMs = 600, sampleMs = 3_000) {
    this.warmupMs = warmupMs;
    this.sampleMs = sampleMs;
  }

  add(frameTime: number, now: number) {
    if (!Number.isFinite(frameTime) || frameTime <= 0 || !Number.isFinite(now)) return;
    if (this.startedAt === null) this.startedAt = now;
    if (now - this.startedAt < this.warmupMs) return;
    if (this.samples.length < 480) this.samples.push(frameTime);
    else {
      this.samples[this.nextSample] = frameTime;
      this.nextSample = (this.nextSample + 1) % 480;
    }
  }

  snapshot(now = performance.now()): FrameSample {
    if (this.startedAt === null || !this.samples.length || !Number.isFinite(now)) return { ...EMPTY_SAMPLE };
    const sorted = [...this.samples].sort((a, b) => a - b);
    const duration = Math.max(0, now - this.startedAt - this.warmupMs);
    return {
      count: sorted.length,
      duration,
      p50: percentile(sorted, 0.5),
      p95: percentile(sorted, 0.95),
      worst: sorted[sorted.length - 1],
      droppedFrames: sorted.filter((frame) => frame > 34).length,
      repeatedSlowFrames: sorted.filter((frame) => frame > 45).length,
      complete: duration >= this.sampleMs,
    };
  }

  reset(now = performance.now()) {
    this.startedAt = Number.isFinite(now) ? now : null;
    this.samples = [];
    this.nextSample = 0;
  }
}

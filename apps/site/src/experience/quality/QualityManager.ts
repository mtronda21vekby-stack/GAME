import type { BlackCrownExperienceQuality } from "../experienceConfig";
import type { QualityTier } from "../types";
import { readDeviceCapabilities } from "./DeviceCapabilities";
import { QUALITY_PRESETS, type QualityPreset } from "./qualityPresets";
import { FrameSampler, type FrameSample } from "./FrameSampler";

export function selectAutoQuality(): QualityTier {
  const device = readDeviceCapabilities();
  if (device.reducedMotion || device.saveData || device.mobileViewport || device.coarsePointer) return "low";
  if ((device.memory !== null && device.memory <= 4) || device.cores <= 4) return "low";
  if ((device.memory !== null && device.memory >= 8) && device.cores >= 8) return "high";
  return "medium";
}

export class QualityManager {
  private requested: BlackCrownExperienceQuality;
  private tier: QualityTier;
  private automaticDowngradeUsed = false;

  constructor(requested: BlackCrownExperienceQuality) {
    this.requested = requested;
    this.tier = requested === "auto" ? selectAutoQuality() : requested;
  }

  get preset(): QualityPreset {
    return QUALITY_PRESETS[this.tier];
  }

  setRequested(requested: BlackCrownExperienceQuality) {
    this.requested = requested;
    this.tier = requested === "auto" ? selectAutoQuality() : requested;
    return this.preset;
  }

  get requestedQuality() {
    return this.requested;
  }

  considerAutomaticDowngrade(sample: FrameSample): QualityPreset | null {
    if (this.requested !== "auto" || this.automaticDowngradeUsed || !sample.complete) return null;
    const sustained = sample.p95 > 29 || sample.repeatedSlowFrames >= Math.max(4, Math.ceil(sample.count * 0.04));
    if (!sustained || this.tier === "low") return null;
    this.automaticDowngradeUsed = true;
    this.tier = this.tier === "high" ? "medium" : "low";
    return this.preset;
  }
}

export type RuntimeBudgetLevel = 0 | 1 | 2 | 3;
export type RuntimeBudgetOptions = {
  warmupMs?: number;
  windowMs?: number;
  cooldownMs?: number;
  slowP95Ms?: number;
  recoveryP95Ms?: number;
  pressureWindows?: number;
  recoveryWindows?: number;
  minimumSamples?: number;
  maxLevel?: RuntimeBudgetLevel;
};
export type RuntimeBudgetSnapshot = {
  level: RuntimeBudgetLevel;
  revision: number;
  reason: "initial" | "sustained-pressure" | "stable-recovery";
  phase: "warmup" | "sampling" | "cooldown" | "suspended";
  suspended: boolean;
  pressureWindows: number;
  recoveryWindows: number;
  completedWindows: number;
  cooldownUntil: number;
  frame: FrameSample;
};

const emptyFrame = (): FrameSample => ({ count: 0, duration: 0, p50: 0, p95: 0, worst: 0, droppedFrames: 0, repeatedSlowFrames: 0, complete: false });

/** Repeated evidence for the existing runtime, independent of its visual feature mapping. */
export class RuntimeBudget {
  private readonly options: Required<RuntimeBudgetOptions>;
  private readonly sampler: FrameSampler;
  private currentLevel: RuntimeBudgetLevel = 0;
  private revision = 0;
  private reason: RuntimeBudgetSnapshot["reason"] = "initial";
  private suspended = false;
  private pressure = 0;
  private recovery = 0;
  private completedWindows = 0;
  private cooldownUntil = 0;
  private warmupUntil: number | null = null;
  private windowStart = 0;
  private latestNow = 0;
  private samplesInWindow = 0;
  private frame = emptyFrame();

  constructor(options: RuntimeBudgetOptions = {}) {
    this.options = {
      warmupMs: options.warmupMs ?? 600,
      windowMs: options.windowMs ?? 2000,
      cooldownMs: options.cooldownMs ?? 8000,
      slowP95Ms: options.slowP95Ms ?? 29,
      recoveryP95Ms: options.recoveryP95Ms ?? 20,
      pressureWindows: options.pressureWindows ?? 2,
      recoveryWindows: options.recoveryWindows ?? 4,
      minimumSamples: options.minimumSamples ?? 8,
      maxLevel: options.maxLevel ?? 3,
    };
    this.sampler = new FrameSampler(0, this.options.windowMs);
  }

  get level() { return this.currentLevel; }

  private begin(now: number, warmup: boolean) {
    this.warmupUntil = now + (warmup ? this.options.warmupMs : 0);
    this.windowStart = this.warmupUntil;
    this.samplesInWindow = 0;
    this.sampler.reset(this.windowStart);
  }

  /** Feed raw foreground intervals, never a clamped simulation delta or hidden gap. */
  sample(delta: number, now: number): RuntimeBudgetSnapshot | null {
    if (!Number.isFinite(delta) || delta <= 0 || !Number.isFinite(now) || this.suspended) return null;
    if (this.warmupUntil !== null && now < this.latestNow) this.reset(now);
    this.latestNow = now;
    if (this.warmupUntil === null) this.begin(now, true);
    if (now < this.warmupUntil!) return null;
    this.sampler.add(delta, now);
    this.samplesInWindow += 1;
    if (now - this.windowStart < this.options.windowMs || this.samplesInWindow < this.options.minimumSamples) return null;
    this.frame = this.sampler.snapshot(now);
    this.completedWindows += 1;
    this.begin(now, false);
    if (now < this.cooldownUntil) { this.pressure = this.recovery = 0; return null; }

    const slow = this.frame.p95 > this.options.slowP95Ms || this.frame.repeatedSlowFrames >= Math.max(4, Math.ceil(this.frame.count * 0.1));
    const fast = this.frame.p95 <= this.options.recoveryP95Ms && this.frame.repeatedSlowFrames === 0;
    this.pressure = slow ? Math.min(this.options.pressureWindows, this.pressure + 1) : 0;
    this.recovery = fast ? Math.min(this.options.recoveryWindows, this.recovery + 1) : 0;
    let next = this.currentLevel;
    if (this.pressure >= this.options.pressureWindows && next < this.options.maxLevel) {
      next = (next + 1) as RuntimeBudgetLevel;
      this.reason = "sustained-pressure";
    } else if (this.recovery >= this.options.recoveryWindows && next > 0) {
      next = (next - 1) as RuntimeBudgetLevel;
      this.reason = "stable-recovery";
    }
    if (next === this.currentLevel) return null;
    this.currentLevel = next;
    this.revision += 1;
    this.pressure = this.recovery = 0;
    this.cooldownUntil = now + this.options.cooldownMs;
    return this.snapshot(now);
  }

  /** A pause, lost context or inactive phase discards partial evidence, not quality. */
  suspend(value: boolean, now = this.latestNow) {
    if (value === this.suspended) return;
    this.suspended = value;
    this.reset(now);
  }

  reset(now?: number) {
    this.pressure = this.recovery = 0;
    this.frame = emptyFrame();
    this.warmupUntil = null;
    this.samplesInWindow = 0;
    if (now !== undefined && Number.isFinite(now)) {
      this.latestNow = now;
      this.begin(now, true);
    }
  }

  /** Cached local diagnostics; no per-frame sort, React state, persistence or network. */
  snapshot(now = this.latestNow): RuntimeBudgetSnapshot {
    return {
      level: this.currentLevel, revision: this.revision, reason: this.reason,
      phase: this.suspended ? "suspended" : this.warmupUntil === null || now < this.warmupUntil ? "warmup" : now < this.cooldownUntil ? "cooldown" : "sampling",
      suspended: this.suspended, pressureWindows: this.pressure, recoveryWindows: this.recovery,
      completedWindows: this.completedWindows, cooldownUntil: this.cooldownUntil, frame: { ...this.frame },
    };
  }
}

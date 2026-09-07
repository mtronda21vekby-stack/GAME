import { EXPERIENCE_PHASE_RANGES } from "../../experience-shell/experienceShellConfig";

const MIX_EPSILON = 0.00005;
const FINAL_CROWN_PASS_MIDPOINT = (
  EXPERIENCE_PHASE_RANGES.finalCrownPass[0] + EXPERIENCE_PHASE_RANGES.finalCrownPass[1]
) / 2;

export type ExperienceAudioMix = {
  crown: number;
  ocean: number;
  vault: number;
  network: number;
};

type AmbienceKey = keyof ExperienceAudioMix;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothRange(progress: number, start: number, end: number) {
  const value = clamp01((progress - start) / Math.max(0.0001, end - start));
  return value * value * (3 - 2 * value);
}

/** Pure timeline mix: deterministic in either scroll direction and safe to unit test. */
export function evaluateExperienceAudioMix(progress: number, reducedMotion: boolean): ExperienceAudioMix {
  const value = clamp01(progress);
  const ambienceScale = reducedMotion ? 0.64 : 1;
  const crownOpening = 1 - smoothRange(value, ...EXPERIENCE_PHASE_RANGES.crownToOcean);
  const crownFinal = smoothRange(value, EXPERIENCE_PHASE_RANGES.finalCrownPass[0], FINAL_CROWN_PASS_MIDPOINT)
    * (1 - smoothRange(value, FINAL_CROWN_PASS_MIDPOINT, EXPERIENCE_PHASE_RANGES.finalCrownPass[1]));
  const ocean = smoothRange(value, ...EXPERIENCE_PHASE_RANGES.crownToOcean)
    * (1 - smoothRange(value, ...EXPERIENCE_PHASE_RANGES.oceanToVault));
  const vault = smoothRange(value, ...EXPERIENCE_PHASE_RANGES.oceanToVault)
    * (1 - smoothRange(value, ...EXPERIENCE_PHASE_RANGES.vaultToNetwork));
  const network = smoothRange(value, ...EXPERIENCE_PHASE_RANGES.vaultToNetwork)
    * (1 - smoothRange(value, ...EXPERIENCE_PHASE_RANGES.finalCrownPass));

  return {
    crown: Math.max(crownOpening, crownFinal) * 0.012 * ambienceScale,
    ocean: ocean * 0.014 * ambienceScale,
    vault: vault * 0.016 * ambienceScale,
    network: network * 0.009 * ambienceScale,
  };
}

function audioContextConstructor() {
  const target = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? target.webkitAudioContext;
}

function connectSpatially(context: AudioContext, source: AudioNode, destination: AudioNode, pan: number) {
  if (typeof context.createStereoPanner !== "function") {
    source.connect(destination);
    return;
  }
  const panner = context.createStereoPanner();
  panner.pan.value = pan;
  source.connect(panner);
  panner.connect(destination);
}

export class AudioController {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly ambienceGains: Partial<Record<AmbienceKey, GainNode>> = {};
  private sources: AudioScheduledSourceNode[] = [];
  private enabled = false;
  private disposed = false;
  private generation = 0;
  private mix = evaluateExperienceAudioMix(0, false);
  private appliedMix: ExperienceAudioMix | null = null;

  update(progress: number, reducedMotion: boolean) {
    this.mix = evaluateExperienceAudioMix(progress, reducedMotion);
    this.applyMix();
  }

  async setEnabled(enabled: boolean) {
    if (this.disposed) return;
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
      return;
    }
    if (this.context) {
      await this.context.resume().catch(() => undefined);
      return;
    }

    const Context = audioContextConstructor();
    if (!Context) return;
    const generation = ++this.generation;
    const context = new Context();
    this.context = context;

    try {
      this.buildGraph(context);
      // Called directly by SOUND ON, so resume happens inside the user gesture.
      const resumePromise = context.resume();
      this.applyMix();
      await resumePromise;
      if (!this.enabled || this.disposed || generation !== this.generation) return;
    } catch {
      if (generation === this.generation) this.stop();
    }
  }

  private buildGraph(context: AudioContext) {
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    master.gain.value = 0.0001;
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 2.5;
    compressor.attack.value = 0.025;
    compressor.release.value = 0.4;
    master.connect(compressor);
    compressor.connect(context.destination);
    master.gain.setTargetAtTime(0.9, context.currentTime, 0.08);
    this.master = master;

    this.createAmbience(context, master, "crown", -0.16, [
      [42, "sine", 0.72],
      [71, "triangle", 0.16],
    ], "lowpass", 190);
    this.createAmbience(context, master, "ocean", 0.14, [
      [31, "sine", 0.58],
      [93, "sine", 0.12],
    ], "lowpass", 240);
    this.createAmbience(context, master, "vault", -0.08, [
      [35, "sawtooth", 0.22],
      [52, "sine", 0.55],
    ], "lowpass", 150);
    this.createAmbience(context, master, "network", 0.18, [
      [147, "sine", 0.25],
      [221, "triangle", 0.09],
    ], "bandpass", 310);
  }

  private createAmbience(
    context: AudioContext,
    destination: AudioNode,
    key: AmbienceKey,
    pan: number,
    voices: ReadonlyArray<readonly [number, OscillatorType, number]>,
    filterType: BiquadFilterType,
    filterFrequency: number,
  ) {
    const bus = context.createGain();
    const filter = context.createBiquadFilter();
    bus.gain.value = 0;
    filter.type = filterType;
    filter.frequency.value = filterFrequency;
    filter.Q.value = 0.65;
    filter.connect(bus);
    connectSpatially(context, bus, destination, pan);
    this.ambienceGains[key] = bus;

    voices.forEach(([frequency, type, level], index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index === 0 ? -3 : 4;
      gain.gain.value = level;
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start();
      this.sources.push(oscillator);
    });
  }

  private applyMix() {
    const context = this.context;
    if (!context) return;
    const now = context.currentTime;
    const applied = this.appliedMix ?? {
      crown: Number.NaN,
      ocean: Number.NaN,
      vault: Number.NaN,
      network: Number.NaN,
    };
    const schedule = (key: AmbienceKey, node: GainNode | null | undefined) => {
      const value = this.mix[key];
      if (!node || (Number.isFinite(applied[key]) && Math.abs(value - applied[key]) <= MIX_EPSILON)) return;
      node.gain.cancelScheduledValues(now);
      node.gain.setTargetAtTime(value, now, 0.14);
      applied[key] = value;
    };
    schedule("crown", this.ambienceGains.crown);
    schedule("ocean", this.ambienceGains.ocean);
    schedule("vault", this.ambienceGains.vault);
    schedule("network", this.ambienceGains.network);
    this.appliedMix = applied;
  }

  private stop() {
    this.generation += 1;
    const context = this.context;
    this.sources.forEach((source) => {
      try { source.stop(); } catch { /* already stopped */ }
      source.disconnect();
    });
    this.sources = [];
    Object.values(this.ambienceGains).forEach((gain) => gain?.disconnect());
    this.master?.disconnect();
    if (context) void context.close().catch(() => undefined);
    this.context = null;
    this.master = null;
    this.appliedMix = null;
    for (const key of Object.keys(this.ambienceGains) as AmbienceKey[]) delete this.ambienceGains[key];
  }

  dispose() {
    this.disposed = true;
    this.enabled = false;
    this.stop();
  }
}

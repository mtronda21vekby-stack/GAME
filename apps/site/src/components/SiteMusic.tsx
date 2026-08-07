import React from "react";
import "../styles/site-music.css";

const ENABLED_KEY = "bc.siteMusic.enabled.v1";
const VOLUME_KEY = "bc.siteMusic.volume.v1";

type MusicState = "waiting" | "playing" | "paused" | "unsupported";

type Engine = {
  context: AudioContext;
  master: GainNode;
  oscillators: OscillatorNode[];
  pulseTimer: number | null;
};

function readEnabled() {
  try {
    return localStorage.getItem(ENABLED_KEY) !== "0";
  } catch {
    return true;
  }
}

function readVolume() {
  try {
    const value = Number(localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.34;
  } catch {
    return 0.34;
  }
}

function storeEnabled(enabled: boolean) {
  try {
    localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // Storage is optional.
  }
}

function storeVolume(volume: number) {
  try {
    localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {
    // Storage is optional.
  }
}

function audioContextCtor() {
  const target = window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  };
  return window.AudioContext ?? target.webkitAudioContext;
}

function createPad(context: AudioContext, destination: AudioNode, frequency: number, type: OscillatorType, level: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = level;
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start();
  return oscillator;
}

function schedulePulse(engine: Engine) {
  const { context, master } = engine;
  if (context.state !== "running") return;

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(42, now);
  oscillator.frequency.exponentialRampToValueAtTime(34, now + 0.55);
  filter.type = "lowpass";
  filter.frequency.value = 180;
  filter.Q.value = 0.6;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.11, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.82);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  oscillator.start(now);
  oscillator.stop(now + 0.9);
}

function buildEngine(volume: number): Engine | null {
  const Context = audioContextCtor();
  if (!Context) return null;

  const context = new Context();
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  const air = context.createBiquadFilter();

  master.gain.value = 0.0001;
  compressor.threshold.value = -22;
  compressor.knee.value = 18;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.04;
  compressor.release.value = 0.6;
  air.type = "lowpass";
  air.frequency.value = 1850;
  air.Q.value = 0.35;

  master.connect(air);
  air.connect(compressor);
  compressor.connect(context.destination);

  const oscillators = [
    createPad(context, master, 36.71, "sine", 0.09),
    createPad(context, master, 55, "sine", 0.055),
    createPad(context, master, 73.42, "triangle", 0.028),
    createPad(context, master, 110, "sine", 0.018),
    createPad(context, master, 146.83, "triangle", 0.009),
    createPad(context, master, 220, "sine", 0.005),
  ];

  // Slow breathing modulation. It changes the drone without requiring any media file.
  const lfo = context.createOscillator();
  const lfoGain = context.createGain();
  lfo.type = "sine";
  lfo.frequency.value = 0.055;
  lfoGain.gain.value = Math.max(0.005, volume * 0.018);
  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);
  lfo.start();
  oscillators.push(lfo);

  return { context, master, oscillators, pulseTimer: null };
}

function targetGain(volume: number) {
  return Math.max(0.0001, Math.min(0.19, volume * 0.19));
}

export function SiteMusic() {
  const engineRef = React.useRef<Engine | null>(null);
  const [enabled, setEnabled] = React.useState(readEnabled);
  const [volume, setVolume] = React.useState(readVolume);
  const [state, setState] = React.useState<MusicState>(() => (audioContextCtor() ? "waiting" : "unsupported"));
  const [expanded, setExpanded] = React.useState(false);

  const stopPulseTimer = React.useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.pulseTimer === null) return;
    window.clearInterval(engine.pulseTimer);
    engine.pulseTimer = null;
  }, []);

  const startPulseTimer = React.useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.pulseTimer !== null) return;
    schedulePulse(engine);
    engine.pulseTimer = window.setInterval(() => schedulePulse(engine), 4100);
  }, []);

  const start = React.useCallback(async () => {
    if (!enabled || state === "unsupported") return;

    let engine = engineRef.current;
    if (!engine) {
      engine = buildEngine(volume);
      if (!engine) {
        setState("unsupported");
        return;
      }
      engineRef.current = engine;
    }

    try {
      await engine.context.resume();
      const now = engine.context.currentTime;
      engine.master.gain.cancelScheduledValues(now);
      engine.master.gain.setValueAtTime(Math.max(0.0001, engine.master.gain.value), now);
      engine.master.gain.exponentialRampToValueAtTime(targetGain(volume), now + 0.9);
      startPulseTimer();
      setState("playing");
    } catch {
      setState("waiting");
    }
  }, [enabled, startPulseTimer, state, volume]);

  const pause = React.useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) {
      setState("paused");
      return;
    }

    stopPulseTimer();
    const now = engine.context.currentTime;
    engine.master.gain.cancelScheduledValues(now);
    engine.master.gain.setValueAtTime(Math.max(0.0001, engine.master.gain.value), now);
    engine.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    window.setTimeout(() => {
      void engine.context.suspend().catch(() => undefined);
    }, 320);
    setState("paused");
  }, [stopPulseTimer]);

  React.useEffect(() => {
    if (!enabled || state !== "waiting") return;

    const unlock = () => {
      void start();
    };

    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("touchend", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchend", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [enabled, start, state]);

  React.useEffect(() => {
    const engine = engineRef.current;
    if (!engine || state !== "playing") return;
    const now = engine.context.currentTime;
    engine.master.gain.cancelScheduledValues(now);
    engine.master.gain.setTargetAtTime(targetGain(volume), now, 0.16);
  }, [state, volume]);

  React.useEffect(() => {
    const onVisibility = () => {
      const engine = engineRef.current;
      if (!engine || !enabled) return;
      if (document.visibilityState === "hidden" && state === "playing") {
        stopPulseTimer();
        void engine.context.suspend().catch(() => undefined);
      } else if (document.visibilityState === "visible" && state === "playing") {
        void engine.context.resume().then(startPulseTimer).catch(() => undefined);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled, startPulseTimer, state, stopPulseTimer]);

  React.useEffect(() => {
    return () => {
      stopPulseTimer();
      const engine = engineRef.current;
      engine?.oscillators.forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch {
          // Already stopped.
        }
      });
      void engine?.context.close().catch(() => undefined);
      engineRef.current = null;
    };
  }, [stopPulseTimer]);

  if (state === "unsupported") return null;

  const toggle = () => {
    if (state === "playing") {
      setEnabled(false);
      storeEnabled(false);
      void pause();
      return;
    }

    setEnabled(true);
    storeEnabled(true);
    void start();
  };

  const statusLabel = state === "playing" ? "ON" : state === "waiting" ? "TAP" : "OFF";

  return (
    <aside className="bcSiteMusic" data-state={state} data-expanded={expanded ? "true" : "false"} aria-label="Музыка BlackCrown">
      <button
        type="button"
        className="bcSiteMusic__toggle"
        onClick={toggle}
        aria-pressed={state === "playing"}
        title={state === "playing" ? "Выключить музыку" : "Включить музыку"}
      >
        <span className="bcSiteMusic__bars" aria-hidden="true"><i /><i /><i /></span>
        <span className="bcSiteMusic__copy"><strong>MUSIC</strong><small>{statusLabel}</small></span>
      </button>

      <button
        type="button"
        className="bcSiteMusic__expand"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label="Настроить громкость"
      >
        {expanded ? "×" : "···"}
      </button>

      {expanded ? (
        <label className="bcSiteMusic__volume">
          <span>VOL</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={volume}
            onChange={(event) => {
              const next = Number(event.currentTarget.value);
              setVolume(next);
              storeVolume(next);
            }}
          />
          <output>{Math.round(volume * 100)}</output>
        </label>
      ) : null}
    </aside>
  );
}

export default SiteMusic;

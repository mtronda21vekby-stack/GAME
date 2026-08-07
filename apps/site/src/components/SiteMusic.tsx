import React from "react";
import "../styles/site-music.css";

const ENABLED_KEY = "bc.siteMusic.enabled.v3";
const VOLUME_KEY = "bc.siteMusic.volume.v3";
const SAMPLE_RATE = 16_000;
const TRACK_VERSION = "uploaded-loop-v3-ios";
const TRACK_PARTS = [
  "/audio/blackcrown-loop-part-00.txt",
  "/audio/blackcrown-loop-part-01.txt",
  "/audio/blackcrown-loop-part-02.txt",
  "/audio/blackcrown-loop-part-03.txt",
  "/audio/blackcrown-loop-part-04.txt",
  "/audio/blackcrown-loop-part-05.txt",
] as const;

type MusicState = "loading" | "waiting" | "playing" | "paused" | "error" | "unsupported";

type Engine = {
  context: AudioContext;
  master: GainNode;
  source: AudioBufferSourceNode | null;
};

let pcmCache: Uint8Array | null = null;
let pcmLoadPromise: Promise<Uint8Array> | null = null;

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
    return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.42;
  } catch {
    return 0.42;
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

function targetGain(volume: number) {
  return Math.max(0.0001, Math.min(0.68, volume * 0.68));
}

function buildEngine(): Engine | null {
  const Context = audioContextCtor();
  if (!Context) return null;

  const context = new Context();
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();

  master.gain.value = 0.0001;
  compressor.threshold.value = -10;
  compressor.knee.value = 8;
  compressor.ratio.value = 2.5;
  compressor.attack.value = 0.02;
  compressor.release.value = 0.3;

  master.connect(compressor);
  compressor.connect(context.destination);

  return { context, master, source: null };
}

async function fetchTrackPart(url: string) {
  const separator = url.includes("?") ? "&" : "?";
  const response = await fetch(`${url}${separator}v=${TRACK_VERSION}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { accept: "text/plain" },
  });

  if (!response.ok) {
    throw new Error(`BlackCrown music asset failed: ${response.status}`);
  }

  const text = (await response.text()).trim();
  if (!text || !/^[A-Za-z0-9+/=]+$/.test(text)) {
    throw new Error("BlackCrown music asset is invalid");
  }

  return text;
}

function decodePackedPcm(encoded: string) {
  const compact = encoded.replace(/\s+/g, "");
  const binary = window.atob(compact);
  if (!binary.length) throw new Error("BlackCrown music asset is empty");

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function preloadTrack(force = false) {
  if (force) {
    pcmCache = null;
    pcmLoadPromise = null;
  }

  if (pcmCache) return Promise.resolve(pcmCache);
  if (pcmLoadPromise) return pcmLoadPromise;

  pcmLoadPromise = Promise.all(TRACK_PARTS.map(fetchTrackPart))
    .then((parts) => decodePackedPcm(parts.join("")))
    .then((bytes) => {
      pcmCache = bytes;
      return bytes;
    })
    .finally(() => {
      pcmLoadPromise = null;
    });

  return pcmLoadPromise;
}

function createPcmBuffer(context: AudioContext, bytes: Uint8Array) {
  const audioBuffer = context.createBuffer(1, bytes.length, SAMPLE_RATE);
  const channel = audioBuffer.getChannelData(0);

  for (let index = 0; index < bytes.length; index += 1) {
    channel[index] = (bytes[index] - 128) / 128;
  }

  return audioBuffer;
}

function createLoopSource(engine: Engine, bytes: Uint8Array) {
  const source = engine.context.createBufferSource();
  const buffer = createPcmBuffer(engine.context, bytes);
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = 0;
  source.loopEnd = buffer.duration;
  source.connect(engine.master);
  source.start(0);
  engine.source = source;
  return source;
}

export function SiteMusic() {
  const engineRef = React.useRef<Engine | null>(null);
  const mountedRef = React.useRef(true);
  const [enabled, setEnabled] = React.useState(readEnabled);
  const [volume, setVolume] = React.useState(readVolume);
  const [state, setState] = React.useState<MusicState>(() =>
    audioContextCtor() ? "loading" : "unsupported"
  );
  const [expanded, setExpanded] = React.useState(false);

  const start = React.useCallback(() => {
    if (state === "unsupported") return;

    const bytes = pcmCache;
    if (!bytes) {
      if (mountedRef.current) setState("loading");
      void preloadTrack()
        .then(() => {
          if (mountedRef.current) setState("waiting");
        })
        .catch(() => {
          if (mountedRef.current) setState("error");
        });
      return;
    }

    let engine = engineRef.current;
    if (!engine) {
      engine = buildEngine();
      if (!engine) {
        if (mountedRef.current) setState("unsupported");
        return;
      }
      engineRef.current = engine;
    }

    try {
      // iOS Safari: resume and source.start are both invoked immediately inside
      // the user gesture. There is no network await between unlock and playback.
      const resumePromise = engine.context.resume();

      if (!engine.source) {
        createLoopSource(engine, bytes);
      }

      const now = engine.context.currentTime;
      engine.master.gain.cancelScheduledValues(now);
      engine.master.gain.setValueAtTime(Math.max(0.0001, engine.master.gain.value), now);
      engine.master.gain.exponentialRampToValueAtTime(targetGain(volume), now + 0.32);
      if (mountedRef.current) setState("playing");

      void resumePromise.catch(() => {
        if (mountedRef.current) setState("waiting");
      });
    } catch {
      if (mountedRef.current) setState("error");
    }
  }, [state, volume]);

  const pause = React.useCallback(() => {
    const engine = engineRef.current;
    if (!engine) {
      setState("paused");
      return;
    }

    const source = engine.source;
    engine.source = null;

    const now = engine.context.currentTime;
    engine.master.gain.cancelScheduledValues(now);
    engine.master.gain.setValueAtTime(Math.max(0.0001, engine.master.gain.value), now);
    engine.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    window.setTimeout(() => {
      if (source) {
        try {
          source.stop();
        } catch {
          // Source may already be stopped.
        }
        source.disconnect();
      }
      if (!engine.source) void engine.context.suspend().catch(() => undefined);
    }, 190);

    setState("paused");
  }, []);

  React.useEffect(() => {
    if (state === "unsupported") return;

    let active = true;
    void preloadTrack()
      .then(() => {
        if (!active || !mountedRef.current) return;
        setState(enabled ? "waiting" : "paused");
      })
      .catch(() => {
        if (active && mountedRef.current) setState("error");
      });

    return () => {
      active = false;
    };
    // Load exactly once. The user's saved enabled preference is read at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!enabled || state !== "waiting") return;

    const unlock = () => start();
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
    engine.master.gain.setTargetAtTime(targetGain(volume), now, 0.1);
  }, [state, volume]);

  React.useEffect(() => {
    const onVisibility = () => {
      const engine = engineRef.current;
      if (!engine || !enabled || state !== "playing") return;

      if (document.visibilityState === "hidden") {
        void engine.context.suspend().catch(() => undefined);
      } else {
        void engine.context.resume().catch(() => {
          if (mountedRef.current) setState("waiting");
        });
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled, state]);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
      const engine = engineRef.current;
      if (engine?.source) {
        try {
          engine.source.stop();
        } catch {
          // Source may already be stopped.
        }
        engine.source.disconnect();
      }
      void engine?.context.close().catch(() => undefined);
      engineRef.current = null;
    };
  }, []);

  if (state === "unsupported") return null;

  const toggle = () => {
    if (state === "loading") return;

    if (state === "playing") {
      setEnabled(false);
      storeEnabled(false);
      pause();
      return;
    }

    if (state === "error") {
      setState("loading");
      void preloadTrack(true)
        .then(() => {
          if (mountedRef.current) setState("waiting");
        })
        .catch(() => {
          if (mountedRef.current) setState("error");
        });
      return;
    }

    setEnabled(true);
    storeEnabled(true);
    start();
  };

  const statusLabel =
    state === "playing"
      ? "ON"
      : state === "loading"
        ? "LOAD"
        : state === "waiting"
          ? "TAP"
          : state === "error"
            ? "RETRY"
            : "OFF";

  return (
    <aside
      className="bcSiteMusic"
      data-state={state}
      data-expanded={expanded ? "true" : "false"}
      aria-label="Музыка BlackCrown"
    >
      <button
        type="button"
        className="bcSiteMusic__toggle"
        onClick={toggle}
        aria-pressed={state === "playing"}
        title={
          state === "loading"
            ? "Музыка загружается"
            : state === "playing"
              ? "Выключить музыку"
              : "Включить музыку"
        }
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

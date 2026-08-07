import React from "react";
import "../styles/site-music.css";

const ENABLED_KEY = "bc.siteMusic.enabled.v5";
const VOLUME_KEY = "bc.siteMusic.volume.v5";
const TRACK_VERSION = "uploaded-long-loop-v5-native";
const TRACK_PARTS = [
  "/audio/blackcrown-long-part-00.txt",
  "/audio/blackcrown-long-part-01.txt",
  "/audio/blackcrown-long-part-02.txt",
] as const;

type MusicState = "loading" | "waiting" | "playing" | "paused" | "error";

type Engine = {
  audio: HTMLAudioElement;
  objectUrl: string;
};

let mediaCache: ArrayBuffer | null = null;
let mediaLoadPromise: Promise<ArrayBuffer> | null = null;

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

function clampVolume(volume: number) {
  return Math.max(0, Math.min(1, volume));
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

function decodeBase64Buffer(encoded: string) {
  const compact = encoded.replace(/\s+/g, "");
  const binary = window.atob(compact);

  if (binary.length < 100_000) {
    throw new Error("BlackCrown long music asset is incomplete");
  }

  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const isId3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
  const isMpegFrame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
  if (!isId3 && !isMpegFrame) {
    throw new Error("BlackCrown music asset is not a valid MP3 stream");
  }

  return buffer;
}

function preloadMedia(force = false) {
  if (force) {
    mediaCache = null;
    mediaLoadPromise = null;
  }

  if (mediaCache) return Promise.resolve(mediaCache);
  if (mediaLoadPromise) return mediaLoadPromise;

  mediaLoadPromise = Promise.all(TRACK_PARTS.map(fetchTrackPart))
    .then((parts) => decodeBase64Buffer(parts.join("")))
    .then((buffer) => {
      mediaCache = buffer;
      return buffer;
    })
    .finally(() => {
      mediaLoadPromise = null;
    });

  return mediaLoadPromise;
}

function createEngine(buffer: ArrayBuffer, volume: number): Engine {
  const blob = new Blob([buffer], { type: "audio/mpeg" });
  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio();

  audio.preload = "auto";
  audio.loop = true;
  audio.volume = clampVolume(volume);
  audio.src = objectUrl;
  audio.load();

  return { audio, objectUrl };
}

function destroyEngine(engine: Engine | null) {
  if (!engine) return;

  try {
    engine.audio.pause();
    engine.audio.removeAttribute("src");
    engine.audio.load();
  } catch {
    // Best-effort cleanup.
  }

  URL.revokeObjectURL(engine.objectUrl);
}

export function SiteMusic() {
  const engineRef = React.useRef<Engine | null>(null);
  const mountedRef = React.useRef(true);
  const startingRef = React.useRef(false);
  const [enabled, setEnabled] = React.useState(readEnabled);
  const [volume, setVolume] = React.useState(readVolume);
  const [state, setState] = React.useState<MusicState>("loading");
  const [expanded, setExpanded] = React.useState(false);

  const prepare = React.useCallback((force = false) => {
    if (force) {
      destroyEngine(engineRef.current);
      engineRef.current = null;
    }

    if (engineRef.current) return Promise.resolve(engineRef.current);

    return preloadMedia(force).then((buffer) => {
      const engine = createEngine(buffer, volume);
      engineRef.current = engine;
      return engine;
    });
  }, [volume]);

  const start = React.useCallback(() => {
    const engine = engineRef.current;
    if (!engine || startingRef.current) return;

    startingRef.current = true;
    engine.audio.loop = true;
    engine.audio.volume = clampVolume(volume);

    // Critical for iOS Safari: play() is invoked synchronously inside the
    // user's pointer/touch/click event. No AudioContext or async decode sits
    // between the gesture and media playback.
    const playPromise = engine.audio.play();

    void playPromise
      .then(() => {
        if (mountedRef.current) setState("playing");
      })
      .catch(() => {
        if (mountedRef.current) setState("waiting");
      })
      .finally(() => {
        startingRef.current = false;
      });
  }, [volume]);

  const pause = React.useCallback(() => {
    const engine = engineRef.current;
    if (engine) engine.audio.pause();
    startingRef.current = false;
    setState("paused");
  }, []);

  React.useEffect(() => {
    let active = true;

    setState("loading");
    void prepare()
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
    // The long MP3 is assembled once on mount, before the first gesture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!enabled || state !== "waiting") return;

    const unlock = () => start();

    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("touchstart", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [enabled, start, state]);

  React.useEffect(() => {
    const engine = engineRef.current;
    if (engine) engine.audio.volume = clampVolume(volume);
  }, [volume]);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
      destroyEngine(engineRef.current);
      engineRef.current = null;
    };
  }, []);

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
      void prepare(true)
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

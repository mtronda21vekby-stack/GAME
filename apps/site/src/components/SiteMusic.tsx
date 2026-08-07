import React from "react";
import "../styles/site-music.css";

const ENABLED_KEY = "bc.siteMusic.enabled.v7";
const VOLUME_KEY = "bc.siteMusic.volume.v7";
const TRACK_VERSION = "uploaded-long-loop-v7-button";
const TRACK_PARTS = [
  "/audio/blackcrown-long-part-00.txt",
  "/audio/blackcrown-long-part-01.txt",
  "/audio/blackcrown-long-part-02.txt",
] as const;

type MusicState = "loading" | "waiting" | "starting" | "playing" | "paused" | "error";

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
  const binary = window.atob(encoded.replace(/\s+/g, ""));
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
    throw new Error("BlackCrown music asset is not an MP3 stream");
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
  const audio = document.createElement("audio");

  audio.preload = "auto";
  audio.loop = true;
  audio.autoplay = false;
  audio.muted = false;
  audio.volume = clampVolume(volume);
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
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

  const startFromUserTap = React.useCallback(() => {
    const engine = engineRef.current;
    if (!engine) {
      setState("error");
      return;
    }

    setEnabled(true);
    storeEnabled(true);
    setState("starting");

    engine.audio.loop = true;
    engine.audio.muted = false;
    engine.audio.volume = clampVolume(volume);

    // The only playback trigger is the MUSIC button's click event.
    // This avoids the pointerdown/onClick race that blocked iOS Safari.
    const playPromise = engine.audio.play();
    void playPromise
      .then(() => {
        if (mountedRef.current) setState("playing");
      })
      .catch((error) => {
        console.warn("BlackCrown music play() rejected", error);
        if (mountedRef.current) setState("waiting");
      });
  }, [volume]);

  const pause = React.useCallback(() => {
    engineRef.current?.audio.pause();
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
      .catch((error) => {
        console.warn("BlackCrown music preload failed", error);
        if (active && mountedRef.current) setState("error");
      });

    return () => {
      active = false;
    };
    // Prepare once. Playback itself only happens from the MUSIC button click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (engineRef.current) engineRef.current.audio.volume = clampVolume(volume);
  }, [volume]);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
      destroyEngine(engineRef.current);
      engineRef.current = null;
    };
  }, []);

  const toggle = () => {
    if (state === "playing" || state === "starting") {
      setEnabled(false);
      storeEnabled(false);
      pause();
      return;
    }

    if (state === "loading") {
      // Do not swallow the tap silently. Keep the control visibly responsive.
      setState("loading");
      return;
    }

    if (state === "error") {
      setState("loading");
      void prepare(true)
        .then(() => {
          if (mountedRef.current) setState("waiting");
        })
        .catch((error) => {
          console.warn("BlackCrown music retry failed", error);
          if (mountedRef.current) setState("error");
        });
      return;
    }

    startFromUserTap();
  };

  const statusLabel =
    state === "playing"
      ? "ON"
      : state === "starting"
        ? "START"
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

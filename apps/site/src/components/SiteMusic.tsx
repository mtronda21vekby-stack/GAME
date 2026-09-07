import React from "react";
import {
  BLACKCROWN_MUSIC_COMMAND,
  BLACKCROWN_MUSIC_SRC,
  type BlackCrownMusicCommand,
} from "../audio/blackcrownMusic";
import "../styles/site-music.css";

const ENABLED_KEY = "bc.siteMusic.enabled.v9";
const VOLUME_KEY = "bc.siteMusic.volume.v9";

type MusicState = "ready" | "starting" | "playing" | "paused" | "error";

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

export function SiteMusic({ headless = false }: { headless?: boolean }) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = React.useState(readVolume);
  const [state, setState] = React.useState<MusicState>(() => (readEnabled() ? "ready" : "paused"));
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = clampVolume(volume);
    audio.muted = false;
  }, [volume]);

  const playFromTap = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      setState("error");
      return;
    }

    storeEnabled(true);
    audio.loop = true;
    audio.muted = false;
    audio.volume = clampVolume(volume);
    setState("starting");

    try {
      const promise = audio.play();
      void promise
        .then(() => setState("playing"))
        .catch((error) => {
          console.warn("BlackCrown Suno MP3 play() rejected", error);
          setState("error");
        });
    } catch (error) {
      console.warn("BlackCrown Suno MP3 play() failed", error);
      setState("error");
    }
  }, [volume]);

  React.useEffect(() => {
    const onMusicCommand = (event: Event) => {
      const command = event as CustomEvent<BlackCrownMusicCommand>;
      if (command.detail?.enabled) {
        playFromTap();
        return;
      }
      audioRef.current?.pause();
      storeEnabled(false);
      setState("paused");
    };
    window.addEventListener(BLACKCROWN_MUSIC_COMMAND, onMusicCommand);
    return () => window.removeEventListener(BLACKCROWN_MUSIC_COMMAND, onMusicCommand);
  }, [playFromTap]);

  React.useEffect(() => () => {
    const audio = audioRef.current;
    audio?.pause();
    if (audio) {
      audio.removeAttribute("src");
      audio.load();
    }
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (state === "playing" || (audio && !audio.paused)) {
      audio?.pause();
      storeEnabled(false);
      setState("paused");
      return;
    }

    if (state === "error" && audio) {
      audio.load();
    }
    playFromTap();
  };

  const statusLabel =
    state === "playing"
      ? "ON"
      : state === "starting"
        ? "START"
        : state === "error"
          ? "RETRY"
          : state === "paused"
            ? "OFF"
            : "TAP";

  const audio = (
    <audio
      ref={audioRef}
      src={BLACKCROWN_MUSIC_SRC}
      preload={headless ? "none" : "metadata"}
      loop
      playsInline
      onPlaying={() => setState("playing")}
      onError={() => setState("error")}
      aria-hidden="true"
    />
  );

  if (headless) return audio;

  return (
    <aside
      className="bcSiteMusic"
      data-state={state}
      data-expanded={expanded ? "true" : "false"}
      aria-label="Музыка BlackCrown"
    >
      {audio}

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

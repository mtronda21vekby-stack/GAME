import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@blackcrown/ui";
import { track } from "@blackcrown/core";
import type { GameSettings } from "./SettingsPanel";

type Props = {
  src: string;
  settings: GameSettings;
};

export function EvoFishFrame({ src, settings }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [immersive, setImmersive] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const summary = useMemo(() => {
    return `Quality: ${settings.quality}, Input: ${settings.inputMode}, FPS: ${settings.fpsCounter ? "ON" : "OFF"}, Sound: ${settings.sound ? "ON" : "OFF"}`;
  }, [settings]);

  // ESC/back fallback: if immersive, exit on history/back or ESC-like cases
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImmersive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const reload = () => {
    track({ type: "game_container", action: "reload" });
    setLoaded(false);
    iframeRef.current?.contentWindow?.location.reload();
  };

  const enterFullscreen = async () => {
    track({ type: "game_container", action: "fullscreen" });

    // 1) Try real Fullscreen (best on desktop/Android)
    const el = wrapRef.current;
    try {
      if (el?.requestFullscreen) {
        await el.requestFullscreen();
        return;
      }
    } catch {
      // ignore, fallback below
    }

    // 2) iOS/Safari/iframe fallback: pseudo fullscreen overlay
    setImmersive(true);
  };

  const exitImmersive = () => setImmersive(false);

  return (
    <div
      ref={wrapRef}
      className="glassStrong bc-motion"
      style={{
        padding: 14,
        borderRadius: 22,
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div className="bc-row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div className="bc-col" style={{ gap: 2 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>EvoFish</div>
          <div className="bc-faint" style={{ fontWeight: 750 }}>{summary}</div>
        </div>

        <div className="bc-row" style={{ gap: 10, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={enterFullscreen}>
            Fullscreen
          </Button>
          <Button variant="ghost" onClick={reload}>
            Reload
          </Button>
        </div>
      </div>

      <div style={{ height: 12 }} />

      {/* Frame area */}
      <div
        className={immersive ? "bc-immersive" : ""}
        style={{
          borderRadius: 18,
          border: "1px solid var(--stroke)",
          background: "rgba(0,0,0,0.18)",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* Immersive top bar (only in pseudo fullscreen) */}
        {immersive ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 5,
              padding: `max(10px, env(safe-area-inset-top)) 10px 10px`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              background: "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0))",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)"
            }}
          >
            <div style={{ fontWeight: 850 }}>EvoFish</div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" onClick={reload}>Reload</Button>
              <Button variant="primary" onClick={exitImmersive}>Закрыть</Button>
            </div>
          </div>
        ) : null}

        <iframe
          ref={iframeRef}
          title="EvoFish"
          src={src}
          onLoad={() => setLoaded(true)}
          // IMPORTANT: allow fullscreen + scripts
          allow="fullscreen; autoplay; gamepad; accelerometer; gyroscope; clipboard-read; clipboard-write"
          allowFullScreen
          // IMPORTANT: DO NOT sandbox EvoFish (иначе скрипты/локалстор могут ломаться)
          style={{
            width: "100%",
            height: immersive ? "100dvh" : "62dvh",
            border: 0,
            display: "block",
            background: "transparent"
          }}
        />

        {!loaded ? (
          <div
            className="bc-p"
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: "rgba(0,0,0,0.18)"
            }}
          >
            Загрузка EvoFish…
          </div>
        ) : null}
      </div>

      {/* CSS for iOS-safe pseudo fullscreen */}
      <style>{`
        .bc-immersive{
          position: fixed !important;
          inset: 0 !important;
          z-index: 9999 !important;
          border-radius: 0 !important;
          border: 0 !important;
          background: rgba(0,0,0,0.86) !important;
        }
        @supports (padding: env(safe-area-inset-top)){
          .bc-immersive{
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { GameSettings } from "./SettingsPanel";

type AnyEl = HTMLElement & {
  requestFullscreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
};

type AnyDoc = Document & {
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
};

function getReq(el: AnyEl | null): (() => Promise<void>) | null {
  if (!el) return null;
  return (
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen ||
    null
  );
}

async function tryEnter(el: AnyEl | null): Promise<boolean> {
  const req = getReq(el);
  if (!req) return false;
  try {
    await req.call(el);
    return true;
  } catch {
    return false;
  }
}

async function tryExit(): Promise<boolean> {
  const d = document as AnyDoc;
  const exit =
    document.exitFullscreen ||
    d.webkitExitFullscreen ||
    d.mozCancelFullScreen ||
    d.msExitFullscreen ||
    null;

  if (!exit) return false;
  try {
    await exit.call(document);
    return true;
  } catch {
    return false;
  }
}

function isNativeFullscreenActive(): boolean {
  const d = document as any;
  return Boolean(document.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement);
}

export function EvoFishFrame(props: { src: string; settings: GameSettings }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Fallback fullscreen that works everywhere (including iOS / restricted envs)
  const [pseudoFs, setPseudoFs] = useState(false);
  // Track native fullscreen state
  const [nativeFs, setNativeFs] = useState(false);

  const meta = useMemo(() => {
    const s = props.settings;
    return `Quality: ${s.quality}, Input: ${s.inputMode}, FPS: ${s.fpsCounter ? "ON" : "OFF"}, Sound: ${s.sound ? "ON" : "OFF"}`;
  }, [props.settings]);

  useEffect(() => {
    const onFs = () => setNativeFs(isNativeFullscreenActive());
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange" as any, onFs);
    document.addEventListener("mozfullscreenchange" as any, onFs);
    document.addEventListener("MSFullscreenChange" as any, onFs);
    onFs();
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange" as any, onFs);
      document.removeEventListener("mozfullscreenchange" as any, onFs);
      document.removeEventListener("MSFullscreenChange" as any, onFs);
    };
  }, []);

  // ESC should exit pseudo fullscreen too
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPseudoFs(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const enterFullscreen = async () => {
    // 1) Try FULLSCREEN on the IFRAME element first (best for games on desktop/xbox)
    const iframe = iframeRef.current as unknown as AnyEl | null;
    const okIframe = await tryEnter(iframe);
    if (okIframe) return;

    // 2) Try fullscreen on wrapper
    const wrap = wrapRef.current as unknown as AnyEl | null;
    const okWrap = await tryEnter(wrap);
    if (okWrap) return;

    // 3) Fallback to pseudo fullscreen (works everywhere)
    setPseudoFs(true);
  };

  const exitFullscreen = async () => {
    // Try native exit; if not active or blocked, just close pseudo
    await tryExit();
    setPseudoFs(false);
  };

  const reload = () => {
    const fr = iframeRef.current;
    if (!fr) return;
    fr.src = fr.src;
  };

  const inFullscreen = nativeFs || pseudoFs;

  return (
    <div
      ref={wrapRef}
      className={`glassStrong bc-motion ${pseudoFs ? "bcPseudoFs" : ""}`}
      style={{
        padding: 14,
        borderRadius: 22,
        overflow: "hidden",
        position: "relative"
      }}
    >
      {/* Top controls */}
      <div className="bc-row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div className="bc-col" style={{ gap: 2 }}>
          <div style={{ fontWeight: 900 }}>EvoFish</div>
          <div className="bc-faint" style={{ fontWeight: 700 }}>{meta}</div>
        </div>

        <div className="bc-row" style={{ gap: 10, flexWrap: "wrap" }}>
          <button className="bc-focus bcBtnMini" onClick={reload}>Reload</button>

          {!inFullscreen ? (
            <button className="bc-focus bcBtnPrimary" onClick={enterFullscreen}>
              Fullscreen
            </button>
          ) : (
            <button className="bc-focus bcBtnPrimary" onClick={exitFullscreen}>
              Закрыть
            </button>
          )}
        </div>
      </div>

      <div style={{ height: 12 }} />

      {/* Frame */}
      <div
        style={{
          borderRadius: 18,
          border: "1px solid var(--stroke)",
          overflow: "hidden",
          background: "rgba(0,0,0,0.25)"
        }}
      >
        <iframe
          ref={iframeRef}
          title="EvoFish"
          src={props.src}
          style={{
            width: "100%",
            height: pseudoFs ? "calc(100vh - 140px)" : "62vh",
            minHeight: pseudoFs ? "560px" : "460px",
            border: 0,
            display: "block"
          }}
          // Permissions: fullscreen is the key; gamepad helps Xbox/PC controllers
          allow="fullscreen; gamepad; autoplay"
          allowFullScreen
        />
      </div>

      {/* Styles */}
      <style>{`
        .bcBtnMini{
          height: 40px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid var(--stroke);
          background: rgba(255,255,255,0.08);
          color: var(--text);
          cursor: pointer;
        }
        .bcBtnPrimary{
          height: 40px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid rgba(120,160,255,0.28);
          background: linear-gradient(180deg, rgba(120,160,255,0.40), rgba(120,160,255,0.18));
          color: var(--text);
          cursor: pointer;
          font-weight: 800;
        }

        /* Pseudo fullscreen: always works (mobile + restricted fullscreen envs) */
        .bcPseudoFs{
          position: fixed !important;
          inset: 0 !important;
          z-index: 9999 !important;
          border-radius: 0 !important;
          padding:
            max(10px, env(safe-area-inset-top))
            10px
            max(10px, env(safe-area-inset-bottom)) !important;
        }
      `}</style>

      {pseudoFs ? (
        <div className="bc-faint" style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
          Подсказка: если “настоящий” fullscreen запрещён браузером — включается безопасный fullscreen-режим.
        </div>
      ) : null}
    </div>
  );
}

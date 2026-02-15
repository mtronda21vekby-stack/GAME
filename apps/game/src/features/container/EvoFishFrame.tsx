import React, { useMemo, useRef, useState } from "react";
import type { GameSettings } from "./SettingsPanel";

function supportsNativeFullscreen(el: HTMLElement | null): boolean {
  if (!el) return false;
  const anyEl = el as any;
  return Boolean(anyEl.requestFullscreen || anyEl.webkitRequestFullscreen);
}

async function tryNativeFullscreen(el: HTMLElement | null): Promise<boolean> {
  if (!el) return false;
  const anyEl = el as any;
  const req =
    anyEl.requestFullscreen ||
    anyEl.webkitRequestFullscreen ||
    anyEl.mozRequestFullScreen ||
    anyEl.msRequestFullscreen;

  if (!req) return false;

  try {
    await req.call(el);
    return true;
  } catch {
    return false;
  }
}

async function tryExitNativeFullscreen(): Promise<void> {
  const d: any = document;
  const exit =
    document.exitFullscreen ||
    d.webkitExitFullscreen ||
    d.mozCancelFullScreen ||
    d.msExitFullscreen;

  try {
    if (exit) await exit.call(document);
  } catch {
    // ignore
  }
}

export function EvoFishFrame(props: { src: string; settings: GameSettings }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Pseudo fullscreen (works on iOS always)
  const [pseudoFs, setPseudoFs] = useState(false);

  const meta = useMemo(() => {
    const s = props.settings;
    return `Quality: ${s.quality}, Input: ${s.inputMode}, FPS: ${s.fpsCounter ? "ON" : "OFF"}, Sound: ${s.sound ? "ON" : "OFF"}`;
  }, [props.settings]);

  const enter = async () => {
    // Try native fullscreen first (works on some browsers)
    const ok = await tryNativeFullscreen(wrapRef.current);
    if (!ok) setPseudoFs(true);
  };

  const exit = async () => {
    await tryExitNativeFullscreen();
    setPseudoFs(false);
  };

  const reload = () => {
    const fr = iframeRef.current;
    if (!fr) return;
    fr.src = fr.src;
  };

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
          {!pseudoFs ? (
            <button className="bc-focus bcBtnPrimary" onClick={enter}>
              Fullscreen
            </button>
          ) : (
            <button className="bc-focus bcBtnPrimary" onClick={exit}>
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
            minHeight: pseudoFs ? "560px" : "420px",
            border: 0,
            display: "block"
          }}
          // Fullscreen permissions (must-have)
          allow="fullscreen; gamepad; autoplay; clipboard-read; clipboard-write"
          allowFullScreen
        />
      </div>

      {/* Styles (safe-area + pseudo fullscreen) */}
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

        /* Pseudo fullscreen: reliable on iOS Safari */
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

      {/* iOS hint (optional, subtle) */}
      {pseudoFs ? (
        <div className="bc-faint" style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
          Подсказка: на iPhone лучше играть в горизонтали (Landscape).
        </div>
      ) : null}
    </div>
  );
}

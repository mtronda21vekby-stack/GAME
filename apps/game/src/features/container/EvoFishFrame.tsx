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
  return Boolean(
    document.fullscreenElement ||
      d.webkitFullscreenElement ||
      d.mozFullScreenElement ||
      d.msFullscreenElement
  );
}

export function EvoFishFrame(props: { src: string; settings: GameSettings }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Pseudo fullscreen: always works
  const [pseudoFs, setPseudoFs] = useState(false);
  // Native fullscreen state
  const [nativeFs, setNativeFs] = useState(false);

  // Premium UI controls
  const [uiHidden, setUiHidden] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const meta = useMemo(() => {
    const s = props.settings;
    return `Quality: ${s.quality}, Input: ${s.inputMode}, FPS: ${
      s.fpsCounter ? "ON" : "OFF"
    }, Sound: ${s.sound ? "ON" : "OFF"}`;
  }, [props.settings]);

  const inFullscreen = nativeFs || pseudoFs;

  const clearHideTimer = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const scheduleAutoHide = () => {
    clearHideTimer();
    if (!inFullscreen) return;
    hideTimer.current = window.setTimeout(() => {
      setUiHidden(true);
    }, 2200);
  };

  const showUiNow = () => {
    if (!inFullscreen) return;
    setUiHidden(false);
    scheduleAutoHide();
  };

  // Listen fullscreen change
  useEffect(() => {
    const onFs = () => {
      const active = isNativeFullscreenActive();
      setNativeFs(active);
      // entering/exiting native fullscreen should reset UI state
      if (!active && !pseudoFs) setUiHidden(false);
      if (active) {
        setUiHidden(false);
        scheduleAutoHide();
      }
    };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pseudoFs]);

  // ESC exits pseudo fullscreen too; F toggles fullscreen on desktop
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPseudoFs(false);
        setUiHidden(false);
        await tryExit();
      }
      // Toggle fullscreen with "f" / "F" (desktop)
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (inFullscreen) {
          await exitFullscreen();
        } else {
          await enterFullscreen();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inFullscreen]);

  // Any interaction should show UI (mouse move / touch)
  useEffect(() => {
    const onMove = () => {
      if (!inFullscreen) return;
      showUiNow();
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchstart", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchstart", onMove);
      window.removeEventListener("pointerdown", onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inFullscreen]);

  const enterFullscreen = async () => {
    // Prefer iframe fullscreen (best for games on PC/Xbox)
    const iframe = iframeRef.current as unknown as AnyEl | null;
    const okIframe = await tryEnter(iframe);
    if (okIframe) {
      setUiHidden(false);
      scheduleAutoHide();
      return;
    }

    // Try wrapper fullscreen
    const wrap = wrapRef.current as unknown as AnyEl | null;
    const okWrap = await tryEnter(wrap);
    if (okWrap) {
      setUiHidden(false);
      scheduleAutoHide();
      return;
    }

    // Fallback pseudo fullscreen
    setPseudoFs(true);
    setUiHidden(false);
    scheduleAutoHide();
  };

  const exitFullscreen = async () => {
    await tryExit();
    setPseudoFs(false);
    setUiHidden(false);
    clearHideTimer();
  };

  const reload = () => {
    const fr = iframeRef.current;
    if (!fr) return;
    fr.src = fr.src;
  };

  // Double-tap on frame toggles UI (mobile-friendly)
  const lastTap = useRef<number>(0);
  const onFrameTap = () => {
    if (!inFullscreen) return;
    const now = Date.now();
    if (now - lastTap.current < 260) {
      // double tap
      setUiHidden((v) => !v);
      // if we just showed it, keep it visible for a moment then auto-hide
      if (uiHidden) scheduleAutoHide();
    } else {
      // single tap: show UI briefly
      showUiNow();
    }
    lastTap.current = now;
  };

  const frameHeight = pseudoFs ? "calc(100vh - 140px)" : "62vh";

  return (
    <div
      ref={wrapRef}
      className={`glassStrong bc-motion ${pseudoFs ? "bcPseudoFs" : ""} ${
        inFullscreen ? "bcFsRoot" : ""
      }`}
      style={{
        padding: 14,
        borderRadius: 22,
        overflow: "hidden",
        position: "relative"
      }}
    >
      {/* Top controls (auto-hide in fullscreen) */}
      <div className={`bcTop ${inFullscreen && uiHidden ? "bcTopHidden" : ""}`}>
        <div className="bc-row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div className="bc-col" style={{ gap: 2 }}>
            <div style={{ fontWeight: 900 }}>EvoFish</div>
            <div className="bc-faint" style={{ fontWeight: 700 }}>{meta}</div>
          </div>

          <div className="bc-row" style={{ gap: 10, flexWrap: "wrap" }}>
            <button className="bc-focus bcBtnMini" onClick={reload}>Reload</button>

            {!inFullscreen ? (
              <button className="bc-focus bcBtnPrimary" onClick={enterFullscreen}>
                Fullscreen (F)
              </button>
            ) : (
              <button className="bc-focus bcBtnPrimary" onClick={exitFullscreen}>
                Закрыть (Esc)
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: 12 }} />

      {/* Frame (tap/move shows UI, double tap toggles UI) */}
      <div
        onClick={onFrameTap}
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
            height: frameHeight,
            minHeight: pseudoFs ? "560px" : "460px",
            border: 0,
            display: "block"
          }}
          allow="fullscreen; gamepad; autoplay"
          allowFullScreen
        />
      </div>

      {/* Minimal hint in fullscreen when UI hidden */}
      {inFullscreen && uiHidden ? (
        <div className="bcFsHint">
          Двигай мышью/тапни чтобы показать меню · Double tap — скрыть/показать
        </div>
      ) : null}

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

        /* Top bar container */
        .bcTop{
          transition: transform 160ms ease, opacity 160ms ease;
          will-change: transform, opacity;
        }
        .bcTopHidden{
          transform: translate3d(0,-10px,0);
          opacity: 0;
          pointer-events: none;
        }

        /* Pseudo fullscreen: always works (mobile + restricted envs) */
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

        .bcFsHint{
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: max(12px, env(safe-area-inset-bottom));
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid var(--stroke);
          background: rgba(0,0,0,0.30);
          color: var(--text);
          font-size: 12px;
          opacity: 0.85;
          text-align: center;
          pointer-events: none;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
}

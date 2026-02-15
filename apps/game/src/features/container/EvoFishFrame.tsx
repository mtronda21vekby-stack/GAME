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

/**
 * Fix viewport height inconsistencies:
 * - 100vh is not equal to the visible viewport on some browsers (Safari / iOS / some embedded webviews).
 * We set --app-vh to window.innerHeight and use it for immersive fullscreen sizing.
 */
function useAppViewportHeightVar() {
  useEffect(() => {
    const set = () => {
      document.documentElement.style.setProperty("--app-vh", `${window.innerHeight}px`);
      document.documentElement.style.setProperty("--app-vw", `${window.innerWidth}px`);
    };
    set();
    window.addEventListener("resize", set, { passive: true });
    window.addEventListener("orientationchange", set as any, { passive: true });
    return () => {
      window.removeEventListener("resize", set as any);
      window.removeEventListener("orientationchange", set as any);
    };
  }, []);
}

export function EvoFishFrame(props: { src: string; settings: GameSettings }) {
  useAppViewportHeightVar();

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [pseudoFs, setPseudoFs] = useState(false);
  const [nativeFs, setNativeFs] = useState(false);

  // Premium overlay UI
  const [uiHidden, setUiHidden] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const inFullscreen = nativeFs || pseudoFs;

  const meta = useMemo(() => {
    const s = props.settings;
    return `Quality: ${s.quality}, Input: ${s.inputMode}, FPS: ${
      s.fpsCounter ? "ON" : "OFF"
    }, Sound: ${s.sound ? "ON" : "OFF"}`;
  }, [props.settings]);

  const clearHideTimer = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const scheduleAutoHide = () => {
    clearHideTimer();
    if (!inFullscreen) return;
    hideTimer.current = window.setTimeout(() => setUiHidden(true), 1800);
  };

  const showUiNow = () => {
    if (!inFullscreen) return;
    setUiHidden(false);
    scheduleAutoHide();
  };

  // Track fullscreen changes
  useEffect(() => {
    const onFs = () => {
      const active = isNativeFullscreenActive();
      setNativeFs(active);

      if (active || pseudoFs) {
        setUiHidden(false);
        scheduleAutoHide();
      } else {
        setUiHidden(false);
        clearHideTimer();
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

  // Hotkeys: Esc exit, F toggle, U toggle overlay UI
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        await exitFullscreen();
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (inFullscreen) await exitFullscreen();
        else await enterFullscreen();
      }
      if (e.key === "u" || e.key === "U") {
        if (!inFullscreen) return;
        setUiHidden((v) => !v);
        if (uiHidden) scheduleAutoHide();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inFullscreen, uiHidden]);

  // Any interaction shows overlay UI in fullscreen
  useEffect(() => {
    const onMove = () => {
      if (!inFullscreen) return;
      showUiNow();
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchstart", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove as any);
      window.removeEventListener("touchstart", onMove as any);
      window.removeEventListener("pointerdown", onMove as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inFullscreen]);

  // Double tap/click toggles overlay UI in fullscreen
  const lastTap = useRef<number>(0);
  const onFrameTap = () => {
    if (!inFullscreen) return;
    const now = Date.now();
    if (now - lastTap.current < 260) {
      setUiHidden((v) => !v);
      if (uiHidden) scheduleAutoHide();
    } else {
      showUiNow();
    }
    lastTap.current = now;
  };

  const enterFullscreen = async () => {
    // Prefer iframe fullscreen (best for PC/Xbox)
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

  const cardMode = !inFullscreen;

  return (
    <div
      ref={wrapRef}
      className={`bcRoot ${pseudoFs ? "bcPseudoFs" : ""} ${inFullscreen ? "bcImmersive" : ""}`}
      style={{
        padding: cardMode ? 14 : 0,
        borderRadius: cardMode ? 22 : 0,
        overflow: "hidden",
        position: "relative",
        border: cardMode ? "1px solid var(--stroke)" : "none",
        background: cardMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.94)"
      }}
    >
      {/* Overlay */}
      <div className={`bcOverlay ${inFullscreen && uiHidden ? "bcOverlayHidden" : ""}`}>
        <div className="bcOverlayInner">
          <div className="bcOverlayLeft">
            <div className="bcTitle">EvoFish</div>
            <div className="bcSub">{meta}</div>
          </div>

          <div className="bcOverlayRight">
            <button className="bcPill" onClick={reload}>Reload</button>

            {!inFullscreen ? (
              <button className="bcPill bcPillPrimary" onClick={enterFullscreen}>
                Fullscreen (F)
              </button>
            ) : (
              <>
                <button
                  className="bcPill"
                  onClick={() => {
                    setUiHidden((v) => !v);
                    if (uiHidden) scheduleAutoHide();
                  }}
                >
                  UI (U)
                </button>
                <button className="bcPill bcPillPrimary" onClick={exitFullscreen}>
                  Закрыть (Esc)
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Frame */}
      <div
        onClick={onFrameTap}
        className="bcFrameWrap"
        style={{
          borderRadius: cardMode ? 18 : 0,
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
            // IMPORTANT: when fullscreen, use real visible height via --app-vh
            height: cardMode ? "62vh" : "var(--app-vh)",
            minHeight: cardMode ? "460px" : "var(--app-vh)",
            border: 0,
            display: "block"
          }}
          allow="fullscreen; gamepad; autoplay"
          allowFullScreen
        />
      </div>

      {inFullscreen && uiHidden ? (
        <div className="bcHint">
          Двигай мышью/тапни · Double tap — UI · F — fullscreen · Esc — выйти
        </div>
      ) : null}

      <style>{`
        /* Pseudo fullscreen (fallback) */
        .bcPseudoFs{
          position: fixed !important;
          inset: 0 !important;
          z-index: 9999 !important;
        }

        /* Immersive: fill the *visible* viewport */
        .bcImmersive{
          width: var(--app-vw, 100vw) !important;
          height: var(--app-vh, 100vh) !important;
          background: rgba(0,0,0,0.94) !important;
        }

        /* Overlay */
        .bcOverlay{
          position: ${cardMode ? "relative" : "absolute"};
          top: 0;
          left: 0;
          right: 0;
          z-index: 20;
          padding: ${cardMode ? "0 0 12px 0" : "max(10px, env(safe-area-inset-top)) 10px 10px"};
          transition: transform 160ms ease, opacity 160ms ease;
          will-change: transform, opacity;
          pointer-events: auto;
        }
        .bcOverlayHidden{
          transform: translate3d(0,-10px,0);
          opacity: 0;
          pointer-events: none;
        }

        .bcOverlayInner{
          display:flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: ${cardMode ? "0" : "10px 12px"};
          border-radius: ${cardMode ? "0" : "18px"};
          border: ${cardMode ? "none" : "1px solid rgba(255,255,255,0.10)"};
          background: ${cardMode ? "transparent" : "rgba(0,0,0,0.26)"};
          backdrop-filter: ${cardMode ? "none" : "blur(14px)"};
          -webkit-backdrop-filter: ${cardMode ? "none" : "blur(14px)"};
        }

        .bcOverlayLeft{ min-width: 0; }
        .bcTitle{ font-weight: 900; letter-spacing: -0.01em; }
        .bcSub{ margin-top: 2px; font-size: 12px; opacity: 0.8; }

        .bcOverlayRight{ display:flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }

        .bcPill{
          height: 40px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.08);
          color: var(--text);
          cursor: pointer;
          font-weight: 850;
        }
        .bcPillPrimary{
          border: 1px solid rgba(120,160,255,0.28);
          background: linear-gradient(180deg, rgba(120,160,255,0.40), rgba(120,160,255,0.18));
        }

        .bcHint{
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: max(12px, env(safe-area-inset-bottom));
          z-index: 30;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.30);
          color: var(--text);
          font-size: 12px;
          opacity: 0.86;
          text-align: center;
          pointer-events: none;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        @media (prefers-reduced-motion: reduce){
          .bcOverlay{ transition: none !important; }
        }
      `}</style>
    </div>
  );
}

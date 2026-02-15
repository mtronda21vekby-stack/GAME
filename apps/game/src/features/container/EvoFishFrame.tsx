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

  const [uiHidden, setUiHidden] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const inFullscreen = nativeFs || pseudoFs;

  const meta = useMemo(() => {
    const s = props.settings;
    return `Качество: ${s.quality}, Ввод: ${s.inputMode}, FPS: ${
      s.fpsCounter ? "ON" : "OFF"
    }, Звук: ${s.sound ? "ON" : "OFF"}`;
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
    hideTimer.current = window.setTimeout(() => setUiHidden(true), 1700);
  };

  const showUiNow = () => {
    if (!inFullscreen) return;
    setUiHidden(false);
    scheduleAutoHide();
  };

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

  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      if (e.key === "Escape") await exitFullscreen();
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
    const iframe = iframeRef.current as unknown as AnyEl | null;
    const okIframe = await tryEnter(iframe);
    if (okIframe) {
      setUiHidden(false);
      scheduleAutoHide();
      return;
    }

    const wrap = wrapRef.current as unknown as AnyEl | null;
    const okWrap = await tryEnter(wrap);
    if (okWrap) {
      setUiHidden(false);
      scheduleAutoHide();
      return;
    }

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
      className={`${pseudoFs ? "bcPseudoFs" : ""} ${inFullscreen ? "bcImmersive" : ""}`}
      style={{
        padding: cardMode ? 0 : 0,
        borderRadius: cardMode ? 22 : 0,
        overflow: "hidden",
        position: "relative",
        border: "none", // <- никаких белых рамок
        background: cardMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.94)",
        boxShadow: cardMode ? "0 30px 120px rgba(0,0,0,0.28)" : "none"
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
      <div onClick={onFrameTap} style={{ borderRadius: cardMode ? 22 : 0, overflow: "hidden" }}>
        <iframe
          ref={iframeRef}
          title="EvoFish"
          src={props.src}
          style={{
            width: "100%",
            height: cardMode ? "62vh" : "var(--app-vh)",
            minHeight: cardMode ? "520px" : "var(--app-vh)",
            border: 0,
            display: "block"
          }}
          allow="fullscreen; gamepad; autoplay"
          allowFullScreen
        />
      </div>

      {inFullscreen && uiHidden ? (
        <div className="bcHint">
          Тапни чтобы показать меню · Double tap — UI
        </div>
      ) : null}

      <style>{`
        .bcPseudoFs{
          position: fixed !important;
          inset: 0 !important;
          z-index: 9999 !important;
        }

        .bcImmersive{
          width: var(--app-vw, 100vw) !important;
          height: var(--app-vh, 100vh) !important;
          background: rgba(0,0,0,0.94) !important;
        }

        .bcOverlay{
          position: ${cardMode ? "relative" : "absolute"};
          top: 0;
          left: 0;
          right: 0;
          z-index: 20;
          padding: ${cardMode ? "12px 12px 10px" : "max(10px, env(safe-area-inset-top)) 10px 10px"};
          transition: transform 160ms ease, opacity 160ms ease;
          will-change: transform, opacity;
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
          border: none;
          background: ${cardMode ? "transparent" : "rgba(0,0,0,0.22)"};
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
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.07);
          color: var(--text);
          cursor: pointer;
          font-weight: 850;
        }
        .bcPillPrimary{
          border: 1px solid rgba(120,160,255,0.26);
          background: linear-gradient(180deg, rgba(120,160,255,0.38), rgba(120,160,255,0.16));
        }

        .bcHint{
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: max(12px, env(safe-area-inset-bottom));
          z-index: 30;
          padding: 10px 12px;
          border-radius: 999px;
          border: none;
          background: rgba(0,0,0,0.28);
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

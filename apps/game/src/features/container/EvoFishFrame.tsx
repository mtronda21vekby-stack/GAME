import React, { useEffect, useRef, useState } from "react";
import type { GameSettings } from "./SettingsPanel";
import { EVOFISH_MOBILE_CSS } from "./evoFishMobileCss";

type EvoFishFrameProps = {
  src: string;
  settings: GameSettings;
  onOpenSettings?: () => void;
};

type FullscreenElement = HTMLElement & {
  requestFullscreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
};

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
};

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

function isNativeFullscreenActive() {
  const d = document as any;
  return Boolean(
    document.fullscreenElement ||
      d.webkitFullscreenElement ||
      d.mozFullScreenElement ||
      d.msFullscreenElement
  );
}

async function requestFullscreen(el: FullscreenElement | null) {
  if (!el) return false;
  const fn =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen ||
    null;

  if (!fn) return false;

  try {
    await fn.call(el);
    return true;
  } catch {
    return false;
  }
}

async function exitNativeFullscreen() {
  const d = document as FullscreenDocument;
  const fn =
    document.exitFullscreen ||
    d.webkitExitFullscreen ||
    d.mozCancelFullScreen ||
    d.msExitFullscreen ||
    null;

  if (!fn) return false;

  try {
    await fn.call(document);
    return true;
  } catch {
    return false;
  }
}

function injectMobileCss(frame: HTMLIFrameElement | null) {
  try {
    const doc = frame?.contentDocument;
    if (!doc) return;

    const old = doc.getElementById("bc-mobile-game-css");
    if (old) old.remove();

    const style = doc.createElement("style");
    style.id = "bc-mobile-game-css";
    style.textContent = EVOFISH_MOBILE_CSS;
    doc.head.appendChild(style);

    const viewport = doc.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        "content",
        "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"
      );
    }
  } catch {
    // EvoFish is same-origin in production. If injection fails, keep original game playable.
  }
}

export function EvoFishFrame(props: EvoFishFrameProps) {
  useAppViewportHeightVar();

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const hideTimer = useRef<number | null>(null);

  const [pseudoFullscreen, setPseudoFullscreen] = useState(true);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [uiHidden, setUiHidden] = useState(true);

  const fullscreen = pseudoFullscreen || nativeFullscreen;

  const clearHideTimer = () => {
    if (!hideTimer.current) return;
    window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };

  const autoHideUi = () => {
    clearHideTimer();
    if (!fullscreen) return;
    hideTimer.current = window.setTimeout(() => setUiHidden(true), 2400);
  };

  const openMenu = () => {
    setUiHidden((value) => !value);
    autoHideUi();
  };

  const openGameTab = (tabId: string) => {
    try {
      const tab = iframeRef.current?.contentDocument?.getElementById(tabId) as HTMLElement | null;
      tab?.click();
      setUiHidden(true);
    } catch {
      // keep game running
    }
  };

  const enterFullscreen = async () => {
    const ok = await requestFullscreen(wrapRef.current as FullscreenElement | null);
    if (!ok) setPseudoFullscreen(true);
    setUiHidden(true);
    autoHideUi();
  };

  const exitFullscreen = async () => {
    await exitNativeFullscreen();
    setPseudoFullscreen(false);
    setUiHidden(false);
    clearHideTimer();
  };

  const reload = () => {
    const frame = iframeRef.current;
    if (frame) frame.src = frame.src;
  };

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setNativeFullscreen(isNativeFullscreenActive());
      setUiHidden(true);
      autoHideUi();
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange" as any, onFullscreenChange);
    document.addEventListener("mozfullscreenchange" as any, onFullscreenChange);
    document.addEventListener("MSFullscreenChange" as any, onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange" as any, onFullscreenChange);
      document.removeEventListener("mozfullscreenchange" as any, onFullscreenChange);
      document.removeEventListener("MSFullscreenChange" as any, onFullscreenChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  useEffect(() => {
    const t = window.setInterval(() => injectMobileCss(iframeRef.current), 800);
    return () => window.clearInterval(t);
  }, []);

  const frameHeight = fullscreen ? "var(--app-vh)" : "72vh";

  return (
    <div
      ref={wrapRef}
      className={`${pseudoFullscreen ? "bcPseudoFs" : ""} ${fullscreen ? "bcImmersive" : ""}`}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: fullscreen ? 0 : 22,
        background: "#031827"
      }}
    >
      <button className="bcQuickMenu" type="button" onClick={openMenu} aria-label="Меню игры">
        ☰
      </button>

      <div className={`bcOverlay ${fullscreen && uiHidden ? "bcOverlayHidden" : ""}`}>
        <div className="bcOverlayInner">
          <button className="bcPill bcPillPrimary" onClick={() => openGameTab("tHud")}>Игра</button>
          <button className="bcPill" onClick={() => openGameTab("tShop")}>Магазин</button>
          <button className="bcPill" onClick={() => openGameTab("tCraft")}>Мутации</button>
          <button className="bcPill" onClick={() => openGameTab("tQuests")}>Задания</button>
          <button className="bcPill" onClick={() => openGameTab("tSettings")}>Настройки</button>
          <button className="bcPill" onClick={reload}>Reload</button>
          {props.onOpenSettings ? <button className="bcPill" onClick={props.onOpenSettings}>App</button> : null}
          {fullscreen ? (
            <button className="bcPill" onClick={exitFullscreen}>Close</button>
          ) : (
            <button className="bcPill" onClick={enterFullscreen}>Fullscreen</button>
          )}
        </div>
      </div>

      <div style={{ height: frameHeight }}>
        <iframe
          ref={iframeRef}
          title="EvoFish"
          src={props.src}
          onLoad={() => injectMobileCss(iframeRef.current)}
          style={{
            width: "100%",
            height: frameHeight,
            minHeight: frameHeight,
            border: 0,
            display: "block",
            background: "#031827"
          }}
          allow="fullscreen; gamepad; autoplay"
          allowFullScreen
        />
      </div>

      <style>{`
        .bcPseudoFs{position:fixed!important;inset:0!important;z-index:9999!important}
        .bcImmersive{width:var(--app-vw,100vw)!important;height:var(--app-vh,100vh)!important;background:#031827!important}
        .bcQuickMenu{position:absolute;right:max(12px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));z-index:36;width:46px;height:46px;border-radius:999px;border:1px solid rgba(150,230,255,.18);background:rgba(2,16,27,.62);color:#e7f2ff;font-size:22px;font-weight:900;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 12px 30px rgba(0,0,0,.22)}
        .bcOverlay{position:absolute;left:0;right:0;top:0;z-index:35;padding:calc(max(10px,env(safe-area-inset-top)) + 54px) 10px 10px;transition:opacity 160ms ease,transform 160ms ease;pointer-events:none}
        .bcOverlayHidden{opacity:0;transform:translateY(-12px)}
        .bcOverlayInner{margin-left:auto;width:min(320px,calc(100vw - 20px));display:grid;grid-template-columns:1fr;gap:8px;padding:10px;border-radius:22px;background:rgba(2,16,27,.94);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(150,230,255,.14);box-shadow:0 18px 50px rgba(0,0,0,.30);pointer-events:auto}
        .bcPill{min-height:42px;padding:0 13px;border-radius:15px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.07);color:#e7f2ff;font-weight:900;text-align:left}.bcPillPrimary{border-color:rgba(120,240,255,.28);background:linear-gradient(180deg,rgba(120,240,255,.22),rgba(90,160,255,.13))}
        @media(orientation:landscape){.bcQuickMenu{width:42px;height:42px;font-size:20px}.bcOverlay{padding-top:calc(max(10px,env(safe-area-inset-top)) + 50px)}.bcOverlayInner{width:250px}}
      `}</style>
    </div>
  );
}

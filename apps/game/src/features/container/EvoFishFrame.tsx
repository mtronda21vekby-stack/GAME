import React, { useEffect, useRef, useState } from "react";
import { navigate } from "../../router";
import type { GameSettings } from "./SettingsPanel";
import { EVOFISH_MOBILE_CSS } from "./evoFishMobileCss";
import { InstallAppHint } from "./InstallAppHint";
import { applyEvoFishRuntime, EVOFISH_VERSION } from "./evoFishRuntime";
import { EVOFISH_NEXT_VERSION } from "../../evofish-next/version";

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

function applyRuntime(frame: HTMLIFrameElement | null) {
  injectMobileCss(frame);
  applyEvoFishRuntime(frame);
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
    hideTimer.current = window.setTimeout(() => setUiHidden(true), 3200);
  };

  const toggleMenu = () => {
    setUiHidden((value) => !value);
    autoHideUi();
  };

  const openNextGame = (event?: React.SyntheticEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    clearHideTimer();
    setUiHidden(true);
    navigate("/game/next");
  };

  const openSkinLab = (event?: React.SyntheticEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    clearHideTimer();
    setUiHidden(true);
    navigate("/game/next/skins");
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
    document.title = `EvoFish ${EVOFISH_VERSION}`;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      clearHideTimer();
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setNativeFullscreen(isNativeFullscreenActive());
      setUiHidden(true);
      clearHideTimer();
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
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => applyRuntime(iframeRef.current), 800);
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
      <button className="bcMenuButton" type="button" onClick={toggleMenu} aria-label="Меню игры">
        Меню
      </button>

      <button
        className="bcNextQuick"
        type="button"
        onPointerDown={openNextGame}
        onTouchStart={openNextGame}
        onClick={openNextGame}
        aria-label="Открыть EvoFish Next"
      >
        NEXT GAME<span>{EVOFISH_NEXT_VERSION}</span>
      </button>

      <InstallAppHint />

      <div className={`bcOverlay ${fullscreen && uiHidden ? "bcOverlayHidden" : ""}`}>
        <div className="bcOverlayInner">
          <div className="bcMenuHeader">
            EvoFish
            <span>Playable {EVOFISH_VERSION}</span>
            <span>Next {EVOFISH_NEXT_VERSION}</span>
          </div>
          <button className="bcPill bcPillNext" onPointerDown={openNextGame} onClick={openNextGame}>NEXT GAME — новая версия</button>
          <button className="bcPill bcPillNextGhost" onPointerDown={openSkinLab} onClick={openSkinLab}>Skin Lab — скины Next</button>
          <button className="bcPill bcPillPrimary" onClick={() => openGameTab("tHud")}>Игра</button>
          <button className="bcPill" onClick={() => openGameTab("tShop")}>Магазин</button>
          <button className="bcPill" onClick={() => openGameTab("tCraft")}>Мутации</button>
          <button className="bcPill" onClick={() => openGameTab("tQuests")}>Задания</button>
          <button className="bcPill" onClick={() => openGameTab("tSettings")}>Настройки</button>
          <button className="bcPill" onClick={reload}>Перезапуск</button>
          {props.onOpenSettings ? <button className="bcPill" onClick={props.onOpenSettings}>App</button> : null}
          {fullscreen ? (
            <button className="bcPill" onClick={exitFullscreen}>Окно</button>
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
          onLoad={() => {
            applyRuntime(iframeRef.current);
            setUiHidden(true);
          }}
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
        .bcMenuButton{position:fixed!important;left:max(126px,calc(env(safe-area-inset-left) + 126px));top:max(10px,env(safe-area-inset-top));z-index:2147483300;width:58px;height:30px;border-radius:999px;border:1px solid rgba(150,230,255,.20);background:linear-gradient(180deg,rgba(2,18,30,.70),rgba(2,18,30,.46));color:rgba(231,242,255,.92);font-size:11px;font-weight:950;letter-spacing:.02em;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 10px 24px rgba(0,0,0,.20);pointer-events:auto!important;touch-action:manipulation}
        .bcNextQuick{position:fixed!important;right:max(10px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));z-index:2147483400;min-width:118px;height:38px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,215,120,.36);background:linear-gradient(180deg,rgba(255,215,120,.26),rgba(255,120,80,.14));color:#fff3c4;font-size:11px;font-weight:1000;letter-spacing:.04em;text-align:left;box-shadow:0 14px 34px rgba(0,0,0,.28),0 0 24px rgba(255,190,90,.12);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);pointer-events:auto!important;touch-action:manipulation}.bcNextQuick span{display:block;margin-top:1px;color:rgba(255,255,255,.72);font-size:9px;font-weight:850;letter-spacing:0;text-transform:none}
        .bcOverlay{position:absolute;left:0;right:0;top:0;z-index:35;padding:calc(max(10px,env(safe-area-inset-top)) + 46px) 10px 10px;transition:opacity 160ms ease,transform 160ms ease;pointer-events:none}
        .bcOverlayHidden{opacity:0;transform:translateY(-12px);visibility:hidden}
        .bcOverlayHidden .bcOverlayInner{pointer-events:none!important}
        .bcOverlayInner{margin-left:max(10px,env(safe-area-inset-left));width:min(320px,calc(100vw - 20px));display:grid;grid-template-columns:1fr;gap:8px;padding:10px;border-radius:22px;background:rgba(2,16,27,.95);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(150,230,255,.16);box-shadow:0 18px 50px rgba(0,0,0,.32);pointer-events:auto}
        .bcMenuHeader{padding:4px 4px 7px;color:#e7f2ff;font-weight:950;font-size:13px}.bcMenuHeader span{display:block;margin-top:2px;font-size:11px;color:rgba(231,242,255,.62);font-weight:850}
        .bcPill{min-height:42px;padding:0 13px;border-radius:15px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.07);color:#e7f2ff;font-weight:950;text-align:left}.bcPillPrimary{border-color:rgba(120,240,255,.30);background:linear-gradient(180deg,rgba(120,240,255,.24),rgba(90,160,255,.14))}.bcPillNext{border-color:rgba(255,215,120,.34);background:linear-gradient(180deg,rgba(255,215,120,.24),rgba(255,120,80,.12));color:#fff3c4}.bcPillNextGhost{border-color:rgba(180,140,255,.24);background:linear-gradient(180deg,rgba(180,140,255,.16),rgba(120,240,255,.08))}
        @media(orientation:landscape){.bcMenuButton{left:max(118px,calc(env(safe-area-inset-left) + 118px));width:54px;height:28px;font-size:10px}.bcNextQuick{min-width:110px;height:34px;font-size:10px}.bcOverlay{padding-top:calc(max(10px,env(safe-area-inset-top)) + 42px)}.bcOverlayInner{width:250px}}
      `}</style>
    </div>
  );
}

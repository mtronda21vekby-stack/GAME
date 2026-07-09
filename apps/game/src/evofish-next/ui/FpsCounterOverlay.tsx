import React, { useEffect, useRef, useState } from "react";

const FPS_KEY = "evofish_next_show_fps_v1";

function readEnabled() {
  try {
    return localStorage.getItem(FPS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeEnabled(enabled: boolean) {
  try {
    localStorage.setItem(FPS_KEY, enabled ? "1" : "0");
    window.dispatchEvent(new Event("evofish_fps_setting_changed"));
  } catch {
    // optional setting
  }
}

function settingsPanelOpen() {
  return typeof document !== "undefined" && Boolean(document.querySelector(".efSettingsPanel"));
}

export function FpsCounterOverlay() {
  const [enabled, setEnabled] = useState(readEnabled);
  const [settingsOpen, setSettingsOpen] = useState(settingsPanelOpen);
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(typeof performance !== "undefined" ? performance.now() : 0);

  useEffect(() => {
    let raf = 0;
    const loop = (time: number) => {
      frameCount.current += 1;
      const elapsed = time - lastTime.current;
      if (elapsed >= 500) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastTime.current = time;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const refresh = () => {
      setEnabled(readEnabled());
      setSettingsOpen(settingsPanelOpen());
    };
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setInterval(refresh, 400);
    window.addEventListener("storage", refresh);
    window.addEventListener("evofish_fps_setting_changed", refresh as EventListener);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("evofish_fps_setting_changed", refresh as EventListener);
    };
  }, []);

  const toggle = () => {
    const next = !enabled;
    writeEnabled(next);
    setEnabled(next);
  };

  return (
    <>
      {settingsOpen ? <button className={`efFpsToggle ${enabled ? "active" : ""}`} onClick={toggle}>FPS {enabled ? `ON · ${fps || "—"}` : "OFF"}</button> : null}
      {enabled ? <div className={`efFpsCounter ${fps < 45 ? "warn" : fps >= 58 ? "good" : ""}`}>{fps || "—"} FPS</div> : null}
      <style>{`
        .efFpsCounter{position:fixed;right:max(10px,env(safe-area-inset-right));top:calc(max(10px,env(safe-area-inset-top)) + 32px);z-index:10005;border:1px solid rgba(150,230,255,.18);border-radius:999px;background:rgba(2,16,27,.48);color:#e7f2ff;font:1000 11px/1 system-ui,-apple-system,BlinkMacSystemFont,sans-serif;padding:7px 9px;box-shadow:0 10px 28px rgba(0,0,0,.24);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);pointer-events:none}.efFpsCounter.good{color:#84ffc0}.efFpsCounter.warn{color:#ffdf7a}.efFpsToggle{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:calc(max(18px,env(safe-area-inset-bottom)) + 92px);z-index:10008;min-width:96px;min-height:38px;border-radius:14px;border:1px solid rgba(150,230,255,.20);background:rgba(2,16,27,.76);color:#e7f2ff;font:1000 12px/1 system-ui,-apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 12px 34px rgba(0,0,0,.30);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}.efFpsToggle.active{background:linear-gradient(135deg,rgba(120,240,255,.22),rgba(110,255,180,.16));border-color:rgba(120,240,255,.36);color:#e7f2ff}
      `}</style>
    </>
  );
}

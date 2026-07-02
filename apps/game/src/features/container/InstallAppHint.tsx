import React, { useEffect, useMemo, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
};

function isStandaloneMode() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.("(display-mode: standalone)")?.matches || nav.standalone === true;
}

function isIOSLike() {
  const ua = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  return /iPhone|iPad|iPod/i.test(ua) || (platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

function dismissed() {
  try {
    return localStorage.getItem("evofish.installHint.dismissed.v1") === "1";
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    localStorage.setItem("evofish.installHint.dismissed.v1", "1");
  } catch {
    // ignore
  }
}

export function InstallAppHint() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);

  const ios = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isIOSLike();
  }, []);

  useEffect(() => {
    if (isStandaloneMode() || dismissed()) return;

    const showTimer = window.setTimeout(() => setVisible(true), 900);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setVisible(true);
      setExpanded(false);
    };

    const onInstalled = () => {
      rememberDismissed();
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || isStandaloneMode()) return null;

  const close = () => {
    rememberDismissed();
    setVisible(false);
  };

  const install = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      setPromptEvent(null);
      rememberDismissed();
      setVisible(false);
      return;
    }
    setExpanded(true);
  };

  return (
    <div className="bcInstallHint" role="dialog" aria-label="Установка EvoFish">
      <button className="bcInstallClose" type="button" onClick={close} aria-label="Закрыть">
        ×
      </button>

      <div className="bcInstallTitle">Установи EvoFish как приложение</div>
      <div className="bcInstallText">
        Так игра откроется без вкладок Safari и с большим игровым экраном.
      </div>

      {expanded ? (
        <div className="bcInstallSteps">
          {ios ? (
            <>
              <div>1. Нажми кнопку <b>Поделиться</b> в Safari.</div>
              <div>2. Выбери <b>На экран “Домой”</b>.</div>
              <div>3. Нажми <b>Добавить</b>.</div>
            </>
          ) : (
            <>
              <div>1. Открой меню браузера.</div>
              <div>2. Выбери <b>Установить приложение</b> или <b>Add to Home Screen</b>.</div>
            </>
          )}
        </div>
      ) : null}

      <button className="bcInstallButton" type="button" onClick={install}>
        {promptEvent ? "Установить одной кнопкой" : ios ? "Показать инструкцию" : "Установить"}
      </button>

      <style>{`
        .bcInstallHint{position:absolute;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));z-index:42;max-width:430px;margin:0 auto;padding:14px 14px 12px;border-radius:22px;background:linear-gradient(180deg,rgba(3,24,39,.94),rgba(1,12,22,.94));border:1px solid rgba(150,230,255,.16);box-shadow:0 18px 52px rgba(0,0,0,.34);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:#e7f2ff;pointer-events:auto}
        .bcInstallClose{position:absolute;right:10px;top:8px;width:30px;height:30px;border-radius:999px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.07);color:#e7f2ff;font-size:20px;line-height:1}
        .bcInstallTitle{font-weight:950;font-size:15px;padding-right:34px}.bcInstallText{margin-top:5px;font-size:12px;line-height:1.35;color:rgba(231,242,255,.78)}
        .bcInstallSteps{margin-top:10px;display:grid;gap:5px;font-size:12px;line-height:1.35;color:rgba(231,242,255,.88)}
        .bcInstallButton{margin-top:11px;width:100%;min-height:42px;border:0;border-radius:16px;background:linear-gradient(180deg,rgba(120,240,255,.26),rgba(90,160,255,.16));color:#e7f2ff;font-weight:950;font-size:13px}
        @media(orientation:landscape){.bcInstallHint{left:auto;width:330px;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));padding:12px}.bcInstallTitle{font-size:14px}.bcInstallText,.bcInstallSteps{font-size:11px}.bcInstallButton{min-height:38px}}
      `}</style>
    </div>
  );
}

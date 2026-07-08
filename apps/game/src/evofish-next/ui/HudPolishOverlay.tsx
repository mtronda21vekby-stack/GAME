import React, { useEffect } from "react";

export function HudPolishOverlay() {
  useEffect(() => {
    const applyPanelScrollMode = () => {
      const root = document.querySelector<HTMLElement>(".efNextPlay");
      const panel = document.querySelector<HTMLElement>(".efGamePanel");
      if (!root) return;
      root.style.touchAction = panel ? "auto" : "none";
      if (panel) {
        panel.style.overflowY = "auto";
        panel.style.touchAction = "pan-y";
        panel.style.setProperty("-webkit-overflow-scrolling", "touch");
      }
    };

    const observer = new MutationObserver(applyPanelScrollMode);
    applyPanelScrollMode();
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    const tick = window.setInterval(applyPanelScrollMode, 350);
    return () => {
      observer.disconnect();
      window.clearInterval(tick);
      const root = document.querySelector<HTMLElement>(".efNextPlay");
      if (root) root.style.touchAction = "none";
    };
  }, []);

  return (
    <style>{`
      .efNextHud{width:min(300px,calc(var(--ef-vw,100vw) - 24px))!important;max-height:168px!important;padding:8px 8px 6px!important;border-radius:0!important;background:transparent!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;gap:3px!important;overflow:visible!important}.efHudTitle{justify-content:flex-start!important;gap:8px!important}.efHudTitle b{font-size:16px!important;letter-spacing:.01em!important;text-shadow:0 2px 7px rgba(0,0,0,.50)!important}.efHudTitle em{font-size:9px!important;color:#fff3a0!important;text-shadow:0 2px 7px rgba(0,0,0,.50)!important;margin-left:auto!important}.efHudChips{display:flex!important;gap:5px!important;align-items:center!important;grid-template-columns:none!important}.efHudChips span{min-height:23px!important;min-width:auto!important;width:auto!important;padding:0 8px!important;border-radius:999px!important;font-size:10.5px!important;background:rgba(2,16,27,.20)!important;border:1px solid rgba(150,230,255,.13)!important;box-shadow:none!important;backdrop-filter:blur(5px)!important;-webkit-backdrop-filter:blur(5px)!important}.efHudChips span:nth-child(3),.efHudChips span:nth-child(4){background:rgba(2,16,27,.16)!important;border-color:rgba(255,255,255,.12)!important}.efHudLine{font-size:9px!important;line-height:1.12!important;color:rgba(231,242,255,.82)!important;text-shadow:0 2px 7px rgba(0,0,0,.52)!important}.efHudLine:nth-of-type(1),.efHudLine:nth-of-type(3){display:none!important}.efNextHud .questText{display:block!important;color:rgba(255,243,160,.90)!important;margin-top:2px!important}.efNextHud>i{height:3px!important;max-width:244px!important;border-radius:999px!important;background:transparent!important;box-shadow:none!important;overflow:visible!important;margin:1px 0 4px!important}.efNextHud>i em{display:block!important;height:100%!important;border-radius:999px!important;box-shadow:none!important}.efNextHud>i em:not(.xp):not(.quest):not(.apex){background:linear-gradient(90deg,#80ffd8,#68e9ff)!important}.efNextHud>i em.xp{background:linear-gradient(90deg,#f1cc73,#e59d3c)!important;box-shadow:none!important}.efNextHud>i em.quest{background:linear-gradient(90deg,#aa8bff,#765cff)!important;opacity:.78!important;box-shadow:none!important}.efNextHud>i em.apex{background:linear-gradient(90deg,#ff7474,#ffd36a)!important;box-shadow:none!important}.efNextHud.compact{width:min(250px,calc(var(--ef-vw,100vw) - 24px))!important;max-height:112px!important}.efMenuGrid button:first-child{display:none!important}.efGamePanel{overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;overscroll-behavior:contain!important;max-height:min(74dvh,calc(var(--ef-vh,100dvh) - max(84px,env(safe-area-inset-top)) - 24px))!important}.efGamePanel *{touch-action:pan-y!important}.efSettingsPanel,.efShopPanel,.efFullMapPanel{max-height:calc(min(74dvh,calc(var(--ef-vh,100dvh) - max(84px,env(safe-area-inset-top)) - 24px)) - 52px)!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;padding-bottom:20px!important}.efControlModes,.efZoomPresets,.efPanelHead,.efSettingRow{touch-action:manipulation!important}.efSettingBlock,.efZoomControl{touch-action:pan-y!important}@media(max-width:520px){.efNextHud{width:min(292px,calc(var(--ef-vw,100vw) - 18px))!important;left:max(10px,env(safe-area-inset-left))!important;top:max(8px,env(safe-area-inset-top))!important}.efHudChips span{font-size:10px!important;min-height:22px!important;padding:0 7px!important}.efHudLine{font-size:8.8px!important}.efHudTitle b{font-size:15px!important}.efNextHud>i{max-width:232px!important}.efGamePanel{left:max(8px,env(safe-area-inset-left))!important;right:max(8px,env(safe-area-inset-right))!important;width:auto!important;max-height:min(78dvh,calc(var(--ef-vh,100dvh) - 86px))!important}.efSettingsPanel,.efShopPanel,.efFullMapPanel{max-height:calc(min(78dvh,calc(var(--ef-vh,100dvh) - 86px)) - 52px)!important}}
    `}</style>
  );
}

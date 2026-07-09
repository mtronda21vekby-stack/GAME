import React from "react";

/**
 * Keeps the top minimap visible while removing the old bottom full-map launcher.
 * Also restores safe iOS panel/settings scrolling without MutationObserver or DOM writes.
 */
export function NoMapQuickBarOverlay() {
  return (
    <style>{`
      .efQuickBar button:first-child{display:none!important;pointer-events:none!important}
      .efQuickBar{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;width:min(252px,calc(var(--ef-vw,100vw) - 24px))!important;align-items:stretch!important;justify-items:stretch!important}
      .efQuickBar button{width:100%!important;min-width:0!important}
      .efGamePanel.mapPanel,.efFullMapPanel{display:none!important;visibility:hidden!important;pointer-events:none!important}

      .efGamePanel{top:max(6px,env(safe-area-inset-top))!important;left:max(8px,env(safe-area-inset-left))!important;right:max(8px,env(safe-area-inset-right))!important;width:auto!important;max-height:calc(var(--ef-vh,100dvh) - max(12px,env(safe-area-inset-top)) - 14px)!important;padding:8px!important;border-radius:18px!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;overscroll-behavior:contain!important}
      .efGamePanel *{touch-action:pan-y!important}
      .efPanelHead{position:sticky!important;top:0!important;z-index:3!important;min-height:38px!important;height:38px!important;margin:0 0 6px!important;padding:0 0 6px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;background:linear-gradient(180deg,rgba(2,16,27,.96),rgba(2,16,27,.68))!important;border-bottom:1px solid rgba(150,230,255,.14)!important}
      .efPanelHead b{font-size:14px!important;line-height:1!important;letter-spacing:.01em!important}.efPanelHead button{width:32px!important;height:32px!important;min-width:32px!important;border-radius:50%!important;padding:0!important;font-size:20px!important;display:flex!important;align-items:center!important;justify-content:center!important}
      .efPanelHead,.efPanelHead *,.efControlModes,.efControlModes *,.efShopTabs,.efShopTabs *,.efZoomPresets,.efZoomPresets *,.efSettingRow button,.efWideButton,.efMenuGrid button,.efShopCard,.efPanelItem{touch-action:manipulation!important}

      .efSettingsPanel{display:grid!important;gap:7px!important;max-height:calc(var(--ef-vh,100dvh) - max(12px,env(safe-area-inset-top)) - 66px)!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;overscroll-behavior:contain!important;padding:0 1px 18px!important}
      .efSettingsPanel *{touch-action:pan-y!important}.efSettingsPanel button,.efSettingsPanel input{touch-action:manipulation!important}
      .efSettingBlock{display:grid!important;gap:6px!important;padding:8px!important;margin:0!important;border-radius:12px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(150,230,255,.12)!important;box-shadow:none!important}
      .efSettingBlock b{font-size:12px!important;line-height:1.05!important;margin:0!important;color:#fff!important}.efSettingBlock small{display:none!important}
      .efControlModes{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important}.efControlModes.two{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .efControlModes button,.efZoomPresets button,.efWideButton{min-height:32px!important;height:32px!important;border-radius:11px!important;padding:0 6px!important;font-size:10px!important;line-height:1!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important}
      .efControlModes button.active{background:linear-gradient(180deg,rgba(120,240,255,.22),rgba(90,160,255,.10))!important;border-color:rgba(120,240,255,.36)!important}
      .efSettingRow{min-height:38px!important;padding:6px 8px!important;margin:0!important;border-radius:12px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(150,230,255,.12)!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important}.efSettingRow span{font-size:11px!important;line-height:1!important}.efSettingRow button{height:30px!important;min-width:58px!important;border-radius:999px!important;font-size:10px!important}
      .efZoomControl{display:grid!important;gap:5px!important;padding:8px!important;margin:0!important;border-radius:12px!important;background:rgba(255,255,255,.04)!important;border:1px solid rgba(150,230,255,.11)!important;touch-action:pan-y!important}.efZoomControl span{font-size:11px!important;line-height:1.05!important}.efZoomControl input{height:22px!important;touch-action:manipulation!important}.efZoomPresets{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important}

      .efShopPanel{display:grid!important;gap:8px!important;max-height:calc(var(--ef-vh,100dvh) - max(12px,env(safe-area-inset-top)) - 66px)!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;overscroll-behavior:contain!important;padding:0 1px 18px!important}.efShopPanel *{touch-action:pan-y!important}.efShopPanel button,.efShopPanel a{touch-action:manipulation!important}
      .efNextPlay:has(.efGamePanel){touch-action:auto!important}

      @media(max-width:520px){.efQuickBar{width:min(238px,calc(var(--ef-vw,100vw) - 24px))!important}.efGamePanel{top:max(4px,env(safe-area-inset-top))!important;left:max(6px,env(safe-area-inset-left))!important;right:max(6px,env(safe-area-inset-right))!important;max-height:calc(var(--ef-vh,100dvh) - max(10px,env(safe-area-inset-top)) - 10px)!important;padding:7px!important;border-radius:16px!important}.efSettingsPanel,.efShopPanel{max-height:calc(var(--ef-vh,100dvh) - max(10px,env(safe-area-inset-top)) - 58px)!important}.efSettingBlock{padding:7px!important;gap:5px!important}.efControlModes button,.efZoomPresets button,.efWideButton{height:30px!important;min-height:30px!important;font-size:9.8px!important}.efPanelHead{height:36px!important;min-height:36px!important}.efPanelHead b{font-size:13px!important}}
    `}</style>
  );
}

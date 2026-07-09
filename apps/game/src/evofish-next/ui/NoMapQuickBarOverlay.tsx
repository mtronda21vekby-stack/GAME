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

      .efGamePanel{overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;overscroll-behavior:contain!important;max-height:min(78dvh,calc(var(--ef-vh,100dvh) - max(86px,env(safe-area-inset-top)) - 24px))!important}
      .efGamePanel *{touch-action:pan-y!important}
      .efPanelHead,.efPanelHead *,.efControlModes,.efControlModes *,.efShopTabs,.efShopTabs *,.efZoomPresets,.efZoomPresets *,.efSettingRow button,.efWideButton,.efMenuGrid button,.efShopCard,.efPanelItem{touch-action:manipulation!important}
      .efSettingsPanel,.efShopPanel{display:block!important;max-height:calc(min(78dvh,calc(var(--ef-vh,100dvh) - max(86px,env(safe-area-inset-top)) - 24px)) - 52px)!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;overscroll-behavior:contain!important;padding-bottom:24px!important}
      .efSettingsPanel *,.efShopPanel *{touch-action:pan-y!important}
      .efSettingsPanel button,.efSettingsPanel input,.efShopPanel button,.efShopPanel a{touch-action:manipulation!important}
      .efZoomControl{touch-action:pan-y!important}
      .efZoomControl input{touch-action:manipulation!important}
      .efNextPlay:has(.efGamePanel){touch-action:auto!important}

      @media(max-width:520px){.efQuickBar{width:min(238px,calc(var(--ef-vw,100vw) - 24px))!important}.efGamePanel{left:max(8px,env(safe-area-inset-left))!important;right:max(8px,env(safe-area-inset-right))!important;width:auto!important;max-height:min(80dvh,calc(var(--ef-vh,100dvh) - 88px))!important}.efSettingsPanel,.efShopPanel{max-height:calc(min(80dvh,calc(var(--ef-vh,100dvh) - 88px)) - 52px)!important}}
    `}</style>
  );
}

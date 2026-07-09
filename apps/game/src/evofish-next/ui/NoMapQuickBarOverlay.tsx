import React from "react";

/**
 * Keeps the top minimap visible while removing the old bottom full-map launcher.
 * This is intentionally CSS-only: no MutationObserver, no DOM writes, no runtime side effects.
 */
export function NoMapQuickBarOverlay() {
  return (
    <style>{`
      .efQuickBar button:first-child{display:none!important;pointer-events:none!important}
      .efQuickBar{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;width:min(252px,calc(var(--ef-vw,100vw) - 24px))!important;align-items:stretch!important;justify-items:stretch!important}
      .efQuickBar button{width:100%!important;min-width:0!important}
      .efGamePanel.mapPanel,.efFullMapPanel{display:none!important;visibility:hidden!important;pointer-events:none!important}
      @media(max-width:520px){.efQuickBar{width:min(238px,calc(var(--ef-vw,100vw) - 24px))!important}}
    `}</style>
  );
}

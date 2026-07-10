import React, { useEffect } from "react";

const THROTTLE_ATTR = "data-ef-panel-canvas-throttle";

function restoreCanvas(root?: HTMLElement | null) {
  const targetRoot = root || document.querySelector<HTMLElement>(".efNextPlay");
  const canvas = targetRoot?.querySelector<HTMLCanvasElement>(".efNextCanvas");
  targetRoot?.classList.remove("efPanelCanvasThrottled");
  if (!canvas) return;
  canvas.removeAttribute(THROTTLE_ATTR);
  canvas.style.visibility = "";
  canvas.style.pointerEvents = "";
}

function applyCanvasThrottle() {
  const root = document.querySelector<HTMLElement>(".efNextPlay");
  if (!root) return;

  const panelOpen = Boolean(root.querySelector(".efGamePanel:not(.mapPanel)"));
  root.classList.toggle("efPanelCanvasThrottled", panelOpen);

  const canvas = root.querySelector<HTMLCanvasElement>(".efNextCanvas");
  if (!canvas) return;

  if (!panelOpen) {
    restoreCanvas(root);
    return;
  }

  canvas.setAttribute(THROTTLE_ATTR, "1");
  canvas.style.visibility = "hidden";
  canvas.style.pointerEvents = "none";
}

/**
 * Mobile performance rescue for panels.
 * When a heavy UI panel is open, the gameplay canvas behind it is hidden from compositing.
 * Gameplay resumes normally when the panel closes.
 */
export function PanelCanvasThrottleOverlay() {
  useEffect(() => {
    applyCanvasThrottle();
    const observer = new MutationObserver(applyCanvasThrottle);
    observer.observe(document.body, { childList: true, subtree: true });
    const tick = window.setInterval(applyCanvasThrottle, 450);

    return () => {
      observer.disconnect();
      window.clearInterval(tick);
      restoreCanvas();
    };
  }, []);

  return (
    <style>{`
      .efNextPlay.efPanelCanvasThrottled{background:radial-gradient(circle at 25% 20%,rgba(120,240,255,.14),transparent 34%),linear-gradient(180deg,#09283a,#02101b)!important}
      .efNextPlay.efPanelCanvasThrottled .efNextCanvas{visibility:hidden!important;pointer-events:none!important}
      .efNextPlay.efPanelCanvasThrottled .efGamePanel{transform:translateZ(0)!important;will-change:transform!important}
    `}</style>
  );
}

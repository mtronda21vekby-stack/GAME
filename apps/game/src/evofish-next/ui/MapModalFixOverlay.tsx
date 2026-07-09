import React, { useEffect } from "react";

function numberAttr(node: Element | null, name: string) {
  const value = Number(node?.getAttribute(name) || 0);
  return Number.isFinite(value) ? value : 0;
}

function baseWorldSize(svg: SVGSVGElement) {
  if (!svg.dataset.worldWidth || !svg.dataset.worldHeight) {
    const vb = (svg.getAttribute("viewBox") || "0 0 5200 3400").split(/\s+/).map(Number);
    svg.dataset.worldWidth = String(Math.max(1, vb[2] || 5200));
    svg.dataset.worldHeight = String(Math.max(1, vb[3] || 3400));
  }
  return {
    worldW: Math.max(1, Number(svg.dataset.worldWidth || 5200)),
    worldH: Math.max(1, Number(svg.dataset.worldHeight || 3400))
  };
}

function applyFocusedMapView(svg: SVGSVGElement, panel: HTMLElement) {
  const player = Array.from(svg.querySelectorAll<SVGCircleElement>("circle"))
    .find((circle) => (circle.getAttribute("fill") || "").includes("110,255,180"));
  if (!player) return;

  const { worldW, worldH } = baseWorldSize(svg);
  const rect = panel.getBoundingClientRect();
  const aspect = Math.max(0.52, Math.min(1.9, rect.width / Math.max(1, rect.height)));
  const viewH = Math.min(worldH, Math.max(1380, worldH * 0.52));
  const viewW = Math.min(worldW, viewH * aspect);
  const cx = numberAttr(player, "cx");
  const cy = numberAttr(player, "cy");
  const x = Math.max(0, Math.min(worldW - viewW, cx - viewW * 0.5));
  const y = Math.max(0, Math.min(worldH - viewH, cy - viewH * 0.5));

  svg.setAttribute("viewBox", `${x} ${y} ${viewW} ${viewH}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
}

export function MapModalFixOverlay() {
  useEffect(() => {
    const apply = () => {
      const panel = document.querySelector<HTMLElement>(".efGamePanel.mapPanel");
      const frame = document.querySelector<HTMLElement>(".efWorldMapFrame");
      const svg = document.querySelector<SVGSVGElement>(".efWorldMapSvg");
      if (!panel || !frame || !svg) return;

      panel.classList.add("efMapModalFixed");
      frame.classList.add("efMapFrameFixed");
      svg.classList.add("efMapSvgFixed");
      applyFocusedMapView(svg, frame);
    };

    const observer = new MutationObserver(apply);
    apply();
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    const timer = window.setInterval(apply, 500);
    window.addEventListener("resize", apply, { passive: true });
    window.visualViewport?.addEventListener("resize", apply, { passive: true });
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      window.removeEventListener("resize", apply);
      window.visualViewport?.removeEventListener("resize", apply);
    };
  }, []);

  return (
    <style>{`
      .efGamePanel.mapPanel.efMapModalFixed{position:fixed!important;left:50%!important;top:50%!important;right:auto!important;bottom:auto!important;transform:translate(-50%,-50%)!important;width:min(94vw,860px)!important;height:min(78dvh,760px)!important;max-height:min(78dvh,760px)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;border-radius:24px!important;background:rgba(4,18,30,.86)!important;border:1px solid rgba(150,230,255,.20)!important;box-shadow:0 22px 68px rgba(0,0,0,.42)!important;backdrop-filter:blur(16px)!important;-webkit-backdrop-filter:blur(16px)!important;padding:0!important}.efGamePanel.mapPanel.efMapModalFixed .efPanelHead{height:64px!important;flex:0 0 64px!important;padding:0 16px!important;border-bottom:1px solid rgba(150,230,255,.14)!important;background:rgba(2,16,27,.32)!important}.efGamePanel.mapPanel.efMapModalFixed .efPanelHead b{font-size:23px!important}.efGamePanel.mapPanel.efMapModalFixed .efPanelHead button{width:44px!important;height:44px!important;border-radius:50%!important}.efGamePanel.mapPanel.efMapModalFixed .efFullMapPanel{position:relative!important;flex:1 1 auto!important;min-height:0!important;height:auto!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;padding:0!important;margin:0!important;max-height:none!important}.efWorldMapFrame.efMapFrameFixed{position:relative!important;flex:1 1 auto!important;min-height:0!important;width:100%!important;height:100%!important;overflow:hidden!important;border:0!important;border-radius:0!important;background:rgba(2,16,27,.42)!important}.efWorldMapSvg.efMapSvgFixed{display:block!important;width:100%!important;height:100%!important;min-width:0!important;max-width:none!important}.efGamePanel.mapPanel.efMapModalFixed .efMapLegend{position:absolute!important;left:12px!important;right:12px!important;bottom:10px!important;display:flex!important;flex-wrap:wrap!important;gap:8px!important;justify-content:center!important;padding:8px 10px!important;border-radius:14px!important;background:rgba(2,16,27,.54)!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important;z-index:2!important}.efGamePanel.mapPanel.efMapModalFixed .efMapLegend span{font-size:11px!important}@media(max-width:720px){.efGamePanel.mapPanel.efMapModalFixed{width:calc(100vw - 12px)!important;height:min(79dvh,760px)!important;border-radius:22px!important}.efGamePanel.mapPanel.efMapModalFixed .efPanelHead{height:58px!important;flex-basis:58px!important}.efGamePanel.mapPanel.efMapModalFixed .efPanelHead b{font-size:22px!important}.efGamePanel.mapPanel.efMapModalFixed .efMapLegend{display:none!important}}
    `}</style>
  );
}

import React, { useEffect } from "react";
import MatrixBackground from "./components/MatrixBackground";
import { Router } from "./routes/Router";

function killLegacyBackgrounds() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const isVisible = (el: HTMLElement) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false;
    return true;
  };

  const looksLikeBg = (cs: CSSStyleDeclaration) => {
    const bgImg = cs.backgroundImage && cs.backgroundImage !== "none";
    const bgCol = cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent";
    const blur = (cs.backdropFilter && cs.backdropFilter !== "none") || ((cs as any).webkitBackdropFilter && (cs as any).webkitBackdropFilter !== "none");
    const filter = cs.filter && cs.filter !== "none";
    return bgImg || bgCol || blur || filter;
  };

  const coversViewport = (r: DOMRect) =>
    r.width >= vw - 2 && r.height >= vh - 2 && Math.abs(r.left) <= 2 && Math.abs(r.top) <= 2;

  const nodes = Array.from(document.body.querySelectorAll<HTMLElement>("*"));

  for (const el of nodes) {
    if (el.dataset.bcMatrixKeep === "1") continue;
    if (el.classList.contains("bc-matrix-bg")) continue;
    if (!isVisible(el)) continue;

    const cs = getComputedStyle(el);

    // чаще всего фон — fixed
    if (cs.position !== "fixed") continue;

    // не трогаем реальный UI поверх (высокие z-index)
    const z = parseInt(cs.zIndex || "0", 10);
    if (Number.isFinite(z) && z >= 50) continue;

    if (!looksLikeBg(cs)) continue;

    const r = el.getBoundingClientRect();
    if (!coversViewport(r)) continue;

    el.style.display = "none";
  }
}

export function App() {
  useEffect(() => {
    // 2 прохода: сразу и после первого кадра (когда всё домонтируется)
    killLegacyBackgrounds();
    requestAnimationFrame(killLegacyBackgrounds);
  }, []);

  return (
    <>
      <MatrixBackground
        opacity={0.085}
        speed={0.36}
        density={1.0}
        fontSize={16}
        color="rgba(90, 190, 255, 0.92)"
        glow
      />
      <div className="bc-app-layer" data-bc-matrix-keep="1">
        <Router />
      </div>
    </>
  );
}

export default App;

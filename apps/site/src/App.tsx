import React from "react";
import MatrixBackground from "./components/MatrixBackground";
import { Router } from "./routes/Router";

function syncAppVh() {
  const h = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-vh", `${Math.round(h)}px`);
}

export function App() {
  React.useEffect(() => {
    // ставим один раз
    syncAppVh();

    let raf = 0;
    let last = 0;

    const update = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const h = window.visualViewport?.height ?? window.innerHeight;
        const next = Math.round(h);

        // не дёргаем CSS-переменную по мелочи (это и было источником микролагов)
        if (Math.abs(next - last) >= 3) {
          last = next;
          document.documentElement.style.setProperty("--app-vh", `${next}px`);
        }
      });
    };

    const vv = window.visualViewport;

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    // ВАЖНО: НЕ слушаем vv.scroll — это ломает плавность скролла на iOS
    vv?.addEventListener?.("resize", update);

    // iOS иногда “застывает” после возврата со сна/фонового режима
    window.addEventListener("pageshow", update);
    window.addEventListener("focus", update);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      vv?.removeEventListener?.("resize", update);
      window.removeEventListener("pageshow", update);
      window.removeEventListener("focus", update);
    };
  }, []);

  return (
    <div className="bcAppShell">
      {/* фон фиксированный и закрывает весь экран */}
      <div className="bcMatrixLayer" aria-hidden="true">
        <MatrixBackground />
      </div>

      <div className="bcAppContent">
        <Router />
      </div>
    </div>
  );
}

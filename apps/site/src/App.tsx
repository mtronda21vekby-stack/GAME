import React from "react";
import MatrixBackground from "./components/MatrixBackground";
import { Router } from "./routes/Router";

function syncAppVhNow() {
  const h = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-vh", `${Math.round(h)}px`);
}

export function App() {
  React.useEffect(() => {
    let raf: number | null = null;

    const schedule = () => {
      if (raf != null) return;
      raf = window.requestAnimationFrame(() => {
        raf = null;
        syncAppVhNow();
      });
    };

    schedule();

    const vv = window.visualViewport;

    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);

    // iOS: реагируем на resize (адресная строка/панели)
    vv?.addEventListener("resize", schedule);

    return () => {
      if (raf != null) window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      vv?.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div className="bcAppShell">
      <div className="bcMatrixLayer" aria-hidden="true">
        <MatrixBackground />
      </div>

      <div className="bcAppContent">
        <Router />
      </div>
    </div>
  );
}

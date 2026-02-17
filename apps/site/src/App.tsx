import React from "react";
import MatrixBackground from "./components/MatrixBackground";
import { Router } from "./routes/Router";

function syncAppVh() {
  const h = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-vh", `${Math.round(h)}px`);
}

export function App() {
  React.useEffect(() => {
    syncAppVh();

    const onResize = () => syncAppVh();
    const vv = window.visualViewport;

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    // iOS Safari: высота реально меняется во время скролла
    vv?.addEventListener("resize", onResize);
    vv?.addEventListener("scroll", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      vv?.removeEventListener("resize", onResize);
      vv?.removeEventListener("scroll", onResize);
    };
  }, []);

  return (
    <div className="bcAppShell">
      {/* ВАЖНО: фон покрывает ВЕСЬ экран (layout viewport), иначе будут “поля” под Safari барами */}
      <div className="bcMatrixLayer" aria-hidden="true">
        <MatrixBackground />
      </div>

      <div className="bcAppContent">
        <Router />
      </div>
    </div>
  );
}

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

    // iOS Safari: высота viewport реально меняется во время скролла
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
      {/* Фон ВСЕГДА фиксированный и на всю высоту текущего visual viewport */}
      <div
        className="bcMatrixLayer"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "calc(var(--app-vh, 100vh))",
          zIndex: 0,
          pointerEvents: "none",
          background: "#000",
        }}
      >
        <MatrixBackground />
      </div>

      <div className="bcAppContent" style={{ position: "relative", zIndex: 1, minHeight: "100%" }}>
        <Router />
      </div>
    </div>
  );
}

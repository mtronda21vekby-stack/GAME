import React from "react";
import { ensureGuestSession } from "@blackcrown/core";
import { Router } from "./routes/Router";

let lastAppVh = 0;

function syncAppVh() {
  const h = Math.round(window.visualViewport?.height ?? window.innerHeight);
  if (Math.abs(h - lastAppVh) < 2) return;
  lastAppVh = h;
  document.documentElement.style.setProperty("--app-vh", `${h}px`);
}

export function App() {
  React.useEffect(() => {
    syncAppVh();

    let frame = 0;
    let viewportTimer = 0;
    const vv = window.visualViewport;

    const queueSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        syncAppVh();
      });
    };

    const onVisualViewportResize = () => {
      window.clearTimeout(viewportTimer);
      viewportTimer = window.setTimeout(queueSync, 120);
    };

    window.addEventListener("resize", queueSync, { passive: true });
    window.addEventListener("orientationchange", queueSync, { passive: true });
    vv?.addEventListener("resize", onVisualViewportResize, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(viewportTimer);
      window.removeEventListener("resize", queueSync);
      window.removeEventListener("orientationchange", queueSync);
      vv?.removeEventListener("resize", onVisualViewportResize);
    };
  }, []);

  React.useEffect(() => {
    void ensureGuestSession();
  }, []);

  return (
    <div className="bcAppShell">
      <div className="bcAppContent">
        <Router />
      </div>
    </div>
  );
}

export default App;

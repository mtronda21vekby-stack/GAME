import React from "react";
import { Router } from "./routes/Router";

let lastAppVh = 0;

function syncAppVh() {
  const h = Math.round(window.visualViewport?.height ?? window.innerHeight);
  if (Math.abs(h - lastAppVh) < 2) return;
  lastAppVh = h;
  document.documentElement.style.setProperty("--app-vh", `${h}px`);
}

function safeId() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCrypto = crypto as any;
    if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  } catch {
    // ignore
  }
  return `c_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function getClientId(): string {
  try {
    const k = "bc.clientId.v1";
    const ex = localStorage.getItem(k);
    if (ex) return ex;
    const id = safeId();
    localStorage.setItem(k, id);
    return id;
  } catch {
    return safeId();
  }
}

async function ensureGuestUser() {
  const clientId = getClientId();
  try {
    await fetch("/api/auth/guest", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ clientId }),
      credentials: "include",
      cache: "no-store",
      keepalive: true,
    });
  } catch {
    // ignore
  }
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
    ensureGuestUser();
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

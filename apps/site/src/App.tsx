import React from "react";
import MatrixBackground from "./components/MatrixBackground";
import { Router } from "./routes/Router";

function syncAppVh() {
  const h = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-vh", `${Math.round(h)}px`);
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

async function pingSite() {
  const clientId = getClientId();
  try {
    await fetch("/api/metrics/ping", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ clientId, area: "site" }),
      credentials: "include",
      keepalive: true,
      cache: "no-store",
    });
  } catch {
    // ignore
  }
}

export function App() {
  React.useEffect(() => {
    syncAppVh();

    const onResize = () => syncAppVh();
    const vv = window.visualViewport;

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    vv?.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      vv?.removeEventListener("resize", onResize);
    };
  }, []);

  React.useEffect(() => {
    let alive = true;

    pingSite();

    const t = window.setInterval(() => {
      if (!alive) return;
      if (document.visibilityState === "visible") pingSite();
    }, 20000);

    const onVis = () => {
      if (document.visibilityState === "visible") pingSite();
    };

    window.addEventListener("focus", onVis);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      window.clearInterval(t);
      window.removeEventListener("focus", onVis);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="bcAppShell">
      <div className="bcMatrixLayer" aria-hidden="true">
        <MatrixBackground />
      </div>

      {/* premium FX layers (CSS only) */}
      <div className="bcShellFx" aria-hidden="true">
        <div className="bcShellVignette" />
        <div className="bcShellNoise" />
      </div>

      <div className="bcAppContent">
        <Router />
      </div>
    </div>
  );
}

export default App;

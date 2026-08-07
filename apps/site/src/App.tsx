import React from "react";
import MatrixDepthEngine from "./components/MatrixDepthEngine";
import MotionDirector from "./components/MotionDirector";
import MotionRevealV3 from "./components/MotionRevealV3";
import SiteMusic from "./components/SiteMusic";
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
    ensureGuestUser();
  }, []);

  return (
    <div className="bcAppShell">
      <MatrixDepthEngine quality="auto" intensity={1} />
      <MotionDirector />
      <MotionRevealV3 />
      <SiteMusic />

      <div className="bcAppContent">
        <Router />
      </div>
    </div>
  );
}

export default App;

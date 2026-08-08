import React from "react";
import MatrixDepthEngine from "./components/MatrixDepthEngine";
import MobileParallaxDirector from "./components/MobileParallaxDirector";
import MotionDirector from "./components/MotionDirector";
import MotionRevealV3 from "./components/MotionRevealV3";
import PremiumParallaxDirector from "./components/PremiumParallaxDirector";
import SiteMusic from "./components/SiteMusic";
import { Router } from "./routes/Router";
import "./styles/mobile-scroll-stability.css";

function syncAppVh() {
  const h = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-vh", `${Math.round(h)}px`);
}

function useMobileStabilityProfile() {
  const query = "(max-width: 820px), (pointer: coarse)";
  const [enabled, setEnabled] = React.useState(() => window.matchMedia?.(query).matches ?? false);

  React.useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return;

    const sync = () => setEnabled(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  return enabled;
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
  const mobileStabilityProfile = useMobileStabilityProfile();

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
    <div className="bcAppShell" data-mobile-stability={mobileStabilityProfile ? "true" : "false"}>
      {!mobileStabilityProfile ? <MatrixDepthEngine quality="auto" intensity={1} /> : null}
      <MotionDirector />
      <MotionRevealV3 />
      {mobileStabilityProfile ? <MobileParallaxDirector /> : <PremiumParallaxDirector />}
      <SiteMusic />

      <div className="bcAppContent">
        <Router />
      </div>
    </div>
  );
}

export default App;

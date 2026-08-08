import React from "react";
import HeroParallaxDirector from "./components/HeroParallaxDirector";
import MatrixDepthEngine from "./components/MatrixDepthEngine";
import MobileParallaxDirector from "./components/MobileParallaxDirector";
import MotionDirector from "./components/MotionDirector";
import MotionRevealV3 from "./components/MotionRevealV3";
import PremiumParallaxDirector from "./components/PremiumParallaxDirector";
import SiteMusic from "./components/SiteMusic";
import { Router } from "./routes/Router";
import "./styles/mobile-scroll-stability.css";

let lastAppVh = 0;

function syncAppVh() {
  const h = Math.round(window.visualViewport?.height ?? window.innerHeight);
  if (Math.abs(h - lastAppVh) < 2) return;
  lastAppVh = h;
  document.documentElement.style.setProperty("--app-vh", `${h}px`);
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
      // iOS Safari can emit a stream of visualViewport resize events while the
      // address bar collapses during a flick. Updating a root layout variable on
      // every one of those events makes scroll compositing unnecessarily costly.
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
    <div className="bcAppShell" data-mobile-stability={mobileStabilityProfile ? "true" : "false"}>
      {!mobileStabilityProfile ? <MatrixDepthEngine quality="auto" intensity={1} /> : null}
      <MotionDirector />
      <MotionRevealV3 />
      {mobileStabilityProfile ? (
        <>
          <MobileParallaxDirector />
          <HeroParallaxDirector />
        </>
      ) : (
        <PremiumParallaxDirector />
      )}
      <SiteMusic />

      <div className="bcAppContent">
        <Router />
      </div>
    </div>
  );
}

export default App;
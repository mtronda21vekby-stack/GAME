import React from "react";
import { createRoot } from "react-dom/client";
import "@blackcrown/assets";
import "@blackcrown/ui";
import "./app.css";
import "./styles/site.css";
import "./styles/matrix.css";
import { App } from "./App";
import { registerSW } from "./pwa/registerSW";
import { ErrorBoundary } from "./ErrorBoundary";
import { applySitePrefs } from "./lib/prefs";

/**
 * Cursor + Scroll runtime vars (no deps, Production Safe)
 * Exposes CSS vars on :root:
 *  --bc-cx, --bc-cy (px)
 *  --bc-cx-n, --bc-cy-n (normalized -0.5..0.5)
 *  --bc-cvx, --bc-cvy (px/ms)
 *  --bc-scroll-y (px)
 *  --bc-scroll-p (0..1)
 *  --bc-scroll-v (px/ms)
 */
function initMotionRuntime() {
  const w = window as unknown as { __bc_motion_inited?: boolean };
  if (w.__bc_motion_inited) return;
  w.__bc_motion_inited = true;

  const root = document.documentElement;

  const state = {
    // cursor
    cx: window.innerWidth * 0.5,
    cy: window.innerHeight * 0.35,
    tx: window.innerWidth * 0.5,
    ty: window.innerHeight * 0.35,
    pcx: window.innerWidth * 0.5,
    pcy: window.innerHeight * 0.35,
    // scroll
    sy: window.scrollY || 0,
    psy: window.scrollY || 0,
    // timing
    t: performance.now(),
    raf: 0 as number | 0,
    active: true,
    reduced: false,
  };

  const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  state.reduced = !!mql?.matches;

  const setVars = (tNow: number) => {
    const dt = Math.max(8, Math.min(64, tNow - state.t)); // clamp for stability
    state.t = tNow;

    // cursor smoothing (very light, no "laggy follow")
    const follow = state.reduced ? 1 : 0.28;
    state.cx += (state.tx - state.cx) * follow;
    state.cy += (state.ty - state.cy) * follow;

    const vx = (state.cx - state.pcx) / dt;
    const vy = (state.cy - state.pcy) / dt;
    state.pcx = state.cx;
    state.pcy = state.cy;

    // scroll
    state.sy = window.scrollY || 0;
    const sv = (state.sy - state.psy) / dt;
    state.psy = state.sy;

    const doc = document.documentElement;
    const maxScroll = Math.max(1, (doc.scrollHeight || 0) - (window.innerHeight || 0));
    const sp = Math.max(0, Math.min(1, state.sy / maxScroll));

    // normalized cursor (-0.5..0.5)
    const nx = window.innerWidth > 0 ? state.cx / window.innerWidth - 0.5 : 0;
    const ny = window.innerHeight > 0 ? state.cy / window.innerHeight - 0.5 : 0;

    root.style.setProperty("--bc-cx", `${Math.round(state.cx)}px`);
    root.style.setProperty("--bc-cy", `${Math.round(state.cy)}px`);
    root.style.setProperty("--bc-cx-n", `${nx.toFixed(4)}`);
    root.style.setProperty("--bc-cy-n", `${ny.toFixed(4)}`);
    root.style.setProperty("--bc-cvx", `${vx.toFixed(4)}`);
    root.style.setProperty("--bc-cvy", `${vy.toFixed(4)}`);

    root.style.setProperty("--bc-scroll-y", `${Math.round(state.sy)}px`);
    root.style.setProperty("--bc-scroll-p", `${sp.toFixed(5)}`);
    root.style.setProperty("--bc-scroll-v", `${sv.toFixed(5)}`);
  };

  const tick = (tNow: number) => {
    state.raf = 0;
    if (!state.active) return;
    setVars(tNow);
  };

  const requestTick = () => {
    if (state.raf) return;
    state.raf = window.requestAnimationFrame(tick);
  };

  const onPointerMove = (e: PointerEvent) => {
    // only primary pointer for stability
    if (e.isPrimary === false) return;
    state.tx = e.clientX;
    state.ty = e.clientY;
    requestTick();
  };

  const onTouchMove = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    state.tx = t.clientX;
    state.ty = t.clientY;
    requestTick();
  };

  const onScroll = () => {
    requestTick();
  };

  const onResize = () => {
    requestTick();
  };

  const onVis = () => {
    state.active = document.visibilityState !== "hidden";
    if (state.active) requestTick();
  };

  const onMql = () => {
    state.reduced = !!mql?.matches;
    requestTick();
  };

  // init immediately
  requestTick();

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
  document.addEventListener("visibilitychange", onVis);
  mql?.addEventListener?.("change", onMql);

  // iOS: visualViewport changes during scroll (no layout thrash; only schedules a tick)
  const vv = window.visualViewport;
  vv?.addEventListener?.("resize", onResize);
  vv?.addEventListener?.("scroll", onResize);
}

applySitePrefs();
initMotionRuntime();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

registerSW();

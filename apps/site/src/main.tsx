import React from "react";
import { createRoot } from "react-dom/client";
import "@blackcrown/assets";
import "@blackcrown/ui";
import "./app.css";
import "./styles/site.css";
import "./styles/premium-shell.css";
import "./styles/visual-overhaul.css";
import "./styles/experience-layer.css";
import "./styles/stability-fixes.css";
import "./styles/matrix-rebirth.css";
import "./styles/customer-stability.css";
import "./styles/brand-nexus.css";
import "./styles/v3-mobile-art-pass.css";
import "./styles/dock-v2.css";
import "./styles/home-v3.css";
import { atomicMobileStyles } from "./styles/atomic-mobile-styles";
import { App } from "./App";
import { registerSW } from "./pwa/registerSW";
import { ErrorBoundary } from "./ErrorBoundary";
import { applySitePrefs } from "./lib/prefs";

function installAtomicMobileStyles() {
  const mobile = window.matchMedia?.("(max-width: 820px), (pointer: coarse)").matches ?? false;
  if (!mobile) return;

  const styleId = "bc-atomic-mobile-styles-v2";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.dataset.bcAtomicStyles = "v2";
  style.textContent = atomicMobileStyles;
  document.head.appendChild(style);
  document.documentElement.dataset.bcAtomicStyles = "v2";
}

/**
 * Crash hooks (Production Safe)
 * Sends minimal analytics events to /api/metrics/event
 * - site_window_error
 * - site_unhandled_rejection
 */
function installCrashHooks() {
  const w = window as unknown as { __bc_crash_hooks_inited?: boolean };
  if (w.__bc_crash_hooks_inited) return;
  w.__bc_crash_hooks_inited = true;

  const emit = async (name: string) => {
    try {
      await fetch("/api/metrics/event", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ app: "site", name, n: 1 }),
        credentials: "include",
        cache: "no-store",
        keepalive: true,
      });
    } catch {
      // ignore
    }
  };

  window.addEventListener(
    "error",
    () => {
      emit("site_window_error");
    },
    { passive: true }
  );

  window.addEventListener(
    "unhandledrejection",
    () => {
      emit("site_unhandled_rejection");
    },
    { passive: true }
  );
}

installAtomicMobileStyles();
applySitePrefs();
installCrashHooks();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

registerSW();

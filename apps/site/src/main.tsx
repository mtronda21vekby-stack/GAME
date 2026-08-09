import React from "react";
import { createRoot } from "react-dom/client";
import "@blackcrown/assets";
import "@blackcrown/ui";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/shell.css";
import "./styles/chrome.css";
import "./styles/overlays.css";
import "./styles/dock-v2.css";
import { App } from "./App";
import { registerSW } from "./pwa/registerSW";
import { ErrorBoundary } from "./ErrorBoundary";
import { applySitePrefs } from "./lib/prefs";

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

import React from "react";
import { createRoot } from "react-dom/client";
import "@blackcrown/assets";
import "@blackcrown/ui";
import "./app.css";
import "./styles/site.css";
import { App } from "./App";
import { registerSW } from "./pwa/registerSW";
import { ErrorBoundary } from "./ErrorBoundary";

function setAppVh() {
  document.documentElement.style.setProperty("--app-vh", `${window.innerHeight}px`);
}
setAppVh();
window.addEventListener("resize", setAppVh, { passive: true });
window.addEventListener("orientationchange", setAppVh, { passive: true });

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

registerSW();

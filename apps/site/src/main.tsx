import React from "react";
import { createRoot } from "react-dom/client";
import "@blackcrown/assets";
import "@blackcrown/ui";
import "./app.css";
import "./styles/site.css";
import { App } from "./routes/App";
import { registerSW } from "./pwa/registerSW";
import { ErrorBoundary } from "./ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

registerSW();

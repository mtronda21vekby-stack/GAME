import React, { useEffect } from "react";
import { Router } from "../router";
import { Game } from "./Game";
import { BetaChecklist } from "../evofish-next/ui/BetaChecklist";
import { BetaErrorBoundary } from "../evofish-next/ui/BetaErrorBoundary";
import { BetaHome } from "../evofish-next/ui/BetaHome";
import { BetaProgress } from "../evofish-next/ui/BetaProgress";
import { BetaQA } from "../evofish-next/ui/BetaQA";
import { BetaReport } from "../evofish-next/ui/BetaReport";
import { SkinLab } from "../evofish-next/ui/SkinLab";
import { NextLobby } from "../evofish-next/ui/NextLobby";
import { NextPlaytest } from "../evofish-next/ui/NextPlaytest";
import { attachConsoleAnalytics, track } from "@blackcrown/core";

function disableGameServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.filter((registration) => registration.scope.includes("/game/")).map((registration) => registration.unregister())))
    .catch(() => {});
}

function withBoundary(element: React.ReactNode) {
  return <BetaErrorBoundary>{element}</BetaErrorBoundary>;
}

export function App() {
  useEffect(() => attachConsoleAnalytics(), []);
  useEffect(() => track({ type: "page_view", path: window.location.pathname }), []);
  useEffect(() => disableGameServiceWorker(), []);

  return (
    <Router
      routes={[
        { path: "/", element: withBoundary(<BetaHome />) },
        { path: "/game", element: withBoundary(<BetaHome />) },
        { path: "/game/lobby", element: withBoundary(<BetaHome />) },
        { path: "/game/play", element: withBoundary(<NextPlaytest />) },
        { path: "/game/progress", element: withBoundary(<BetaProgress />) },
        { path: "/game/repair", element: withBoundary(<BetaProgress />) },
        { path: "/game/qa", element: withBoundary(<BetaQA />) },
        { path: "/game/report", element: withBoundary(<BetaReport />) },
        { path: "/game/checklist", element: withBoundary(<BetaChecklist />) },
        { path: "/game/skins", element: withBoundary(<SkinLab />) },
        { path: "/game/classic", element: withBoundary(<Game />) },
        { path: "/game/next", element: withBoundary(<NextLobby />) },
        { path: "/game/next/lobby", element: withBoundary(<NextLobby />) },
        { path: "/game/next/progress", element: withBoundary(<BetaProgress />) },
        { path: "/game/next/qa", element: withBoundary(<BetaQA />) },
        { path: "/game/next/report", element: withBoundary(<BetaReport />) },
        { path: "/game/next/checklist", element: withBoundary(<BetaChecklist />) },
        { path: "/game/next/skins", element: withBoundary(<SkinLab />) },
        { path: "/game/next/play", element: withBoundary(<NextPlaytest />) },
        { path: "/classic", element: withBoundary(<Game />) },
        { path: "/next", element: withBoundary(<BetaHome />) },
        { path: "/next/lobby", element: withBoundary(<NextLobby />) },
        { path: "/next/progress", element: withBoundary(<BetaProgress />) },
        { path: "/next/qa", element: withBoundary(<BetaQA />) },
        { path: "/next/report", element: withBoundary(<BetaReport />) },
        { path: "/next/checklist", element: withBoundary(<BetaChecklist />) },
        { path: "/next/skins", element: withBoundary(<SkinLab />) },
        { path: "/next/play", element: withBoundary(<NextPlaytest />) },
      ]}
    />
  );
}

export default App;

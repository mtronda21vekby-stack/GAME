import React, { useEffect } from "react";
import { Router } from "../router";
import { Game } from "./Game";
import { AIDebugLab } from "../evofish-next/ui/AIDebugLab";
import { BetaCacheDoctor } from "../evofish-next/ui/BetaCacheDoctor";
import { BetaChecklist } from "../evofish-next/ui/BetaChecklist";
import { BetaErrorBoundary } from "../evofish-next/ui/BetaErrorBoundary";
import { BetaHome } from "../evofish-next/ui/BetaHome";
import { BetaProgress } from "../evofish-next/ui/BetaProgress";
import { BetaQA } from "../evofish-next/ui/BetaQA";
import { BetaReport } from "../evofish-next/ui/BetaReport";
import { Leaderboard } from "../evofish-next/ui/Leaderboard";
import { ProfileHub } from "../evofish-next/ui/ProfileHub";
import { SeasonHub } from "../evofish-next/ui/SeasonHub";
import { SkinLab } from "../evofish-next/ui/SkinLab";
import { NextPlaySession } from "../evofish-next/ui/NextPlaySession";
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

function GameModeEntry() {
  const mode = new URLSearchParams(window.location.search).get("mode");
  if (mode === "classic") return <Game />;
  if (mode === "next") return <NextPlaySession />;
  return <BetaHome />;
}

export function App() {
  useEffect(() => attachConsoleAnalytics(), []);
  useEffect(() => track({ type: "page_view", path: window.location.pathname }), []);
  useEffect(() => disableGameServiceWorker(), []);

  return (
    <Router
      routes={[
        { path: "/", element: withBoundary(<BetaHome />) },
        { path: "/game", element: withBoundary(<GameModeEntry />) },
        { path: "/game/lobby", element: withBoundary(<BetaHome />) },
        { path: "/game/account", element: withBoundary(<ProfileHub />) },
        { path: "/game/profiles", element: withBoundary(<ProfileHub />) },
        { path: "/game/play", element: withBoundary(<NextPlaySession />) },
        { path: "/game/debug", element: withBoundary(<AIDebugLab />) },
        { path: "/game/progress", element: withBoundary(<BetaProgress />) },
        { path: "/game/repair", element: withBoundary(<BetaProgress />) },
        { path: "/game/leaderboard", element: withBoundary(<Leaderboard />) },
        { path: "/game/season", element: withBoundary(<SeasonHub />) },
        { path: "/game/qa", element: withBoundary(<BetaQA />) },
        { path: "/game/report", element: withBoundary(<BetaReport />) },
        { path: "/game/checklist", element: withBoundary(<BetaChecklist />) },
        { path: "/game/cache", element: withBoundary(<BetaCacheDoctor />) },
        { path: "/game/skins", element: withBoundary(<SkinLab />) },
        { path: "/game/classic", element: withBoundary(<Game />) },
        { path: "/game/next", element: withBoundary(<BetaHome />) },
        { path: "/game/next/lobby", element: withBoundary(<BetaHome />) },
        { path: "/game/next/account", element: withBoundary(<ProfileHub />) },
        { path: "/game/next/profiles", element: withBoundary(<ProfileHub />) },
        { path: "/game/next/debug", element: withBoundary(<AIDebugLab />) },
        { path: "/game/next/progress", element: withBoundary(<BetaProgress />) },
        { path: "/game/next/leaderboard", element: withBoundary(<Leaderboard />) },
        { path: "/game/next/season", element: withBoundary(<SeasonHub />) },
        { path: "/game/next/qa", element: withBoundary(<BetaQA />) },
        { path: "/game/next/report", element: withBoundary(<BetaReport />) },
        { path: "/game/next/checklist", element: withBoundary(<BetaChecklist />) },
        { path: "/game/next/cache", element: withBoundary(<BetaCacheDoctor />) },
        { path: "/game/next/skins", element: withBoundary(<SkinLab />) },
        { path: "/game/next/play", element: withBoundary(<NextPlaySession />) },
        { path: "/classic", element: withBoundary(<Game />) },
        { path: "/next", element: withBoundary(<BetaHome />) },
        { path: "/next/lobby", element: withBoundary(<BetaHome />) },
        { path: "/next/account", element: withBoundary(<ProfileHub />) },
        { path: "/next/profiles", element: withBoundary(<ProfileHub />) },
        { path: "/next/debug", element: withBoundary(<AIDebugLab />) },
        { path: "/next/progress", element: withBoundary(<BetaProgress />) },
        { path: "/next/leaderboard", element: withBoundary(<Leaderboard />) },
        { path: "/next/season", element: withBoundary(<SeasonHub />) },
        { path: "/next/qa", element: withBoundary(<BetaQA />) },
        { path: "/next/report", element: withBoundary(<BetaReport />) },
        { path: "/next/checklist", element: withBoundary(<BetaChecklist />) },
        { path: "/next/cache", element: withBoundary(<BetaCacheDoctor />) },
        { path: "/next/skins", element: withBoundary(<SkinLab />) },
        { path: "/next/play", element: withBoundary(<NextPlaySession />) },
      ]}
      notFound={withBoundary(<BetaHome />)}
    />
  );
}

export default App;

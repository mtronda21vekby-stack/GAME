import React, { useEffect } from "react";
import { attachConsoleAnalytics, ensureGuestSession, track } from "@blackcrown/core";
import { DailyLoginReward } from "../components/DailyLoginReward";
import { Router } from "../router";
import { WorldDock } from "../worlds/WorldDock";
import { WorldPortal } from "../worlds/WorldPortal";
import { Leaderboard } from "./Leaderboard";
import { Lobby } from "./Lobby";

export function App() {
  useEffect(() => attachConsoleAnalytics(), []);
  useEffect(() => track({ type: "page_view", path: window.location.pathname }), []);
  useEffect(() => {
    void ensureGuestSession();
  }, []);

  return (
    <>
      <Router
        routes={[
          { path: "/", element: <Lobby /> },
          { path: "/lobby", element: <Lobby /> },
          { path: "/lobby/world/quiet-valley", element: <WorldPortal worldId="quiet-valley" /> },
          { path: "/leaderboard", element: <Leaderboard /> },
          { path: "/top", element: <Leaderboard /> },
          { path: "/game/progress", element: <Leaderboard /> }
        ]}
      />
      <WorldDock />
      <DailyLoginReward />
    </>
  );
}

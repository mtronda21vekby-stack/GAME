import React, { useEffect } from "react";
import { attachConsoleAnalytics, track } from "@blackcrown/core";
import { DailyLoginReward } from "../components/DailyLoginReward";
import { Router } from "../router";
import { Leaderboard } from "./Leaderboard";
import { Lobby } from "./Lobby";

export function App() {
  useEffect(() => attachConsoleAnalytics(), []);
  useEffect(() => track({ type: "page_view", path: window.location.pathname }), []);

  return (
    <>
      <Router
        routes={[
          { path: "/", element: <Lobby /> },
          { path: "/lobby", element: <Lobby /> },
          { path: "/leaderboard", element: <Leaderboard /> },
          { path: "/top", element: <Leaderboard /> },
          { path: "/game/progress", element: <Leaderboard /> }
        ]}
      />
      <DailyLoginReward />
    </>
  );
}

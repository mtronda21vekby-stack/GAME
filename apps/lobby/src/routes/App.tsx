import React, { useEffect } from "react";
import { attachConsoleAnalytics, ensureGuestSession, track } from "@blackcrown/core";
import { DailyLoginReward } from "../components/DailyLoginReward";
import { Router } from "../router";
import { Leaderboard } from "./Leaderboard";
import { Lobby } from "./Lobby";

function QuietValleyLegacyRedirect() {
  useEffect(() => {
    window.location.replace("/games/quiet-valley/");
  }, []);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#07100b",
        color: "#eaf7e7",
        fontFamily: "Inter, system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <div>
        <strong style={{ display: "block", fontSize: 22 }}>Quiet Valley</strong>
        <span style={{ display: "block", marginTop: 8, opacity: 0.7 }}>Открываем отдельную игру…</span>
      </div>
    </main>
  );
}

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
          { path: "/lobby/world/quiet-valley", element: <QuietValleyLegacyRedirect /> },
          { path: "/leaderboard", element: <Leaderboard /> },
          { path: "/top", element: <Leaderboard /> },
          { path: "/game/progress", element: <Leaderboard /> }
        ]}
      />
      <DailyLoginReward />
    </>
  );
}

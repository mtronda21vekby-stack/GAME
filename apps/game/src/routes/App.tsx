import React, { useEffect } from "react";
import { Router } from "../router";
import { Game } from "./Game";
import { attachConsoleAnalytics, track } from "@blackcrown/core";

export function App() {
  useEffect(() => attachConsoleAnalytics(), []);
  useEffect(() => track({ type: "page_view", path: window.location.pathname }), []);

  return (
    <Router
      routes={[
        { path: "/", element: <Game /> },
        { path: "/game", element: <Game /> }
      ]}
    />
  );
}

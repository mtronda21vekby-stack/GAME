import React, { useEffect } from "react";
import { Router } from "../router";
import { Game } from "./Game";
import { attachConsoleAnalytics, track } from "@blackcrown/core";

function safeId() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCrypto = crypto as any;
    if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  } catch {
    // ignore
  }
  return `c_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function getClientId(): string {
  try {
    const k = "bc.clientId.v1";
    const ex = localStorage.getItem(k);
    if (ex) return ex;
    const id = safeId();
    localStorage.setItem(k, id);
    return id;
  } catch {
    return safeId();
  }
}

async function ping() {
  const clientId = getClientId();
  try {
    await fetch("/api/metrics/ping", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ clientId, area: "game" }),
      credentials: "include",
      keepalive: true,
      cache: "no-store",
    });
  } catch {
    // metrics are optional
  }
}

function registerGameServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost") return;

  navigator.serviceWorker.register("/game/sw.js", { scope: "/game/" }).catch(() => {
    // PWA install remains optional; never block the game.
  });
}

export function App() {
  useEffect(() => attachConsoleAnalytics(), []);
  useEffect(() => track({ type: "page_view", path: window.location.pathname }), []);
  useEffect(() => registerGameServiceWorker(), []);

  // metrics ping (online + unique через server /api/metrics/ping)
  useEffect(() => {
    let alive = true;

    ping();

    const t = window.setInterval(() => {
      if (!alive) return;
      if (document.visibilityState === "visible") ping();
    }, 20000);

    const onVis = () => {
      if (document.visibilityState === "visible") ping();
    };

    window.addEventListener("focus", onVis);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      window.clearInterval(t);
      window.removeEventListener("focus", onVis);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <Router
      routes={[
        { path: "/", element: <Game /> },
        { path: "/game", element: <Game /> },
      ]}
    />
  );
}

export default App;

// GAME/apps/lobby/src/App.tsx
import React from "react";
import { Lobby } from "./routes/Lobby";

function getOrCreateGuestId(): string {
  try {
    const existing = localStorage.getItem("guest.id");
    if (existing) return existing;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCrypto = crypto as any;
    const id = anyCrypto?.randomUUID ? anyCrypto.randomUUID() : `g_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
    localStorage.setItem("guest.id", id);
    return id;
  } catch {
    return `g_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }
}

async function pingPresence(id: string) {
  try {
    await fetch("/api/presence/ping", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope: "lobby", id }),
    });
  } catch {
    // ignore
  }
}

export function App() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const id = getOrCreateGuestId();

    // сразу пингуем и дальше поддерживаем "online"
    pingPresence(id);
    const t = window.setInterval(() => pingPresence(id), 25_000);

    return () => window.clearInterval(t);
  }, []);

  return <Lobby />;
}

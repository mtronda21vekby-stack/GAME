import React from "react";
import { Lobby } from "./routes/Lobby";

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
      body: JSON.stringify({ clientId, area: "lobby" }),
      credentials: "include",
      keepalive: true,
    });
  } catch {
    // ignore
  }
}

export function App() {
  React.useEffect(() => {
    let alive = true;

    // immediate ping
    ping();

    // periodic ping
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

  return <Lobby />;
}

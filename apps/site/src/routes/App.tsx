import React from "react";
import { Router } from "./Router";

type AppName = "site" | "lobby" | "game";

// В ЭТОМ app/site ставим "site". Для lobby/game — поменяешь на "lobby"/"game".
const METRICS_APP: AppName = "site";

function getAnonId() {
  const k = "bc_anon_id";
  try {
    let v = localStorage.getItem(k);
    if (!v) {
      v = `anon_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
      localStorage.setItem(k, v);
    }
    return v;
  } catch {
    // если localStorage недоступен — fallback
    return `anon_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }
}

async function postJson(url: string, body: unknown) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
      cache: "no-store",
      keepalive: true,
    });
  } catch {
    // ignore
  }
}

function startMetrics(app: AppName) {
  const user = getAnonId();

  const heartbeat = () =>
    postJson("/api/metrics/heartbeat", {
      app,
      user,
      ttl: 90, // TTL ключа online (сек). Держим > интервала пинга
    });

  const unique = () =>
    postJson("/api/metrics/unique", {
      app,
      user,
    });

  // 1) сразу отмечаем unique на сутки
  unique();

  // 2) online: сразу и затем периодически
  heartbeat();
  const t = window.setInterval(heartbeat, 30_000);

  // 3) при возвращении на вкладку — мгновенный heartbeat
  const onVis = () => {
    if (document.visibilityState === "visible") heartbeat();
  };
  document.addEventListener("visibilitychange", onVis);

  return () => {
    window.clearInterval(t);
    document.removeEventListener("visibilitychange", onVis);
  };
}

export function App() {
  React.useEffect(() => {
    return startMetrics(METRICS_APP);
  }, []);

  return <Router />;
}

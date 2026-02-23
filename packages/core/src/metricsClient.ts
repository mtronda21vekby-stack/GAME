export type MetricsApp = "site" | "lobby" | "game";

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

export function startMetrics(app: MetricsApp) {
  const user = getAnonId();

  const heartbeat = () =>
    postJson("/api/metrics/heartbeat", {
      app,
      user,
      ttl: 90,
    });

  const unique = () =>
    postJson("/api/metrics/unique", {
      app,
      user,
    });

  unique();
  heartbeat();

  const t = window.setInterval(heartbeat, 30_000);

  const onVis = () => {
    if (document.visibilityState === "visible") heartbeat();
  };
  document.addEventListener("visibilitychange", onVis);

  return () => {
    window.clearInterval(t);
    document.removeEventListener("visibilitychange", onVis);
  };
}

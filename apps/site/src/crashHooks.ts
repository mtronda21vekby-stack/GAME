async function emitCrashEvent(name: string) {
  try {
    await fetch("/api/metrics/event", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ app: "site", name, n: 1 }),
      credentials: "include",
      cache: "no-store",
      keepalive: true,
    });
  } catch {
    // ignore
  }
}

export function installCrashHooks() {
  // window.onerror
  window.addEventListener("error", () => {
    emitCrashEvent("site_window_error");
  });

  // unhandled promise rejection
  window.addEventListener("unhandledrejection", () => {
    emitCrashEvent("site_unhandled_rejection");
  });
}

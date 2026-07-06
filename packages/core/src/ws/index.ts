import type { WSClient, WSMessage, WSState } from "./types";
import { createMockWS } from "./mockTransport";

/**
 * WS abstraction.
 * - url "mock://lobby" -> BroadcastChannel transport (dev/local)
 * - url "ws(s)://..."  -> real WebSocket transport (prod)
 * - url "http(s)://..." -> auto-convert to ws(s)://
 */
export function createWS(url: string): WSClient {
  // mock transport
  if (url.startsWith("mock://")) {
    const channel = url.replace("mock://", "bc:");
    return createMockWS(channel);
  }

  const wsUrl = normalizeToWsUrl(url);
  if (wsUrl) {
    return createBrowserWS(wsUrl);
  }

  // Production-safe fallback
  return createMockWS("bc:fallback");
}

function normalizeToWsUrl(input: string): string | null {
  const u = (input || "").trim();
  if (!u) return null;

  if (u.startsWith("ws://") || u.startsWith("wss://")) return u;

  if (u.startsWith("http://")) return "ws://" + u.slice("http://".length);
  if (u.startsWith("https://")) return "wss://" + u.slice("https://".length);

  // allow relative path like "/ws/main"
  if (u.startsWith("/")) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}${u}`;
  }

  return null;
}

function createBrowserWS(wsUrl: string): WSClient {
  let ws: WebSocket | null = null;
  let st: WSState = "idle";

  const messageListeners = new Set<(msg: WSMessage) => void>();
  const stateListeners = new Set<(state: WSState) => void>();

  const setState = (state: WSState) => {
    st = state;
    for (const fn of stateListeners) fn(st);
  };

  const connect = () => {
    if (ws && (st === "open" || st === "connecting")) return;
    setState("connecting");
    ws = new WebSocket(wsUrl);

    ws.addEventListener("open", () => {
      setState("open");
    });

    ws.addEventListener("close", () => {
      setState("closed");
    });

    ws.addEventListener("error", () => {
      setState("closed");
    });

    ws.addEventListener("message", (ev) => {
      let parsed: WSMessage | null = null;
      try {
        parsed = JSON.parse(String(ev.data));
      } catch {
        return;
      }
      if (!parsed) return;
      for (const fn of messageListeners) fn(parsed);
    });
  };

  connect();

  return {
    state: () => st,
    connect,

    send(msg: WSMessage) {
      if (!ws || st !== "open") return;
      try {
        ws.send(JSON.stringify(msg));
      } catch {
        // ignore
      }
    },

    onMessage(fn: (msg: WSMessage) => void) {
      messageListeners.add(fn);
      return () => messageListeners.delete(fn);
    },

    onState(fn: (state: WSState) => void) {
      stateListeners.add(fn);
      fn(st);
      return () => stateListeners.delete(fn);
    },

    close() {
      try {
        ws?.close(1000);
      } catch {
        // ignore
      }
      ws = null;
      setState("closed");
    },
  };
}

export type { WSClient, WSMessage };

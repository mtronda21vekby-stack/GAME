import type { WSClient, WSMessage } from "./types";
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
  let isOpen = false;

  const messageListeners = new Set<(msg: WSMessage) => void>();
  const openListeners = new Set<() => void>();
  const closeListeners = new Set<() => void>();
  const errorListeners = new Set<(err: unknown) => void>();

  const connect = () => {
    ws = new WebSocket(wsUrl);

    ws.addEventListener("open", () => {
      isOpen = true;
      for (const fn of openListeners) fn();
    });

    ws.addEventListener("close", () => {
      isOpen = false;
      for (const fn of closeListeners) fn();
    });

    ws.addEventListener("error", (e) => {
      for (const fn of errorListeners) fn(e);
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
    send(msg: WSMessage) {
      if (!ws || !isOpen) return;
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

    onOpen(fn: () => void) {
      openListeners.add(fn);
      return () => openListeners.delete(fn);
    },

    onClose(fn: () => void) {
      closeListeners.add(fn);
      return () => closeListeners.delete(fn);
    },

    onError(fn: (err: unknown) => void) {
      errorListeners.add(fn);
      return () => errorListeners.delete(fn);
    },

    close() {
      try {
        ws?.close(1000);
      } catch {
        // ignore
      }
      ws = null;
      isOpen = false;
    },
  };
}

export type { WSClient, WSMessage };

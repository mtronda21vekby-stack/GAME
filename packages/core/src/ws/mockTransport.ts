import type { WSClient, WSMessage, WSState } from "./types";

type Listener<T> = (v: T) => void;

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function createMockWS(channelName: string): WSClient {
  const channel = new BroadcastChannel(channelName);
  let st: WSState = "idle";
  const msgListeners = new Set<Listener<WSMessage>>();
  const stListeners = new Set<Listener<WSState>>();

  const setState = (s: WSState) => {
    st = s;
    for (const l of stListeners) l(st);
  };

  channel.onmessage = (ev) => {
    const data = ev.data as WSMessage | undefined;
    if (!data) return;
    for (const l of msgListeners) l(data);
  };

  return {
    state: () => st,
    connect: () => {
      if (st === "open" || st === "connecting") return;
      setState("connecting");
      queueMicrotask(() => setState("open"));
    },
    close: () => {
      if (st === "closed") return;
      setState("closed");
      channel.close();
    },
    send: (msg: WSMessage) => {
      if (st !== "open") return;
      const safe = (msg.type === "chat" && (!msg.id || !msg.ts))
        ? { ...msg, id: uid(), ts: Date.now() }
        : msg;
      channel.postMessage(safe);
      for (const l of msgListeners) l(safe);
    },
    onMessage: (cb) => {
      msgListeners.add(cb);
      return () => msgListeners.delete(cb);
    },
    onState: (cb) => {
      stListeners.add(cb);
      cb(st);
      return () => stListeners.delete(cb);
    }
  };
}

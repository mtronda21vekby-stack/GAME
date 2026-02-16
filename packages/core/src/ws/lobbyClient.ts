export type LobbyPlayer = { id: string; name: string; ready: boolean; joinedAt: number; lastSeen: number };
export type LobbyChatMsg = { id: string; at: number; fromId: string; fromName: string; text: string };

export type LobbyServerMsg =
  | { t: "hello"; room: string; clientId: string; serverTime: number; you: LobbyPlayer; players: LobbyPlayer[]; history: LobbyChatMsg[] }
  | { t: "players"; players: LobbyPlayer[] }
  | { t: "chat"; msg: LobbyChatMsg }
  | { t: "error"; code: string; message: string };

export type LobbyClientMsg =
  | { t: "join"; name: string }
  | { t: "ready"; ready: boolean }
  | { t: "chat"; text: string }
  | { t: "ping"; at: number };

type Handlers = {
  onHello?: (m: Extract<LobbyServerMsg, { t: "hello" }>) => void;
  onPlayers?: (m: Extract<LobbyServerMsg, { t: "players" }>) => void;
  onChat?: (m: Extract<LobbyServerMsg, { t: "chat" }>) => void;
  onError?: (m: Extract<LobbyServerMsg, { t: "error" }>) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

function toWsUrl(room: string) {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const r = encodeURIComponent(room || "main");
  return `${proto}//${host}/ws/${r}`;
}

export function createLobbyClient(room: string, handlers: Handlers) {
  const ws = new WebSocket(toWsUrl(room));
  let isOpen = false;

  const send = (m: LobbyClientMsg) => {
    if (!isOpen) return;
    ws.send(JSON.stringify(m));
  };

  ws.addEventListener("open", () => {
    isOpen = true;
    handlers.onOpen?.();
  });

  ws.addEventListener("close", () => {
    isOpen = false;
    handlers.onClose?.();
  });

  ws.addEventListener("error", () => {
    // close handler будет следом
  });

  ws.addEventListener("message", (ev) => {
    let msg: LobbyServerMsg | null = null;
    try {
      msg = JSON.parse(String(ev.data));
    } catch {
      return;
    }
    if (!msg || typeof (msg as any).t !== "string") return;

    if (msg.t === "hello") handlers.onHello?.(msg);
    else if (msg.t === "players") handlers.onPlayers?.(msg);
    else if (msg.t === "chat") handlers.onChat?.(msg);
    else if (msg.t === "error") handlers.onError?.(msg);
  });

  return {
    close() {
      try {
        ws.close(1000);
      } catch {}
    },
    join(name: string) {
      send({ t: "join", name });
    },
    setReady(ready: boolean) {
      send({ t: "ready", ready });
    },
    chat(text: string) {
      send({ t: "chat", text });
    },
  };
}

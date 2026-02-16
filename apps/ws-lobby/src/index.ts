type ServerMsg =
  | { t: "hello"; room: string; clientId: string; serverTime: number; you: Player; players: Player[]; history: ChatMsg[] }
  | { t: "players"; players: Player[] }
  | { t: "chat"; msg: ChatMsg }
  | { t: "error"; code: string; message: string };

type ClientMsg =
  | { t: "join"; name: string }
  | { t: "ready"; ready: boolean }
  | { t: "chat"; text: string }
  | { t: "ping"; at: number };

type Player = { id: string; name: string; ready: boolean; joinedAt: number; lastSeen: number };
type ChatMsg = { id: string; at: number; fromId: string; fromName: string; text: string };

const MAX_NAME = 18;
const MAX_TEXT = 180;
const HISTORY_LIMIT = 40;
const SPAM_WINDOW_MS = 2500;
const SPAM_MAX_MSG = 3;

const json = (x: any) => JSON.stringify(x);

function safeName(raw: string): string {
  const s = (raw || "").trim().replace(/\s+/g, " ");
  if (!s) return "Игрок";
  return s.slice(0, MAX_NAME);
}

function safeText(raw: string): string {
  const s = (raw || "").trim().replace(/\s+/g, " ");
  return s.slice(0, MAX_TEXT);
}

function uid(): string {
  // достаточно для чата
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function okUpgrade(request: Request): boolean {
  return request.headers.get("Upgrade")?.toLowerCase() === "websocket";
}

function roomFromUrl(url: URL): string {
  // /ws/<room> или ?room=
  const parts = url.pathname.split("/").filter(Boolean);
  const byPath = parts[0] === "ws" && parts[1] ? parts[1] : "";
  const byQuery = url.searchParams.get("room") || "";
  const r = (byPath || byQuery || "main").trim();
  // простая нормализация
  return r.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "main";
}

export interface Env {
  LOBBY_ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    if (url.pathname.startsWith("/ws")) {
      if (!okUpgrade(request)) return new Response("Expected WebSocket", { status: 426 });

      const room = roomFromUrl(url);
      const id = env.LOBBY_ROOM.idFromName(room);
      const stub = env.LOBBY_ROOM.get(id);

      // прокидываем room дальше в DO
      const nextUrl = new URL(request.url);
      nextUrl.searchParams.set("room", room);

      return stub.fetch(new Request(nextUrl.toString(), request));
    }

    return new Response("Not found", { status: 404 });
  },
};

export class LobbyRoom {
  private state: DurableObjectState;
  private room: string = "main";

  private sockets = new Map<WebSocket, string>(); // socket -> clientId
  private players = new Map<string, Player>(); // clientId -> Player
  private history: ChatMsg[] = [];
  private spam = new Map<string, number[]>(); // clientId -> timestamps

  constructor(state: DurableObjectState) {
    this.state = state;

    this.state.blockConcurrencyWhile(async () => {
      const saved = await this.state.storage.get<{ players: Player[]; history: ChatMsg[] }>("snapshot");
      if (saved?.players) {
        for (const p of saved.players) this.players.set(p.id, p);
      }
      if (saved?.history) this.history = saved.history.slice(-HISTORY_LIMIT);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    this.room = url.searchParams.get("room") || this.room;

    if (!okUpgrade(request)) return new Response("Expected WebSocket", { status: 426 });

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    const clientId = uid();
    this.sockets.set(server, clientId);

    server.accept();

    // baseline player
    const now = Date.now();
    const player: Player = {
      id: clientId,
      name: "Игрок",
      ready: false,
      joinedAt: now,
      lastSeen: now,
    };
    this.players.set(clientId, player);

    // send hello
    this.send(server, {
      t: "hello",
      room: this.room,
      clientId,
      serverTime: now,
      you: player,
      players: this.sortedPlayers(),
      history: this.history.slice(-HISTORY_LIMIT),
    } satisfies ServerMsg);

    // broadcast players
    this.broadcastPlayers();

    server.addEventListener("message", (ev) => {
      this.onMessage(server, ev);
    });

    server.addEventListener("close", () => {
      this.onClose(server);
    });

    server.addEventListener("error", () => {
      this.onClose(server);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private send(ws: WebSocket, msg: ServerMsg) {
    try {
      ws.send(json(msg));
    } catch {}
  }

  private broadcast(msg: ServerMsg) {
    for (const ws of this.sockets.keys()) this.send(ws, msg);
  }

  private sortedPlayers(): Player[] {
    return Array.from(this.players.values()).sort((a, b) => a.joinedAt - b.joinedAt);
  }

  private async persist() {
    // сохраняем только “срез” — без сокетов
    const snap = {
      players: this.sortedPlayers().map((p) => ({ ...p })),
      history: this.history.slice(-HISTORY_LIMIT),
    };
    await this.state.storage.put("snapshot", snap);
  }

  private broadcastPlayers() {
    this.broadcast({ t: "players", players: this.sortedPlayers() });
    void this.persist();
  }

  private spamAllow(id: string, now: number): boolean {
    const arr = this.spam.get(id) || [];
    const next = arr.filter((t) => now - t <= SPAM_WINDOW_MS);
    next.push(now);
    this.spam.set(id, next);
    return next.length <= SPAM_MAX_MSG;
  }

  private onMessage(ws: WebSocket, ev: MessageEvent) {
    const id = this.sockets.get(ws);
    if (!id) return;

    const p = this.players.get(id);
    if (!p) return;

    const now = Date.now();
    p.lastSeen = now;

    let data: any = null;
    try {
      data = typeof ev.data === "string" ? JSON.parse(ev.data) : null;
    } catch {
      this.send(ws, { t: "error", code: "bad_json", message: "Неверный формат" });
      return;
    }

    const msg = data as ClientMsg;
    if (!msg || typeof msg.t !== "string") return;

    if (msg.t === "ping") {
      this.send(ws, { t: "hello", room: this.room, clientId: id, serverTime: now, you: p, players: this.sortedPlayers(), history: this.history.slice(-HISTORY_LIMIT) });
      return;
    }

    if (msg.t === "join") {
      p.name = safeName(msg.name);
      this.players.set(id, p);
      this.broadcastPlayers();
      return;
    }

    if (msg.t === "ready") {
      p.ready = !!msg.ready;
      this.players.set(id, p);
      this.broadcastPlayers();
      return;
    }

    if (msg.t === "chat") {
      const text = safeText(msg.text);
      if (!text) return;

      if (!this.spamAllow(id, now)) {
        this.send(ws, { t: "error", code: "rate_limited", message: "Слишком быстро" });
        return;
      }

      const chat: ChatMsg = {
        id: uid(),
        at: now,
        fromId: id,
        fromName: p.name,
        text,
      };

      this.history.push(chat);
      this.history = this.history.slice(-HISTORY_LIMIT);

      this.broadcast({ t: "chat", msg: chat });
      void this.persist();
      return;
    }
  }

  private onClose(ws: WebSocket) {
    const id = this.sockets.get(ws);
    if (!id) return;

    this.sockets.delete(ws);
    this.players.delete(id);
    this.spam.delete(id);

    this.broadcastPlayers();
  }
}

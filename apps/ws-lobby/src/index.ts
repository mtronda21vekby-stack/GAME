type ServerMsg =
  | {
      t: "hello";
      room: string;
      clientId: string;
      serverTime: number;
      seq: number;
      you: Player;
      players: Player[];
      history: ChatMsg[];
    }
  | { t: "players"; seq: number; players: Player[] }
  | { t: "chat"; seq: number; msg: ChatMsg }
  | { t: "error"; code: string; message: string };

type ClientMsg =
  | { t: "join"; name: string }
  | { t: "ready"; ready: boolean }
  | { t: "chat"; text: string }
  | { t: "ping"; at: number };

type Player = {
  id: string;
  name: string;
  ready: boolean;
  joinedAt: number;
  lastSeen: number;
  online: boolean;
};

type ChatMsg = { id: string; at: number; fromId: string; fromName: string; text: string };

const MAX_NAME = 18;
const MAX_TEXT = 180;
const HISTORY_LIMIT = 60;

const SPAM_WINDOW_MS = 2500;
const SPAM_MAX_MSG = 3;

const PRESENCE_GRACE_MS = 45_000; // не выкидываем сразу при мобильных реконнектах
const CLEANUP_TICK_MS = 15_000;

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
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function okUpgrade(request: Request): boolean {
  return request.headers.get("Upgrade")?.toLowerCase() === "websocket";
}

function roomFromUrl(url: URL): string {
  // /api/lobby/ws/<room>
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((x) => x === "ws");
  const byPath = idx >= 0 && parts[idx + 1] ? parts[idx + 1] : "";
  const byQuery = url.searchParams.get("room") || "";
  const r = (byPath || byQuery || "main").trim();
  return r.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "main";
}

function clientIdFromUrl(url: URL): string {
  const cid = (url.searchParams.get("cid") || "").trim();
  // allow: letters/numbers/_-:. (как у тебя в других safeId)
  const cleaned = cid.replace(/[^a-zA-Z0-9_\-:.]/g, "").slice(0, 96);
  return cleaned || `c_${uid()}`;
}

export interface Env {
  LOBBY_ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") return new Response("ok", { status: 200 });

    if (url.pathname.startsWith("/api/lobby/ws")) {
      if (!okUpgrade(request)) return new Response("Expected WebSocket", { status: 426 });

      const room = roomFromUrl(url);
      const id = env.LOBBY_ROOM.idFromName(room);
      const stub = env.LOBBY_ROOM.get(id);

      const nextUrl = new URL(request.url);
      nextUrl.searchParams.set("room", room);

      return stub.fetch(new Request(nextUrl.toString(), request));
    }

    return new Response("Not found", { status: 404 });
  },
};

type Snapshot = {
  seq: number;
  players: Player[];
  history: ChatMsg[];
};

export class LobbyRoom {
  private state: DurableObjectState;
  private room: string = "main";

  private seq = 0;

  // online sockets
  private sockets = new Map<WebSocket, string>(); // ws -> clientId
  private byClient = new Map<string, WebSocket>(); // clientId -> ws (последний)

  // player state
  private players = new Map<string, Player>(); // clientId -> Player
  private history: ChatMsg[] = [];

  // anti-spam
  private spam = new Map<string, number[]>(); // clientId -> timestamps

  constructor(state: DurableObjectState) {
    this.state = state;

    this.state.blockConcurrencyWhile(async () => {
      const snap = await this.state.storage.get<Snapshot>("snapshot");
      if (snap?.seq) this.seq = snap.seq;
      if (snap?.players?.length) {
        for (const p of snap.players) {
          // после рестарта DO считаем всех offline до реального коннекта
          this.players.set(p.id, { ...p, online: false });
        }
      }
      if (snap?.history?.length) this.history = snap.history.slice(-HISTORY_LIMIT);

      // запускаем периодическую уборку
      await this.armCleanupAlarm();
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    this.room = url.searchParams.get("room") || this.room;

    if (!okUpgrade(request)) return new Response("Expected WebSocket", { status: 426 });

    const clientId = clientIdFromUrl(url);
    const initialName = safeName(url.searchParams.get("name") || "");

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    // если уже был сокет на этот clientId — закрываем старый (reconnect)
    const prevWs = this.byClient.get(clientId);
    if (prevWs && prevWs !== server) {
      try {
        prevWs.close(1000, "replaced");
      } catch {}
      this.sockets.delete(prevWs);
    }

    this.byClient.set(clientId, server);
    this.sockets.set(server, clientId);

    const now = Date.now();

    const existed = this.players.get(clientId);
    const player: Player = existed
      ? {
          ...existed,
          name: existed.name || initialName || "Игрок",
          lastSeen: now,
          online: true,
        }
      : {
          id: clientId,
          name: initialName || "Игрок",
          ready: false,
          joinedAt: now,
          lastSeen: now,
          online: true,
        };

    this.players.set(clientId, player);

    // hello
    this.send(server, {
      t: "hello",
      room: this.room,
      clientId,
      serverTime: now,
      seq: this.nextSeq(),
      you: player,
      players: this.sortedPlayers(),
      history: this.history.slice(-HISTORY_LIMIT),
    });

    this.broadcastPlayers();

    server.addEventListener("message", (ev) => this.onMessage(server, ev));
    server.addEventListener("close", () => this.onClose(server));
    server.addEventListener("error", () => this.onClose(server));

    void this.persist();
    void this.armCleanupAlarm();

    return new Response(null, { status: 101, webSocket: client });
  }

  async alarm() {
    // cleanup offline players after grace window
    const now = Date.now();
    let changed = false;

    for (const [id, p] of this.players) {
      if (p.online) continue;
      if (now - p.lastSeen > PRESENCE_GRACE_MS) {
        this.players.delete(id);
        this.spam.delete(id);
        changed = true;
      }
    }

    if (changed) {
      this.broadcastPlayers();
      void this.persist();
    }

    // re-arm
    await this.armCleanupAlarm();
  }

  private async armCleanupAlarm() {
    // Durable Objects alarm is single timestamp; keep it ticking
    const when = Date.now() + CLEANUP_TICK_MS;
    try {
      await this.state.storage.setAlarm(when);
    } catch {
      // ignore
    }
  }

  private nextSeq() {
    this.seq += 1;
    return this.seq;
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
    // AAA-поведение: online сверху, затем ready, затем joinedAt
    return Array.from(this.players.values()).sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      if (a.ready !== b.ready) return a.ready ? -1 : 1;
      return a.joinedAt - b.joinedAt;
    });
  }

  private async persist() {
    const snap: Snapshot = {
      seq: this.seq,
      players: this.sortedPlayers().map((p) => ({ ...p })),
      history: this.history.slice(-HISTORY_LIMIT),
    };
    await this.state.storage.put("snapshot", snap);
  }

  private broadcastPlayers() {
    this.broadcast({ t: "players", seq: this.nextSeq(), players: this.sortedPlayers() });
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
    p.online = true;

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
      // keepalive
      this.send(ws, {
        t: "hello",
        room: this.room,
        clientId: id,
        serverTime: now,
        seq: this.nextSeq(),
        you: p,
        players: this.sortedPlayers(),
        history: this.history.slice(-HISTORY_LIMIT),
      });
      return;
    }

    if (msg.t === "join") {
      p.name = safeName(msg.name);
      this.players.set(id, p);
      this.broadcastPlayers();
      void this.persist();
      return;
    }

    if (msg.t === "ready") {
      p.ready = !!msg.ready;
      this.players.set(id, p);
      this.broadcastPlayers();
      void this.persist();
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

      this.broadcast({ t: "chat", seq: this.nextSeq(), msg: chat });
      void this.persist();
      return;
    }
  }

  private onClose(ws: WebSocket) {
    const id = this.sockets.get(ws);
    if (!id) return;

    this.sockets.delete(ws);

    const cur = this.byClient.get(id);
    if (cur === ws) this.byClient.delete(id);

    const p = this.players.get(id);
    if (p) {
      // не удаляем сразу — grace window
      p.online = false;
      p.lastSeen = Date.now();
      this.players.set(id, p);
    }

    this.broadcastPlayers();
    void this.persist();
    void this.armCleanupAlarm();
  }
}

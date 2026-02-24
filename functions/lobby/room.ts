export class LobbyRoom {
  state: DurableObjectState;
  sockets: Map<string, WebSocket>;
  players: Map<string, any>;
  chat: any[];
  matchState: "waiting" | "countdown" | "started";

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sockets = new Map();
    this.players = new Map();
    this.chat = [];
    this.matchState = "waiting";
  }

  async fetch(request: Request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    await this.handleSession(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleSession(ws: WebSocket) {
    ws.accept();

    const id = crypto.randomUUID();

    ws.addEventListener("message", (evt) => {
      this.onMessage(id, ws, evt.data);
    });

    ws.addEventListener("close", () => {
      this.players.delete(id);
      this.sockets.delete(id);
      this.broadcastState();
    });

    this.sockets.set(id, ws);
  }

  onMessage(id: string, ws: WebSocket, raw: any) {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === "join") {
      this.players.set(id, {
        id,
        name: msg.name,
        ready: false,
        joinedAt: Date.now(),
      });

      this.broadcastState();
      return;
    }

    if (msg.type === "ready") {
      const p = this.players.get(id);
      if (!p) return;

      p.ready = !!msg.value;
      this.broadcastState();
      this.checkAutoStart();
      return;
    }

    if (msg.type === "chat") {
      const p = this.players.get(id);
      if (!p) return;

      const entry = {
        id: crypto.randomUUID(),
        from: p.name,
        text: msg.text,
        t: Date.now(),
      };

      this.chat.push(entry);
      if (this.chat.length > 80) this.chat.shift();

      this.broadcast({
        type: "chat",
        msg: entry,
      });
    }
  }

  broadcastState() {
    const payload = {
      type: "state",
      players: Array.from(this.players.values()),
      matchState: this.matchState,
      serverTime: Date.now(),
    };

    this.broadcast(payload);
  }

  broadcast(obj: any) {
    const msg = JSON.stringify(obj);
    for (const ws of this.sockets.values()) {
      try {
        ws.send(msg);
      } catch {}
    }
  }

  async checkAutoStart() {
    if (this.matchState !== "waiting") return;

    const players = Array.from(this.players.values());
    if (players.length < 2) return;
    if (!players.every((p) => p.ready)) return;

    this.matchState = "countdown";
    this.broadcastState();

    setTimeout(() => {
      this.matchState = "started";
      this.broadcastState();
    }, 5000);
  }
}

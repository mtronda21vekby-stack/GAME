// apps/lobby/src/routes/Lobby.tsx
import React from "react";
import { Button } from "@blackcrown/ui";
import { userStorage } from "@blackcrown/core";

function nav(path: string) {
  window.location.assign(path);
}

function getNick() {
  return userStorage.getString("nickname", "") || "Игрок";
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function clampText(s: string, max = 180) {
  const t = String(s || "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? t.slice(0, max) : t;
}

function safeId() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCrypto = crypto as any;
    if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  } catch {
    // ignore
  }
  return `bc_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function getClientId(): string {
  try {
    const k = "bc.lobby.clientId.v1";
    const ex = localStorage.getItem(k);
    if (ex) return ex;
    const id = safeId();
    localStorage.setItem(k, id);
    return id;
  } catch {
    return safeId();
  }
}

/* =========================
   REST fallback (existing MVP)
   ========================= */

type LobbyStatus = "connecting" | "online" | "offline";
type NetMode = "ws" | "poll";

type LobbyUser = { clientId: string; nick: string; ready: boolean; seenAt: number };
type LobbyStateResp = { ok: boolean; kv?: boolean; roomId?: string; users?: LobbyUser[] };

type ChatItem = { id: string; t: number; nick: string; text: string; local?: boolean };
type ChatResp = { ok: boolean; kv?: boolean; roomId?: string; items?: ChatItem[]; serverTime?: number };

function uniqChat(items: ChatItem[], limit = 120) {
  const seen = new Set<string>();
  const out: ChatItem[] = [];
  for (const it of items) {
    if (!it?.id) continue;
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  if (out.length > limit) return out.slice(out.length - limit);
  return out;
}

async function postHeartbeat(payload: { roomId: string; clientId: string; nick: string; ready: boolean }) {
  try {
    const res = await fetch("/api/lobby/heartbeat", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ ...payload, ttl: 60 }),
      credentials: "include",
      cache: "no-store",
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchState(roomId: string): Promise<LobbyUser[] | null> {
  try {
    const res = await fetch(`/api/lobby/state?roomId=${encodeURIComponent(roomId)}`, {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as LobbyStateResp;
    if (!json?.ok) return null;
    return Array.isArray(json.users) ? (json.users as LobbyUser[]) : [];
  } catch {
    return null;
  }
}

async function fetchChat(roomId: string): Promise<ChatItem[] | null> {
  try {
    const res = await fetch(`/api/lobby/chat?roomId=${encodeURIComponent(roomId)}`, {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ChatResp;
    if (!json?.ok) return null;
    return Array.isArray(json.items) ? (json.items as ChatItem[]) : [];
  } catch {
    return null;
  }
}

async function sendChatRest(payload: { roomId: string; clientId: string; nick: string; text: string }) {
  try {
    const res = await fetch("/api/lobby/chat/send", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
      cache: "no-store",
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* =========================
   WebSocket (AAA v1): DO protocol t: hello/players/chat/error
   ========================= */

type WsServerMsg =
  | {
      t: "hello";
      room: string;
      clientId: string;
      serverTime: number;
      you: { id: string; name: string; ready: boolean; joinedAt: number; lastSeen: number };
      players: { id: string; name: string; ready: boolean; joinedAt: number; lastSeen: number }[];
      history: { id: string; at: number; fromId: string; fromName: string; text: string }[];
    }
  | { t: "players"; players: { id: string; name: string; ready: boolean; joinedAt: number; lastSeen: number }[] }
  | { t: "chat"; msg: { id: string; at: number; fromId: string; fromName: string; text: string } }
  | { t: "error"; code: string; message: string };

type WsClientMsg =
  | { t: "join"; name: string }
  | { t: "ready"; ready: boolean }
  | { t: "chat"; text: string }
  | { t: "ping"; at: number };

function wsUrl(roomId: string) {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  // ВАЖНО: это обязано резолвиться на твой WS Worker route: blackcrown.work/api/lobby/*
  return `${proto}//${location.host}/api/lobby/ws?room=${encodeURIComponent(roomId)}`;
}

function mapPlayersWsToUI(players: { id: string; name: string; ready: boolean; lastSeen: number }[]): LobbyUser[] {
  const now = Date.now();
  return players
    .slice(0, 8)
    .map((p) => ({
      clientId: p.id,
      nick: p.name || "Игрок",
      ready: !!p.ready,
      seenAt: Number(p.lastSeen || now) || now,
    }))
    .sort((a, b) => {
      if (a.ready !== b.ready) return a.ready ? -1 : 1;
      return (b.seenAt || 0) - (a.seenAt || 0);
    });
}

function mapHistoryWsToUI(history: { id: string; at: number; fromName: string; text: string }[]): ChatItem[] {
  return history
    .slice(-120)
    .map((m) => ({ id: m.id, t: m.at, nick: m.fromName || "Игрок", text: m.text || "" }))
    .filter((m) => !!m.id && !!m.text);
}

function removeMatchingLocal(prev: ChatItem[], serverMsg: { fromName: string; text: string; at: number }) {
  // убираем ровно 1 локальный “эхо” если совпали ник+текст и по времени рядом
  let removed = false;
  const out: ChatItem[] = [];
  for (const it of prev) {
    if (
      !removed &&
      it.local === true &&
      it.nick === serverMsg.fromName &&
      it.text === serverMsg.text &&
      Math.abs((it.t || 0) - (serverMsg.at || 0)) <= 4000
    ) {
      removed = true;
      continue;
    }
    out.push(it);
  }
  return out;
}

export function Lobby() {
  const [room] = React.useState("main");

  const [status, setStatus] = React.useState<LobbyStatus>("connecting");
  const [mode, setMode] = React.useState<NetMode>("ws");

  const [players, setPlayers] = React.useState<LobbyUser[]>([]);
  const [history, setHistory] = React.useState<ChatItem[]>([]);
  const [ready, setReady] = React.useState(false);
  const [text, setText] = React.useState("");

  const [busySend, setBusySend] = React.useState(false);

  const listRef = React.useRef<HTMLDivElement | null>(null);

  const clientIdRef = React.useRef<string>(getClientId());
  const nickRef = React.useRef<string>(getNick());

  // WS refs
  const wsRef = React.useRef<WebSocket | null>(null);
  const aliveRef = React.useRef(true);
  const joinSentRef = React.useRef(false);
  const pingTimerRef = React.useRef<number | null>(null);
  const reconnectTimerRef = React.useRef<number | null>(null);
  const reconnectAttemptRef = React.useRef(0);
  const desiredReadyRef = React.useRef(false);

  // keep nick fresh
  React.useEffect(() => {
    const sync = () => {
      nickRef.current = getNick();
    };
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync as any);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync as any);
    };
  }, []);

  // autoscroll chat
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history.length]);

  const closeWs = React.useCallback(() => {
    if (pingTimerRef.current != null) {
      window.clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
    if (reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    joinSentRef.current = false;

    const ws = wsRef.current;
    wsRef.current = null;

    if (ws) {
      try {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      } catch {
        // ignore
      }
    }
  }, []);

  const sendWs = React.useCallback((msg: WsClientMsg) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(msg));
      return true;
    } catch {
      return false;
    }
  }, []);

  const connectWs = React.useCallback(() => {
    closeWs();

    setMode("ws");
    setStatus("connecting");

    const url = wsUrl(room);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    const scheduleReconnect = () => {
      if (!aliveRef.current) return;
      if (reconnectTimerRef.current != null) return;

      const attempt = Math.min(12, (reconnectAttemptRef.current || 0) + 1);
      reconnectAttemptRef.current = attempt;

      const backoff = Math.min(9000, 350 + attempt * 550);
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        connectWs();
      }, backoff) as unknown as number;
    };

    const doJoin = () => {
      if (joinSentRef.current) return;
      joinSentRef.current = true;

      // server DO сейчас сам генерит clientId; твой local clientId оставляем для REST/аналитики
      sendWs({ t: "join", name: nickRef.current });

      // re-apply desired ready if user already toggled while connecting
      if (desiredReadyRef.current) {
        sendWs({ t: "ready", ready: true });
      }
    };

    ws.onopen = () => {
      if (!aliveRef.current) return;
      reconnectAttemptRef.current = 0;
      setStatus("online");
      doJoin();

      // ping: keepalive + server clock authority
      pingTimerRef.current = window.setInterval(() => {
        if (!aliveRef.current) return;
        if (document.visibilityState !== "visible") return;
        sendWs({ t: "ping", at: Date.now() });
      }, 18_000) as unknown as number;
    };

    ws.onmessage = (ev) => {
      if (!aliveRef.current) return;

      let data: WsServerMsg | null = null;
      try {
        data = JSON.parse(String(ev.data)) as WsServerMsg;
      } catch {
        data = null;
      }
      if (!data || typeof (data as any).t !== "string") return;

      if (data.t === "hello") {
        // DO sends hello immediately on connect, but join may not yet be applied; we join anyway
        doJoin();

        const p = data.players || [];
        const h = data.history || [];
        setPlayers(mapPlayersWsToUI(p));
        setHistory(uniqChat(mapHistoryWsToUI(h), 120));

        // authoritative ready (from `you`)
        const youReady = !!data.you?.ready;
        setReady(youReady);
        desiredReadyRef.current = youReady;
        return;
      }

      if (data.t === "players") {
        const p = data.players || [];
        setPlayers(mapPlayersWsToUI(p));
        return;
      }

      if (data.t === "chat") {
        const m = data.msg;
        if (!m?.id) return;

        setHistory((prev) => {
          const cleaned = removeMatchingLocal(prev, { fromName: m.fromName, text: m.text, at: m.at });
          const next: ChatItem = { id: m.id, t: m.at, nick: m.fromName || "Игрок", text: m.text || "" };
          return uniqChat([...cleaned, next], 120);
        });
        return;
      }

      if (data.t === "error") {
        // мягко: просто деградируем, не ломая UI
        setStatus("offline");
        return;
      }
    };

    ws.onerror = () => {
      // браузеры обычно сразу закрывают после error
    };

    ws.onclose = () => {
      if (!aliveRef.current) return;
      setStatus("offline");
      joinSentRef.current = false;
      if (pingTimerRef.current != null) {
        window.clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
      scheduleReconnect();
    };
  }, [room, closeWs, sendWs]);

  // WS lifecycle (primary)
  React.useEffect(() => {
    aliveRef.current = true;
    connectWs();

    const onVis = () => {
      if (document.visibilityState !== "visible") return;

      const ws = wsRef.current;
      // если разорвано — быстрое переподключение
      if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        connectWs();
        return;
      }
      // ensure join
      if (ws.readyState === WebSocket.OPEN && !joinSentRef.current) {
        joinSentRef.current = true;
        sendWs({ t: "join", name: nickRef.current });
      }
    };

    window.addEventListener("focus", onVis);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      aliveRef.current = false;
      window.removeEventListener("focus", onVis);
      document.removeEventListener("visibilitychange", onVis);
      closeWs();
    };
  }, [connectWs, closeWs, sendWs]);

  // REST fallback (only if WS is offline for a while OR you manually flip mode later)
  React.useEffect(() => {
    if (mode !== "poll") return;

    let alive = true;

    const heartbeat = async () => {
      const ok = await postHeartbeat({
        roomId: room,
        clientId: clientIdRef.current,
        nick: nickRef.current,
        ready,
      });
      if (!alive) return;
      setStatus(ok ? "online" : "offline");
    };

    const pullState = async () => {
      const s = await fetchState(room);
      if (!alive) return;
      if (s) setPlayers(s.slice(0, 8));
    };

    const pullChat = async () => {
      const c = await fetchChat(room);
      if (!alive) return;
      if (c) setHistory((prev) => uniqChat([...prev, ...c], 120));
    };

    setStatus("connecting");
    void heartbeat();
    void pullState();
    void pullChat();

    const tHeartbeat = window.setInterval(() => {
      if (!alive) return;
      if (document.visibilityState !== "visible") return;
      void heartbeat();
    }, 15_000);

    const tState = window.setInterval(() => {
      if (!alive) return;
      if (document.visibilityState !== "visible") return;
      void pullState();
    }, 1_800);

    const tChat = window.setInterval(() => {
      if (!alive) return;
      if (document.visibilityState !== "visible") return;
      void pullChat();
    }, 1_100);

    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      void heartbeat();
      void pullState();
      void pullChat();
    };

    window.addEventListener("focus", onVis);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      window.clearInterval(tHeartbeat);
      window.clearInterval(tState);
      window.clearInterval(tChat);
      window.removeEventListener("focus", onVis);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [mode, room, ready]);

  const isOnline = status === "online";
  const onlineCount = players.length;
  const canReady = onlineCount <= 8;

  const everyoneReady = React.useMemo(() => {
    if (players.length < 2) return false;
    return players.slice(0, 8).every((p) => p.ready);
  }, [players]);

  const toggleReady = React.useCallback(async () => {
    if (!canReady) return;

    const next = !desiredReadyRef.current;
    desiredReadyRef.current = next;
    setReady(next);

    if (mode === "ws") {
      if (!isOnline) return;
      sendWs({ t: "ready", ready: next });
      return;
    }

    // poll
    await postHeartbeat({
      roomId: room,
      clientId: clientIdRef.current,
      nick: nickRef.current,
      ready: next,
    });
  }, [canReady, mode, isOnline, sendWs, room]);

  const doSend = React.useCallback(async () => {
    if (!isOnline) return;
    if (busySend) return;

    const msg = clampText(text, 180);
    if (!msg) return;

    setBusySend(true);
    setText("");

    if (mode === "ws") {
      // optimistic local
      const optimistic: ChatItem = {
        id: `local_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`,
        t: Date.now(),
        nick: nickRef.current,
        text: msg,
        local: true,
      };
      setHistory((prev) => uniqChat([...prev, optimistic], 120));

      const ok = sendWs({ t: "chat", text: msg });
      setBusySend(false);
      if (!ok) setStatus("offline");
      return;
    }

    // poll
    const ok = await sendChatRest({
      roomId: room,
      clientId: clientIdRef.current,
      nick: nickRef.current,
      text: msg,
    });

    const c = await fetchChat(room);
    if (c) setHistory(uniqChat(c, 120));

    setBusySend(false);
    if (!ok) setStatus("offline");
  }, [isOnline, busySend, text, room, mode, sendWs]);

  const hardReconnect = React.useCallback(async () => {
    setStatus("connecting");

    if (mode === "ws") {
      connectWs();
      return;
    }

    await postHeartbeat({
      roomId: room,
      clientId: clientIdRef.current,
      nick: nickRef.current,
      ready,
    });
    const s = await fetchState(room);
    const c = await fetchChat(room);
    if (s) setPlayers(s.slice(0, 8));
    if (c) setHistory(uniqChat(c, 120));
  }, [mode, connectWs, room, ready]);

  return (
    <main className="bcSiteRoot">
      <section className="bcSection" style={{ paddingTop: 14 }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div
            className="glassStrong"
            style={{
              borderRadius: 22,
              padding: 14,
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 980 }}>Lobby</div>
              <div style={{ opacity: 0.75, fontWeight: 850 }}>Комната: {room}</div>
              <div style={{ opacity: 0.75, fontWeight: 850 }}>Игроки: {onlineCount}/8</div>
              <div style={{ opacity: 0.75, fontWeight: 850 }}>
                Статус: {status === "online" ? "онлайн" : status === "connecting" ? "подключение" : "офлайн"}
              </div>
              <div style={{ opacity: 0.75, fontWeight: 850 }}>Mode: {mode === "ws" ? "WebSocket" : "Polling"}</div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="secondary" onClick={() => nav("/game/")}>
                Игры
              </Button>
              <Button variant="ghost" onClick={() => nav("/")}>
                Главная
              </Button>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ display: "grid", gap: 12 }}>
            <div className="glassStrong" style={{ borderRadius: 22, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontWeight: 950 }}>Игроки</div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <Button variant={ready ? "primary" : "secondary"} onClick={toggleReady} disabled={!isOnline || !canReady}>
                    {ready ? "Готов" : "Не готов"}
                  </Button>

                  <Button variant="ghost" onClick={hardReconnect}>
                    Переподключить
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() => nav("/game/")}
                    disabled={!everyoneReady}
                    title={everyoneReady ? "Запустить" : "Нужно минимум 2 игрока и все должны быть ready"}
                  >
                    В игру
                  </Button>
                </div>
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {players.slice(0, 8).map((p) => (
                  <div
                    key={p.clientId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: 10,
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.04)",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{p.nick}</div>
                    <div style={{ opacity: 0.78, fontWeight: 900 }}>{p.ready ? "ready" : "…"}</div>
                  </div>
                ))}
              </div>

              {!canReady ? <div style={{ marginTop: 10, opacity: 0.78, fontWeight: 850 }}>Комната заполнена.</div> : null}

              {everyoneReady ? (
                <div style={{ marginTop: 10, opacity: 0.9, fontWeight: 900, lineHeight: 1.45 }}>
                  Все готовы — можно запускать игру.
                </div>
              ) : null}
            </div>

            <div className="glassStrong" style={{ borderRadius: 22, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontWeight: 950 }}>Чат</div>
                <div style={{ opacity: 0.72, fontWeight: 850, fontSize: 12 }}>{isOnline ? "live" : "offline"}</div>
              </div>

              <div
                ref={listRef}
                style={{
                  marginTop: 10,
                  height: 280,
                  overflow: "auto",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.16)",
                  padding: 10,
                }}
              >
                {history.map((m) => (
                  <div key={m.id} style={{ padding: "6px 0", display: "grid", gap: 4, opacity: m.local ? 0.78 : 1 }}>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
                      <div style={{ fontWeight: 950 }}>{m.nick}</div>
                      <div style={{ opacity: 0.68, fontWeight: 850, fontSize: 12 }}>{fmtTime(m.t)}</div>
                    </div>
                    <div style={{ opacity: 0.88, lineHeight: 1.4, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.text}</div>
                  </div>
                ))}
                {history.length === 0 ? <div style={{ opacity: 0.72, fontWeight: 850 }}>Сообщений пока нет.</div> : null}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={isOnline ? "Написать сообщение" : "Чат офлайн"}
                  disabled={!isOnline || busySend}
                  onKeyDown={(e) => {
                    if (!isOnline || busySend) return;
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void doSend();
                    }
                  }}
                  style={{
                    flex: "1 1 240px",
                    height: 44,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "var(--text)",
                    padding: "0 12px",
                    outline: "none",
                    fontWeight: 850,
                    opacity: isOnline ? 1 : 0.65,
                  }}
                />

                <Button variant="primary" onClick={() => void doSend()} disabled={!isOnline || busySend}>
                  {busySend ? "Отправка..." : "Отправить"}
                </Button>
              </div>

              <div style={{ marginTop: 10, opacity: 0.72, fontWeight: 850, fontSize: 12, lineHeight: 1.45 }}>
                AAA v1: WebSocket (Durable Objects) + авто-reconnect + ping keepalive. Fallback: polling (если ты вручную переключишь mode на poll).
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Lobby;

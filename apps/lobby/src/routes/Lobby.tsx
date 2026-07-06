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
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) : t;
}

function safeId() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCrypto = crypto as any;
    if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  } catch {}
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

type LobbyStatus = "connecting" | "online" | "offline";
type NetMode = "ws" | "poll";

type Player = {
  id: string;
  name: string;
  ready: boolean;
  joinedAt?: number;
  lastSeen?: number;
};

type ChatMsg = {
  id: string;
  from: string;
  text: string;
  t: number;
  local?: boolean;
};

type WsServerHello = {
  t: "hello";
  room: string;
  clientId: string;
  serverTime: number;
  seq: number;
  match?: any;
  you?: Player;
  players?: Player[];
  history?: { id: string; at: number; fromId: string; fromName: string; text: string }[];
};

type WsServerPlayers = {
  t: "players";
  seq: number;
  serverTime: number;
  match?: any;
  players: Player[];
};

type WsServerChat = {
  t: "chat";
  seq: number;
  serverTime: number;
  msg: { id: string; at: number; fromId: string; fromName: string; text: string };
};

type WsServerMatch = { t: "match"; seq: number; serverTime: number; match: any };
type WsServerStart = { t: "start"; seq: number; serverTime: number; matchId: string; seed: number; players: Player[] };
type WsServerError = { t: "error"; code: string; message: string };

type WsServerAny = WsServerHello | WsServerPlayers | WsServerChat | WsServerMatch | WsServerStart | WsServerError | any;

type WsClientJoin = { t: "join"; clientId?: string; name: string };
type WsClientReady = { t: "ready"; ready: boolean };
type WsClientChat = { t: "chat"; text: string; clientMsgId?: string };
type WsClientPing = { t: "ping"; at: number };

type PollStateResp = {
  ok: boolean;
  room: string;
  serverTime: number;
  players: Player[];
};

type PollChatResp = {
  ok: boolean;
  room: string;
  serverTime: number;
  items: { id: string; at: number; fromName: string; text: string }[];
};

function uniqChat(items: ChatMsg[], limit = 80) {
  const seen = new Set<string>();
  const out: ChatMsg[] = [];
  for (const it of items) {
    if (!it?.id) continue;
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  if (out.length > limit) return out.slice(out.length - limit);
  return out;
}

function wsUrl(roomId: string) {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  const base = `${proto}//${location.host}`;
  return `${base}/api/lobby/ws?room=${encodeURIComponent(roomId)}`;
}

/* ---------- POLL API ---------- */

async function pollHeartbeat(payload: { room: string; clientId: string; name: string; ready: boolean }) {
  try {
    const res = await fetch("/api/lobby/poll/heartbeat", {
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

async function pollState(room: string): Promise<PollStateResp | null> {
  try {
    const res = await fetch(`/api/lobby/poll/state?room=${encodeURIComponent(room)}`, {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as PollStateResp;
    if (!json?.ok) return null;
    return json;
  } catch {
    return null;
  }
}

async function pollChat(room: string): Promise<PollChatResp | null> {
  try {
    const res = await fetch(`/api/lobby/poll/chat?room=${encodeURIComponent(room)}`, {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as PollChatResp;
    if (!json?.ok) return null;
    return json;
  } catch {
    return null;
  }
}

async function pollSendChat(payload: { room: string; clientId: string; name: string; text: string }) {
  try {
    const res = await fetch("/api/lobby/poll/chat/send", {
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

export function Lobby() {
  const [room] = React.useState("main");

  const [status, setStatus] = React.useState<LobbyStatus>("connecting");
  const [mode, setMode] = React.useState<NetMode>("ws");

  const [players, setPlayers] = React.useState<Player[]>([]);
  const [history, setHistory] = React.useState<ChatMsg[]>([]);
  const [ready, setReady] = React.useState(false);
  const [text, setText] = React.useState("");

  const [matchLabel, setMatchLabel] = React.useState<"ожидание" | "старт" | "запущен">("ожидание");

  const listRef = React.useRef<HTMLDivElement | null>(null);

  const wsRef = React.useRef<WebSocket | null>(null);
  const aliveRef = React.useRef(true);
  const joinSentRef = React.useRef(false);
  const reconnectTimerRef = React.useRef<number | null>(null);
  const attemptRef = React.useRef(0);

  const myNickRef = React.useRef(getNick());
  const clientIdRef = React.useRef<string>(getClientId());
  const desiredReadyRef = React.useRef(false);

  const ClickFix = (
    <style>{`
      /* make lobby UI top-most and always clickable */
      .bcSiteRoot { min-height: 100vh; position: relative; isolation: isolate; overflow: hidden; background: linear-gradient(180deg, #031827 0%, #020b15 68%, #010711 100%); color: #e7f2ff; }
      .bcSiteRoot:before { content: ""; position: fixed; inset: -18%; background: radial-gradient(ellipse at 20% 8%, rgba(120,240,255,.22), transparent 36%), radial-gradient(ellipse at 84% 18%, rgba(255,220,120,.12), transparent 32%), linear-gradient(115deg, transparent 0 42%, rgba(255,255,255,.045) 50%, transparent 60%); pointer-events: none; }
      .bcSiteRoot:after { content: ""; position: fixed; inset: 0; opacity: .20; background-image: radial-gradient(circle at 18% 24%, rgba(220,250,255,.48) 0 1px, transparent 2px), radial-gradient(circle at 80% 26%, rgba(120,240,255,.36) 0 1px, transparent 2px), radial-gradient(circle at 62% 82%, rgba(255,255,255,.28) 0 1px, transparent 2px); background-size: 280px 240px, 340px 300px, 300px 280px; pointer-events: none; }
      .bcLobbyUiLayer { position: relative; z-index: 2147483647; pointer-events: auto; }
      .bcLobbyUiLayer * { pointer-events: auto; }
      .glassStrong { border: 1px solid rgba(150,230,255,.16) !important; background: linear-gradient(180deg, rgba(255,255,255,.095), rgba(255,255,255,.038)) !important; box-shadow: 0 24px 80px rgba(0,0,0,.35) !important; backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
      .bcLobbyTitle { display: grid; gap: 4px; }
      .bcLobbyTitle b { font-size: 24px; line-height: 1; }
      .bcLobbyTitle span { color: rgba(231,242,255,.62); font-weight: 850; font-size: 13px; }

      /* kill any background overlays/canvas capturing touches */
      canvas,
      .MatrixBackground,
      .matrixCanvas,
      #matrix,
      .bcHeroBg,
      .bcHeroAurora,
      .bcHeroVignette,
      .bcHeroNoise,
      .bcBg,
      .bcBackground,
      .bcBackdrop {
        pointer-events: none !important;
        touch-action: none !important;
      }
    `}</style>
  );

  React.useEffect(() => {
    const sync = () => {
      myNickRef.current = getNick();
    };
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync as any);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync as any);
    };
  }, []);

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history.length]);

  const closeWs = React.useCallback(() => {
    const ws = wsRef.current;
    wsRef.current = null;
    joinSentRef.current = false;

    if (reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (ws) {
      try {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      } catch {}
    }
  }, []);

  const sendWs = React.useCallback((msg: WsClientJoin | WsClientReady | WsClientChat | WsClientPing) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(msg));
      return true;
    } catch {
      return false;
    }
  }, []);

  const scheduleReconnect = React.useCallback(() => {
    if (!aliveRef.current) return;
    if (reconnectTimerRef.current != null) return;

    const attempt = Math.min(8, attemptRef.current + 1);
    attemptRef.current = attempt;

    const backoff = Math.min(9000, 350 + attempt * 650);
    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      connectRef.current?.();
    }, backoff) as unknown as number;
  }, []);

  const connectRef = React.useRef<(() => void) | null>(null);

  const connectWs = React.useCallback(() => {
    setMode("ws");
    closeWs();
    setStatus("connecting");

    const url = wsUrl(room);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    let opened = false;

    const doJoin = () => {
      if (joinSentRef.current) return;
      joinSentRef.current = true;

      sendWs({
        t: "join",
        clientId: clientIdRef.current,
        name: myNickRef.current,
      } satisfies WsClientJoin);

      const desired = desiredReadyRef.current;
      if (desired) sendWs({ t: "ready", ready: true } satisfies WsClientReady);
    };

    // If WS doesn't open quickly (WebView), auto-fallback to polling
    const fallbackTimer = window.setTimeout(() => {
      if (!aliveRef.current) return;
      if (opened) return;
      try {
        ws.close();
      } catch {}
      setMode("poll");
    }, 2200);

    ws.onopen = () => {
      opened = true;
      window.clearTimeout(fallbackTimer);
      if (!aliveRef.current) return;
      setStatus("online");
      attemptRef.current = 0;
      doJoin();
    };

    ws.onmessage = (ev) => {
      if (!aliveRef.current) return;

      let data: WsServerAny | null = null;
      try {
        data = JSON.parse(String(ev.data)) as WsServerAny;
      } catch {
        data = null;
      }
      if (!data || typeof data.t !== "string") return;

      if (data.t === "hello") {
        const h = data as WsServerHello;

        if (Array.isArray(h.players)) setPlayers(h.players.slice(0, 8));

        if (Array.isArray(h.history)) {
          const mapped: ChatMsg[] = h.history.map((m) => ({
            id: m.id,
            from: m.fromName,
            text: m.text,
            t: m.at,
          }));
          setHistory((prev) => uniqChat([...prev, ...mapped], 80));
        }

        const ms = h.match?.s;
        if (ms === "countdown") setMatchLabel("старт");
        else if (ms === "started") setMatchLabel("запущен");
        else setMatchLabel("ожидание");
        return;
      }

      if (data.t === "players") {
        const p = data as WsServerPlayers;
        if (Array.isArray(p.players)) setPlayers(p.players.slice(0, 8));
        const ms = p.match?.s;
        if (ms === "countdown") setMatchLabel("старт");
        else if (ms === "started") setMatchLabel("запущен");
        else setMatchLabel("ожидание");
        return;
      }

      if (data.t === "match") {
        const ms = (data as WsServerMatch).match?.s;
        if (ms === "countdown") setMatchLabel("старт");
        else if (ms === "started") setMatchLabel("запущен");
        else setMatchLabel("ожидание");
        return;
      }

      if (data.t === "chat") {
        const c = data as WsServerChat;
        const m = c.msg;
        if (!m?.id) return;
        setHistory((prev) => uniqChat([...prev, { id: m.id, from: m.fromName, text: m.text, t: m.at }], 80));
        return;
      }

      if (data.t === "start") {
        nav("/game/");
        return;
      }
    };

    ws.onerror = () => {
      // handled by close / fallback
    };

    ws.onclose = () => {
      window.clearTimeout(fallbackTimer);
      if (!aliveRef.current) return;

      // If we were in WS mode and it closes, try reconnect a few times, then fallback to poll.
      setStatus("offline");
      joinSentRef.current = false;

      if (mode === "ws") {
        if (attemptRef.current >= 3) {
          setMode("poll");
          return;
        }
        scheduleReconnect();
      }
    };
  }, [room, closeWs, sendWs, scheduleReconnect, mode]);

  connectRef.current = connectWs;

  // keepalive ping for WS
  React.useEffect(() => {
    if (mode !== "ws") return;
    if (status !== "online") return;

    const t = window.setInterval(() => {
      if (!aliveRef.current) return;
      if (document.visibilityState !== "visible") return;
      sendWs({ t: "ping", at: Date.now() } satisfies WsClientPing);
    }, 18_000);

    return () => window.clearInterval(t);
  }, [mode, status, sendWs]);

  // POLLING loop (fallback)
  React.useEffect(() => {
    if (mode !== "poll") return;

    let alive = true;

    const tick = async () => {
      const ok = await pollHeartbeat({
        room,
        clientId: clientIdRef.current,
        name: myNickRef.current,
        ready: desiredReadyRef.current,
      });

      if (!alive) return;
      setStatus(ok ? "online" : "offline");

      const s = await pollState(room);
      if (!alive) return;
      if (s?.ok) {
        setPlayers(Array.isArray(s.players) ? s.players.slice(0, 8) : []);
        setMatchLabel("ожидание");
      }

      const c = await pollChat(room);
      if (!alive) return;
      if (c?.ok && Array.isArray(c.items)) {
        const mapped: ChatMsg[] = c.items.map((m) => ({ id: m.id, from: m.fromName, text: m.text, t: m.at }));
        setHistory((prev) => uniqChat([...prev, ...mapped], 80));
      }
    };

    setStatus("connecting");
    void tick();

    const tHeart = window.setInterval(() => {
      if (!alive) return;
      if (document.visibilityState !== "visible") return;
      void tick();
    }, 1100);

    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      void tick();
    };

    window.addEventListener("focus", onVis);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      window.clearInterval(tHeart);
      window.removeEventListener("focus", onVis);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [mode, room]);

  // lifecycle start: try WS first
  React.useEffect(() => {
    aliveRef.current = true;
    connectWs();

    const onVis = () => {
      if (document.visibilityState !== "visible") return;

      // if in WS mode but socket dead -> reconnect
      if (mode === "ws") {
        const ws = wsRef.current;
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          connectWs();
        }
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
  }, [connectWs, closeWs, mode]);

  const onlineCount = players.length;
  const canReady = onlineCount <= 8;
  const isOnline = status === "online";

  const toggleReady = React.useCallback(async () => {
    if (!canReady) return;

    const next = !desiredReadyRef.current;
    desiredReadyRef.current = next;
    setReady(next);

    if (mode === "ws") {
      if (!isOnline) return;
      sendWs({ t: "ready", ready: next } satisfies WsClientReady);
      return;
    }

    // poll mode: push immediately
    await pollHeartbeat({
      room,
      clientId: clientIdRef.current,
      name: myNickRef.current,
      ready: next,
    });
  }, [canReady, isOnline, mode, room, sendWs]);

  const sendChat = React.useCallback(async () => {
    if (!isOnline) return;

    const msg = clampText(text, 180);
    if (!msg) return;

    setText("");

    const optimistic: ChatMsg = {
      id: `local_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`,
      from: myNickRef.current,
      text: msg,
      t: Date.now(),
      local: true,
    };
    setHistory((prev) => uniqChat([...prev, optimistic], 80));

    if (mode === "ws") {
      sendWs({ t: "chat", text: msg, clientMsgId: safeId() } satisfies WsClientChat);
      return;
    }

    // poll
    await pollSendChat({
      room,
      clientId: clientIdRef.current,
      name: myNickRef.current,
      text: msg,
    });

    const c = await pollChat(room);
    if (c?.ok && Array.isArray(c.items)) {
      const mapped: ChatMsg[] = c.items.map((m) => ({ id: m.id, from: m.fromName, text: m.text, t: m.at }));
      setHistory((prev) => uniqChat([...prev, ...mapped], 80));
    }
  }, [isOnline, mode, room, sendWs, text]);

  const hardReconnect = React.useCallback(() => {
    attemptRef.current = 0;
    if (mode === "ws") {
      connectWs();
      return;
    }
    // poll mode: just re-run tick by switching mode briefly
    setMode("poll");
  }, [connectWs, mode]);

  return (
    <main className="bcSiteRoot">
      {ClickFix}

      <div className="bcLobbyUiLayer">
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
                <div className="bcLobbyTitle"><b>EvoFish Лобби</b><span>Океанская комната</span></div>
                <div style={{ opacity: 0.75, fontWeight: 850 }}>Игроки: {onlineCount}/8</div>
                <div style={{ opacity: 0.75, fontWeight: 850 }}>
                  Статус: {status === "online" ? "онлайн" : status === "connecting" ? "подключение" : "офлайн"}
                </div>
                <div style={{ opacity: 0.75, fontWeight: 850 }}>Матч: {matchLabel}</div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="secondary" onClick={() => nav("/game/")}>
                  Играть
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
                    <Button variant={ready ? "primary" : "secondary"} onClick={() => void toggleReady()} disabled={!isOnline || !canReady}>
                      {ready ? "Готов" : "Не готов"}
                    </Button>

                    <Button variant="ghost" onClick={hardReconnect}>
                      Переподключить
                    </Button>

                    <Button variant="secondary" onClick={() => nav("/game/")} disabled={!isOnline}>
                      В игру
                    </Button>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {players.slice(0, 8).map((p) => (
                    <div
                      key={p.id}
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
                      <div style={{ fontWeight: 900 }}>{p.name}</div>
                      <div style={{ opacity: 0.78, fontWeight: 900 }}>{p.ready ? "готов" : "ждёт"}</div>
                    </div>
                  ))}
                </div>

                {!canReady ? <div style={{ marginTop: 10, opacity: 0.78, fontWeight: 850, lineHeight: 1.45 }}>Комната заполнена.</div> : null}
              </div>

              <div className="glassStrong" style={{ borderRadius: 22, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ fontWeight: 950 }}>Чат</div>
                  <div style={{ opacity: 0.72, fontWeight: 850, fontSize: 12 }}>{isOnline ? "в эфире" : "нет связи"}</div>
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
                    <div key={m.id} style={{ padding: "6px 0", display: "grid", gap: 4 }}>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
                        <div style={{ fontWeight: 950 }}>{m.from}</div>
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
                    disabled={!isOnline}
                    onKeyDown={(e) => {
                      if (!isOnline) return;
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void sendChat();
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

                  <Button variant="primary" onClick={() => void sendChat()} disabled={!isOnline}>
                    Отправить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Lobby;

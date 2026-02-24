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

type LobbyStatus = "connecting" | "online" | "offline";

type LobbyUser = { clientId: string; nick: string; ready: boolean; seenAt: number };
type LobbyStateResp = { ok: boolean; kv?: boolean; roomId?: string; users?: LobbyUser[] };

type ChatItem = { id: string; t: number; nick: string; text: string };
type ChatResp = { ok: boolean; kv?: boolean; roomId?: string; items?: ChatItem[]; serverTime?: number };

function uniqChat(items: ChatItem[], limit = 80) {
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

async function sendChat(payload: { roomId: string; clientId: string; nick: string; text: string }) {
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

export function Lobby() {
  const [room] = React.useState("main");

  const [status, setStatus] = React.useState<LobbyStatus>("connecting");
  const [players, setPlayers] = React.useState<LobbyUser[]>([]);
  const [history, setHistory] = React.useState<ChatItem[]>([]);
  const [ready, setReady] = React.useState(false);
  const [text, setText] = React.useState("");

  const [busySend, setBusySend] = React.useState(false);

  const listRef = React.useRef<HTMLDivElement | null>(null);

  const clientIdRef = React.useRef<string>(getClientId());
  const nickRef = React.useRef<string>(getNick());

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

  // heartbeat + polling loop
  React.useEffect(() => {
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
      if (c) setHistory((prev) => uniqChat([...prev, ...c], 80));
    };

    // initial
    setStatus("connecting");
    void heartbeat();
    void pullState();
    void pullChat();

    // intervals (MVP stable)
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
  }, [room, ready]);

  const isOnline = status === "online";
  const onlineCount = players.length;
  const canReady = onlineCount <= 8;

  const toggleReady = React.useCallback(async () => {
    if (!canReady) return;
    const next = !ready;
    setReady(next);

    // push instantly (fast UI)
    await postHeartbeat({
      roomId: room,
      clientId: clientIdRef.current,
      nick: nickRef.current,
      ready: next,
    });
  }, [canReady, ready, room]);

  const doSend = React.useCallback(async () => {
    if (!isOnline) return;
    if (busySend) return;

    const msg = clampText(text, 180);
    if (!msg) return;

    setBusySend(true);
    setText("");

    const ok = await sendChat({
      roomId: room,
      clientId: clientIdRef.current,
      nick: nickRef.current,
      text: msg,
    });

    // сразу подтягиваем чат, чтобы “как вебсокет”
    const c = await fetchChat(room);
    if (c) setHistory(uniqChat(c, 80));

    setBusySend(false);

    // если отправка провалилась — просто покажем, что мы offline
    if (!ok) setStatus("offline");
  }, [isOnline, busySend, text, room]);

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

                  <Button
                    variant="ghost"
                    onClick={async () => {
                      setStatus("connecting");
                      await postHeartbeat({
                        roomId: room,
                        clientId: clientIdRef.current,
                        nick: nickRef.current,
                        ready,
                      });
                      const s = await fetchState(room);
                      const c = await fetchChat(room);
                      if (s) setPlayers(s.slice(0, 8));
                      if (c) setHistory(uniqChat(c, 80));
                    }}
                  >
                    Переподключить
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
                  <div key={m.id} style={{ padding: "6px 0", display: "grid", gap: 4 }}>
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
                MVP (stable): presence/ready через heartbeat + чат через polling. Следующий этап — WebSocket на отдельном Worker-сервисе.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Lobby;

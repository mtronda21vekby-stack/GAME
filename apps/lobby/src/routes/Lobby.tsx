import React from "react";
import { Button } from "@blackcrown/ui";
import { userStorage } from "@blackcrown/core";
import { createLobbyClient, LobbyChatMsg, LobbyPlayer } from "@blackcrown/core";

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

export function Lobby() {
  const [room] = React.useState("main");
  const [status, setStatus] = React.useState<"connecting" | "online" | "offline">("connecting");
  const [players, setPlayers] = React.useState<LobbyPlayer[]>([]);
  const [history, setHistory] = React.useState<LobbyChatMsg[]>([]);
  const [ready, setReady] = React.useState(false);
  const [text, setText] = React.useState("");
  const listRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const nick = getNick();

    const client = createLobbyClient(room, {
      onOpen: () => setStatus("online"),
      onClose: () => setStatus("offline"),
      onHello: (m) => {
        setPlayers(m.players);
        setHistory(m.history);
        setReady(m.you.ready);
        client.join(nick);
      },
      onPlayers: (m) => setPlayers(m.players),
      onChat: (m) => setHistory((prev) => [...prev, m.msg].slice(-40)),
    });

    return () => client.close();
  }, [room]);

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history.length]);

  const onlineCount = players.length;
  const canReady = onlineCount <= 8;

  return (
    <main className="bcSiteRoot">
      <section className="bcSection" style={{ paddingTop: 14 }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div className="glassStrong" style={{ borderRadius: 22, padding: 14, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 980 }}>Lobby</div>
              <div style={{ opacity: 0.75, fontWeight: 850 }}>Комната: {room}</div>
              <div style={{ opacity: 0.75, fontWeight: 850 }}>Игроки: {onlineCount}/8</div>
              <div style={{ opacity: 0.75, fontWeight: 850 }}>
                Статус: {status === "online" ? "онлайн" : status === "connecting" ? "подключение" : "офлайн"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="secondary" onClick={() => nav("/game/")}>Игры</Button>
              <Button variant="ghost" onClick={() => nav("/")}>Главная</Button>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ display: "grid", gap: 12 }}>
            <div className="glassStrong" style={{ borderRadius: 22, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontWeight: 950 }}>Игроки</div>
                <Button
                  variant={ready ? "primary" : "secondary"}
                  onClick={() => {
                    if (!canReady) return;
                    const next = !ready;
                    setReady(next);
                    // отправка через новый клиент: создадим быстрый connect для действия
                    const c = createLobbyClient(room, {});
                    c.setReady(next);
                    setTimeout(() => c.close(), 50);
                  }}
                >
                  {ready ? "Готов" : "Не готов"}
                </Button>
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
                    <div style={{ opacity: 0.78, fontWeight: 900 }}>{p.ready ? "ready" : "…"}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glassStrong" style={{ borderRadius: 22, padding: 14 }}>
              <div style={{ fontWeight: 950 }}>Чат</div>

              <div
                ref={listRef}
                style={{
                  marginTop: 10,
                  height: 260,
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
                      <div style={{ fontWeight: 950 }}>{m.fromName}</div>
                      <div style={{ opacity: 0.68, fontWeight: 850, fontSize: 12 }}>{fmtTime(m.at)}</div>
                    </div>
                    <div style={{ opacity: 0.88, lineHeight: 1.4 }}>{m.text}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Написать сообщение"
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
                  }}
                />
                <Button
                  variant="primary"
                  onClick={() => {
                    const msg = text.trim();
                    if (!msg) return;
                    setText("");
                    const c = createLobbyClient(room, {});
                    c.chat(msg);
                    setTimeout(() => c.close(), 50);
                  }}
                >
                  Отправить
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

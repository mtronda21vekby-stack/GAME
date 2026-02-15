import React, { useEffect, useMemo, useState } from "react";
import { Button, Tabs, ToastViewport, useToasts } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import { userStorage, track, attachConsoleAnalytics } from "@blackcrown/core";
import { Router, Link, navigate } from "../router";
import { About } from "./About";
import { Support } from "./Support";
import { Privacy } from "./Privacy";
import { Terms } from "./Terms";
import { AccountModal } from "../features/account/AccountModal";
import { Roadmap } from "../features/content/Roadmap";
import { Changelog } from "../features/content/Changelog";
import { StorePreview } from "../features/store/StorePreview";

const PATHS = {
  site: "/",
  game: "/game/",
  lobby: "/lobby/"
} as const;

export function App() {
  useEffect(() => attachConsoleAnalytics(), []);

  return (
    <Router
      routes={[
        { path: "/", element: <Home /> },
        { path: "/about", element: <About /> },
        { path: "/support", element: <Support /> },
        { path: "/privacy", element: <Privacy /> },
        { path: "/terms", element: <Terms /> }
      ]}
    />
  );
}

function Home() {
  const { toasts, push, dismiss } = useToasts();
  const [accountOpen, setAccountOpen] = useState(false);
  const [tab, setTab] = useState<"roadmap" | "changelog" | "store">("roadmap");

  const nickname = userStorage.getString("nickname", "");
  const displayName = nickname || "Игрок";

  useEffect(() => {
    track({ type: "page_view", path: window.location.pathname });
  }, []);

  const goGame = () => {
    track({ type: "cta_click", id: "go_game_from_site" });
    push({ title: "Запуск…", message: "Открываю контейнер игры" });
    window.location.href = PATHS.game;
  };

  const goLobby = () => {
    track({ type: "cta_click", id: "go_lobby_from_site" });
    window.location.href = PATHS.lobby;
  };

  const nav = useMemo(() => (
    <div className="nav">
      <div className="bc-container bc-row" style={{ justifyContent: "space-between" }}>
        <Link to="/" className="bc-row" style={{ gap: 10 }}>
          <img alt="" src={Icons.crown} width="22" height="22" />
          <div style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>BlackCrown</div>
        </Link>

        <div className="bc-row" style={{ gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Link to="/about" className="bc-muted">О проекте</Link>
          <Link to="/support" className="bc-muted">Поддержка</Link>

          <Button variant="secondary" onClick={() => setAccountOpen(true)}>
            Аккаунт: {displayName}
          </Button>

          <Button variant="primary" leftIconSrc={Icons.play} onClick={goGame}>
            Играть
          </Button>
        </div>
      </div>
    </div>
  ), [displayName]);

  return (
    <>
      {nav}

      <main className="bc-container" style={{ padding: "16px 0 44px" }}>
        <section className="heroGrid">
          <div className="glassStrong shimmerBorder echoGrain bc-motion" style={{ padding: 22, position: "relative", overflow: "hidden" }}>
            <div className="echo-orb" style={{ right: -140, top: -160 }} />
            <div className="echo-orb" style={{ left: -160, bottom: -180, opacity: 0.28 }} />

            <h1 className="bc-h1">Премиум-хаб для EvoFish.<br />Apple-like UX.</h1>

            <p className="bc-p" style={{ marginTop: 10, maxWidth: 760 }}>
              BlackCrown — это “входная дверь”. EvoFish — игра. Lobby — сбор команды и чат.
              Motion сделан под 120fps: только <b>transform/opacity</b>.
            </p>

            <div style={{ marginTop: 14 }} className="echo-line" />

            <div className="bc-row" style={{ marginTop: 16, flexWrap: "wrap" }}>
              <Button variant="primary" size="lg" leftIconSrc={Icons.play} onClick={goGame}>
                Запустить EvoFish
              </Button>

              <Button variant="secondary" size="lg" onClick={goLobby}>
                Открыть Lobby
              </Button>

              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  setAccountOpen(true);
                  track({ type: "cta_click", id: "open_account" });
                }}
              >
                Указать ник
              </Button>
            </div>

            <div className="bc-divider" style={{ marginTop: 18 }} />

            <div className="kpi" style={{ marginTop: 16 }}>
              <Kpi title="Адаптив" value="iPhone → Xbox" desc="Safe-area + большие тач-цели" />
              <Kpi title="Motion" value="120fps" desc="transform/opacity, без тяжёлых фильтров" />
              <Kpi title="PWA" value="Offline" desc="Сайт кеширует shell, игра — no-cache" />
            </div>
          </div>

          <div className="glass bc-motion" style={{ padding: 18 }}>
            <div className="bc-h2">Быстрые действия</div>
            <div style={{ marginTop: 12 }} className="bc-col">
              <Action title="О проекте" desc="Что это и что дальше по плану" onClick={() => { navigate("/about"); track({ type: "cta_click", id: "nav_about" }); }} />
              <Action title="Поддержка" desc="FAQ и контакты" onClick={() => { navigate("/support"); track({ type: "cta_click", id: "nav_support" }); }} />
              <Action title="Приватность" desc="Local-first: ник хранится на устройстве" onClick={() => navigate("/privacy")} />
              <Action title="Условия" desc="Базовые правила использования" onClick={() => navigate("/terms")} />
            </div>
          </div>
        </section>

        <section style={{ marginTop: 16 }} className="glass bc-motion">
          <div style={{ padding: 18 }} className="bc-row">
            <div className="bc-col" style={{ flex: 1 }}>
              <div className="bc-h2">Лента</div>
              <div className="bc-p">Roadmap, Changelog и превью магазина.</div>
            </div>

            <Tabs
              value={tab}
              onChange={(v) => setTab(v)}
              items={[
                { id: "roadmap", label: "Roadmap" },
                { id: "changelog", label: "Changelog" },
                { id: "store", label: "Store" }
              ]}
            />
          </div>

          <div className="bc-divider" />

          <div style={{ padding: 18 }}>
            {tab === "roadmap" ? <Roadmap /> : null}
            {tab === "changelog" ? <Changelog /> : null}
            {tab === "store" ? <StorePreview onBuy={() => push({ title: "Магазин", message: "Покупки пока отключены (заглушка)." })} /> : null}
          </div>
        </section>
      </main>

      <AccountModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        onSaved={(name) => {
          push({ title: "Сохранено", message: `Ник: ${name}` });
          setAccountOpen(false);
        }}
      />

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

function Kpi(props: { title: string; value: string; desc: string }) {
  return (
    <div className="bc-card shimmerBorder echoGrain" style={{ padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.05)" }}>
      <div className="bc-faint" style={{ fontSize: 13 }}>{props.title}</div>
      <div style={{ fontWeight: 850, letterSpacing: "-0.02em", fontSize: 20, marginTop: 4 }}>{props.value}</div>
      <div className="bc-p" style={{ marginTop: 4 }}>{props.desc}</div>
    </div>
  );
}

function Action(props: { title: string; desc: string; onClick: () => void }) {
  return (
    <button
      className="bc-focus bc-motion"
      onClick={props.onClick}
      style={{
        textAlign: "left",
        borderRadius: 16,
        border: "1px solid var(--stroke)",
        background: "rgba(255,255,255,0.06)",
        color: "var(--text)",
        padding: 12,
        cursor: "pointer",
        transition: "transform 140ms ease, opacity 140ms ease, background 140ms ease"
      }}
      onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.99)")}
      onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
    >
      <div style={{ fontWeight: 750 }}>{props.title}</div>
      <div className="bc-p">{props.desc}</div>
    </button>
  );
}

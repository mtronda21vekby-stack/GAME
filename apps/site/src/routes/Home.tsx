import React from "react";
import { Button, Modal } from "@blackcrown/ui";
import { Icons, HeroArt } from "@blackcrown/assets";
import { userStorage } from "@blackcrown/core";
import { Router } from "./Router";

function navSite(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

function navExternal(path: string) {
  window.location.assign(path);
}

function getName() {
  return userStorage.getString("nickname", "") || "Игрок";
}

function Pill(props: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.82)",
        fontWeight: 850,
        fontSize: 12,
        letterSpacing: "0.02em",
      }}
    >
      {props.children}
    </span>
  );
}

function FeatureCard(props: {
  title: string;
  desc: string;
  tag: string;
  actionLabel: string;
  onAction: () => void;
  href?: string;
  kind?: "site" | "external";
  artSrc: string;
}) {
  const kind = props.kind ?? "site";

  const open = () => {
    if (!props.href) return;
    if (kind === "external") navExternal(props.href);
    else navSite(props.href);
  };

  return (
    <div
      className="glassStrong bc-motion"
      role={props.href ? "link" : undefined}
      tabIndex={props.href ? 0 : undefined}
      onClick={open}
      onKeyDown={(e) => {
        if (!props.href) return;
        if (e.key !== "Enter" && e.key !== " ") return;
        open();
      }}
      style={{
        borderRadius: 22,
        border: "none",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 34px 120px rgba(0,0,0,0.30)",
        overflow: "hidden",
        cursor: props.href ? "pointer" : "default",
      }}
    >
      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <div style={{ fontWeight: 950, fontSize: 18, letterSpacing: "-0.02em" }}>{props.title}</div>
          <Pill>{props.tag}</Pill>
        </div>

        <div style={{ marginTop: 8, opacity: 0.86, lineHeight: 1.45 }}>{props.desc}</div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              props.onAction();
            }}
          >
            {props.actionLabel}
          </Button>

          {props.href ? (
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            >
              Открыть
            </Button>
          ) : null}
        </div>
      </div>

      <div style={{ padding: 14, paddingTop: 0 }}>
        <img
          alt=""
          src={props.artSrc}
          style={{
            width: "100%",
            height: 160,
            objectFit: "cover",
            borderRadius: 18,
            border: "none",
            display: "block",
            opacity: 0.95,
          }}
        />
      </div>
    </div>
  );
}

function AccountModal(props: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = React.useState<string>(() => userStorage.getString("nickname", "") || "");

  React.useEffect(() => {
    if (!props.open) return;
    setValue(userStorage.getString("nickname", "") || "");
  }, [props.open]);

  return (
    <Modal open={props.open} title="Аккаунт" onClose={props.onClose}>
      <div className="bc-col" style={{ gap: 10 }}>
        <div style={{ fontWeight: 900 }}>Никнейм</div>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Введите никнейм"
          autoComplete="nickname"
          inputMode="text"
          style={{
            width: "100%",
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

        <div className="bc-row" style={{ justifyContent: "flex-end", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
          <Button variant="ghost" onClick={props.onClose}>
            Закрыть
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              const next = value.trim();
              if (next.length > 0) userStorage.setString("nickname", next);
              props.onClose();
              props.onSaved();
            }}
          >
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function Home() {
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [name, setName] = React.useState(getName());

  return (
    <main className="bcSiteRoot">
      <section className="bcHero">
        <div className="bcHeroBg" aria-hidden="true">
          <img className="bcHeroAurora" alt="" src={HeroArt.aurora} />
          <div className="bcHeroVignette" />
          <div className="bcHeroNoise" style={{ backgroundImage: `url(${HeroArt.noise})` }} />
        </div>

        <header className="bcTop">
          <button type="button" className="bcBrand" onClick={() => navSite("/")} aria-label="BlackCrown Home">
            <img alt="" src={Icons.crown} width="20" height="20" />
            <div style={{ fontWeight: 950 }}>BlackCrown</div>
          </button>

          <nav className="bcNav" aria-label="Навигация">
            <a className="bcLink" href="/about">
              О проекте
            </a>
            <a className="bcLink" href="/support">
              Поддержка
            </a>
            <a className="bcLink" href="/privacy">
              Privacy
            </a>
            <a className="bcLink" href="/terms">
              Terms
            </a>
          </nav>

          <div className="bcRight">
            <button type="button" className="bcAccountPill" onClick={() => setAccountOpen(true)} aria-label="Аккаунт">
              Аккаунт: {name}
            </button>

            <Button variant="primary" leftIconSrc={Icons.play} onClick={() => navExternal("/game/")}>
              Играть
            </Button>
          </div>
        </header>

        <div className="bcHeroGrid">
          <div className="bcHeroCopy glassStrong">
            <div className="bcKicker">Игровая платформа</div>

            <h1 className="bcH1">
              Хаб для игр.
              <br />
              Единый стиль.
              <br />
              Быстрый запуск.
            </h1>

            <p className="bcLead">
              BlackCrown — витрина и лончер для наших игр. Сегодня доступна <b>EvoFish</b>, дальше — новые тайтлы и события.
            </p>

            <div className="bcCtas">
              <Button variant="primary" leftIconSrc={Icons.play} onClick={() => navExternal("/game/")}>
                Запустить EvoFish
              </Button>

              <Button variant="secondary" onClick={() => navExternal("/lobby/")}>
                Открыть Lobby
              </Button>

              <Button variant="ghost" onClick={() => navSite("/store")}>
                Магазин
              </Button>
            </div>

            <div className="bcBadges">
              <Pill>iPhone → Xbox</Pill>
              <Pill>120fps motion</Pill>
              <Pill>PWA ready</Pill>
            </div>
          </div>

          <div className="bcHeroPanel glassStrong">
            <div className="bcPanelTitle">Разделы</div>

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={() => navExternal("/game/")}>
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Игры</div>
                <div className="bcPanelP">Запуск тайтлов и настройки.</div>
              </div>
            </div>

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={() => navExternal("/lobby/")}>
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Lobby</div>
                <div className="bcPanelP">Команда и чат.</div>
              </div>
            </div>

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={() => navSite("/support")}>
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Поддержка</div>
                <div className="bcPanelP">Помощь и контакты.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bcSection">
        <div className="bcSectionHead">
          <div className="bcSectionTitle">Платформа</div>
          <div className="bcSectionSub">Премиум интерфейс и быстрые анимации — для телефона, ПК и консоли.</div>
        </div>

        <div className="bcCards">
          <FeatureCard
            title="Единый премиум-стиль"
            desc="Единые компоненты, токены и motion. Чистая типографика и стекло — без визуального шума."
            tag="UI"
            actionLabel="О проекте"
            onAction={() => navSite("/about")}
            href="/about"
            kind="site"
            artSrc={HeroArt.cardGrid}
          />

          <FeatureCard
            title="Игры"
            desc="Единый запуск, настройки и управление. EvoFish и следующие тайтлы — на одном домене."
            tag="Play"
            actionLabel="Открыть игру"
            onAction={() => navExternal("/game/")}
            href="/game/"
            kind="external"
            artSrc={HeroArt.cardNeon}
          />

          <FeatureCard
            title="Lobby"
            desc="Комната и чат. Быстрый вход, список игроков и статусы готовности."
            tag="Social"
            actionLabel="В Lobby"
            onAction={() => navExternal("/lobby/")}
            href="/lobby/"
            kind="external"
            artSrc={HeroArt.cardWave}
          />
        </div>

        <div style={{ maxWidth: 980, margin: "16px auto 0", opacity: 0.78 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a className="bcLink" href="/privacy">
              Privacy
            </a>
            <a className="bcLink" href="/terms">
              Terms
            </a>
            <a className="bcLink" href="/support">
              Поддержка
            </a>
          </div>
        </div>
      </section>

      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} onSaved={() => setName(getName())} />
    </main>
  );
}

export function App() {
  return <Router />;
}

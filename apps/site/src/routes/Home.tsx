import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons, HeroArt } from "@blackcrown/assets";
import { userStorage } from "@blackcrown/core";
import { openTelegramBot } from "../lib/telegram";
import { Router } from "./Router";

function navSite(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
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
  imageSrc?: string;
}) {
  const kind = props.kind ?? "site";

  return (
    <div
      className="glassStrong bc-motion"
      role={props.href ? "link" : undefined}
      tabIndex={props.href ? 0 : undefined}
      onClick={() => {
        if (!props.href) return;
        if (kind === "external") navExternal(props.href);
        else navSite(props.href);
      }}
      onKeyDown={(e) => {
        if (!props.href) return;
        if (e.key === " ") e.preventDefault();
        if (e.key !== "Enter" && e.key !== " ") return;
        if (kind === "external") navExternal(props.href);
        else navSite(props.href);
      }}
      style={{
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.08)",
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
                if (kind === "external") navExternal(props.href!);
                else navSite(props.href!);
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
          src={props.imageSrc ?? HeroArt.cardWave}
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

export function Home() {
  const name = getName();

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
            <a className="bcLink" href="/store">
              Магазин
            </a>
            <a className="bcLink" href="/privacy">
              Privacy
            </a>
            <a className="bcLink" href="/terms">
              Terms
            </a>
          </nav>

          <div className="bcRight">
            <button type="button" className="bcAccountPill" onClick={() => navSite("/account")} aria-label="Аккаунт">
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
              Премиум-UX.
              <br />
              Сервисы для игроков.
            </h1>

            <p className="bcLead">
              BlackCrown — витрина и лончер для наших игр. Сегодня доступна <b>EvoFish</b>, дальше — новые проекты и
              события. В экосистему входит <b>AI-Coach в Telegram</b>, который помогает с прогрессом и стратегиями.
            </p>

            <div className="bcCtas">
              <Button variant="primary" leftIconSrc={Icons.play} onClick={() => navExternal("/game/")}>
                Запустить EvoFish
              </Button>

              <Button variant="secondary" onClick={() => navExternal("/lobby/")}>
                Открыть Lobby
              </Button>

              <Button variant="secondary" onClick={openTelegramBot}>
                AI-Coach в Telegram
              </Button>

              <Button variant="ghost" onClick={() => navSite("/store")}>
                Магазин
              </Button>
            </div>

            <div className="bcBadges">
              <Pill>iPhone → Xbox</Pill>
              <Pill>120fps motion</Pill>
              <Pill>PWA ready</Pill>
              <Pill>AI-Coach • Telegram</Pill>
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
                <div className="bcPanelP">Комната и чат.</div>
              </div>
            </div>

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={() => navSite("/store")}>
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Магазин</div>
                <div className="bcPanelP">Коллекция, баланс, предметы.</div>
              </div>
            </div>

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={() => navSite("/account")}>
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Аккаунт</div>
                <div className="bcPanelP">Профиль, аватар и статус.</div>
              </div>
            </div>

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={openTelegramBot}>
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">AI-Coach</div>
                <div className="bcPanelP">Открыть бота в Telegram.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bcSection">
        <div className="bcSectionHead">
          <div className="bcSectionTitle">Экосистема</div>
          <div className="bcSectionSub">Игры + сервисы: профиль, лобби, магазин и AI-помощник в Telegram.</div>
        </div>

        <div className="bcCards">
          <FeatureCard
            title="Игры"
            desc="Единый запуск, настройки и управление. Игры открываются как отдельные приложения на этом же домене."
            tag="Play"
            actionLabel="Открыть игру"
            onAction={() => navExternal("/game/")}
            href="/game/"
            kind="external"
          />

          <FeatureCard
            title="Lobby"
            desc="Комната на 8 игроков: список участников, ready/unready и прозрачный чат."
            tag="Social"
            actionLabel="В Lobby"
            onAction={() => navExternal("/lobby/")}
            href="/lobby/"
            kind="external"
          />

          <FeatureCard
            title="Store"
            desc="Витрина предметов, избранное, покупки и история. Всё сохраняется локально и ощущается как реальный продукт."
            tag="Store"
            actionLabel="Открыть магазин"
            onAction={() => navSite("/store")}
            href="/store"
            kind="site"
          />

          <FeatureCard
            title="AI-Coach в Telegram"
            desc="Помогает с прогрессом, механиками, стратегиями и целями. Быстрый вход в контекст и подсказки по делу."
            tag="Coach"
            actionLabel="Открыть бота"
            onAction={openTelegramBot}
            href="/about"
            kind="site"
            imageSrc={HeroArt.cardWave}
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
    </main>
  );
}

export function App() {
  return <Router />;
}

// apps/site/src/routes/Home.tsx  — ЗАМЕНИ ЦЕЛИКОМ (убраны “пасхалки”, все кнопки/ссылки связаны)

import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons, HeroArt } from "@blackcrown/assets";
import { userStorage } from "@blackcrown/core";

function nav(path: string) {
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
        letterSpacing: "0.02em"
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
}) {
  return (
    <div
      className="glassStrong bc-motion"
      role={props.href ? "link" : undefined}
      tabIndex={props.href ? 0 : undefined}
      onClick={() => props.href && nav(props.href)}
      onKeyDown={(e) => {
        if (!props.href) return;
        if (e.key === "Enter" || e.key === " ") nav(props.href);
      }}
      style={{
        borderRadius: 22,
        border: "none",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 34px 120px rgba(0,0,0,0.30)",
        overflow: "hidden",
        cursor: props.href ? "pointer" : "default"
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
                nav(props.href!);
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
          src={HeroArt.cardWave}
          style={{
            width: "100%",
            height: 160,
            objectFit: "cover",
            borderRadius: 18,
            border: "none",
            display: "block",
            opacity: 0.95
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
          <button
            type="button"
            className="bcBrand"
            onClick={() => nav("/")}
            aria-label="BlackCrown Home"
            style={{ cursor: "pointer" }}
          >
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
            <button
              type="button"
              className="bcAccountPill"
              onClick={() => nav("/account")}
              style={{ cursor: "pointer" }}
              aria-label="Открыть аккаунт"
            >
              Аккаунт: {name}
            </button>

            <Button variant="primary" leftIconSrc={Icons.play} onClick={() => nav("/game/")}>
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
              BlackCrown — это витрина и лончер для наших игр. Сегодня доступна <b>EvoFish</b>, дальше — новые проекты и
              события. Один домен, один аккаунт, единый премиум UX.
            </p>

            <div className="bcCtas">
              <Button variant="primary" leftIconSrc={Icons.play} onClick={() => nav("/game/")}>
                Запустить EvoFish
              </Button>

              <Button variant="secondary" onClick={() => nav("/lobby/")}>
                Открыть Lobby
              </Button>

              <Button variant="ghost" onClick={() => nav("/store")}>
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

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={() => nav("/game/")}>
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Игры</div>
                <div className="bcPanelP">Запуск тайтлов и настройки.</div>
              </div>
            </div>

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={() => nav("/lobby/")}>
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Lobby</div>
                <div className="bcPanelP">Команда и чат.</div>
              </div>
            </div>

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={() => nav("/support")}>
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
          <div className="bcSectionSub">Премиум интерфейс, адаптив и быстрые анимации — для телефона, ПК и консоли.</div>
        </div>

        <div className="bcCards">
          <FeatureCard
            title="Единый премиум-стиль"
            desc="Единые компоненты, токены и motion. Чистая типографика, стекло и воздух — без визуального мусора."
            tag="UI"
            actionLabel="О проекте"
            onAction={() => nav("/about")}
            href="/about"
          />
          <FeatureCard
            title="Запуск за секунды"
            desc="Контейнер для игр: настройки, фуллскрин, управление. EvoFish открывается изолированно, без ломания логики."
            tag="Play"
            actionLabel="Открыть игру"
            onAction={() => nav("/game/")}
            href="/game/"
          />
          <FeatureCard
            title="Lobby и чат"
            desc="Комната на 8 игроков: список, ready/unready и чат. Быстро и аккуратно."
            tag="Social"
            actionLabel="В Lobby"
            onAction={() => nav("/lobby/")}
            href="/lobby/"
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

/** main.tsx импортирует { App } */
export function App() {
  return <Home />;
}

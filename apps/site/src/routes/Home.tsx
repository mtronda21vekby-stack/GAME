import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons, HeroArt } from "@blackcrown/assets";
import { userStorage } from "@blackcrown/core";

function go(path: string) {
  window.location.href = path;
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
        fontWeight: 800,
        fontSize: 12,
        letterSpacing: "0.02em"
      }}
    >
      {props.children}
    </span>
  );
}

function FeatureCard(props: { title: string; desc: string; tag: string }) {
  return (
    <div
      className="glassStrong bc-motion"
      style={{
        borderRadius: 22,
        border: "none",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 34px 120px rgba(0,0,0,0.30)",
        overflow: "hidden"
      }}
    >
      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <div style={{ fontWeight: 950, fontSize: 18, letterSpacing: "-0.02em" }}>{props.title}</div>
          <Pill>{props.tag}</Pill>
        </div>

        <div style={{ marginTop: 8, opacity: 0.86, lineHeight: 1.45 }}>{props.desc}</div>
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
          <div className="bcBrand">
            <img alt="" src={Icons.crown} width="20" height="20" />
            <div style={{ fontWeight: 950 }}>BlackCrown</div>
          </div>

          <nav className="bcNav">
            <a className="bcLink" href="/about">
              О проекте
            </a>
            <a className="bcLink" href="/support">
              Поддержка
            </a>
          </nav>

          <div className="bcRight">
            <div className="bcAccountPill">Аккаунт: {name}</div>
            <Button variant="primary" leftIconSrc={Icons.play} onClick={() => go("/game/")}>
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
              Премиум-ощущение.
              <br />
              Быстрый вход.
            </h1>

            <p className="bcLead">
              BlackCrown — это витрина и лончер для наших игр. Сегодня — <b>EvoFish</b>, дальше — новые тайтлы, режимы,
              события и сезонные релизы. Всё в одном стиле: стекло, воздух, быстрый интерфейс.
            </p>

            <div className="bcCtas">
              <Button variant="primary" leftIconSrc={Icons.play} onClick={() => go("/game/")}>
                Запустить EvoFish
              </Button>

              <Button variant="secondary" onClick={() => go("/lobby/")}>
                Открыть Lobby
              </Button>

              <Button variant="ghost" onClick={() => go("/about")}>
                Подробнее
              </Button>
            </div>

            <div className="bcBadges">
              <Pill>iPhone → Xbox</Pill>
              <Pill>120fps motion</Pill>
              <Pill>PWA ready</Pill>
            </div>
          </div>

          <div className="bcHeroPanel glassStrong">
            <div className="bcPanelTitle">Что дальше</div>

            <div className="bcPanelRow">
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Новые игры</div>
                <div className="bcPanelP">Одна учётка, один стиль, разные миры.</div>
              </div>
            </div>

            <div className="bcPanelRow">
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Сезоны и события</div>
                <div className="bcPanelP">Лёгкие обновления, прозрачные изменения.</div>
              </div>
            </div>

            <div className="bcPanelRow">
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Социальный слой</div>
                <div className="bcPanelP">Lobby + чат + сбор пати (в разработке).</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bcSection">
        <div className="bcSectionHead">
          <div className="bcSectionTitle">Платформа</div>
          <div className="bcSectionSub">Дизайн и архитектура сразу “как продукт”, а не “чтобы поиграться”.</div>
        </div>

        <div className="bcCards">
          <FeatureCard
            title="Единый премиум-стиль"
            desc="Единые компоненты, токены и motion. Минимум визуального шума — максимум “дорогого” ощущения."
            tag="UI"
          />
          <FeatureCard
            title="Запуск за секунды"
            desc="Контейнер игры без ломания логики. Настройки, фуллскрин, контроллеры — аккуратно и быстро."
            tag="Play"
          />
          <FeatureCard
            title="Lobby и чат"
            desc="Лёгкий прозрачный чат и сбор пати. Сейчас — локальный мок, дальше — сервер."
            tag="Social"
          />
        </div>
      </section>
    </main>
  );
}

/** main.tsx ожидает именно App */
export function App() {
  return <Home />;
}

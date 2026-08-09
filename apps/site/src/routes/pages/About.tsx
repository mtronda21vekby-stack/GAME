import React from "react";
import { Button } from "@blackcrown/ui";
import { HeroArt, Icons } from "@blackcrown/assets";
import { SiteHeader } from "../../components/SiteHeader";
import { nav as navSite, navExternal } from "../../lib/nav";
import { openTelegramBot } from "../../lib/telegram";
import "../../styles/content-pages.css";

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

function Card(props: { title: string; desc: string; icon?: string; right?: React.ReactNode }) {
  return (
    <div
      className="glassStrong bc-motion"
      style={{
        borderRadius: 22,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 34px 120px rgba(0,0,0,0.30)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {props.icon ? <img alt="" src={props.icon} width="18" height="18" style={{ opacity: 0.92 }} /> : null}
          <div style={{ fontWeight: 980, fontSize: 16, letterSpacing: "-0.01em" }}>{props.title}</div>
        </div>
        {props.right}
      </div>

      <div style={{ marginTop: 10, opacity: 0.86, lineHeight: 1.55, fontWeight: 850 }}>{props.desc}</div>
    </div>
  );
}

export function About() {
  return (
    <main className="bcSiteRoot">
      <section className="bcHero" style={{ minHeight: "auto" }}>
        <div className="bcHeroBg" aria-hidden="true">
          <img className="bcHeroAurora" alt="" src={HeroArt.aurora} />
          <div className="bcHeroVignette" />
          <div className="bcHeroNoise" style={{ backgroundImage: `url(${HeroArt.noise})` }} />
        </div>

        <SiteHeader active="about" />

        <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 14px 14px" }}>
          <div className="glassStrong" style={{ borderRadius: 22, padding: 18 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Pill>Платформа</Pill>
              <Pill>Игры + сервисы</Pill>
              <Pill>iPhone • PC • Xbox</Pill>
            </div>

            <h1 className="bcH1" style={{ marginTop: 12 }}>
              BlackCrown — хаб,
              <br />
              где игры и сервисы работают вместе.
            </h1>

            <p className="bcLead" style={{ marginTop: 10 }}>
              Мы делаем игры, которые запускаются быстро и выглядят премиально на любом устройстве. Параллельно строим
              сервисный слой: профиль, лобби, поддержка и AI-помощник для игроков.
            </p>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="primary" leftIconSrc={Icons.play} onClick={() => navExternal("/game/")}>
                Запустить игру
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
          </div>
        </div>
      </section>

      <section className="bcSection" style={{ paddingTop: 10 }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 14px" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <Card
              icon={Icons.crown}
              title="Игры на одном домене"
              desc="BlackCrown — витрина и лончер. Каждая игра живёт отдельным приложением, но пользователь ощущает единый продукт: единый стиль, единые настройки и единый профиль."
              right={<Pill>PWA ready</Pill>}
            />

            <Card
              icon={Icons.play}
              title="EvoFish и следующие релизы"
              desc="Сегодня на платформе доступна EvoFish. Дальше — новые проекты, режимы и события. BlackCrown развивается как дом для нескольких игр."
              right={<Pill>Games</Pill>}
            />

            <Card
              title="AI-Coach в Telegram"
              desc="AI-Coach помогает быстрее вливаться, разбираться в механиках, подбирать стратегии и держать прогресс в фокусе. Он открывается в Telegram на телефоне и в веб-версии на ПК/Xbox."
              right={<Pill>Telegram</Pill>}
            />

            <Card
              title="Премиум-UX"
              desc="Стеклянные панели, чистая типографика, плавный motion и аккуратные тач-цели. Интерфейс держится быстрым и стабильным на разных устройствах."
              right={<Pill>120fps motion</Pill>}
            />

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", opacity: 0.78 }}>
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
        </div>
      </section>
    </main>
  );
}

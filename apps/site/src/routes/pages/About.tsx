import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons, HeroArt } from "@blackcrown/assets";
import { openTelegramBot } from "../../lib/telegram";

function nav(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

function openExternal(url: string) {
  window.location.assign(url);
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

        <header className="bcTop">
          <button type="button" className="bcBrand" onClick={() => nav("/")} aria-label="BlackCrown Home">
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
            <Button variant="secondary" onClick={() => nav("/account")}>
              Аккаунт
            </Button>
            <Button variant="secondary" onClick={() => nav("/store")}>
              Магазин
            </Button>
            <Button variant="primary" leftIconSrc={Icons.play} onClick={() => openExternal("/game/")}>
              Играть
            </Button>
          </div>
        </header>

        <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 14px 14px" }}>
          <div className="glassStrong" style={{ borderRadius: 22, padding: 18 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Pill>Платформа</Pill>
              <Pill>Игры + сервисы</Pill>
              <Pill>iPhone • PC • Xbox</Pill>
            </div>

            <h1 className="bcH1" style={{ marginTop: 12 }}>
              BlackCrown — это хаб,
              <br />
              где игры и сервисы работают вместе.
            </h1>

            <p className="bcLead" style={{ marginTop: 10 }}>
              Игры запускаются быстро и выглядят премиально на любом устройстве. Сервисы платформы: профиль, лобби, магазин и
              AI-Coach в Telegram.
            </p>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="primary" leftIconSrc={Icons.play} onClick={() => openExternal("/game/")}>
                Запустить игру
              </Button>
              <Button variant="secondary" onClick={() => openExternal("/lobby/")}>
                Открыть Lobby
              </Button>
              <Button variant="secondary" onClick={() => nav("/store")}>
                Магазин
              </Button>
              <Button variant="ghost" onClick={openTelegramBot}>
                AI-Coach
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
              title="Единый продукт"
              desc="Единый стиль, единые настройки и единый профиль. Игра, лобби и магазин ощущаются как одна платформа."
              right={<Pill>PWA ready</Pill>}
            />

            <Card
              icon={Icons.play}
              title="Игры и релизы"
              desc="Сегодня доступна EvoFish. Дальше — новые режимы, проекты и события."
              right={<Pill>Games</Pill>}
            />

            <Card
              title="AI-Coach в Telegram"
              desc="Помогает быстрее вливаться, разбираться в механиках и подбирать стратегии. Это сервис экосистемы BlackCrown."
              right={<Pill>Telegram</Pill>}
            />

            <Card
              title="Store и коллекция"
              desc="Предметы для профиля и интерфейса. Всё сохранится в коллекции и применится в аккаунте."
              right={<Pill>Store</Pill>}
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

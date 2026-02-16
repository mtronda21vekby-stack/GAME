import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";

function nav(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

type Item = { title: string; desc: string; tag: string };

const ROADMAP: Item[] = [
  { title: "Новые тайтлы", desc: "Платформа для нескольких игр на одном домене и в одном стиле.", tag: "Platform" },
  { title: "События и сезоны", desc: "Обновления контента, тематические события и активности.", tag: "Live" },
  { title: "Магазин", desc: "Косметика, темы, витрина — аккуратно и премиально.", tag: "Store" }
];

const CHANGELOG: Item[] = [
  { title: "Apple-like UI", desc: "Стекло, воздух, мягкий свет и аккуратная типографика.", tag: "UI" },
  { title: "Навигация", desc: "Страницы сайта без перезагрузки, приложения — отдельными путями.", tag: "Routing" },
  { title: "PWA", desc: "Manifest, иконки и корректная база для установки на устройство.", tag: "PWA" }
];

function Card({ item }: { item: Item }) {
  return (
    <div
      className="glassStrong bc-motion"
      style={{
        borderRadius: 22,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 34px 120px rgba(0,0,0,0.30)"
      }}
    >
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
          <div style={{ fontWeight: 980, fontSize: 16, letterSpacing: "-0.01em" }}>{item.title}</div>
          <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.78 }}>{item.tag}</div>
        </div>

        <div style={{ marginTop: 8, color: "rgba(255,255,255,0.74)", fontWeight: 750, lineHeight: 1.45 }}>
          {item.desc}
        </div>
      </div>

      <div style={{ padding: 12, paddingTop: 0 }}>
        <div
          aria-hidden="true"
          style={{
            height: 150,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "radial-gradient(80% 120% at 20% 20%, rgba(124,168,255,0.40), rgba(10,14,30,0) 55%)," +
              "radial-gradient(70% 100% at 80% 0%, rgba(140,95,255,0.28), rgba(10,14,30,0) 55%)," +
              "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
          }}
        />
      </div>
    </div>
  );
}

export function About() {
  return (
    <main className="bcSiteRoot">
      <section className="bcHero">
        {/* Фон — только CSS, без ассетов */}
        <div
          className="bcHeroBg"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -80,
              background:
                "radial-gradient(70% 60% at 15% 20%, rgba(124,168,255,0.42), rgba(11,16,34,0) 60%)," +
                "radial-gradient(60% 55% at 85% 10%, rgba(162,120,255,0.32), rgba(11,16,34,0) 62%)," +
                "radial-gradient(70% 70% at 70% 85%, rgba(35,220,255,0.18), rgba(11,16,34,0) 58%)," +
                "linear-gradient(180deg, rgba(11,16,34,1), rgba(6,10,24,1))"
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(120% 80% at 50% 0%, rgba(0,0,0,0.25), rgba(0,0,0,0) 55%)"
            }}
          />
        </div>

        <header className="bcTop">
          <button type="button" className="bcBrand" onClick={() => nav("/")} aria-label="BlackCrown Home">
            <img alt="" src={Icons.crown} width="20" height="20" />
            <div style={{ fontWeight: 950 }}>BlackCrown</div>
          </button>

          <nav className="bcNav" aria-label="Навигация">
            <a className="bcLink" href="/">Главная</a>
            <a className="bcLink" href="/support">Поддержка</a>
            <a className="bcLink" href="/privacy">Privacy</a>
            <a className="bcLink" href="/terms">Terms</a>
          </nav>

          <div className="bcRight">
            <Button variant="secondary" onClick={() => nav("/store")}>Магазин</Button>
            <Button variant="primary" leftIconSrc={Icons.play} onClick={() => window.location.assign("/game/")}>
              Играть
            </Button>
          </div>
        </header>

        <div className="bcHeroGrid">
          <div className="bcHeroCopy glassStrong">
            <div className="bcKicker">О платформе</div>

            <h1 className="bcH1">BlackCrown</h1>

            <p className="bcLead">
              Премиум-платформа для наших игр: витрина, запуск, настройки и социальные модули. Сегодня — <b>EvoFish</b>,
              дальше — новые игры и события.
            </p>

            <div className="bcCtas">
              <Button variant="primary" leftIconSrc={Icons.play} onClick={() => window.location.assign("/game/")}>
                Запустить EvoFish
              </Button>
              <Button variant="secondary" onClick={() => window.location.assign("/lobby/")}>
                Открыть Lobby
              </Button>
              <Button variant="ghost" onClick={() => nav("/account")}>
                Аккаунт
              </Button>
            </div>
          </div>

          <div className="bcHeroPanel glassStrong">
            <div className="bcPanelTitle">Разделы</div>

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={() => nav("/store")}>
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Store</div>
                <div className="bcPanelP">Косметика и темы.</div>
              </div>
            </div>

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={() => nav("/account")}>
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Аккаунт</div>
                <div className="bcPanelP">Ник и профиль.</div>
              </div>
            </div>

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={() => nav("/support")}>
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Поддержка</div>
                <div className="bcPanelP">Контакты и помощь.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bcSection">
        <div className="bcSectionHead">
          <div className="bcSectionTitle">Roadmap</div>
          <div className="bcSectionSub">Куда идём: новые игры, события и модули платформы.</div>
        </div>
        <div className="bcCards">
          <Card item={ROADMAP[0]} />
          <Card item={ROADMAP[1]} />
          <Card item={ROADMAP[2]} />
        </div>
      </section>

      <section className="bcSection">
        <div className="bcSectionHead">
          <div className="bcSectionTitle">Changelog</div>
          <div className="bcSectionSub">Что уже сделано и зафиксировано в продукте.</div>
        </div>
        <div className="bcCards">
          <Card item={CHANGELOG[0]} />
          <Card item={CHANGELOG[1]} />
          <Card item={CHANGELOG[2]} />
        </div>
      </section>
    </main>
  );
}

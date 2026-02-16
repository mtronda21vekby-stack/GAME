import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons, HeroArt } from "@blackcrown/assets";

function nav(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

type Item = { title: string; desc: string; tag: string };

const ROADMAP: Item[] = [
  { title: "Новые игры", desc: "Следующие тайтлы в общем лаунчере на одном домене.", tag: "Платформа" },
  { title: "Онлайн функции", desc: "Комнаты, статусы, события и синхронизация прогресса.", tag: "Social" },
  { title: "Магазин", desc: "Косметика, темы и витрина контента.", tag: "Store" }
];

const CHANGELOG: Item[] = [
  { title: "Премиум UI", desc: "Стеклянные панели, адаптив и быстрые анимации.", tag: "UI" },
  { title: "Навигация", desc: "Страницы сайта без перезагрузки, приложения — отдельно.", tag: "Routing" },
  { title: "PWA", desc: "Manifest и иконки, корректные meta для iOS.", tag: "PWA" }
];

function Card(props: { item: Item }) {
  const it = props.item;

  return (
    <div className="glassStrong bc-motion" style={{ borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
          <div style={{ fontWeight: 980, fontSize: 16, letterSpacing: "-0.01em" }}>{it.title}</div>
          <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.78 }}>{it.tag}</div>
        </div>
        <div style={{ marginTop: 8, color: "rgba(255,255,255,0.74)", fontWeight: 750, lineHeight: 1.45 }}>
          {it.desc}
        </div>
      </div>

      <div style={{ padding: 12, paddingTop: 0 }}>
        <img
          alt=""
          src={HeroArt.cardWave}
          style={{
            width: "100%",
            height: 150,
            objectFit: "cover",
            borderRadius: 16,
            display: "block",
            opacity: 0.95
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
              Единый хаб для наших игр: витрина, запуск, настройки и социальные функции. Один домен, один стиль, быстрый UX.
            </p>

            <div className="bcCtas">
              <Button variant="secondary" onClick={() => nav("/account")}>Аккаунт</Button>
              <Button variant="ghost" onClick={() => nav("/support")}>Поддержка</Button>
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
          <div className="bcSectionSub">Направление развития платформы и ключевые модули.</div>
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
          <div className="bcSectionSub">Обновления и улучшения, которые уже сделаны.</div>
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

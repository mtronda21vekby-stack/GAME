import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons, HeroArt } from "@blackcrown/assets";

function nav(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

type Item = {
  title: string;
  tag: string;
  desc: string;
  art: string;
  priceLabel: string;
};

const ITEMS: Item[] = [
  {
    title: "Glasswave",
    tag: "skin",
    desc: "Стеклянный отблеск, мягкая аура и чистая типографика.",
    art: HeroArt.cardWave,
    priceLabel: "Скоро",
  },
  {
    title: "Chrome Mist",
    tag: "rare",
    desc: "Холодный хром, тонкие линии и аккуратный неон.",
    art: HeroArt.cardNeon,
    priceLabel: "Скоро",
  },
  {
    title: "Noir",
    tag: "common",
    desc: "Минимализм без лишнего. Контраст, воздух и скорость.",
    art: HeroArt.cardGrid,
    priceLabel: "Скоро",
  },
];

function StoreCard(props: { item: Item }) {
  const it = props.item;
  return (
    <div className="bcStoreCard" role="article" aria-label={it.title}>
      <img className="bcStoreMedia" alt="" src={it.art} />
      <div className="bcStoreBody">
        <div className="bcStoreTop">
          <div className="bcStoreTitle">{it.title}</div>
          <div className="bcStoreTag">{it.tag}</div>
        </div>
        <div className="bcStoreDesc">{it.desc}</div>
        <div className="bcStoreBar">
          <span className="bcPricePill">{it.priceLabel}</span>
          <Button variant="secondary">Открыть</Button>
        </div>
      </div>
    </div>
  );
}

export function Store() {
  return (
    <main className="bcSiteRoot">
      <section className="bcSection" style={{ paddingTop: 24 }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div
            className="glassStrong"
            style={{
              borderRadius: 22,
              padding: 18,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <img alt="" src={Icons.crown} width="20" height="20" />
              <div style={{ fontWeight: 950, fontSize: 16 }}>Магазин</div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="ghost" onClick={() => nav("/")}>
                Главная
              </Button>
              <Button variant="secondary" onClick={() => nav("/game/")}>
                Игры
              </Button>
              <Button variant="secondary" onClick={() => nav("/lobby/")}>
                Lobby
              </Button>
            </div>
          </div>

          <div style={{ height: 14 }} />

          <div
            className="glassStrong"
            style={{ borderRadius: 22, padding: 18, marginBottom: 12 }}
          >
            <div style={{ fontWeight: 980, fontSize: 18, letterSpacing: "-0.01em" }}>Preview</div>
            <div style={{ marginTop: 6, color: "rgba(255,255,255,0.74)", fontWeight: 750, lineHeight: 1.45 }}>
              Витрина скинов и тем. Покупки подключим после онлайна и аккаунтов.
            </div>
          </div>

          <div className="bcStoreGrid">
            {ITEMS.map((it) => (
              <StoreCard key={it.title} item={it} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

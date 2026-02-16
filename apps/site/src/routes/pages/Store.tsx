import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons, HeroArt } from "@blackcrown/assets";

function nav(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

function Card(props: { title: string; tag: string; desc: string }) {
  return (
    <div className="glassStrong bc-motion" style={{ borderRadius: 22, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={{ fontWeight: 950, fontSize: 18 }}>{props.title}</div>
        <div style={{ opacity: 0.8, fontWeight: 900, fontSize: 12 }}>{props.tag}</div>
      </div>
      <div style={{ marginTop: 8, opacity: 0.86, lineHeight: 1.45 }}>{props.desc}</div>
      <div style={{ marginTop: 12 }}>
        <img
          alt=""
          src={HeroArt.cardWave}
          style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 16, display: "block", opacity: 0.95 }}
        />
      </div>
      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="secondary">Скоро</Button>
      </div>
    </div>
  );
}

export function Store() {
  return (
    <main className="bcSiteRoot">
      <section className="bcSection" style={{ paddingTop: 24 }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div className="glassStrong" style={{ borderRadius: 22, padding: 18, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <img alt="" src={Icons.crown} width="20" height="20" />
              <div style={{ fontWeight: 950, fontSize: 16 }}>Магазин</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="ghost" onClick={() => nav("/")}>Главная</Button>
              <Button variant="secondary" onClick={() => nav("/game/")}>Игры</Button>
            </div>
          </div>

          <div style={{ height: 14 }} />

          <div className="bcCards">
            <Card title="Glasswave" tag="skin" desc="Стеклянный отблеск и мягкий спектр." />
            <Card title="Chrome Mist" tag="rare" desc="Холодный хром и тонкие линии." />
            <Card title="Noir" tag="common" desc="Чистый минимализм без шума." />
          </div>
        </div>
      </section>
    </main>
  );
}

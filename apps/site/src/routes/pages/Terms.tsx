import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons, HeroArt } from "@blackcrown/assets";

function nav(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

function navExternal(path: string) {
  window.location.assign(path);
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

function Card(props: { title: string; children: React.ReactNode }) {
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
      <div style={{ fontWeight: 980, fontSize: 16, letterSpacing: "-0.01em" }}>{props.title}</div>
      <div style={{ marginTop: 10, opacity: 0.86, lineHeight: 1.65, fontWeight: 850 }}>{props.children}</div>
    </div>
  );
}

export function Terms() {
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
            <Button variant="primary" leftIconSrc={Icons.play} onClick={() => navExternal("/game/")}>
              Играть
            </Button>
          </div>
        </header>

        <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 14px 14px" }}>
          <div className="glassStrong" style={{ borderRadius: 22, padding: 18 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Pill>Terms</Pill>
              <Pill>Platform</Pill>
              <Pill>Games</Pill>
              <Pill>Services</Pill>
            </div>

            <h1 className="bcH1" style={{ marginTop: 12 }}>
              Terms of Service
            </h1>

            <p className="bcLead" style={{ marginTop: 10 }}>
              Используя BlackCrown, ты соглашаешься с правилами платформы и поведения в сервисах.
            </p>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="secondary" onClick={() => nav("/privacy")}>
                Privacy
              </Button>
              <Button variant="ghost" onClick={() => nav("/support")}>
                Поддержка
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bcSection" style={{ paddingTop: 10 }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 14px" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <Card title="Доступ и использование">
              Платформа предоставляет доступ к играм и сервисам на одном домене. Мы можем обновлять функциональность и дизайн,
              улучшая качество и безопасность.
            </Card>

            <Card title="Поведение пользователя">
              Запрещены действия, которые мешают другим пользователям: спам, оскорбления, попытки взлома, эксплуатация уязвимостей,
              распространение вредоносных ссылок и контента, нарушающего закон.
            </Card>

            <Card title="Игровой контент и сервисы">
              Игры, лобби и AI-Coach являются частями экосистемы. Если сервисы используют сторонние платформы (например Telegram),
              применяются правила этих платформ.
            </Card>

            <Card title="Ответственность">
              Мы стремимся поддерживать стабильность и качество, но не гарантируем непрерывную работу во всех условиях устройств,
              сетей и браузеров. При проблемах используй страницу поддержки.
            </Card>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", opacity: 0.78 }}>
              <a className="bcLink" href="/privacy">
                Privacy
              </a>
              <a className="bcLink" href="/support">
                Поддержка
              </a>
              <a className="bcLink" href="/about">
                О проекте
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

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

export function Privacy() {
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
              <Pill>Privacy</Pill>
              <Pill>Local storage</Pill>
              <Pill>Telegram</Pill>
            </div>

            <h1 className="bcH1" style={{ marginTop: 12 }}>
              Privacy Policy
            </h1>

            <p className="bcLead" style={{ marginTop: 10 }}>
              Мы минимизируем сбор данных. Профиль и настройки по умолчанию хранятся локально в браузере.
            </p>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="secondary" onClick={() => nav("/support")}>
                Поддержка
              </Button>
              <Button variant="ghost" onClick={() => nav("/terms")}>
                Terms
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bcSection" style={{ paddingTop: 10 }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 14px" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <Card title="Что мы храним локально">
              Мы сохраняем в браузере на устройстве: никнейм, статус, выбранный аватар, настройки интерфейса и некоторые параметры
              контейнера игры. Эти данные нужны, чтобы сайт и сервисы работали одинаково на всех страницах.
            </Card>

            <Card title="Telegram">
              Если ты переходишь к AI-Coach или в поддержку через Telegram, данные обрабатываются по правилам Telegram. Мы не
              получаем доступ к твоим сообщениям в Telegram вне контекста бота и его сценариев.
            </Card>

            <Card title="Cookies и аналитика">
              Сайт ориентирован на быстрый UX и минимальный сбор данных. Если в будущем появится аналитика, она будет оформлена
              в соответствии с этой политикой и не будет вмешиваться в игровой процесс.
            </Card>

            <Card title="Удаление данных">
              Чтобы удалить локальные данные профиля и настроек — открой страницу аккаунта и нажми «Очистить» и/или «Сбросить всё».
              Также можно очистить данные сайта в настройках браузера.
            </Card>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", opacity: 0.78 }}>
              <a className="bcLink" href="/terms">
                Terms
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

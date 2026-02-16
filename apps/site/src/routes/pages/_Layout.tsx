import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import { userStorage } from "@blackcrown/core";

function navSite(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

function navExternal(path: string) {
  window.location.assign(path);
}

function getName() {
  return userStorage.getString("nickname", "") || "Игрок";
}

export function TopBar(props: { onAccount?: () => void }) {
  const name = getName();

  return (
    <header className="bcTop">
      <button type="button" className="bcBrand" onClick={() => navSite("/")} aria-label="BlackCrown">
        <img alt="" src={Icons.crown} width="20" height="20" />
        <div style={{ fontWeight: 950 }}>BlackCrown</div>
      </button>

      <nav className="bcNav" aria-label="Навигация">
        <a className="bcLink" href="/about">О проекте</a>
        <a className="bcLink" href="/support">Поддержка</a>
        <a className="bcLink" href="/privacy">Privacy</a>
        <a className="bcLink" href="/terms">Terms</a>
      </nav>

      <div className="bcRight">
        <button
          type="button"
          className="bcAccountPill"
          onClick={() => (props.onAccount ? props.onAccount() : navSite("/account"))}
          aria-label="Аккаунт"
        >
          Аккаунт: {name}
        </button>

        <Button variant="primary" leftIconSrc={Icons.play} onClick={() => navExternal("/game/")}>
          Играть
        </Button>
      </div>
    </header>
  );
}

export function PageShell(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="bcSiteRoot">
      <section className="bcHero" style={{ minHeight: "calc(var(--app-vh, 100vh))" }}>
        <div className="bcHeroBg" aria-hidden="true" />
        <TopBar />

        <div style={{ maxWidth: 980, margin: "18px auto 0", padding: "0 14px" }}>
          <div className="glassStrong" style={{ borderRadius: 24, padding: 18 }}>
            <div className="bcKicker">BlackCrown</div>
            <h1 className="bcH1" style={{ marginTop: 12 }}>{props.title}</h1>
            {props.subtitle ? <p className="bcLead">{props.subtitle}</p> : null}
          </div>

          <div style={{ marginTop: 14 }}>{props.children}</div>
        </div>
      </section>
    </main>
  );
}

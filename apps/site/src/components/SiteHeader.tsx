import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import { userStorage } from "@blackcrown/core";

type ActiveKey = "home" | "about" | "store" | "support" | "privacy" | "terms" | "account";

function scrollToTop() {
  const scroller = document.querySelector(".bcScroll") as HTMLElement | null;
  if (scroller) {
    scroller.scrollTo({ top: 0, behavior: "auto" });
    return;
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}

function navSite(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  scrollToTop();
}

function navExternal(path: string) {
  window.location.assign(path);
}

function getName() {
  return userStorage.getString("nickname", "") || "Игрок";
}

function NavLink(props: { href: string; label: string; active?: boolean }) {
  return (
    <a
      className="bcLink"
      href={props.href}
      aria-current={props.active ? "page" : undefined}
      style={
        props.active
          ? {
              textDecoration: "none",
              borderBottom: "1px solid rgba(255,255,255,0.28)",
              paddingBottom: 2,
            }
          : undefined
      }
    >
      {props.label}
    </a>
  );
}

export function SiteHeader(props: { active?: ActiveKey }) {
  const name = getName();
  const a = props.active;

  return (
    <header className="bcTop">
      <button type="button" className="bcBrand" onClick={() => navSite("/")} aria-label="BlackCrown Home">
        <img alt="" src={Icons.crown} width="20" height="20" />
        <div style={{ fontWeight: 950 }}>BlackCrown</div>
      </button>

      <nav className="bcNav" aria-label="Навигация">
        <NavLink href="/about" label="О проекте" active={a === "about"} />
        <NavLink href="/store" label="Магазин" active={a === "store"} />
        <NavLink href="/support" label="Поддержка" active={a === "support"} />
        <NavLink href="/privacy" label="Privacy" active={a === "privacy"} />
        <NavLink href="/terms" label="Terms" active={a === "terms"} />
      </nav>

      <div className="bcRight">
        <button type="button" className="bcAccountPill" onClick={() => navSite("/account")} aria-label="Аккаунт">
          Аккаунт: {name}
        </button>

        <Button variant="secondary" onClick={() => navExternal("/lobby/")}>
          Lobby
        </Button>

        <Button variant="primary" leftIconSrc={Icons.play} onClick={() => navExternal("/game/")}>
          Играть
        </Button>
      </div>
    </header>
  );
}

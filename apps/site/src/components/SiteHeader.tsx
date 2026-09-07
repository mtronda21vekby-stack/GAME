import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import { userStorage } from "@blackcrown/core";
import { nav as navSite, navExternal } from "../lib/nav";
import type { SitePath } from "../routes/routeMetadata";

type ActiveKey = "home" | "about" | "store" | "support" | "privacy" | "terms" | "account" | "telegram";
type SiteHeaderProps = {
  active?: ActiveKey;
  showLobby?: boolean;
  showStoreButton?: boolean;
  showAccountPill?: boolean;
};

function getName() {
  return userStorage.getString("nickname", "") || "Игрок";
}

function NavLink(props: { href: SitePath; label: string; active?: boolean }) {
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

export function SiteHeader(props: SiteHeaderProps) {
  const name = getName();
  const a = props.active;
  const showLobby = props.showLobby ?? true;
  const showStoreButton = props.showStoreButton ?? false;
  const showAccountPill = props.showAccountPill ?? true;

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
        <NavLink href="/account/telegram" label="Telegram" active={a === "telegram"} />
        <NavLink href="/privacy" label="Privacy" active={a === "privacy"} />
        <NavLink href="/terms" label="Terms" active={a === "terms"} />
      </nav>

      <div className="bcRight">
        {showAccountPill ? (
          <button
            type="button"
            className="bcAccountPill"
            onClick={() => navSite("/account")}
            aria-label="Аккаунт"
            aria-current={a === "account" || a === "telegram" ? "page" : undefined}
          >
            Аккаунт: {name}
          </button>
        ) : null}

        {showStoreButton ? (
          <Button variant="secondary" onClick={() => navSite("/store")}>
            Store
          </Button>
        ) : null}

        {showLobby ? (
          <Button variant="secondary" onClick={() => navExternal("/lobby/")}>
            Lobby
          </Button>
        ) : null}

        <Button variant="primary" leftIconSrc={Icons.play} onClick={() => navExternal("/games/")}>
          Играть
        </Button>
      </div>
    </header>
  );
}

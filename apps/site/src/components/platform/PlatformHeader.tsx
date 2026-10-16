import React from "react";

export type PlatformHeaderProps = {
  active?: "games" | "store" | "about" | "account";
  children?: React.ReactNode;
};

const links = [
  { key: "games", href: "/games/", label: "Игры" },
  { key: "store", href: "/store", label: "Магазин" },
  { key: "about", href: "/about", label: "О проекте" },
  { key: "account", href: "/account", label: "Профиль" },
] as const;

export function PlatformHeader({ active, children }: PlatformHeaderProps) {
  const path = window.location.pathname;
  const selected = active ?? (path.startsWith("/account") ? "account" : path === "/store" || path === "/cart" || path.startsWith("/checkout") ? "store" : path === "/about" ? "about" : path === "/games" || path === "/games/" ? "games" : undefined);
  return (
    <header className="platHeader">
      <a className="platBrand" href="/" aria-label="BLACKCROWN — главная">
        <svg viewBox="0 0 36 30" width="32" height="28" fill="none" aria-hidden="true"><path d="M3 7 10 13 18 2 26 13 33 7 29 24H7L3 7Z" stroke="currentColor" strokeWidth="1.7"/><path d="M8 28H28" stroke="currentColor" strokeWidth="1.7"/></svg>
        <span>BLACKCROWN<small>INDEPENDENT WORLDS</small></span>
      </a>
      <nav className="platNav" aria-label="Основная навигация">
        {links.map(link => <a key={link.key} href={link.href} aria-current={selected === link.key ? "page" : undefined}>{link.label}{link.key === "account" ? <span aria-hidden="true"> ↗</span> : null}</a>)}
      </nav>
      {children ? <div className="platHeaderActions">{children}</div> : null}
    </header>
  );
}

import React from "react";
import { Icons } from "@blackcrown/assets";

const productLinks = [
  { href: "/game/", label: "EvoFish" },
  { href: "/games/crown-front/", label: "CROWN//FRONT" },
  { href: "/lobby/", label: "Lobby" },
  { href: "/store", label: "Store" },
];

const companyLinks = [
  { href: "/about", label: "О платформе" },
  { href: "/support", label: "Поддержка" },
  { href: "/account", label: "Аккаунт" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

function LinkGroup(props: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <div className="bcFooter__group">
      <div className="bcFooter__label">{props.title}</div>
      <nav aria-label={props.title}>
        {props.links.map((link) => (
          <a key={link.href} href={link.href}>
            <span>{link.label}</span>
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bcFooter">
      <div className="bcFooter__frame">
        <div className="bcFooter__brand">
          <a className="bcFooter__mark" href="/" aria-label="BlackCrown — на главную">
            <span className="bcFooter__logo">
              <img src={Icons.crown} width="32" height="32" alt="" />
            </span>
            <span>
              <strong>BlackCrown</strong>
              <small>INTERACTIVE WORLDS</small>
            </span>
          </a>

          <p>
            Игры, социальные функции и сервисы для игроков — в одной цельной веб-платформе.
          </p>

          <div className="bcFooter__signal">
            <span aria-hidden="true" />
            <span>WEB PLATFORM / BUILD ACTIVE</span>
          </div>
        </div>

        <div className="bcFooter__links">
          <LinkGroup title="Миры" links={productLinks} />
          <LinkGroup title="Платформа" links={companyLinks} />
          <LinkGroup title="Правовая информация" links={legalLinks} />
        </div>

        <div className="bcFooter__bottom">
          <span>© {year} BLACKCROWN</span>
          <span>DESIGNED FOR WEBGL / MOBILE / DESKTOP</span>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;

import React from "react";
import { Icons } from "@blackcrown/assets";

const gameLinks = [
  { href: "/games/ballcrown/", label: "Ballcrown" },
  { href: "/game/?mode=next", label: "EvoFish Next" },
  { href: "/games/quiet-valley/", label: "Quiet Valley" },
  { href: "/games/crown-front/", label: "CROWN//FRONT · закрытая альфа" },
];

const platformLinks = [
  { href: "/games/", label: "Все игры" },
  { href: "/store", label: "Магазин" },
  { href: "/about", label: "О проекте" },
  { href: "/account", label: "Профиль" },
];

function FooterLinks({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <div className="platFooterGroup">
      <h2>{title}</h2>
      <nav aria-label={title}>
        {links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="platFooter">
      <div className="platContainer">
        <div className="platFooterMain">
          <div className="platFooterBrand">
            <a className="platFooterLogo" href="/" aria-label="BLACKCROWN — на главную">
              <img src={Icons.crown} width="28" height="28" alt="" />
              <span>BLACKCROWN</span>
            </a>
            <p>Несколько игр.<br />Свой мир для каждого.</p>
          </div>
          <FooterLinks title="Игры" links={gameLinks} />
          <FooterLinks title="Платформа" links={platformLinks} />
          <div className="platFooterHelp">
            <span className="platEyebrow">Помощь</span>
            <p>Вопрос по игре<br />или платформе?</p>
            <a href="/support">Поддержка <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className="platFooterBottom">
          <span>© {new Date().getFullYear()} BLACKCROWN</span>
          <nav aria-label="Правовая информация">
            <a href="/privacy">Конфиденциальность</a>
            <a href="/terms">Условия использования</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;

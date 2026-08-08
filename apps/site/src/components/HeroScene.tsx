import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import { BLACKCROWN_HERO_CROWN } from "../assets/blackcrownHeroCrown";
import "../styles/hero-premium-v1.css";

export type HeroStatusTone = "cyan" | "orange" | "green";

export type HeroStatus = {
  label: string;
  value: string;
  tone?: HeroStatusTone;
};

export type HeroSceneProps = {
  playerName: string;
  onNavigate: (path: string) => void;
  onPlay: () => void;
  onExploreWorlds: () => void;
  statuses?: HeroStatus[];
};

function HeroNavLink({ href, onNavigate, children }: { href: string; onNavigate: (path: string) => void; children: React.ReactNode }) {
  return (
    <a
      className="bcLink bcHotLink"
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(href);
      }}
    >
      {children}
    </a>
  );
}

const DEFAULT_STATUSES: HeroStatus[] = [
  { label: "EVOFISH", value: "LIVE", tone: "green" },
  { label: "CROWN//FRONT", value: "ALPHA", tone: "orange" },
  { label: "BLACKCROWN NETWORK", value: "ONLINE", tone: "cyan" },
];

export default function HeroScene({
  playerName,
  onNavigate,
  onPlay,
  onExploreWorlds,
  statuses = DEFAULT_STATUSES,
}: HeroSceneProps) {
  const network = statuses.find((status) => status.label === "BLACKCROWN NETWORK")?.value ?? "ONLINE";

  return (
    <section className="bcHero bcNexusHero bcV3Hero bcHeroPremium" aria-labelledby="bc-v3-hero-title">
      <div className="bcHeroBg bcNexusHero__background bcHeroPremium__background" aria-hidden="true">
        <div
          className="bcNexusHero__focus bcHeroPremium__depth bcHeroPremium__depth--far"
          data-bc-parallax
          data-bc-parallax-depth="12"
          data-bc-parallax-pointer="3"
          data-bc-parallax-scale="0.004"
        />
        <div
          className="bcV3Hero__light bcV3Hero__light--cyan bcHeroPremium__depth bcHeroPremium__depth--cyan"
          data-bc-parallax
          data-bc-parallax-depth="30"
          data-bc-parallax-pointer="8"
          data-bc-parallax-scale="0.008"
        />
        <div
          className="bcV3Hero__light bcV3Hero__light--violet bcHeroPremium__depth bcHeroPremium__depth--violet"
          data-bc-parallax
          data-bc-parallax-depth="24"
          data-bc-parallax-pointer="-7"
          data-bc-parallax-scale="0.006"
        />
        <div className="bcHeroPremium__city" />
        <div className="bcHeroVignette" />
      </div>

      <header className="bcTop bcNexusTop bcV3Hero__top bcHeroPremium__top">
        <button type="button" className="bcBrand bcHot" onClick={() => onNavigate("/")} aria-label="BlackCrown — главная">
          <span className="bcBrand__mark"><img alt="" src={Icons.crown} width="24" height="24" /></span>
          <span className="bcBrand__copy"><strong>BLACKCROWN</strong><small>INTERACTIVE WORLDS</small></span>
        </button>

        <nav className="bcNav" aria-label="Основная навигация">
          <button type="button" className="bcLink bcHotLink" onClick={onExploreWorlds}>Миры</button>
          <HeroNavLink href="/about" onNavigate={onNavigate}>Платформа</HeroNavLink>
          <HeroNavLink href="/store" onNavigate={onNavigate}>Store</HeroNavLink>
          <HeroNavLink href="/support" onNavigate={onNavigate}>Поддержка</HeroNavLink>
        </nav>

        <div className="bcRight bcHeroPremium__right">
          <button type="button" className="bcAccountPill bcHot" onClick={() => onNavigate("/account")} aria-label="Открыть аккаунт">
            <span className="bcAccountPill__dot" aria-hidden="true" /><span>{playerName}</span>
          </button>
          <Button variant="primary" leftIconSrc={Icons.play} onClick={onPlay}>Играть</Button>
        </div>
      </header>

      <div className="bcNexusHero__layout bcV3Hero__layout bcHeroPremium__layout">
        <div
          className="bcNexusHero__copy bcV3Hero__copy bcHeroPremium__copy"
          data-bc-parallax
          data-bc-parallax-depth="7"
          data-bc-parallax-pointer="2"
          data-bc-parallax-rotate="0.08"
        >
          <div className="bcNexusHero__eyebrow bcHeroPremium__eyebrow">
            <span aria-hidden="true" />
            <strong>BLACKCROWN NETWORK</strong>
            <small>{network}</small>
          </div>

          <h1 id="bc-v3-hero-title" className="bcNexusHero__title bcV3Hero__title bcHeroPremium__title">BLACKCROWN</h1>
          <p className="bcNexusHero__tagline bcV3Hero__tagline bcHeroPremium__tagline">Одна корона. Несколько миров.</p>
          <p className="bcNexusHero__lead bcV3Hero__lead bcHeroPremium__lead">Профиль, прогресс и игры BlackCrown — в одной системе.</p>

          <div className="bcNexusHero__actions bcV3Hero__actions bcHeroPremium__actions">
            <Button variant="primary" leftIconSrc={Icons.play} onClick={onPlay}>Запустить BlackCrown</Button>
            <Button variant="secondary" onClick={onExploreWorlds}>Смотреть миры</Button>
          </div>
        </div>

        <div
          className="bcNexusHero__core bcV3Hero__core bcHeroPremium__art"
          data-bc-parallax
          data-bc-parallax-depth="26"
          data-bc-parallax-pointer="9"
          data-bc-parallax-rotate="0.24"
          data-bc-parallax-scale="0.014"
          aria-hidden="true"
        >
          <div className="bcHeroPremium__artGlow" />
          <img className="bcHeroPremium__artImage" src={BLACKCROWN_HERO_CROWN} alt="" />
          <div className="bcHeroPremium__artFloor" />
        </div>
      </div>

      <button type="button" className="bcHeroPremium__scroll" onClick={onExploreWorlds} aria-label="Прокрутить к мирам">
        <span>SCROLL</span>
        <i aria-hidden="true" />
      </button>
    </section>
  );
}

import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import BrandCore from "./BrandCore";

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

function HeroStatusItem({ label, value, tone = "cyan" }: HeroStatus) {
  return (
    <div className="bcNexusStatus__item" data-tone={tone}>
      <span aria-hidden="true" />
      <strong>{label}</strong>
      <small>{value}</small>
    </div>
  );
}

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
  return (
    <section className="bcHero bcNexusHero bcV3Hero" aria-labelledby="bc-v3-hero-title">
      <div className="bcHeroBg bcNexusHero__background" aria-hidden="true">
        <div className="bcNexusHero__focus" />
        <div className="bcV3Hero__light bcV3Hero__light--cyan" />
        <div className="bcV3Hero__light bcV3Hero__light--violet" />
        <div className="bcV3Hero__grid" />
        <div className="bcHeroVignette" />
        <div className="bcHeroNoise" />
      </div>

      <header className="bcTop bcNexusTop bcV3Hero__top">
        <button
          type="button"
          className="bcBrand bcHot"
          onClick={() => onNavigate("/")}
          aria-label="BlackCrown — главная"
        >
          <span className="bcBrand__mark">
            <img alt="" src={Icons.crown} width="22" height="22" />
          </span>
          <span className="bcBrand__copy">
            <strong>BlackCrown</strong>
            <small>INTERACTIVE WORLDS</small>
          </span>
        </button>

        <nav className="bcNav" aria-label="Основная навигация">
          <button type="button" className="bcLink bcHotLink" onClick={onExploreWorlds}>
            Миры
          </button>
          <HeroNavLink href="/about" onNavigate={onNavigate}>
            Платформа
          </HeroNavLink>
          <HeroNavLink href="/store" onNavigate={onNavigate}>
            Store
          </HeroNavLink>
          <HeroNavLink href="/support" onNavigate={onNavigate}>
            Поддержка
          </HeroNavLink>
        </nav>

        <div className="bcRight">
          <button
            type="button"
            className="bcAccountPill bcHot"
            onClick={() => onNavigate("/account")}
            aria-label="Открыть аккаунт"
          >
            <span className="bcAccountPill__dot" aria-hidden="true" />
            <span>{playerName}</span>
          </button>
          <Button variant="primary" leftIconSrc={Icons.play} onClick={onPlay}>
            Играть
          </Button>
        </div>
      </header>

      <div className="bcNexusHero__layout bcV3Hero__layout">
        <div className="bcNexusHero__copy bcV3Hero__copy">
          <div className="bcNexusHero__eyebrow">
            <span aria-hidden="true" />
            <strong>BLACKCROWN NETWORK</strong>
            <small>ONLINE</small>
          </div>

          <h1 id="bc-v3-hero-title" className="bcNexusHero__title bcV3Hero__title">
            <span>BLACK</span>
            <span>CROWN</span>
          </h1>

          <p className="bcNexusHero__tagline bcV3Hero__tagline">Одна корона. Несколько миров.</p>
          <p className="bcNexusHero__lead bcV3Hero__lead">
            Единая игровая экосистема для профиля, прогресса, коллекции и новых миров BlackCrown.
          </p>

          <div className="bcNexusHero__actions bcV3Hero__actions">
            <Button variant="primary" onClick={() => onNavigate("/account")}>
              Войти в BlackCrown
            </Button>
            <Button variant="secondary" onClick={onExploreWorlds}>
              Исследовать миры
            </Button>
          </div>

          <div className="bcNexusHero__signature">
            <span>BC // V3 EXPERIENCE</span>
            <span>WEBGL · MOBILE · DESKTOP</span>
          </div>
        </div>

        <div className="bcNexusHero__core bcV3Hero__core">
          <BrandCore />
          <div className="bcV3Hero__reactorFloor" aria-hidden="true" />
        </div>
      </div>

      <div className="bcNexusStatus bcV3Hero__status" aria-label="Статус экосистемы">
        {statuses.map((status) => (
          <HeroStatusItem key={`${status.label}-${status.value}`} {...status} />
        ))}
      </div>
    </section>
  );
}

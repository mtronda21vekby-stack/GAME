import React from "react";
import { Icons } from "@blackcrown/assets";
import { BLACKCROWN_HERO_CROWN } from "../assets/blackcrownHeroCrown";
import "../styles/hero-concept-v2.css";

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

const DEFAULT_STATUSES: HeroStatus[] = [
  { label: "EVOFISH", value: "LIVE", tone: "green" },
  { label: "CROWN//FRONT", value: "ALPHA", tone: "orange" },
  { label: "BLACKCROWN NETWORK", value: "ONLINE", tone: "cyan" },
];

export default function HeroScene({
  onNavigate,
  onPlay,
  onExploreWorlds,
  statuses = DEFAULT_STATUSES,
}: HeroSceneProps) {
  const network = statuses.find((status) => status.label === "BLACKCROWN NETWORK")?.value ?? "ONLINE";

  return (
    <section className="bcHero bcV3Hero bcHeroConcept" aria-labelledby="bc-hero-concept-title">
      <div className="bcHeroConcept__background" aria-hidden="true">
        <div
          className="bcHeroConcept__ambient bcHeroConcept__ambient--cyan"
          data-bc-parallax
          data-bc-parallax-depth="22"
          data-bc-parallax-pointer="5"
          data-bc-parallax-scale="0.006"
        />
        <div
          className="bcHeroConcept__ambient bcHeroConcept__ambient--violet"
          data-bc-parallax
          data-bc-parallax-depth="18"
          data-bc-parallax-pointer="-5"
          data-bc-parallax-scale="0.005"
        />
        <div className="bcHeroConcept__city" />
        <div className="bcHeroConcept__vignette" />
      </div>

      <header className="bcHeroConcept__bar">
        <button
          type="button"
          className="bcHeroConcept__brand"
          onClick={() => onNavigate("/")}
          aria-label="BlackCrown — главная"
        >
          <span className="bcHeroConcept__brandMark">
            <img src={Icons.crown} alt="" width="30" height="30" />
          </span>
          <span className="bcHeroConcept__brandName">BLACKCROWN</span>
        </button>

        <button type="button" className="bcHeroConcept__playTop" onClick={onPlay}>
          <span>Играть</span>
          <i aria-hidden="true">›</i>
        </button>
      </header>

      <div
        className="bcHeroConcept__copy"
        data-bc-parallax
        data-bc-parallax-depth="7"
        data-bc-parallax-pointer="1.4"
        data-bc-parallax-scale="0.002"
      >
        <div className="bcHeroConcept__network">
          <i aria-hidden="true" />
          <span>BLACKCROWN NETWORK</span>
          <strong>{network}</strong>
        </div>

        <h1 id="bc-hero-concept-title" className="bcHeroConcept__title">BLACKCROWN</h1>

        <p className="bcHeroConcept__tagline">
          Одна <span>корона.</span> Несколько <strong>миров.</strong>
        </p>

        <p className="bcHeroConcept__lead">Экосистема игр, миров и сервисов нового поколения.</p>

        <div className="bcHeroConcept__actions">
          <button type="button" className="bcHeroConcept__cta bcHeroConcept__cta--primary" onClick={onPlay}>
            <i aria-hidden="true" />
            <span>Запустить BlackCrown</span>
          </button>
          <button
            type="button"
            className="bcHeroConcept__cta bcHeroConcept__cta--secondary"
            onClick={onExploreWorlds}
          >
            Смотреть миры
          </button>
        </div>
      </div>

      <div
        className="bcHeroConcept__art"
        data-bc-parallax
        data-bc-parallax-depth="31"
        data-bc-parallax-pointer="7"
        data-bc-parallax-rotate="0.18"
        data-bc-parallax-scale="0.012"
        aria-hidden="true"
      >
        <div className="bcHeroConcept__artAura" />
        <img className="bcHeroConcept__artImage" src={BLACKCROWN_HERO_CROWN} alt="" />
        <div className="bcHeroConcept__artTopMask" />
      </div>

      <button
        type="button"
        className="bcHeroConcept__scroll"
        onClick={onExploreWorlds}
        aria-label="Перейти к мирам BlackCrown"
      >
        <i aria-hidden="true" />
        <span>SCROLL</span>
      </button>
    </section>
  );
}

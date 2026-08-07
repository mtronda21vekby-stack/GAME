import React from "react";
import GlassSurface from "./GlassSurface";

export type PlatformV3Props = {
  onNavigate: (path: string) => void;
  onOpenLobby: () => void;
};

type PlatformModule = {
  code: string;
  title: string;
  description: string;
  status: string;
  tone: "cyan" | "violet" | "green";
  action: () => void;
};

export function PlatformV3({ onNavigate, onOpenLobby }: PlatformV3Props) {
  const modules: PlatformModule[] = [
    {
      code: "01",
      title: "Профиль",
      description: "Единая идентичность, прогресс и настройки игрока.",
      status: "SYNCED",
      tone: "green",
      action: () => onNavigate("/account"),
    },
    {
      code: "02",
      title: "Store",
      description: "Предметы, избранное и коллекция BlackCrown.",
      status: "ACTIVE",
      tone: "violet",
      action: () => onNavigate("/store"),
    },
    {
      code: "03",
      title: "Lobby",
      description: "Комната, ready-state и командный канал.",
      status: "ONLINE",
      tone: "cyan",
      action: onOpenLobby,
    },
  ];

  return (
    <section className="bcPlatformV3" aria-labelledby="bc-platform-v3-title">
      <GlassSurface className="bcPlatformV3__shell" material="metal" tone="cyan">
        <div
          className="bcPlatformV3__visual"
          aria-hidden="true"
          data-bc-parallax
          data-bc-parallax-depth="12"
          data-bc-parallax-pointer="4"
          data-bc-parallax-rotate="0.24"
          data-bc-parallax-scale="0.005"
        >
          <img src="/assets/site/neon/network.svg" alt="" loading="lazy" />
          <div className="bcPlatformV3__orbit bcPlatformV3__orbit--outer" />
          <div className="bcPlatformV3__orbit bcPlatformV3__orbit--inner" />
          <div className="bcPlatformV3__pulse" />
          <span>NETWORK / STABLE</span>
        </div>

        <div
          className="bcPlatformV3__copy"
          data-bc-parallax
          data-bc-parallax-depth="4"
          data-bc-parallax-pointer="1"
          data-bc-parallax-rotate="0.08"
        >
          <div className="bcPlatformV3__eyebrow">BLACKCROWN PLATFORM / CORE SERVICES</div>
          <h2 id="bc-platform-v3-title">Один профиль для всей экосистемы.</h2>
          <p>
            Игры, коллекция, магазин и лобби работают как единая система. Пользователь не теряет контекст при переходе между мирами.
          </p>

          <div className="bcPlatformV3__modules">
            {modules.map((module) => (
              <button
                key={module.code}
                type="button"
                className="bcPlatformV3__module"
                data-tone={module.tone}
                onClick={module.action}
              >
                <span className="bcPlatformV3__code">{module.code}</span>
                <span className="bcPlatformV3__moduleCopy">
                  <strong>{module.title}</strong>
                  <small>{module.description}</small>
                </span>
                <span className="bcPlatformV3__status">{module.status}</span>
                <span className="bcPlatformV3__arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </div>
      </GlassSurface>
    </section>
  );
}

export default PlatformV3;

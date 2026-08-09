import React from "react";
import "../styles/cinematic-experience-v1.css";

type WorldStatus = { status: string };

export type CinematicExperienceProps = {
  evofish: WorldStatus;
  crownFront: WorldStatus;
  network: WorldStatus;
  statusSource: string;
  onNavigate: (path: string) => void;
  onPlay: () => void;
  onOpenCrownFront: () => void;
  onOpenLobby: () => void;
};

function phaseOpacity(progress: number, center: number, width = 0.2) {
  const d = Math.abs(progress - center);
  return Math.max(0, Math.min(1, 1 - d / width));
}

export function CinematicExperience({
  evofish,
  crownFront,
  network,
  statusSource,
  onNavigate,
  onPlay,
  onOpenCrownFront,
  onOpenLobby,
}: CinematicExperienceProps) {
  const rootRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = root.getBoundingClientRect();
      const travel = Math.max(1, root.offsetHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / travel));
      const phase = Math.min(4, Math.max(0, Math.floor(progress * 5)));

      root.dataset.phase = String(phase);
      root.style.setProperty("--cx-p", progress.toFixed(4));
      root.style.setProperty("--cx-hero", phaseOpacity(progress, 0.06, 0.2).toFixed(4));
      root.style.setProperty("--cx-gate", phaseOpacity(progress, 0.26, 0.18).toFixed(4));
      root.style.setProperty("--cx-ocean", phaseOpacity(progress, 0.48, 0.23).toFixed(4));
      root.style.setProperty("--cx-reactor", phaseOpacity(progress, 0.70, 0.23).toFixed(4));
      root.style.setProperty("--cx-network", phaseOpacity(progress, 0.92, 0.2).toFixed(4));
      root.style.setProperty("--cx-crown-y", `${Math.round(progress * -190)}px`);
      root.style.setProperty("--cx-crown-scale", `${1 + progress * 1.8}`);
      root.style.setProperty("--cx-crown-rot", `${progress * 28 - 8}deg`);
      root.style.setProperty("--cx-ocean-y", `${Math.round((progress - 0.48) * -150)}px`);
      root.style.setProperty("--cx-reactor-y", `${Math.round((progress - 0.70) * -130)}px`);
    };

    const request = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={rootRef} id="worlds" className="bcCinematicExperience" data-phase="0" aria-label="BlackCrown cinematic experience">
      <div className="bcCinematicExperience__sticky">
        <div className="bcCinematicExperience__grain" aria-hidden="true" />
        <div className="bcCinematicExperience__scan" aria-hidden="true" />

        <div className="bcCinematicExperience__layer bcCinematicExperience__layer--hero" aria-hidden="true">
          <div className="bcCinematicExperience__heroGlow" />
          <img className="bcCinematicExperience__crown" src="/art/hero-crown.jpg" alt="" />
        </div>

        <div className="bcCinematicExperience__layer bcCinematicExperience__layer--gate" aria-hidden="true">
          <div className="bcCinematicExperience__gateRing bcCinematicExperience__gateRing--a" />
          <div className="bcCinematicExperience__gateRing bcCinematicExperience__gateRing--b" />
          <div className="bcCinematicExperience__gateCore" />
        </div>

        <div className="bcCinematicExperience__layer bcCinematicExperience__layer--ocean" aria-hidden="true">
          <img src="/art/evofish-world.jpg" alt="" />
          <div className="bcCinematicExperience__oceanLight" />
        </div>

        <div className="bcCinematicExperience__layer bcCinematicExperience__layer--reactor" aria-hidden="true">
          <img src="/assets/games/crown-front/crown-front-preview.svg" alt="" />
          <div className="bcCinematicExperience__reactorCore" />
        </div>

        <div className="bcCinematicExperience__layer bcCinematicExperience__layer--network" aria-hidden="true">
          <div className="bcCinematicExperience__networkGrid" />
          <div className="bcCinematicExperience__networkOrb" />
        </div>

        <div className="bcCinematicExperience__chrome">
          <div className="bcCinematicExperience__brand"><span>BLACKCROWN</span><small>INTERACTIVE UNIVERSE</small></div>
          <div className="bcCinematicExperience__progress"><i /><i /><i /><i /><i /></div>
          <div className="bcCinematicExperience__source">NETWORK / {statusSource.toUpperCase()}</div>
        </div>

        <div className="bcCinematicExperience__copy bcCinematicExperience__copy--hero">
          <span>BLACKCROWN NETWORK • {network.status === "LIVE" ? "ONLINE" : network.status}</span>
          <h1>BLACKCROWN</h1>
          <p>Одна корона. Несколько миров.</p>
          <div className="bcCinematicExperience__actions">
            <button className="bcCinematicExperience__primary" onClick={onPlay}>Играть</button>
            <button onClick={() => onNavigate("/about")}>О вселенной</button>
          </div>
        </div>

        <div className="bcCinematicExperience__copy bcCinematicExperience__copy--gate">
          <span>WORLD GATE / 01</span>
          <h2>Погружение</h2>
          <p>Корона раскрывает проход в первый мир.</p>
        </div>

        <div className="bcCinematicExperience__copy bcCinematicExperience__copy--ocean">
          <span>EVOFISH / {evofish.status}</span>
          <h2>Эволюция начинается в глубине.</h2>
          <p>Исследуй океан, развивай хищника и меняй форму вместе с миром.</p>
          <button className="bcCinematicExperience__primary" onClick={onPlay}>Войти в EvoFish</button>
        </div>

        <div className="bcCinematicExperience__copy bcCinematicExperience__copy--reactor">
          <span>CROWN//FRONT / {crownFront.status}</span>
          <h2>Война внутри механического короля.</h2>
          <p>Захватывай узлы, контролируй реактор и меняй ход боя.</p>
          <div className="bcCinematicExperience__actions">
            <button className="bcCinematicExperience__primary" onClick={onOpenCrownFront}>Войти в Alpha</button>
            <button onClick={onOpenLobby}>Lobby</button>
          </div>
        </div>

        <div className="bcCinematicExperience__copy bcCinematicExperience__copy--network">
          <span>BLACKCROWN NETWORK / {network.status}</span>
          <h2>Один профиль. Вся экосистема.</h2>
          <p>Игры, коллекция, Store и Lobby связаны одним BlackCrown ID.</p>
          <div className="bcCinematicExperience__actions">
            <button className="bcCinematicExperience__primary" onClick={() => onNavigate("/account")}>Профиль</button>
            <button onClick={() => onNavigate("/store")}>Store</button>
          </div>
        </div>

        <div className="bcCinematicExperience__scrollHint" aria-hidden="true"><span>SCROLL TO ENTER</span><i /></div>
      </div>
    </section>
  );
}

export default CinematicExperience;

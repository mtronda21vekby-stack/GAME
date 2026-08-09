import React from "react";
import CrownWebGLCanvas from "./CrownWebGLCanvas";
import "../styles/cinematic-experience-v1.css";

type WorldStatus = { status: string };
type KeyArtId = "hero" | "evofish";

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
  const distance = Math.abs(progress - center);
  return Math.max(0, Math.min(1, 1 - distance / width));
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
  const readyKeyArtRef = React.useRef<Set<KeyArtId>>(new Set());
  const [phase, setPhase] = React.useState(0);
  const [navigatorOpen, setNavigatorOpen] = React.useState(false);

  const verifyKeyArt = React.useCallback((event: React.SyntheticEvent<HTMLImageElement>, id: KeyArtId) => {
    const image = event.currentTarget;
    const valid = image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
    image.dataset.keyArtStatus = valid ? "ready" : "error";

    const root = rootRef.current;
    if (!root) return;

    if (!valid) {
      readyKeyArtRef.current.delete(id);
      root.dataset.keyArtStatus = "error";
      return;
    }

    readyKeyArtRef.current.add(id);
    root.dataset.keyArtStatus = readyKeyArtRef.current.size === 2 ? "ready" : "loading";
  }, []);

  const jumpToProgress = React.useCallback((target: number) => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const rootTop = window.scrollY + root.getBoundingClientRect().top;
    const travel = Math.max(1, root.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: rootTop + travel * Math.max(0, Math.min(1, target)),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, []);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let previousProgress = 0;
    let previousAt = performance.now();
    let smoothedVelocity = 0;
    let previousPhase = -1;

    const update = () => {
      raf = 0;
      const now = performance.now();
      const rect = root.getBoundingClientRect();
      const travel = Math.max(1, root.offsetHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / travel));
      const nextPhase = Math.min(4, Math.max(0, Math.floor(progress * 5)));
      const elapsed = Math.max(16, now - previousAt);
      const instantVelocity = ((progress - previousProgress) / elapsed) * 1000;
      smoothedVelocity += (instantVelocity - smoothedVelocity) * 0.16;

      previousProgress = progress;
      previousAt = now;

      root.dataset.phase = String(nextPhase);
      root.style.setProperty("--cx-p", progress.toFixed(5));
      root.style.setProperty("--cx-v", smoothedVelocity.toFixed(5));
      root.style.setProperty("--cx-hero", phaseOpacity(progress, 0.06, 0.2).toFixed(4));
      root.style.setProperty("--cx-gate", phaseOpacity(progress, 0.26, 0.18).toFixed(4));
      root.style.setProperty("--cx-ocean", phaseOpacity(progress, 0.48, 0.23).toFixed(4));
      root.style.setProperty("--cx-reactor", phaseOpacity(progress, 0.70, 0.23).toFixed(4));
      root.style.setProperty("--cx-network", phaseOpacity(progress, 0.92, 0.2).toFixed(4));
      root.style.setProperty("--cx-ocean-y", `${Math.round((progress - 0.48) * -120)}px`);
      root.style.setProperty("--cx-reactor-y", `${Math.round((progress - 0.70) * -110)}px`);

      if (nextPhase !== previousPhase) {
        previousPhase = nextPhase;
        setPhase(nextPhase);
      }
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

  React.useEffect(() => {
    if (!navigatorOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavigatorOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [navigatorOpen]);

  const runNavigatorCommand = (target: number) => {
    setNavigatorOpen(false);
    jumpToProgress(target);
  };

  return (
    <section
      ref={rootRef}
      id="worlds"
      className="bcCinematicExperience"
      data-phase="0"
      data-key-art-status="loading"
      data-webgl-status="loading"
      aria-label="BlackCrown cinematic experience"
    >
      <div className="bcCinematicExperience__sticky">
        <CrownWebGLCanvas rootRef={rootRef} />

        <div className="bcCinematicExperience__fallback" aria-hidden="true">
          <div className="bcCinematicExperience__fallbackCrown"><i /><i /><i /><i /><i /><i /><i /></div>
        </div>

        <div className="bcCinematicExperience__layer bcCinematicExperience__layer--hero" aria-hidden="true">
          <div className="bcCinematicExperience__heroGlow" />
          <img
            className="bcCinematicExperience__legacyCrown"
            src="/art/hero-crown.webp"
            alt=""
            width="600"
            height="750"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onLoad={(event) => verifyKeyArt(event, "hero")}
            onError={(event) => verifyKeyArt(event, "hero")}
          />
        </div>

        <div className="bcCinematicExperience__layer bcCinematicExperience__layer--ocean" aria-hidden="true">
          <img
            src="/art/evofish-world.webp"
            alt=""
            width="800"
            height="500"
            loading="eager"
            decoding="async"
            onLoad={(event) => verifyKeyArt(event, "evofish")}
            onError={(event) => verifyKeyArt(event, "evofish")}
          />
          <div className="bcCinematicExperience__oceanLight" />
        </div>

        <div className="bcCinematicExperience__layer bcCinematicExperience__layer--reactor" aria-hidden="true">
          <img src="/assets/games/crown-front/crown-front-preview.svg" alt="" />
          <div className="bcCinematicExperience__reactorCore" />
        </div>

        <div className="bcCinematicExperience__vignette" aria-hidden="true" />
        <div className="bcCinematicExperience__grain" aria-hidden="true" />
        <div className="bcCinematicExperience__scan" aria-hidden="true" />

        <header className="bcCinematicExperience__chrome">
          <button className="bcCinematicExperience__brand" onClick={() => jumpToProgress(0)}>
            <span>BLACKCROWN</span><small>INTERACTIVE UNIVERSE</small>
          </button>

          <nav className="bcCinematicExperience__pillNav" aria-label="Cinematic chapters">
            <button aria-current={phase === 0} onClick={() => jumpToProgress(0)}>CROWN</button>
            <button aria-current={phase === 1} onClick={() => jumpToProgress(0.25)}>GATE</button>
            <button aria-current={phase === 2 || phase === 3} onClick={() => jumpToProgress(0.50)}>WORLDS</button>
            <button aria-current={phase === 4} onClick={() => jumpToProgress(0.94)}>NETWORK</button>
          </nav>

          <button
            className="bcCinematicExperience__ask"
            aria-expanded={navigatorOpen}
            aria-controls="bc-crown-navigator"
            onClick={() => setNavigatorOpen((open) => !open)}
          >
            ASK CROWN <span>↗</span>
          </button>
        </header>

        <div className="bcCinematicExperience__rail" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <div className="bcCinematicExperience__coordinate bcCinematicExperience__coordinate--left">BC / IMMERSIVE SYSTEM</div>
        <div className="bcCinematicExperience__coordinate bcCinematicExperience__coordinate--right">NETWORK / {statusSource.toUpperCase()}</div>

        <div className="bcCinematicExperience__copy bcCinematicExperience__copy--hero">
          <span>BLACKCROWN NETWORK • {network.status === "LIVE" ? "ONLINE" : network.status}</span>
          <h1>ENTER<br /><em>THE CROWN.</em></h1>
          <p>Одна корона. Несколько миров. Единая интерактивная экосистема.</p>
          <div className="bcCinematicExperience__actions">
            <button className="bcCinematicExperience__primary" onClick={onPlay}>PLAY NOW <b>↗</b></button>
            <button onClick={() => jumpToProgress(0.25)}>EXPLORE <b>↓</b></button>
          </div>
        </div>

        <div className="bcCinematicExperience__copy bcCinematicExperience__copy--gate">
          <span>WORLD GATE / 01</span>
          <h2>THE SYSTEM<br /><em>OPENS.</em></h2>
          <p>Прокрутка управляет камерой, светом и состоянием мира — не просто перемещает страницу.</p>
        </div>

        <div className="bcCinematicExperience__copy bcCinematicExperience__copy--ocean">
          <span>EVOFISH / {evofish.status}</span>
          <h2>EVOLVE<br /><em>BELOW.</em></h2>
          <p>Исследуй бездну, развивай хищника и меняй форму вместе с живым океаном.</p>
          <div className="bcCinematicExperience__actions">
            <button className="bcCinematicExperience__primary" onClick={onPlay}>ENTER EVOFISH <b>↗</b></button>
          </div>
        </div>

        <div className="bcCinematicExperience__copy bcCinematicExperience__copy--reactor">
          <span>CROWN//FRONT / {crownFront.status}</span>
          <h2>CONTROL<br /><em>THE CORE.</em></h2>
          <p>Захватывай узлы, удерживай реактор и меняй ход войны внутри механического короля.</p>
          <div className="bcCinematicExperience__actions">
            <button className="bcCinematicExperience__hot" onClick={onOpenCrownFront}>ENTER ALPHA <b>↗</b></button>
            <button onClick={onOpenLobby}>LOBBY</button>
          </div>
        </div>

        <div className="bcCinematicExperience__copy bcCinematicExperience__copy--network">
          <span>BLACKCROWN ID / {network.status}</span>
          <h2>ONE ID.<br /><em>EVERY WORLD.</em></h2>
          <p>Игры, коллекция, Store и Lobby связаны единым профилем Blackcrown.</p>
          <div className="bcCinematicExperience__actions">
            <button className="bcCinematicExperience__primary" onClick={() => onNavigate("/account")}>OPEN PROFILE <b>↗</b></button>
            <button onClick={() => onNavigate("/store")}>STORE</button>
          </div>
        </div>

        <aside
          id="bc-crown-navigator"
          className="bcCinematicExperience__navigator"
          data-open={navigatorOpen ? "true" : "false"}
          aria-hidden={!navigatorOpen}
        >
          <div className="bcCinematicExperience__navigatorHead">
            <span>BLACKCROWN NAVIGATOR</span>
            <button aria-label="Close navigator" onClick={() => setNavigatorOpen(false)}>×</button>
          </div>
          <p>Локальная навигация по интерактивной сцене без передачи данных.</p>
          <button onClick={() => runNavigatorCommand(0)}>SHOW THE CROWN <span>01</span></button>
          <button onClick={() => runNavigatorCommand(0.48)}>OPEN EVOFISH <span>02</span></button>
          <button onClick={() => runNavigatorCommand(0.70)}>OPEN CROWN//FRONT <span>03</span></button>
          <button onClick={() => runNavigatorCommand(0.94)}>SHOW THE NETWORK <span>04</span></button>
        </aside>

        <div className="bcCinematicExperience__scrollHint" aria-hidden="true"><span>SCROLL TO ENTER</span><i /></div>
      </div>
    </section>
  );
}

export default CinematicExperience;

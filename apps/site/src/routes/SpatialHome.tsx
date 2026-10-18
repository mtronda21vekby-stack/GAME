import React from "react";
import { PlatformHeader } from "../components/platform/PlatformHeader";
import { SpatialPoster } from "../components/spatial/SpatialPoster";
import { GameDetail } from "../components/spatial/GameDetail";
import type { SpatialSceneHandle } from "../components/spatial/SpatialScene";
import { isSpatialGameLaunch, nextWorldIndex } from "../components/spatial/spatialState";
import { platformGames } from "../lib/platformGames";
import "../styles/spatial.css";

const SpatialScene = React.lazy(() => import("../components/spatial/SpatialScene"));
const categories = ["Все игры", "Экшн", "Исследование", "Симуляторы"] as const;

export default function SpatialHome() {
  const stageRef = React.useRef<HTMLElement>(null);
  const sceneRef = React.useRef<SpatialSceneHandle>(null);
  const choicesRef = React.useRef<HTMLDivElement>(null);
  const [worldIndex, setWorldIndex] = React.useState(0);
  const [category, setCategory] = React.useState<string>("Все игры");
  const [paused, setPaused] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [sceneStatus, setSceneStatus] = React.useState<"loading" | "ready" | "fallback">("loading");
  const [loaded, setLoaded] = React.useState({ complete: 0, total: platformGames.length + 1 });
  const activeWorld = React.useRef(worldIndex);
  activeWorld.current = worldIndex;
  const onPick = React.useCallback((index: number) => { if (activeWorld.current === index) setDetailOpen(true); else setWorldIndex(index); }, []);
  const onProgress = React.useCallback((complete: number, total: number) => setLoaded({ complete, total }), []);
  const closeDetail = React.useCallback(() => setDetailOpen(false), []);
  const visibleGames = React.useMemo(() => platformGames.flatMap((item, index) => category === "Все игры" || item.genre === category ? [index] : []), [category]);
  const game = platformGames[worldIndex];
  const step = (direction: number) => setWorldIndex(value => nextWorldIndex(value, direction, visibleGames));

  function changeCategory(next: string) {
    setCategory(next);
    if (next !== "Все игры" && game.genre !== next) setWorldIndex(Math.max(0, platformGames.findIndex(item => item.genre === next)));
  }
  function releaseBeforeGame(event: React.MouseEvent) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
    if (isSpatialGameLaunch(link.href, window.location.origin)) { sceneRef.current?.dispose(); setSceneStatus("fallback"); }
  }
  function onChoiceKey(event: React.KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = nextWorldIndex(worldIndex, event.key === "ArrowLeft" ? -1 : 1, visibleGames);
    setWorldIndex(next);
    choicesRef.current?.querySelector<HTMLButtonElement>('[data-world="' + next + '"]')?.focus();
  }

  return (
    <div className="spatialPage platPage" data-scene-state={sceneStatus} onClickCapture={releaseBeforeGame}>
      <a className="platSkip" href="#spatial-main">К содержимому</a>
      <PlatformHeader />
      <main id="spatial-main">
        <section className="spatialJourney" ref={stageRef} aria-label="Игровые миры BLACKCROWN">
          <div className="spatialCanvasSticky">
            <SpatialPoster />
            <React.Suspense fallback={null}><SpatialScene ref={sceneRef} stageRef={stageRef} worldIndex={worldIndex} visibleGames={visibleGames} detailOpen={detailOpen} paused={paused} onStatus={setSceneStatus} onProgress={onProgress} onPick={onPick} /></React.Suspense>
            <div className="spatialVignette" aria-hidden="true" />
          </div>
          <div className="spatialJourneyContent">
            <section className="spatialHero" aria-labelledby="spatial-title">
              <div className="spatialHeroCopy">
                <p className="spatialEyebrow">BLACKCROWN / INDEPENDENT WORLDS</p>
                <h1 id="spatial-title">РАЗНЫЕ МИРЫ.<br/><span>ОДНА КОРОНА.</span></h1>
                <p className="spatialLead">Арена, океан, тихая долина.<br/>Выбирай свой мир — и начинай играть.</p>
                <div className="spatialActions"><a className="platButton" href="#spatial-worlds">Выбрать игру <span aria-hidden="true">↓</span></a><a className="platTextLink" href={platformGames[0].href}>Сразу в Ballcrown <span aria-hidden="true">↗</span></a></div>
              </div>
              <div className="spatialHeroFoot">
                <span className="spatialLoadStatus" role="status">{sceneStatus === "fallback" ? "СТАТИЧНАЯ СЦЕНА" : loaded.complete < loaded.total ? "ЗАГРУЗКА СЦЕНЫ / " + loaded.complete + " ИЗ " + loaded.total : "BLACKCROWN / СЦЕНА ГОТОВА"}</span>
                <a className="spatialScrollCue" href="#spatial-worlds">К ИГРАМ <span aria-hidden="true">↓</span></a>
              </div>
            </section>
            <section className="spatialGallerySection" id="spatial-worlds" aria-labelledby="spatial-world-title">
              <div className="spatialGalleryHeading"><p className="spatialEyebrow">01 / ГАЛЕРЕЯ ИГРОВЫХ МИРОВ</p><h2 id="spatial-world-title">НАЙДИ СВОЙ МИР.</h2></div>
              <div className="spatialGalleryVisual">
                <button type="button" className="spatialCardTarget" onClick={() => setDetailOpen(true)} aria-label={"Подробнее об игре " + game.title}>
                  <img className="spatialFallbackCover" src={game.image} alt={game.imageAlt} width="1280" height="720"/>
                  <span className="spatialCardHint">ОТКРЫТЬ МИР <b aria-hidden="true">↗</b></span>
                </button>
              </div>
              <div className="spatialGalleryControls">
                <div className="spatialCurrentGame" aria-live="polite" aria-atomic="true"><p>{String(worldIndex + 1).padStart(2,"0")} / {game.genre} / {game.status}</p><h3>{game.title}</h3></div>
                <div className="spatialGalleryActions"><button type="button" disabled={visibleGames.length < 2} className="spatialArrow" onClick={() => step(-1)} aria-label="Предыдущая игра">←</button><button type="button" className="spatialOpenGame" onClick={() => setDetailOpen(true)}>Об игре <span aria-hidden="true">↗</span></button><a className="spatialDirectPlay" href={game.href}>Играть ↗</a><button type="button" disabled={visibleGames.length < 2} className="spatialArrow" onClick={() => step(1)} aria-label="Следующая игра">→</button></div>
                <div className="spatialWorldChoices" ref={choicesRef} role="group" aria-label="Выбор игры" onKeyDown={onChoiceKey}>{visibleGames.map(index => <button type="button" key={platformGames[index].id} data-world={index} aria-pressed={worldIndex === index} onClick={() => setWorldIndex(index)}>{platformGames[index].title}</button>)}</div>
              </div>
              <div className="spatialGalleryFoot"><div className="spatialFilters" role="group" aria-label="Жанр игры">{categories.map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => changeCategory(item)}>{item}</button>)}</div><a className="platTextLink" href="/games/">Полный каталог ↗</a></div>
            </section>
            <section className="spatialAbout" aria-labelledby="spatial-about-title">
              <div className="spatialAboutCopy"><p className="spatialEyebrow">02 / BLACKCROWN</p><h2 id="spatial-about-title">У КАЖДОГО МИРА<br/><span>СВОЙ ХАРАКТЕР.</span></h2><p>BLACKCROWN объединяет независимые игры.<br/>Разные правила, настроение и темп —<br/>следующая история начинается с твоего выбора.</p><div className="spatialActions"><a className="platTextLink" href="/about">О проекте ↗</a><a className="platTextLink" href="#spatial-worlds">Вернуться к играм ↑</a></div></div>
            </section>
          </div>
        </section>
      </main>
      <button className="spatialMotionToggle" type="button" aria-pressed={paused} aria-label={paused ? "Продолжить движение сцены" : "Пауза движения сцены"} onClick={() => setPaused(value => !value)}><span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span><span>{paused ? "Продолжить" : "Пауза"}</span></button>
      <GameDetail open={detailOpen} game={game} canCycle={visibleGames.length > 1} paused={paused} onTogglePause={() => setPaused(value => !value)} onClose={closeDetail} onPrevious={() => step(-1)} onNext={() => step(1)}/>
    </div>
  );
}

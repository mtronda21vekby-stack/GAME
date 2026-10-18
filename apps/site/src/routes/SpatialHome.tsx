import React from "react";
import { PlatformHeader } from "../components/platform/PlatformHeader";
import { SpatialPoster } from "../components/spatial/SpatialPoster";
import { GameDetail, type PanelOrigin } from "../components/spatial/GameDetail";
import { GamePanel, GamePanelLayer } from "../components/spatial/GamePanel";
import type { SpatialSceneHandle } from "../components/spatial/SpatialScene";
import { isSpatialGameLaunch, nextWorldIndex } from "../components/spatial/spatialState";
import { platformGames } from "../lib/platformGames";
import "../styles/spatial.css";

const SpatialScene = React.lazy(() => import("../components/spatial/SpatialScene"));
const categories = ["Все игры", "Экшн", "Исследование", "Симуляторы"] as const;

export default function SpatialHome() {
  const stageRef = React.useRef<HTMLElement>(null);
  const sceneRef = React.useRef<SpatialSceneHandle>(null);
  const panelRootRef = React.useRef<HTMLDivElement>(null);
  const choicesRef = React.useRef<HTMLDivElement>(null);
  const [worldIndex, setWorldIndex] = React.useState(0);
  const [category, setCategory] = React.useState<string>("Все игры");
  const [paused, setPaused] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailFocus, setDetailFocus] = React.useState(false);
  const panelOrigin = React.useRef<PanelOrigin | null>(null);
  const [sceneStatus, setSceneStatus] = React.useState<"loading" | "ready" | "fallback">("loading");
  const [loaded, setLoaded] = React.useState({ complete: 0, total: 1 });
  const onProgress = React.useCallback((complete: number, total: number) => setLoaded({ complete, total }), []);
  const closeDetail = React.useCallback(() => { setDetailFocus(false); setDetailOpen(false); }, []);
  const startClosingDetail = React.useCallback(() => setDetailFocus(false), []);
  const visibleGames = React.useMemo(() => platformGames.flatMap((item, index) => category === "Все игры" || item.genre === category ? [index] : []), [category]);
  const game = platformGames[worldIndex];
  const step = (direction: number) => setWorldIndex(value => nextWorldIndex(value, direction, visibleGames));

  function openDetail() {
    const panel = [...document.querySelectorAll<HTMLElement>(`.spatialGamePanel[data-game-id="${game.id}"]`)].find(element => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden");
    const box = panel?.getBoundingClientRect();
    panelOrigin.current = box ? { left: box.left, top: box.top, width: box.width, height: box.height, viewportWidth: window.innerWidth } : null;
    setDetailFocus(true); setDetailOpen(true);
  }

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
    <div className="spatialPage platPage" data-scene-state={sceneStatus} data-detail-open={detailOpen} onClickCapture={releaseBeforeGame}>
      <a className="platSkip" href="#spatial-main">К содержимому</a>
      <PlatformHeader />
      <main id="spatial-main">
        <section className="spatialJourney" ref={stageRef} aria-label="Игровые миры BLACKCROWN">
          <div className="spatialCanvasSticky">
            <SpatialPoster />
            <React.Suspense fallback={null}><SpatialScene ref={sceneRef} stageRef={stageRef} panelRootRef={panelRootRef} worldIndex={worldIndex} visibleGames={visibleGames} detailOpen={detailOpen} detailFocus={detailFocus} paused={paused} onStatus={setSceneStatus} onProgress={onProgress} /></React.Suspense>
            <div className="spatialVignette" aria-hidden="true" />
            <GamePanelLayer rootRef={panelRootRef} selected={worldIndex} visible={visibleGames} onSelect={setWorldIndex} onOpen={openDetail}/>
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
              <div className="spatialGalleryHeading"><p className="spatialEyebrow">01 / ИГРОВЫЕ МИРЫ</p><h2 id="spatial-world-title">ВЫБЕРИ СВОЙ МИР.</h2></div>
              <div className="spatialGalleryVisual">
                <div className="spatialPanelFallback"><GamePanel game={game} index={worldIndex} selected onSelect={() => {}} onOpen={openDetail}/></div>
              </div>
              <div className="spatialGalleryControls">
                <button type="button" disabled={visibleGames.length < 2} className="spatialArrow" onClick={() => step(-1)} aria-label="Предыдущая игра">←</button>
                <div className="spatialWorldChoices" ref={choicesRef} role="group" aria-label="Выбор игры" onKeyDown={onChoiceKey}>{visibleGames.map(index => <button type="button" key={platformGames[index].id} data-world={index} aria-label={platformGames[index].title} title={platformGames[index].title} aria-pressed={worldIndex === index} onClick={() => setWorldIndex(index)}>{String(index + 1).padStart(2,"0")}</button>)}</div>
                <button type="button" disabled={visibleGames.length < 2} className="spatialArrow" onClick={() => step(1)} aria-label="Следующая игра">→</button>
                <span className="spatialPanelCounter" role="status">{String(visibleGames.indexOf(worldIndex) + 1).padStart(2,"0")} / {String(visibleGames.length).padStart(2,"0")} — {game.title}</span>
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
      <GameDetail open={detailOpen} origin={panelOrigin.current} game={game} canCycle={visibleGames.length > 1} paused={paused} onTogglePause={() => setPaused(value => !value)} onClosing={startClosingDetail} onClose={closeDetail} onPrevious={() => step(-1)} onNext={() => step(1)}/>
    </div>
  );
}

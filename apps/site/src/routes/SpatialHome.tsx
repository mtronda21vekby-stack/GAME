import React from "react";
import { PlatformHeader } from "../components/platform/PlatformHeader";
import { SpatialPoster } from "../components/spatial/SpatialPoster";
import { GameDetail, type PanelOrigin } from "../components/spatial/GameDetail";
import { GamePanel, GamePanelLayer } from "../components/spatial/GamePanel";
import type { SpatialSceneHandle } from "../components/spatial/SpatialScene";
import { isSpatialGameLaunch, nextWorldIndex } from "../components/spatial/spatialState";
import { platformGames } from "../lib/platformGames";
import { readSpatialReturn, rememberSpatialReturn, SPATIAL_CATEGORIES } from "../components/spatial/spatialNavigation";
import { spatialScrollWorld } from "../components/spatial/SpatialAxis";
import "../styles/spatial.css";

const SpatialScene = React.lazy(() => import("../components/spatial/SpatialScene"));
const categories = SPATIAL_CATEGORIES;

export default function SpatialHome() {
  const stageRef = React.useRef<HTMLElement>(null);
  const sceneRef = React.useRef<SpatialSceneHandle>(null);
  const panelRootRef = React.useRef<HTMLDivElement>(null);
  const choicesRef = React.useRef<HTMLDivElement>(null);
  const galleryRef = React.useRef<HTMLElement>(null);
  const deckRef = React.useRef<HTMLDivElement>(null);
  const [initialView] = React.useState(() => readSpatialReturn(window.history.state, window.location.pathname));
  const [worldIndex, setWorldIndex] = React.useState(initialView?.worldIndex ?? 0);
  const [category, setCategory] = React.useState<string>(initialView?.category ?? "Все игры");
  const [paused, setPaused] = React.useState(false);
  const [clothTouch,setClothTouch] = React.useState<{x:number;y:number;key:number}|null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailFocus, setDetailFocus] = React.useState(false);
  const panelOrigin = React.useRef<PanelOrigin | null>(null);
  const [sceneStatus, setSceneStatus] = React.useState<"loading" | "ready" | "fallback">("loading");
  const onProgress = React.useCallback(() => {}, []);
  const closeDetail = React.useCallback(() => { setDetailFocus(false); setDetailOpen(false); }, []);
  const startClosingDetail = React.useCallback(() => setDetailFocus(false), []);
  const visibleGames = React.useMemo(() => platformGames.flatMap((item, index) => category === "Все игры" || item.genre === category ? [index] : []), [category]);
  const game = platformGames[worldIndex];
  const step = (direction: number) => setWorldIndex(value => nextWorldIndex(value, direction, visibleGames));
  const view = React.useRef({ worldIndex, category, detailOpen });
  view.current = { worldIndex, category, detailOpen };
  const pageScroll = React.useRef(initialView?.scrollY ?? window.scrollY);
  const entryPath = React.useRef(window.location.pathname);
  const rememberView = React.useCallback(() => {
    if (window.location.pathname === entryPath.current) rememberSpatialReturn(window.history, entryPath.current, { ...view.current, scrollY: pageScroll.current });
  }, []);

  React.useEffect(() => {
    let timer = 0;
    const frame = requestAnimationFrame(() => {
      if (initialView) window.scrollTo({ top: initialView.scrollY, behavior: "instant" });
      pageScroll.current = window.scrollY;
    });
    const onScroll = () => {
      if (view.current.detailOpen) return;
      pageScroll.current = window.scrollY;
      window.clearTimeout(timer);
      // Write after the gesture, without replacing history on every animation frame.
      timer = window.setTimeout(rememberView, 160);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", rememberView);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(timer); window.removeEventListener("scroll", onScroll); window.removeEventListener("pagehide", rememberView); };
  }, [initialView, rememberView]);
  React.useEffect(rememberView, [worldIndex, category, rememberView]);

  React.useEffect(() => {
    const section=galleryRef.current,deck=deckRef.current;
    if(!section||!deck)return;
    let start=0,end=0,enabled=false,last:number|undefined;
    const measure=()=>{
      const style=getComputedStyle(deck),head=section.querySelector(".spatialGalleryHead")!.getBoundingClientRect();
      const inset=parseFloat(style.top)||0,box=section.getBoundingClientRect();
      enabled=style.position==="sticky";
      start=head.bottom+window.scrollY+(parseFloat(style.marginTop)||0)-inset;
      end=box.bottom+window.scrollY-(parseFloat(getComputedStyle(section).paddingBottom)||0)-deck.offsetHeight-inset;
      last=spatialScrollWorld(window.scrollY,start,end,visibleGames);
    };
    const onScroll=()=>{
      if(!enabled||view.current.detailOpen)return;
      if(window.scrollY<start){last=undefined;return;}
      const next=spatialScrollWorld(window.scrollY,start,end,visibleGames);
      if(next!==undefined&&next!==last){last=next;setWorldIndex(next);}
    };
    const observer=new ResizeObserver(measure);observer.observe(section);observer.observe(deck);
    measure();const frame=requestAnimationFrame(measure);
    window.addEventListener("resize",measure,{passive:true});window.addEventListener("scroll",onScroll,{passive:true});
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("resize",measure);window.removeEventListener("scroll",onScroll);};
  },[visibleGames]);

  function openDetail() {
    const panel = [...document.querySelectorAll<HTMLElement>(`.spatialGamePanel[data-game-id="${game.id}"]`)].find(element => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden");
    const box = (panel?.querySelector(".spatialPanelMedia") ?? panel)?.getBoundingClientRect();
    panelOrigin.current = box ? { gameId: game.id, left: box.left, top: box.top, width: box.width, height: box.height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight } : null;
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
    rememberView();
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
                <p className="spatialEyebrow"><span className="spatialSignal" aria-hidden="true"/> НЕЗАВИСИМЫЕ ИГРЫ / BLACKCROWN</p>
                <h1 id="spatial-title">ТВОЯ ИГРА.<br/><span>ТВОЙ МИР.</span></h1>
                <p className="spatialLead">От арены Ballcrown до тихой долины.<br/>Найди свой ритм. Выбери свой мир.</p>
                <div className="spatialActions"><a className="platButton" href="#spatial-worlds">Выбрать игру <span aria-hidden="true">↓</span></a><a className="platTextLink" href={platformGames[0].href}>Начать с Ballcrown <span aria-hidden="true">↗</span></a></div>
              </div>
              <div className="spatialBrandSlot" aria-hidden="true"><img className="spatialBrandPoster" src="/experience/blackcrown-skull/blackcrown-skull-poster.png" alt="" width="640" height="760" decoding="async"/></div>
              <div className="spatialHeroFoot">
                <span><b>{String(platformGames.length).padStart(2,"0")}</b> разных мира.<br/>Следующий — твой.</span>
                <a className="spatialScrollCue" href="#spatial-worlds">Исследовать коллекцию <span aria-hidden="true">↓</span></a>
              </div>
            </section>
            <section className="spatialGallerySection" id="spatial-worlds" ref={galleryRef} style={{"--spatial-stops":visibleGames.length} as React.CSSProperties} aria-labelledby="spatial-world-title">
              <div className="spatialGalleryHead"><div className="spatialGalleryHeading"><p className="spatialEyebrow">01 / КОЛЛЕКЦИЯ</p><h2 id="spatial-world-title">Игровые миры.</h2></div><div className="spatialFilters" role="group" aria-label="Жанр игры">{categories.map(item => <button key={item} type="button" aria-label={item} aria-pressed={category === item} onClick={() => changeCategory(item)}>{item === "Все игры" ? "Все" : item}</button>)}</div></div>
              <div className="spatialGalleryDeck" ref={deckRef}>
              <div className="spatialGalleryControls">
                <button type="button" disabled={visibleGames.length < 2} className="spatialArrow" onClick={() => step(-1)} aria-label="Предыдущая игра">←</button>
                <div className="spatialWorldChoices" ref={choicesRef} role="group" aria-label="Выбор игры" onKeyDown={onChoiceKey}>{visibleGames.map(index => <button type="button" key={platformGames[index].id} data-world={index} aria-label={platformGames[index].title} title={platformGames[index].title} aria-pressed={worldIndex === index} onClick={() => setWorldIndex(index)}><span>{String(index + 1).padStart(2,"0")}</span><b>{platformGames[index].title}</b></button>)}</div>
                <button type="button" disabled={visibleGames.length < 2} className="spatialArrow" onClick={() => step(1)} aria-label="Следующая игра">→</button>
                <span className="spatialPanelCounter" role="status" aria-atomic="true">{String(visibleGames.indexOf(worldIndex) + 1).padStart(2,"0")} / {String(visibleGames.length).padStart(2,"0")} · {game.title}</span>
              </div>
              <div className="spatialGalleryVisual">
                <div className="spatialPanelFallback"><GamePanel game={game} index={worldIndex} selected onSelect={() => {}} onOpen={openDetail}/></div>
              </div>
              <div className="spatialGalleryFoot"><span>Прокручивай — открывай следующий мир.</span><a className="platTextLink" href="/games/">Весь каталог <span aria-hidden="true">↗</span></a></div>
              </div>
            </section>
            <section className="spatialMaterial" aria-labelledby="spatial-material-title">
              <div className="spatialMaterialCopy"><p className="spatialEyebrow">02 / МАТЕРИЯ</p><h2 id="spatial-material-title">Коснись.<br/><span>Оставь волну.</span></h2><p id="spatial-cloth-help">Металл тоже может двигаться.<br/>Коснись полотна в любой точке.</p><p className="spatialClothStatus" role="status">{clothTouch?(paused?"Сцена на паузе.":"Касание принято."):""}</p></div>
              <button className="spatialClothControl" type="button" aria-label="Коснуться металлического полотна" aria-describedby="spatial-cloth-help" onClick={event=>{
                const box=event.currentTarget.getBoundingClientRect(),keyboard=event.detail===0;
                const x=keyboard?box.width/2:event.clientX-box.left,y=keyboard?box.height/2:event.clientY-box.top;
                sceneRef.current?.touchCloth(keyboard?undefined:event.clientX,keyboard?undefined:event.clientY);
                setClothTouch({x,y,key:(clothTouch?.key??0)+1});
              }}><span className="spatialClothFallback" aria-hidden="true"/>{clothTouch&&<span key={clothTouch.key} className="spatialClothPulse" style={{left:clothTouch.x,top:clothTouch.y}} aria-hidden="true"/>}<span className="spatialClothHint" aria-hidden="true">Коснись поверхности <span>+</span></span></button>
            </section>
            <section className="spatialAbout" aria-labelledby="spatial-about-title">
              <div className="spatialAboutCopy"><p className="spatialEyebrow">03 / О ПЛАТФОРМЕ</p><h2 id="spatial-about-title">Один BLACKCROWN.<br/><span>Разный опыт.</span></h2></div><div className="spatialAboutText"><p>Быстрый бой, неизвестный океан или день в своей долине. Здесь у каждой игры — собственный мир, настроение и темп.</p><div className="spatialActions"><a className="platTextLink" href="/about">О проекте <span aria-hidden="true">↗</span></a><a className="platTextLink" href="/support">Нужна помощь? <span aria-hidden="true">↗</span></a><a className="platTextLink" href="/nexus-lab">Сцена короны <span aria-hidden="true">↗</span></a></div></div>
            </section>
          </div>
        </section>
      </main>
      <button className="spatialMotionToggle" type="button" aria-pressed={paused} aria-label={paused ? "Продолжить движение сцены" : "Пауза движения сцены"} onClick={() => setPaused(value => !value)}><span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span><span>{paused ? "Продолжить" : "Пауза"}</span></button>
      <GameDetail open={detailOpen} origin={panelOrigin.current} game={game} canCycle={visibleGames.length > 1} paused={paused} onTogglePause={() => setPaused(value => !value)} onClosing={startClosingDetail} onClose={closeDetail} onPrevious={() => step(-1)} onNext={() => step(1)}/>
    </div>
  );
}

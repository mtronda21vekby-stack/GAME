import React from "react";
import { PlatformHeader } from "../components/platform/PlatformHeader";
import { SpatialPoster } from "../components/spatial/SpatialPoster";
import { SPATIAL_BRAND_MODEL } from "../components/spatial/brandModel";
import { GameDetail, type PanelOrigin } from "../components/spatial/GameDetail";
import { GamePanelGrid } from "../components/spatial/GamePanel";
import type { SpatialSceneHandle } from "../components/spatial/SpatialScene";
import { isSpatialGameLaunch, nextWorldIndex } from "../components/spatial/spatialState";
import { platformGames } from "../lib/platformGames";
import { readSpatialReturn, rememberSpatialReturn, spatialReturnForGame, SPATIAL_CATEGORIES, type SpatialReturn } from "../components/spatial/spatialNavigation";
import "../styles/spatial.css";
import { clearSpatialCase, hasSpatialCaseEntry, spatialCaseIndex, spatialCaseOrigin, writeSpatialCase } from "../components/spatial/spatialHistory";
import { SpatialNavigator } from "../components/spatial/SpatialNavigator";

const SpatialScene = React.lazy(() => import("../components/spatial/SpatialScene"));
const categories = SPATIAL_CATEGORIES;

export default function SpatialHome() {
  const stageRef = React.useRef<HTMLElement>(null);
  const sceneRef = React.useRef<SpatialSceneHandle>(null);
  const [initialView] = React.useState(() => (spatialCaseIndex(window.location.hash)!==undefined?spatialCaseOrigin(window.history.state):undefined)??readSpatialReturn(window.history.state, window.location.pathname));
  const [worldIndex, setWorldIndex] = React.useState(initialView?.worldIndex ?? spatialCaseIndex(window.location.hash) ?? 0);
  const [category, setCategory] = React.useState<string>(initialView?.category ?? "Все игры");
  const [paused, setPaused] = React.useState(false);
  const [detailIndex,setDetailIndex]=React.useState<number|null>(()=>spatialCaseIndex(window.location.hash)??null);
  const [clothTouch,setClothTouch] = React.useState<{x:number;y:number;key:number;accepted:boolean}|null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailFocus, setDetailFocus] = React.useState(false);
  const closingRequested=React.useRef(false);
  const searchAfterClose=React.useRef(false);
  const [navigatorSignal,setNavigatorSignal]=React.useState(0);
  const panelOrigin = React.useRef<PanelOrigin | null>(null);
  const [sceneStatus, setSceneStatus] = React.useState<"loading" | "ready" | "fallback">("loading");
  const [load,setLoad]=React.useState({complete:0,total:0,phase:"download"});
  const onProgress = React.useCallback((complete:number,total:number,phase="download") => setLoad({complete,total,phase}), []);
  const closeDetail = React.useCallback(() => { sceneRef.current?.setDetailOpen(false); setDetailFocus(false); setDetailOpen(false);setDetailIndex(null);if(searchAfterClose.current){searchAfterClose.current=false;setNavigatorSignal(value=>value+1);} }, []);
  const startClosingDetail = React.useCallback(() => setDetailFocus(false), []);
  const visibleGames = React.useMemo(() => platformGames.flatMap((item, index) => category === "Все игры" || item.genre === category ? [index] : []), [category]);
  const game = platformGames[worldIndex],detailGame=platformGames[detailIndex??worldIndex];
  const detailIndexRef=React.useRef(detailIndex);detailIndexRef.current=detailIndex;
  const step = (direction: number) => {const next=nextWorldIndex(detailIndexRef.current??worldIndex,direction,visibleGames);setDetailIndex(next);writeSpatialCase(window.history,window.location,next,spatialCaseOrigin(window.history.state)??{...view.current,scrollY:pageScroll.current},true);};
  const view = React.useRef({ worldIndex, category, detailOpen });
  view.current = { worldIndex, category, detailOpen };
  const pageScroll = React.useRef(initialView?.scrollY ?? window.scrollY);
  const launchView = React.useRef<SpatialReturn | null>(null);
  const entryPath = React.useRef(window.location.pathname);
  const rememberView = React.useCallback(() => {
    if (window.location.pathname === entryPath.current&&!view.current.detailOpen) rememberSpatialReturn(window.history, entryPath.current, launchView.current ?? { ...view.current, scrollY: pageScroll.current });
  }, []);

  React.useLayoutEffect(() => {
    let timer = 0;
    const restoration=window.history.scrollRestoration;window.history.scrollRestoration="manual";
    // Restore before the lazy scene samples its initial scroll pose.
    if (initialView) window.scrollTo({ top: initialView.scrollY, behavior: "instant" });
    const linkedCase=spatialCaseIndex(window.location.hash);
    if(linkedCase!==undefined){
      if(!initialView){const panel=document.querySelector(`[data-game-id="${platformGames[linkedCase].id}"]`);if(panel)window.scrollTo({top:window.scrollY+panel.getBoundingClientRect().top-140,behavior:"instant"});}
      setDetailFocus(true);setDetailOpen(true);
    }
    pageScroll.current = window.scrollY;
    const onScroll = () => {
      if (view.current.detailOpen || launchView.current) return;
      pageScroll.current = window.scrollY;
      window.clearTimeout(timer);
      // Write after the gesture, without replacing history on every animation frame.
      timer = window.setTimeout(rememberView, 160);
    };
    const onPageShow = (event:PageTransitionEvent) => {
      if(!event.persisted||!launchView.current)return;
      const saved=launchView.current;launchView.current=null;
      const origin=view.current.detailOpen?spatialCaseOrigin(window.history.state):undefined,restored=origin??saved;
      setWorldIndex(restored.worldIndex);setCategory(restored.category);
      window.scrollTo({top:restored.scrollY,behavior:"instant"});pageScroll.current=restored.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", rememberView);
    window.addEventListener("pageshow", onPageShow);
    return () => { window.history.scrollRestoration=restoration;window.clearTimeout(timer); window.removeEventListener("scroll", onScroll); window.removeEventListener("pagehide", rememberView); window.removeEventListener("pageshow",onPageShow); };
  }, [initialView, rememberView]);
  React.useEffect(rememberView, [worldIndex, category, rememberView]);

  React.useEffect(()=>{
    const pop=()=>{
      closingRequested.current=false;
      if(window.location.pathname!==entryPath.current)return;
      window.history.scrollRestoration="manual";
      const index=spatialCaseIndex(window.location.hash);
      if(index===undefined){const root=readSpatialReturn(window.history.state,entryPath.current);if(root){setWorldIndex(root.worldIndex);setCategory(root.category);pageScroll.current=root.scrollY;window.scrollTo({top:root.scrollY,behavior:"instant"});}setDetailOpen(false);return;}
      const origin=spatialCaseOrigin(window.history.state),hash=window.location.hash;
      if(origin){setWorldIndex(origin.worldIndex);setCategory(origin.category);window.scrollTo({top:origin.scrollY,behavior:"instant"});pageScroll.current=origin.scrollY;}
      requestAnimationFrame(()=>{if(window.location.hash!==hash||window.location.pathname!==entryPath.current)return;const panel=document.querySelector(`.spatialGamePanel[data-game-id="${platformGames[origin?.worldIndex??index].id}"]`),top=panel?.getBoundingClientRect().top;if(top!==undefined&&(top<90||top>innerHeight*.7)){window.scrollTo({top:window.scrollY+top-Math.min(140,innerHeight*.35),behavior:"instant"});pageScroll.current=window.scrollY;}sceneRef.current?.syncScroll();openDetail(index,false);});
    };
    window.addEventListener("popstate",pop);return()=>window.removeEventListener("popstate",pop);
  },[]);

  function openDetail(index: number,recordHistory=true) {
    closingRequested.current=false;
    const saved=!recordHistory?spatialCaseOrigin(window.history.state):undefined;
    const originIndex=saved?.worldIndex??index;
    if(recordHistory){const root={...view.current,worldIndex:index,scrollY:window.scrollY};pageScroll.current=root.scrollY;rememberSpatialReturn(window.history,entryPath.current,root);writeSpatialCase(window.history,window.location,index,root);}
    setWorldIndex(originIndex);setDetailIndex(index);
    const panel = [...document.querySelectorAll<HTMLElement>(`.spatialGamePanel[data-game-id="${platformGames[originIndex].id}"]`)].find(element => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden");
    const box = (panel?.querySelector(".spatialPanelMedia") ?? panel)?.getBoundingClientRect();
    panelOrigin.current = box ? { gameId: platformGames[originIndex].id, left: box.left, top: box.top, width: box.width, height: box.height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight } : null;
    // Freeze before the dialog's layout effect locks scrolling, not in a later passive effect.
    sceneRef.current?.setDetailOpen(true);
    setDetailFocus(true); setDetailOpen(true);
  }
  function requestCloseDetail(){
    if(closingRequested.current)return;closingRequested.current=true;
    if(hasSpatialCaseEntry(window.history.state))window.history.back();
    else{clearSpatialCase(window.history,window.location);setDetailOpen(false);}
  }
  function navigateGame(index:number){
    setWorldIndex(index);requestAnimationFrame(()=>{const el=document.querySelector<HTMLElement>(`[data-game-id="${platformGames[index].id}"]`);if(el)window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top-140,behavior:"instant"});});
  }

  function changeCategory(next: string) {
    setCategory(next);
    if (next !== "Все игры" && game.genre !== next) setWorldIndex(Math.max(0, platformGames.findIndex(item => item.genre === next)));
  }
  function togglePause(){
    const next=!paused;
    // Acknowledge the control in this event, before React's passive prop effects.
    sceneRef.current?.setPaused(next);setPaused(next);
  }
  function releaseBeforeGame(event: React.MouseEvent) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
    if (isSpatialGameLaunch(link.href, window.location.origin)) {
      const pathname=new URL(link.href).pathname;
      const index=platformGames.findIndex(item=>new URL(item.href,window.location.origin).pathname===pathname);
      launchView.current=spatialReturnForGame(index,{...view.current,scrollY:view.current.detailOpen?pageScroll.current:window.scrollY});
      setWorldIndex(launchView.current.worldIndex);setCategory(launchView.current.category);
      rememberSpatialReturn(window.history,entryPath.current,launchView.current);sceneRef.current?.dispose();setSceneStatus("fallback");
    } else rememberView();
  }

  return (
    <div className="spatialPage platPage" data-scene-state={sceneStatus} data-detail-open={detailOpen} data-site-build={import.meta.env.VITE_APP_COMMIT} onClickCapture={releaseBeforeGame}>
      <a className="platSkip" href="#spatial-main">К содержимому</a>
      <PlatformHeader />
      <main id="spatial-main">
        <section className="spatialJourney" ref={stageRef} aria-label="Игровые миры BLACKCROWN">
          <div className="spatialCanvasSticky">
            <SpatialPoster />
            <React.Suspense fallback={null}><SpatialScene ref={sceneRef} stageRef={stageRef} worldIndex={detailIndex??worldIndex} visibleGames={visibleGames} detailOpen={detailOpen} detailFocus={detailFocus} paused={paused} onStatus={setSceneStatus} onProgress={onProgress} /></React.Suspense>
            <div className="spatialVignette" aria-hidden="true" />
          </div>
          <div className="spatialJourneyContent">
            <section className="spatialHero" id="spatial-start" aria-labelledby="spatial-title">
              <p className="spatialHeroLabel spatialEyebrow">НЕЗАВИСИМЫЕ ИГРОВЫЕ МИРЫ</p>
              <div className="spatialBrandSlot" aria-hidden="true"><picture><source media="(max-width:760px)" srcSet={SPATIAL_BRAND_MODEL.mobilePosterUrl}/><img className="spatialBrandPoster" src={SPATIAL_BRAND_MODEL.posterUrl} alt="" width="640" height="464" decoding="async"/></picture></div>
              <div className="spatialHeroCopy">
                <h1 id="spatial-title">У каждого —<br/><span>свой мир.</span></h1>
                <p className="spatialLead">От первого боя до тихой долины.</p>
              </div>
              <div className="spatialHeroDock">
                {sceneStatus!=="fallback"&&load.phase!=="complete"&&<div className="spatialLoad" role="status"><svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="12" style={{strokeDasharray:76,strokeDashoffset:76*(1-(load.total?Math.min(.99,load.complete/load.total):0))}}/></svg><span>{load.phase==="prepare"?"Подготовка сцены":load.total?"Сцена · "+Math.min(99,Math.round(load.complete/load.total*100))+"%":"Загрузка сцены"}</span></div>}
                <span className="spatialHeroCount">{String(platformGames.length).padStart(2,"0")} МИРА ДЛЯ ТВОЕЙ ИСТОРИИ</span>
                <div className="spatialActions"><a className="platButton" href="#spatial-worlds">Выбрать игру <span aria-hidden="true">↓</span></a><a className="platTextLink" href={platformGames[0].href}><span><span className="spatialHeroLaunchPrefix">Начать с </span>Ballcrown</span><span aria-hidden="true">↗</span></a></div>
              </div>
            </section>
            <section className="spatialIntro" id="spatial-intro" aria-labelledby="spatial-intro-title"><p className="spatialEyebrow">01 / BLACKCROWN</p><h2 id="spatial-intro-title">Один знак.<br/><span>Разные миры.</span></h2><p>Быстрый бой, неизвестный океан или день в своей долине.<br/>Здесь у каждой игры — собственный характер и темп.</p><a className="platTextLink" href="/about">О платформе ↗</a></section>
            <section className="spatialGallerySection" id="spatial-worlds" aria-labelledby="spatial-world-title"><span id="spatial-games"/>
              <div className="spatialGalleryHead"><div className="spatialGalleryHeading"><p className="spatialEyebrow">02 / КОЛЛЕКЦИЯ</p><h2 id="spatial-world-title">Выбери историю.</h2></div><div className="spatialFilters" role="group" aria-label="Жанр игры">{categories.map(item => <button key={item} type="button" aria-label={item} aria-pressed={category === item} onClick={() => changeCategory(item)}>{item === "Все игры" ? "Все" : item}</button>)}</div></div>
              <div className="spatialGalleryDeck">
                <GamePanelGrid selected={worldIndex} visible={visibleGames} onOpen={openDetail}/>
                <div className="spatialGalleryFoot"><span>Выбери мир — и начинай игру.</span><a className="platTextLink" href="/games/">Весь каталог <span aria-hidden="true">↗</span></a></div>
              </div>
            </section>
            <section className="spatialTransition" id="spatial-transition" aria-labelledby="spatial-transition-title"><div><p className="spatialEyebrow">03 / МЕЖДУ МИРАМИ</p><h2 id="spatial-transition-title">Форма.<br/><span>В движении.</span></h2><p>Металл, свет и твой жест.</p></div></section>
            <section className="spatialMaterial" id="spatial-lab" aria-labelledby="spatial-material-title">
              <div className="spatialMaterialCopy"><p className="spatialEyebrow">04 / BLACKCROWN LAB</p><h2 id="spatial-material-title">Коснись.<br/><span>Оставь волну.</span></h2><p id="spatial-cloth-help">Потяни поверхность по горизонтали.<br/>Или коснись, чтобы оставить волну.</p><p className="spatialClothStatus" role="status">{clothTouch?(paused?"Сцена на паузе.":clothTouch.accepted?"Касание принято.":"Движение отключено."):""}</p></div>
              <button className="spatialClothControl" type="button" aria-label="Коснуться металлического полотна" aria-describedby="spatial-cloth-help" onClick={event=>{
                const box=event.currentTarget.getBoundingClientRect(),keyboard=event.detail===0;
                const x=keyboard?box.width/2:event.clientX-box.left,y=keyboard?box.height/2:event.clientY-box.top;
                const accepted=sceneRef.current?.touchCloth(keyboard?undefined:event.clientX,keyboard?undefined:event.clientY)??false;
                setClothTouch({x,y,key:(clothTouch?.key??0)+1,accepted});
              }}><span className="spatialClothFallback" aria-hidden="true"/>{clothTouch?.accepted&&<span key={clothTouch.key} className="spatialClothPulse" style={{left:clothTouch.x,top:clothTouch.y}} aria-hidden="true"/>}<span className="spatialClothHint" aria-hidden="true">Коснись поверхности <span>+</span></span></button>
            </section>
            <section className="spatialAbout" aria-labelledby="spatial-about-title">
              <div className="spatialAboutCopy"><p className="spatialEyebrow">05 / ПРОДОЛЖЕНИЕ</p><h2 id="spatial-about-title">Какой мир —<br/><span>следующий?</span></h2></div><div className="spatialAboutText"><p>Быстрый бой или тихая долина.<br/>Выбери, куда вернуться.</p><a className="platButton spatialReturnLink" href="#spatial-worlds">К коллекции <span aria-hidden="true">↑</span></a><div className="spatialActions"><a className="platTextLink" href="/about">О проекте <span aria-hidden="true">↗</span></a><a className="platTextLink" href="/support">Нужна помощь? <span aria-hidden="true">↗</span></a><a className="platTextLink" href="/nexus-lab">Сцена короны <span aria-hidden="true">↗</span></a></div></div>
              <div className="spatialOutroClothSlot" aria-hidden="true"/>
            </section>
          </div>
        </section>
      </main>
      <SpatialNavigator category={category} onCategory={changeCategory} onGame={navigateGame} disabled={detailOpen} openSignal={navigatorSignal}/>
      <button className="spatialMotionToggle" type="button" aria-pressed={paused} aria-label={paused ? "Продолжить движение сцены" : "Пауза движения сцены"} onClick={togglePause}><span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span><span>{paused ? "Продолжить" : "Пауза"}</span></button>
      <GameDetail open={detailOpen} origin={panelOrigin.current} game={detailGame} canCycle={visibleGames.length > 1} paused={paused} onTogglePause={togglePause} onClosing={startClosingDetail} onClose={closeDetail} onRequestClose={requestCloseDetail} onSearch={()=>{searchAfterClose.current=true;requestCloseDetail();}} onPrevious={() => step(-1)} onNext={() => step(1)}/>
    </div>
  );
}

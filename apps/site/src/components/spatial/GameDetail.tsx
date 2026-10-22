import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PlatformGame } from "../../lib/platformGames";
import { prefersStaticPlatform } from "../platform/usePlatformParallax";
import { DETAIL_REST, detailOriginPose, detailPlaneStyle, detailPosterSize, detailProjectQuad, detailQuadPose, detailRectQuad, detailReveal, detailSettledPose, detailSurfaceQuad, type MediaRect, type PanelOrigin } from "./detailTransition";
import { SurfaceMotion, SPATIAL_TIMING } from "./spatialMotion";
import { frameLoop } from "../../experience/core/FrameLoop";
import { CaseMedia } from "./CaseMedia";
import { DecodedText } from "./DecodedText";
import "./spatialDetail.css";

export type { PanelOrigin } from "./detailTransition";
type Props = { open: boolean; origin?: PanelOrigin | null; game: PlatformGame; canCycle: boolean; paused: boolean; onTogglePause: () => void; onClosing?: () => void; onClose: () => void; onRequestClose:()=>void;onSearch:()=>void;onPrevious: () => void; onNext: () => void };
const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
// Crop/reveal and four projective corners share one interruptible clock.
const rest = DETAIL_REST;

/** Native modal, with one interruptible poster/crop/reveal clock. */
export function GameDetail({ open, origin, game, canCycle, paused, onTogglePause, onClosing, onClose, onRequestClose,onSearch,onPrevious, onNext }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mediaRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const informationRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const phase = useRef<"closed" | "opening" | "open" | "closing">("closed");
  const [closingVisual,setClosingVisual] = useState(false);
  const [arrived,setArrived] = useState(false);
  const outgoingGame = useRef(game);
  const visualGame = closingVisual ? outgoingGame.current : game;
  const paintedGame = useRef(visualGame); paintedGame.current=visualGame;
  const currentGameId = useRef(game.id); currentGameId.current = origin?.gameId??game.id;
  const previousGame = useRef(game.id);
  const swipe=useRef<{x:number;y:number}|null>(null);
  const [surface] = useState(() => new SurfaceMotion(rest));
  const frame = useRef(0), focusFrame = useRef(0), closeScroll = useRef(0), epoch=useRef(0), focusEpoch=useRef(0);
  const mediaBox=useRef<MediaRect>();
  const endpoint=useRef([...rest]);
  const restorePage = useRef<(() => void) | null>(null);
  const restoreFocus = useRef<(() => void) | null>(null);
  const source=useRef<{element:HTMLElement;previous:string|undefined}|null>(null);
  const chromeHold=useRef<{element:HTMLElement;previous:string|undefined}|null>(null);
  const connectedHandoff=useRef(false);
  const staticMotion = () => prefersStaticPlatform(window.matchMedia("(prefers-reduced-motion: reduce)"));
  function holdChrome() {
    const element=dialogRef.current?.closest<HTMLElement>(".spatialPage");
    if(!element||chromeHold.current?.element===element)return;
    clearChromeHold();chromeHold.current={element,previous:element.dataset.caseChromeHeld};element.dataset.caseChromeHeld="true";
  }
  function clearChromeHold() {
    if(!chromeHold.current)return;
    const {element,previous}=chromeHold.current;
    if(previous===undefined)delete element.dataset.caseChromeHeld;else element.dataset.caseChromeHeld=previous;
    chromeHold.current=null;
  }
  function markSource() {
    const element=document.querySelector<HTMLElement>(`.spatialGamePanel[data-game-id="${currentGameId.current}"]`);
    if(source.current?.element===element)return;
    clearSource();
    if(element){source.current={element,previous:element.dataset.caseHandoff};element.dataset.caseHandoff="true";window.dispatchEvent(new Event("spatialcasehandoff"));}
  }
  function clearSource() {
    if(source.current){const {element,previous}=source.current;if(previous===undefined)delete element.dataset.caseHandoff;else element.dataset.caseHandoff=previous;source.current=null;window.dispatchEvent(new Event("spatialcasehandoff"));}
  }
  function cancelFrame() { ++epoch.current;frameLoop.cancel(frame.current);frame.current=0; }
  function baseRect() {
    const media = mediaRef.current;if(!media)return;
    const transform=media.style.transform;media.style.transform="none";
    const box=media.getBoundingClientRect();media.style.transform=transform;
    return {left:box.left,top:box.top,width:box.width,height:box.height};
  }
  function paintedQuad() {
    // Native dialog scrolling moves the slot without changing its transform.
    // Capture today's anchor, not the opening-time viewport coordinates.
    const box=baseRect()??mediaBox.current;
    return box?detailSurfaceQuad(box,surface.value):null;
  }
  function sourceOrigin():PanelOrigin|null {
    if(origin?.gameId!==game.id||Math.abs(origin.viewportWidth-innerWidth)>1||Math.abs(origin.viewportHeight-innerHeight)>1)return null;
    const panel=document.querySelector<HTMLElement>(`.spatialGamePanel[data-game-id="${origin.gameId}"] .spatialPanelMedia`);
    const box=panel?.getBoundingClientRect();
    if(!panel||!box?.width||!box.height)return null;
    const plane=panel.closest<HTMLElement>(".spatialPanelSurface");
    let quad=detailRectQuad(box);
    if(plane){
      const transform=getComputedStyle(plane).transform,value=plane.style.getPropertyValue("transform"),priority=plane.style.getPropertyPriority("transform");
      try{
        const matrix=new DOMMatrixReadOnly(transform==="none"?undefined:transform);
        // Measuring the native slot is synchronous and restored before paint;
        // no change is made to the gallery's authored matrix or its unit W.
        plane.style.setProperty("transform","none","important");
        const native=plane.getBoundingClientRect(),media=panel.getBoundingClientRect();
        quad=detailProjectQuad(Array.from(matrix.toFloat64Array()),{left:media.left-native.left,top:media.top-native.top,width:media.width,height:media.height},native)??quad;
      }catch{/* Axis-aligned media remains a safe fallback for an unavailable matrix. */}
      finally{if(value)plane.style.setProperty("transform",value,priority);else plane.style.removeProperty("transform");}
    }
    return {...origin,left:box.left,top:box.top,width:box.width,height:box.height,quad};
  }
  function originPose(fresh=false) {
    const target=sourceOrigin()??(fresh?null:origin);
    const pose=detailOriginPose(target,game.id,innerWidth,innerHeight,mediaBox.current);
    const connected=!!target&&!!mediaBox.current?.width&&!!mediaBox.current.height&&target.gameId===game.id&&Math.abs(target.viewportWidth-innerWidth)<=1&&Math.abs(target.viewportHeight-innerHeight)<=1;
    connectedHandoff.current=connected;
    if(!fresh)endpoint.current=detailSettledPose(connected?target?.quad:null);
    if(connected){
      const projected=detailQuadPose(target.quad??detailRectQuad(target),mediaBox.current!,1,0);
      if(projected)return projected;
      pose[4]=1;
    }
    return [...pose,0,...endpoint.current.slice(6)];
  }
  function paintSurface() {
    const media=mediaRef.current,box=mediaBox.current,dialog=dialogRef.current;if(!media||!box?.width||!box.height||!dialog)return;
    const [,,rawX,rawY,opacity,arrival]=surface.value,sx=Math.max(.05,rawX),sy=Math.max(.05,rawY);
    media.style.transform=detailPlaneStyle(box,surface.value);
    media.style.opacity=String(Math.max(0,Math.min(1,opacity)));
    const image=media.querySelector("img");
    if(image){
      const aspect=image.naturalWidth&&image.naturalHeight?image.naturalWidth/image.naturalHeight:16/9;
      const fitted=detailPosterSize(box.width*sx,box.height*sy,aspect,arrival,paintedGame.current.id==="crown-front");
      image.style.width=`${fitted.width/sx}px`;image.style.height=`${fitted.height/sy}px`;
    }
    const reveal=detailReveal(arrival);
    dialog.style.setProperty("--detail-reveal",String(reveal.frame));
    dialog.style.setProperty("--detail-copy",String(reveal.copy));
    dialog.style.setProperty("--detail-source-title",String(connectedHandoff.current?reveal.source:0));
    dialog.style.setProperty("--detail-tools",String(phase.current==="closing"?reveal.frame:.45+.55*reveal.frame));
    const title=media.querySelector<HTMLElement>(".spatialHandoffTitle");
    if(title){title.style.transform=`scale(${1/sx},${1/sy})`;title.style.left=`${16/sx}px`;title.style.bottom=`${14/sy}px`;}
  }
  function finishGhost() {
    phase.current="closed";setClosingVisual(false);setArrived(false);clearSource();
  }
  useClientLayoutEffect(()=>{
    if(closingVisual||phase.current!=="closed")return;
    // React has removed the outgoing dialog's closing display before native
    // navigation and gallery copy return in this same layout commit.
    clearChromeHold();const focus=restoreFocus.current;restoreFocus.current=null;focus?.();
  },[closingVisual]);
  function restoreSourceThenFinish() {
    const token=epoch.current;
    // The invalidation queues the restored GPU cover before this release. Keep
    // the outgoing poster through that render, so there is no uncovered paint.
    clearSource();
    frame.current=frameLoop.request(()=>{
      if(token!==epoch.current||phase.current!=="closing")return;
      frame.current=0;finishGhost();
    },"case-return-release");
  }
  function settle() {
    cancelFrame();
    if(phase.current==="closing"){restoreSourceThenFinish();return;}
    if(phase.current!=="closed"){
      mediaBox.current=baseRect();surface.rebase(endpoint.current);paintSurface();phase.current="open";setArrived(true);
    }
  }
  function schedule(token=epoch.current) {
    frame.current=frameLoop.request(now=>{
      if(token!==epoch.current)return;frame.current=0;
      surface.sample(now);paintSurface();
      if(surface.active)schedule(token);
      else if(phase.current==="closing")restoreSourceThenFinish();
      else{phase.current="open";setArrived(true);}
    },"case-handoff");
  }
  function lockPage() {
    const overflow=document.body.style.overflow,scroll={top:scrollY,left:scrollX},viewport={width:innerWidth,height:innerHeight};
    const sourceTop=document.querySelector(`.spatialGamePanel[data-game-id="${currentGameId.current}"]`)?.getBoundingClientRect().top??140;
    const location=window.location.pathname+window.location.search,opener=document.activeElement as HTMLElement|null;
    document.body.style.overflow="hidden";
    restorePage.current=()=>{
      document.body.style.overflow=overflow;
      if(window.location.pathname+window.location.search===location){
        const changed=viewport.width!==innerWidth||viewport.height!==innerHeight;
        const panel=changed?document.querySelector(`.spatialGamePanel[data-game-id="${currentGameId.current}"]`):null;
        window.scrollTo({left:scroll.left,top:panel?scrollY+panel.getBoundingClientRect().top-Math.min(Math.max(100,sourceTop),innerHeight*.35):scroll.top,behavior:"instant"});
      }
      const token=focusEpoch.current;
      restoreFocus.current=()=>{
        focusFrame.current=requestAnimationFrame(()=>{
          if(token!==focusEpoch.current||phase.current==="open"||phase.current==="opening"||document.querySelector("dialog[open]"))return;
          const candidates=[...document.querySelectorAll<HTMLElement>(`.spatialGamePanel[data-game-id="${currentGameId.current}"] button`)];
          const panel=candidates.find(element=>element.getClientRects().length&&getComputedStyle(element).visibility!=="hidden");
          (panel??(opener?.isConnected?opener:null))?.focus({preventScroll:true});
        });
      };
    };
  }
  function releasePage(){const release=restorePage.current;restorePage.current=null;release?.();}
  function closePanel() {
    const dialog=dialogRef.current;if((phase.current!=="open"&&phase.current!=="opening")||!dialog)return;
    const now=frameLoop.now();surface.sample(now);paintSurface();cancelFrame();
    const previousQuad=paintedQuad(),previous=[...surface.value];
    outgoingGame.current=game;phase.current="closing";setArrived(false);dialog.dataset.mediaArrived="false";
    const detailScroll=dialog.scrollTop;
    dialog.close();dialog.dataset.phase="closing";dialog.inert=true;dialog.setAttribute("aria-hidden","true");
    dialog.scrollTop=detailScroll;setClosingVisual(true);
    releasePage();closeScroll.current=scrollY;mediaBox.current=baseRect();
    if(previousQuad&&mediaBox.current){const rebased=detailQuadPose(previousQuad,mediaBox.current,previous[4],previous[5]);if(rebased)surface.rebase(rebased,true);}
    const destination=originPose(true);
    if(!connectedHandoff.current)destination[4]=0;
    onClosing?.();onClose();
    if(staticMotion()){surface.rebase(destination);paintSurface();restoreSourceThenFinish();return;}
    surface.moveTo(destination,SPATIAL_TIMING.close,now);schedule();
  }
  useClientLayoutEffect(()=>{
    const dialog=dialogRef.current,media=mediaRef.current;
    if(!open){if(phase.current==="open"||phase.current==="opening")closePanel();return;}
    if(!dialog||!media)return;
    const now=frameLoop.now(),reopening=phase.current==="closing"&&outgoingGame.current.id===game.id;
    surface.sample(now);paintSurface();
    const previousQuad=reopening?paintedQuad():null,previous=[...surface.value];
    cancelFrame();++focusEpoch.current;cancelAnimationFrame(focusFrame.current);restoreFocus.current=null;
    phase.current="opening";setClosingVisual(false);setArrived(false);delete dialog.dataset.phase;
    dialog.inert=false;dialog.removeAttribute("aria-hidden");
    holdChrome();lockPage();dialog.showModal();dialog.scrollTo({top:0,behavior:"instant"});mediaBox.current=baseRect();markSource();
    const box=mediaBox.current;
    if(reopening&&previousQuad&&box?.width&&box.height){
      surface.rebase(detailQuadPose(previousQuad,box,previous[4],previous[5])??originPose(),true);
    }else surface.rebase(originPose());
    previousGame.current=game.id;closeRef.current?.focus({preventScroll:true});
    if(staticMotion()){settle();return;}
    surface.moveTo(endpoint.current,SPATIAL_TIMING.open,now);paintSurface();schedule();
  },[open]);
  useClientLayoutEffect(()=>{
    if(!open||previousGame.current===game.id)return;
    // A related case stays in the same native modal, with the same media clock.
    cancelFrame();dialogRef.current?.scrollTo({top:0,behavior:"instant"});setArrived(false);
    mediaBox.current=baseRect();const related=[...endpoint.current];related[4]=.3;surface.rebase(related);phase.current="opening";
    previousGame.current=game.id;
    if(staticMotion()){settle();return;}
    surface.moveTo(endpoint.current,420,frameLoop.now());paintSurface();schedule();
  },[open,game.id]);
  useEffect(()=>{
    const query=window.matchMedia("(prefers-reduced-motion: reduce)");
    const preference=()=>{if(staticMotion())settle();};
    const resize=()=>{if(phase.current!=="closed")settle();};
    const scroll=()=>{if(phase.current==="closing"&&Math.abs(scrollY-closeScroll.current)>2)settle();};
    const observer=new MutationObserver(preference);observer.observe(document.documentElement,{attributes:true,attributeFilter:["data-reduced-motion"]});
    query.addEventListener("change",preference);window.addEventListener("resize",resize);window.addEventListener("scroll",scroll,{passive:true});
    return()=>{
      cancelFrame();++focusEpoch.current;cancelAnimationFrame(focusFrame.current);observer.disconnect();query.removeEventListener("change",preference);window.removeEventListener("resize",resize);window.removeEventListener("scroll",scroll);
      dialogRef.current?.close();releasePage();cancelAnimationFrame(focusFrame.current);restoreFocus.current=null;clearSource();clearChromeHold();
    };
  },[]);

  return <dialog id="spatial-game-detail" ref={dialogRef} className="spatialDetail" data-game-id={visualGame.id} data-paused={paused} data-media-arrived={arrived} data-phase={closingVisual ? "closing" : undefined} aria-hidden={closingVisual || undefined} aria-labelledby="spatial-detail-title" aria-describedby="spatial-detail-description" onCancel={event => { event.preventDefault(); onRequestClose(); }} onClick={event=>{if(event.target===dialogRef.current)onRequestClose();}} onKeyDown={event=>{if(!canCycle||event.target instanceof HTMLInputElement)return;if(event.key==="ArrowLeft"){event.preventDefault();onPrevious();}if(event.key==="ArrowRight"){event.preventDefault();onNext();}}}>
    <div className="spatialCaseOptics" aria-hidden="true"><i/><i/></div>
    <nav className="spatialCaseNav" aria-label="Навигация BLACKCROWN в кейсе"><button type="button" onClick={onRequestClose}>Игры</button><a href="/store">Магазин</a><a href="/about">О проекте</a><a href="/account">Профиль ↗</a></nav>
    <div className="spatialDetailFrame">
    <div className="spatialDetailTop"><span>BLACKCROWN / <DecodedText text={visualGame.genre} token={visualGame.id}/></span><div className="spatialDetailTools"><button className="spatialDetailPause" type="button" aria-pressed={paused} aria-label={paused ? "Продолжить сцену" : "Пауза сцены"} onClick={onTogglePause}>{paused ? "▷" : "Ⅱ"}</button><button ref={closeRef} type="button" onClick={onRequestClose} aria-label="Закрыть панель и вернуться к выбранной игре"><span aria-hidden="true">×</span></button></div></div>
    <div className="spatialDetailInner">
      <figure className="spatialDetailMedia" ref={mediaRef} onPointerDown={e=>{if(e.pointerType==="touch")swipe.current={x:e.clientX,y:e.clientY};}} onPointerCancel={()=>swipe.current=null} onPointerUp={e=>{const start=swipe.current;swipe.current=null;if(!start||!canCycle)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)>55&&Math.abs(dy)<35){if(dx<0)onNext();else onPrevious();}}}><CaseMedia game={visualGame} open={open && arrived} paused={paused} onPosterLoad={paintSurface}/><div className="spatialHandoffTitle" aria-hidden="true"><span>{visualGame.status}</span><strong>{visualGame.title}</strong></div></figure>
      <div className="spatialDetailBody">
      <div className="spatialDetailCopy" ref={copyRef}>
        <div className="spatialDetailHeadingMeta"><p className="spatialDetailState"><DecodedText text={visualGame.status} token={visualGame.id}/></p></div>
        <h2 id="spatial-detail-title">{visualGame.title}</h2>
      </div>
      <div className="spatialDetailInformation" ref={informationRef}>
        <div className="spatialDetailDescription"><p id="spatial-detail-description"><DecodedText text={visualGame.description} token={visualGame.id}/></p><dl className="spatialCaseFacts"><div><dt>Жанр</dt><dd>{visualGame.genre}</dd></div><div><dt>Доступ</dt><dd>{visualGame.status}</dd></div><div><dt>Об игре</dt><dd>{visualGame.detail}</dd></div></dl></div>
        <div className="spatialDetailLinks"><a href={visualGame.href}>{visualGame.id === "crown-front" ? "Открыть альфу" : "Играть в " + visualGame.title}<span aria-hidden="true">↗</span></a><a className="spatialCaseHelp" href="/support">Помощь с игрой <span aria-hidden="true">↗</span></a><button type="button" onClick={onRequestClose}>← К галерее</button></div>
      </div>
      <div className="spatialDetailBottom"><button type="button" aria-label="← Предыдущая игра" disabled={!canCycle} onClick={() => { if (phase.current === "open" || phase.current === "opening") onPrevious(); }}>← Предыдущая</button><span aria-hidden="true">/</span><button type="button" aria-label="Следующая игра →" disabled={!canCycle} onClick={() => { if (phase.current === "open" || phase.current === "opening") onNext(); }}>Следующая →</button></div>
      <button className="spatialCaseSearch" type="button" onClick={onSearch}>Найти другой мир <span aria-hidden="true">⌕</span></button>
      </div>
    </div></div>
  </dialog>;
}

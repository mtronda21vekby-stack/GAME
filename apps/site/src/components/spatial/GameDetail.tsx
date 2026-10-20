import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PlatformGame } from "../../lib/platformGames";
import { prefersStaticPlatform } from "../platform/usePlatformParallax";
import { detailOriginPose, type PanelOrigin } from "./detailTransition";
import { SurfaceMotion, SPATIAL_TIMING } from "./spatialMotion";
import { CaseMedia } from "./CaseMedia";
import { DecodedText } from "./DecodedText";
import "./spatialDetail.css";

export type { PanelOrigin } from "./detailTransition";
type Props = { open: boolean; origin?: PanelOrigin | null; game: PlatformGame; canCycle: boolean; paused: boolean; onTogglePause: () => void; onClosing?: () => void; onClose: () => void; onRequestClose:()=>void;onSearch:()=>void;onPrevious: () => void; onNext: () => void };
const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const rest = [0,0,1,1,1];

/** Native modal while open; its outgoing surface becomes inert so a new action can interrupt it. */
export function GameDetail({ open, origin, game, canCycle, paused, onTogglePause, onClosing, onClose, onRequestClose,onSearch,onPrevious, onNext }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mediaRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const informationRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const phase = useRef<"closed" | "open" | "closing">("closed");
  const [closingVisual,setClosingVisual] = useState(false);
  const outgoingGame = useRef(game);
  const visualGame = closingVisual ? outgoingGame.current : game;
  const currentGameId = useRef(game.id); currentGameId.current = origin?.gameId??game.id;
  const previousGame = useRef(game.id);
  const swipe=useRef<{x:number;y:number}|null>(null);
  const [surface] = useState(() => new SurfaceMotion(rest));
  const frame = useRef(0), focusFrame = useRef(0), closeScroll = useRef(0);
  const restorePage = useRef<(() => void) | null>(null);
  const animations = useRef<Animation[]>([]);
  const imageAnimation = useRef<Animation | null>(null);
  const staticMotion = () => prefersStaticPlatform(window.matchMedia("(prefers-reduced-motion: reduce)"));
  const copySurfaces = () => [copyRef.current,informationRef.current].filter((element): element is HTMLDivElement => Boolean(element));
  function originPose() {
    const pose = detailOriginPose(origin,game.id,window.innerWidth,window.innerHeight,baseRect());
    // The selected image remains visible throughout its flight into the larger stage.
    if (origin?.gameId === game.id && Math.abs(origin.viewportWidth-window.innerWidth) <= 1 && Math.abs(origin.viewportHeight-window.innerHeight) <= 1) pose[4] = 1;
    return pose;
  }
  function cancelAnimations() { animations.current.forEach(animation => animation.cancel()); animations.current = []; }
  function paintSurface() {
    if (!mediaRef.current) return;
    const [x,y,sx,sy,opacity] = surface.value;
    mediaRef.current.style.transform = `translate3d(${x}px,${y}px,0) scale(${Math.max(.05,sx)},${Math.max(.05,sy)})`;
    mediaRef.current.style.opacity = String(Math.max(0,Math.min(1,opacity)));
  }
  function baseRect() {
    const media = mediaRef.current;
    if (!media) return;
    const transform = media.style.transform;
    media.style.transform = "none";
    const box = media.getBoundingClientRect();
    media.style.transform = transform;
    return box;
  }
  function finishGhost() {
    phase.current = "closed"; setClosingVisual(false);
    if (dialogRef.current) delete dialogRef.current.dataset.phase;
    cancelAnimations();
  }
  function tick(now: number) {
    frame.current = 0; surface.sample(now); paintSurface();
    if (surface.active) frame.current = requestAnimationFrame(tick);
    else if (phase.current === "closing") finishGhost();
    else if (mediaRef.current) { mediaRef.current.style.transform = "none"; mediaRef.current.style.opacity = "1"; }
  }
  function lockPage() {
    const overflow = document.body.style.overflow;
    const scroll = { top:window.scrollY,left:window.scrollX };
    const viewport={width:innerWidth,height:innerHeight};
    const sourceTop=document.querySelector(`.spatialGamePanel[data-game-id="${currentGameId.current}"]`)?.getBoundingClientRect().top??140;
    const location = window.location.pathname+window.location.search;
    const opener = document.activeElement as HTMLElement | null;
    // Locking the root as well breaks Safari's sticky scene behind the modal.
    document.body.style.overflow = "hidden";
    restorePage.current = () => {
      document.body.style.overflow = overflow;
      if (window.location.pathname+window.location.search === location){
        const changed=viewport.width!==innerWidth||viewport.height!==innerHeight;
        const panel=changed?document.querySelector(`.spatialGamePanel[data-game-id="${currentGameId.current}"]`):null;
        window.scrollTo({left:scroll.left,top:panel?window.scrollY+panel.getBoundingClientRect().top-Math.min(Math.max(100,sourceTop),innerHeight*.35):scroll.top,behavior:"instant"});
      }
      focusFrame.current = requestAnimationFrame(() => {
        const candidates = [...document.querySelectorAll<HTMLElement>(`.spatialGamePanel[data-game-id="${currentGameId.current}"] button`)];
        const panel = candidates.find(element => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden");
        (panel ?? (opener?.isConnected ? opener : null))?.focus({ preventScroll:true });
      });
    };
  }
  function releasePage() { const release = restorePage.current; restorePage.current = null; release?.(); }
  function closePanel() {
    const dialog = dialogRef.current;
    if (phase.current !== "open" || !dialog) return;
    const now = performance.now(); surface.sample(now); paintSurface();
    const destination = origin?.gameId===game.id?originPose():[0,18,.98,.98,0];
    const veil = getComputedStyle(dialog).opacity;
    const copy = copyRef.current ? getComputedStyle(copyRef.current).opacity : "1";
    outgoingGame.current = game; phase.current = "closing";
    cancelAnimationFrame(frame.current); cancelAnimations();
    const detailScroll = dialog.scrollTop;
    dialog.close(); dialog.dataset.phase = "closing"; dialog.inert = true; dialog.setAttribute("aria-hidden","true");
    dialog.scrollTop = detailScroll; setClosingVisual(true);
    releasePage(); closeScroll.current = window.scrollY;
    onClosing?.(); onClose();
    if (staticMotion()) { surface.rebase(destination); finishGhost(); return; }
    surface.moveTo(destination,SPATIAL_TIMING.close,now);
    animations.current.push(dialog.animate([{ opacity:veil },{ opacity:0 }],{ duration:SPATIAL_TIMING.close,easing:"cubic-bezier(.4,0,.2,1)",fill:"forwards" }));
    copySurfaces().forEach(element => animations.current.push(element.animate([{ opacity:copy },{ opacity:0 }],{ duration:220,fill:"forwards" })));
    frame.current = requestAnimationFrame(tick);
  }
  useClientLayoutEffect(() => {
    const dialog = dialogRef.current, media = mediaRef.current;
    if(!open){if(phase.current==="open")closePanel();return;}
    if (!dialog || !media) return;
    const now = performance.now(), reopening = phase.current === "closing";
    surface.sample(now); paintSurface();
    const previousBox = reopening ? media.getBoundingClientRect() : null;
    const opacity = surface.value[4], veil = reopening ? getComputedStyle(dialog).opacity : "0";
    const copyOpacity = reopening && copyRef.current ? getComputedStyle(copyRef.current).opacity : "0";
    cancelAnimationFrame(frame.current); cancelAnimationFrame(focusFrame.current); cancelAnimations();
    phase.current = "open"; setClosingVisual(false); delete dialog.dataset.phase;
    dialog.inert = false; dialog.removeAttribute("aria-hidden");
    lockPage(); dialog.showModal(); dialog.scrollTo({ top:0,behavior:"instant" });
    const box = baseRect();
    if (reopening && previousBox && box?.width && box.height) {
      surface.rebase([previousBox.left+previousBox.width/2-box.left-box.width/2,previousBox.top+previousBox.height/2-box.top-box.height/2,previousBox.width/box.width,previousBox.height/box.height,opacity],true);
    } else {
      surface.rebase(originPose());
      previousGame.current = game.id;
    }
    closeRef.current?.focus({ preventScroll:true });
    if (staticMotion()) { surface.rebase(rest); paintSurface(); return; }
    surface.moveTo(rest,SPATIAL_TIMING.open,now); paintSurface();
    animations.current.push(dialog.animate([{ opacity:veil },{ opacity:1 }],{ duration:280,easing:"ease-in-out" }));
    // The image keeps its long shared-surface flight, while the title and actions
    // acknowledge the click immediately. Reopening retains the visible copy.
    copySurfaces().forEach(element => animations.current.push(element.animate(
      [{ opacity:reopening?copyOpacity:.65,transform:reopening ? "none" : "translateY(8px)" },{ opacity:1,transform:"none" }],
      { duration:480,fill:"backwards",easing:"cubic-bezier(.3,0,.2,1)" },
    )));
    frame.current = requestAnimationFrame(tick);
  },[open]);
  useClientLayoutEffect(() => {
    if (!open) return;
    dialogRef.current?.scrollTo({ top:0,behavior:"instant" });
    if (previousGame.current !== game.id && !staticMotion()) {
      imageAnimation.current?.cancel();
      imageAnimation.current = mediaRef.current?.querySelector("img")?.animate([{ opacity:.25 },{ opacity:1 }],{ duration:420,easing:"ease-in-out" }) ?? null;
    }
    previousGame.current = game.id;
  },[open,game.id]);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      cancelAnimationFrame(frame.current); surface.finish(); paintSurface(); cancelAnimations(); imageAnimation.current?.cancel();
      if (phase.current === "closing") finishGhost();
    };
    const preference = () => { if (staticMotion()) finish(); };
    const resize = () => { if (surface.active) finish(); };
    const scroll = () => { if (phase.current === "closing" && Math.abs(window.scrollY-closeScroll.current) > 2) finish(); };
    const observer = new MutationObserver(preference);
    observer.observe(document.documentElement,{ attributes:true,attributeFilter:["data-reduced-motion"] });
    query.addEventListener("change",preference); window.addEventListener("resize",resize); window.addEventListener("scroll",scroll,{ passive:true });
    return () => {
      cancelAnimationFrame(frame.current); cancelAnimationFrame(focusFrame.current); cancelAnimations(); imageAnimation.current?.cancel();
      observer.disconnect(); query.removeEventListener("change",preference); window.removeEventListener("resize",resize); window.removeEventListener("scroll",scroll);
      dialogRef.current?.close(); releasePage(); cancelAnimationFrame(focusFrame.current);
    };
  },[]);

  return <dialog id="spatial-game-detail" ref={dialogRef} className="spatialDetail" data-game-id={visualGame.id} data-paused={paused} data-phase={closingVisual ? "closing" : undefined} aria-hidden={closingVisual || undefined} aria-labelledby="spatial-detail-title" aria-describedby="spatial-detail-description" onCancel={event => { event.preventDefault(); onRequestClose(); }} onClick={event=>{if(event.target===dialogRef.current)onRequestClose();}} onKeyDown={event=>{if(!canCycle||event.target instanceof HTMLInputElement)return;if(event.key==="ArrowLeft"){event.preventDefault();onPrevious();}if(event.key==="ArrowRight"){event.preventDefault();onNext();}}}>
    <div className="spatialCaseOptics" aria-hidden="true"><i/><i/></div>
    <nav className="spatialCaseNav" aria-label="Навигация BLACKCROWN в кейсе"><button type="button" onClick={onRequestClose}>Игры</button><a href="/store">Магазин</a><a href="/about">О проекте</a><a href="/account">Профиль ↗</a></nav>
    <div className="spatialDetailFrame">
    <div className="spatialDetailTop"><span>BLACKCROWN / <DecodedText text={visualGame.genre} token={visualGame.id}/></span><div className="spatialDetailTools"><button className="spatialDetailPause" type="button" aria-pressed={paused} aria-label={paused ? "Продолжить сцену" : "Пауза сцены"} onClick={onTogglePause}>{paused ? "▷" : "Ⅱ"}</button><button ref={closeRef} type="button" onClick={onRequestClose} aria-label="Закрыть панель и вернуться к выбранной игре"><span aria-hidden="true">×</span></button></div></div>
    <div className="spatialDetailInner">
      <figure className="spatialDetailMedia" ref={mediaRef} onPointerDown={e=>{if(e.pointerType==="touch")swipe.current={x:e.clientX,y:e.clientY};}} onPointerCancel={()=>swipe.current=null} onPointerUp={e=>{const start=swipe.current;swipe.current=null;if(!start||!canCycle)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)>55&&Math.abs(dy)<35){if(dx<0)onNext();else onPrevious();}}}><CaseMedia game={visualGame} open={open} paused={paused}/></figure>
      <div className="spatialDetailCopy" ref={copyRef}>
        <div className="spatialDetailHeadingMeta"><p className="spatialDetailState"><DecodedText text={visualGame.status} token={visualGame.id}/></p></div>
        <h2 id="spatial-detail-title">{visualGame.title}</h2>
      </div>
      <div className="spatialDetailInformation" ref={informationRef}>
        <div className="spatialDetailDescription"><p id="spatial-detail-description"><DecodedText text={visualGame.description} token={visualGame.id}/></p><dl className="spatialCaseFacts"><div><dt>Жанр</dt><dd>{visualGame.genre}</dd></div><div><dt>Доступ</dt><dd>{visualGame.status}</dd></div><div><dt>Об игре</dt><dd>{visualGame.detail}</dd></div></dl></div>
        <div className="spatialDetailLinks"><a href={visualGame.href}>{visualGame.id === "crown-front" ? "Открыть альфу" : "Играть в " + visualGame.title}<span aria-hidden="true">↗</span></a><a className="spatialCaseHelp" href="/support">Помощь с игрой <span aria-hidden="true">↗</span></a><button type="button" onClick={onRequestClose}>← К галерее</button></div>
      </div>
      <div className="spatialDetailBottom"><button type="button" aria-label="← Предыдущая игра" disabled={!canCycle} onClick={() => { if (phase.current === "open") onPrevious(); }}>← Предыдущая</button><span aria-hidden="true">/</span><button type="button" aria-label="Следующая игра →" disabled={!canCycle} onClick={() => { if (phase.current === "open") onNext(); }}>Следующая →</button></div>
      <button className="spatialCaseSearch" type="button" onClick={onSearch}>Найти другой мир <span aria-hidden="true">⌕</span></button>
    </div></div>
  </dialog>;
}

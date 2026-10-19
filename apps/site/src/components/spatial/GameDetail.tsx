import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PlatformGame } from "../../lib/platformGames";
import { prefersStaticPlatform } from "../platform/usePlatformParallax";
import { detailOriginPose, type PanelOrigin } from "./detailTransition";
import { SurfaceMotion, SPATIAL_TIMING } from "./spatialMotion";

export type { PanelOrigin } from "./detailTransition";
type Props = { open: boolean; origin?: PanelOrigin | null; game: PlatformGame; canCycle: boolean; paused: boolean; onTogglePause: () => void; onClosing?: () => void; onClose: () => void; onPrevious: () => void; onNext: () => void };
const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const rest = [0,0,1,1,1];

/** Native modal while open; its outgoing surface becomes inert so a new action can interrupt it. */
export function GameDetail({ open, origin, game, canCycle, paused, onTogglePause, onClosing, onClose, onPrevious, onNext }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mediaRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const phase = useRef<"closed" | "open" | "closing">("closed");
  const [closingVisual,setClosingVisual] = useState(false);
  const outgoingGame = useRef(game);
  const visualGame = closingVisual ? outgoingGame.current : game;
  const currentGameId = useRef(game.id); currentGameId.current = game.id;
  const previousGame = useRef(game.id);
  const [surface] = useState(() => new SurfaceMotion(rest));
  const frame = useRef(0), focusFrame = useRef(0), closeScroll = useRef(0);
  const restorePage = useRef<(() => void) | null>(null);
  const animations = useRef<Animation[]>([]);
  const imageAnimation = useRef<Animation | null>(null);
  const staticMotion = () => prefersStaticPlatform(window.matchMedia("(prefers-reduced-motion: reduce)"));
  function cancelAnimations() { animations.current.forEach(animation => animation.cancel()); animations.current = []; }
  function paintSurface() {
    if (!mediaRef.current) return;
    const [x,y,sx,sy,opacity] = surface.value;
    mediaRef.current.style.transform = `translate(${x}px,${y}px) scale(${Math.max(.05,sx)},${Math.max(.05,sy)})`;
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
    const location = window.location.pathname+window.location.search;
    const opener = document.activeElement as HTMLElement | null;
    // Locking the root as well breaks Safari's sticky scene behind the modal.
    document.body.style.overflow = "hidden";
    restorePage.current = () => {
      document.body.style.overflow = overflow;
      if (window.location.pathname+window.location.search === location) window.scrollTo({ ...scroll,behavior:"instant" });
      focusFrame.current = requestAnimationFrame(() => {
        const candidates = [...document.querySelectorAll<HTMLElement>(`.spatialGamePanel[data-game-id="${currentGameId.current}"] button`)];
        const panel = candidates.find(element => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden");
        (panel ?? document.querySelector<HTMLElement>('.spatialWorldChoices button[aria-pressed="true"]') ?? (opener?.isConnected ? opener : null))?.focus({ preventScroll:true });
      });
    };
  }
  function releasePage() { const release = restorePage.current; restorePage.current = null; release?.(); }
  function closePanel() {
    const dialog = dialogRef.current;
    if (phase.current !== "open" || !dialog) return;
    const now = performance.now(); surface.sample(now); paintSurface();
    const destination = detailOriginPose(origin,game.id,window.innerWidth,window.innerHeight,baseRect());
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
    if (copyRef.current) animations.current.push(copyRef.current.animate([{ opacity:copy },{ opacity:0 }],{ duration:220,fill:"forwards" }));
    frame.current = requestAnimationFrame(tick);
  }
  useClientLayoutEffect(() => {
    const dialog = dialogRef.current, media = mediaRef.current;
    if (!open || !dialog || !media) return;
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
      surface.rebase(detailOriginPose(origin,game.id,window.innerWidth,window.innerHeight,box));
      previousGame.current = game.id;
    }
    closeRef.current?.focus({ preventScroll:true });
    if (staticMotion()) { surface.rebase(rest); paintSurface(); return; }
    surface.moveTo(rest,SPATIAL_TIMING.open,now); paintSurface();
    animations.current.push(dialog.animate([{ opacity:veil },{ opacity:1 }],{ duration:280,easing:"ease-in-out" }));
    // Let the shared image pass the copy before revealing it on stacked layouts.
    // Reversing a close retains the current copy opacity instead of flashing to zero.
    if (copyRef.current) animations.current.push(copyRef.current.animate(
      [{ opacity:copyOpacity,transform:reopening ? "none" : "translateY(16px)" },{ opacity:1,transform:"none" }],
      { duration:360,delay:reopening ? 0 : SPATIAL_TIMING.open-360,fill:"backwards",easing:"cubic-bezier(.3,0,.2,1)" },
    ));
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

  return <dialog id="spatial-game-detail" ref={dialogRef} className="spatialDetail" data-phase={closingVisual ? "closing" : undefined} aria-hidden={closingVisual || undefined} aria-labelledby="spatial-detail-title" aria-describedby="spatial-detail-description" onCancel={event => { event.preventDefault(); closePanel(); }}>
    <div className="spatialDetailTop"><span>BLACKCROWN / ИГРОВЫЕ МИРЫ</span><button ref={closeRef} type="button" onClick={closePanel} aria-label="Закрыть панель и вернуться к выбранной игре"><span aria-hidden="true">×</span> Закрыть</button></div>
    <div className="spatialDetailInner">
      <figure className="spatialDetailMedia" ref={mediaRef}><img key={visualGame.id} src={visualGame.image} alt={visualGame.imageAlt} width="1280" height="720"/></figure>
      <div className="spatialDetailCopy" ref={copyRef}>
        <p className="spatialDetailMeta">{visualGame.genre} / {visualGame.status}</p>
        <h2 id="spatial-detail-title">{visualGame.title}</h2>
        <p id="spatial-detail-description">{visualGame.description}</p>
        <p className="spatialDetailControls">{visualGame.detail}</p>
        <div className="spatialDetailLinks"><a href={visualGame.href}>{visualGame.id === "crown-front" ? "Открыть альфу" : "Играть в " + visualGame.title}<span aria-hidden="true">↗</span></a><button type="button" onClick={closePanel}>← К галерее</button></div>
        <div className="spatialDetailBottom"><button type="button" disabled={!canCycle} onClick={() => { if (phase.current === "open") onPrevious(); }}>← Предыдущая игра</button><button type="button" disabled={!canCycle} onClick={() => { if (phase.current === "open") onNext(); }}>Следующая игра →</button><button className="spatialDetailPause" type="button" aria-pressed={paused} onClick={onTogglePause}>{paused ? "▷ Продолжить сцену" : "Ⅱ Пауза сцены"}</button></div>
      </div>
    </div>
  </dialog>;
}

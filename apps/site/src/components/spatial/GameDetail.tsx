import { useEffect, useRef } from "react";
import type { PlatformGame } from "../../lib/platformGames";
import { prefersStaticPlatform } from "../platform/usePlatformParallax";
import { detailOriginTransform, type PanelOrigin } from "./detailTransition";

export type { PanelOrigin } from "./detailTransition";
type Props = { open: boolean; origin?: PanelOrigin | null; game: PlatformGame; canCycle: boolean; paused: boolean; onTogglePause: () => void; onClosing?: () => void; onClose: () => void; onPrevious: () => void; onNext: () => void };

/** The native dialog keeps focus contained while the same WebGL scene stays alive. */
export function GameDetail({ open, origin, game, canCycle, paused, onTogglePause, onClosing, onClose, onPrevious, onNext }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mediaRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const animations = useRef<Animation[]>([]);
  const currentGameId = useRef(game.id);
  currentGameId.current = game.id;
  const staticMotion = () => prefersStaticPlatform(window.matchMedia("(prefers-reduced-motion: reduce)"));
  function cancelAnimations() { animations.current.forEach(animation => animation.cancel()); animations.current = []; }
  function originTransform() {
    return detailOriginTransform(origin, game.id, window.innerWidth, window.innerHeight, mediaRef.current?.getBoundingClientRect());
  }
  function closePanel() {
    if (closing.current) return;
    onClosing?.();
    if (staticMotion() || !mediaRef.current?.animate || !dialogRef.current) { onClose(); return; }
    closing.current = true;
    // Closing during the opening transition starts at the currently visible pose.
    const mediaStyle = getComputedStyle(mediaRef.current), dialogStyle = getComputedStyle(dialogRef.current);
    const fromMedia = { transform: mediaStyle.transform, opacity: mediaStyle.opacity };
    const fromDialog = { opacity: dialogStyle.opacity };
    const fromCopy = copyRef.current ? { opacity: getComputedStyle(copyRef.current).opacity, transform: getComputedStyle(copyRef.current).transform } : null;
    cancelAnimations();
    const media = mediaRef.current.animate([fromMedia, { transform: originTransform(), opacity: .5 }], { duration: 320, easing: "cubic-bezier(.4,0,.7,.3)", fill: "forwards" });
    const veil = dialogRef.current.animate([fromDialog, { opacity: 0 }], { duration: 320, easing: "ease-in", fill: "forwards" });
    if (copyRef.current && fromCopy) animations.current.push(copyRef.current.animate([fromCopy, { opacity: 0, transform: "translateY(12px)" }], { duration: 150, fill: "forwards" }));
    animations.current.push(media, veil);
    media.finished.then(onClose).catch(() => {});
  }
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    const scroll = { top: window.scrollY, left: window.scrollX };
    const location = window.location.pathname + window.location.search;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    closing.current = false;
    dialog.showModal();
    dialog.scrollTo({ top: 0, behavior: "instant" });
    closeRef.current?.focus({ preventScroll: true });
    if (mediaRef.current?.animate && !staticMotion()) {
      animations.current.push(mediaRef.current.animate([{ transform: originTransform(), opacity: .35 }, { transform: "none", opacity: 1 }], { duration: 480, easing: "cubic-bezier(.18,.7,.18,1)" }));
      if (copyRef.current) animations.current.push(copyRef.current.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 260, delay: 100, fill: "backwards", easing: "ease-out" }));
      animations.current.push(dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 }));
    }
    return () => {
      cancelAnimations();
      dialog.close();
      document.body.style.overflow = overflow;
      document.documentElement.style.overflow = rootOverflow;
      if (window.location.pathname + window.location.search === location) window.scrollTo({ ...scroll, behavior: "instant" });
      requestAnimationFrame(() => {
        const candidates = [...document.querySelectorAll<HTMLElement>(`.spatialGamePanel[data-game-id="${currentGameId.current}"] button`)];
        const panelAction = candidates.find(element => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden");
        const target = panelAction ?? document.querySelector<HTMLElement>('.spatialWorldChoices button[aria-pressed="true"]') ?? (opener?.isConnected ? opener : null);
        target?.focus({ preventScroll: true });
      });
    };
  }, [open]);
  useEffect(() => {
    if (open) dialogRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [open, game.id]);

  return <dialog id="spatial-game-detail" ref={dialogRef} className="spatialDetail" aria-labelledby="spatial-detail-title" aria-describedby="spatial-detail-description" onCancel={event => { event.preventDefault(); closePanel(); }}>
    <div className="spatialDetailTop"><span>BLACKCROWN / ИГРОВЫЕ МИРЫ</span><button ref={closeRef} type="button" onClick={closePanel} aria-label="Закрыть панель и вернуться к выбранной игре"><span aria-hidden="true">×</span> Закрыть</button></div>
    <div className="spatialDetailInner">
      <figure className="spatialDetailMedia" ref={mediaRef}><img key={game.id} src={game.image} alt={game.imageAlt} width="1280" height="720"/></figure>
      <div className="spatialDetailCopy" ref={copyRef}>
        <h2 id="spatial-detail-title">{game.title}</h2>
        <p className="spatialDetailMeta">{game.genre} / {game.status}</p>
        <p id="spatial-detail-description">{game.description}</p>
        <p className="spatialDetailControls">{game.detail}</p>
        <div className="spatialDetailLinks"><a href={game.href}>{game.id === "crown-front" ? "Открыть альфу" : "Запустить игру"} ↗</a><button type="button" onClick={closePanel}>← К галерее</button></div>
        <div className="spatialDetailBottom"><button type="button" disabled={!canCycle} onClick={() => { if (!closing.current) onPrevious(); }}>← Предыдущая игра</button><button type="button" disabled={!canCycle} onClick={() => { if (!closing.current) onNext(); }}>Следующая игра →</button><button className="spatialDetailPause" type="button" aria-pressed={paused} onClick={onTogglePause}>{paused ? "▷ Продолжить сцену" : "Ⅱ Пауза сцены"}</button></div>
      </div>
    </div>
  </dialog>;
}

import { useEffect, useRef } from "react";
import type { PlatformGame } from "../../lib/platformGames";
import { prefersStaticPlatform } from "../platform/usePlatformParallax";

type Props = { open: boolean; game: PlatformGame; canCycle: boolean; paused: boolean; onTogglePause: () => void; onClose: () => void; onPrevious: () => void; onNext: () => void };

/** Native dialog owns focus, Escape and inert background; the WebGL scene can stay alive. */
export function GameDetail({ open, game, canCycle, paused, onTogglePause, onClose, onPrevious, onNext }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const animationRef = useRef<Animation | null>(null);
  const currentGameId = useRef(game.id);
  currentGameId.current = game.id;
  function closePanel() {
    if (closing.current) return;
    const content = contentRef.current;
    if (!content || prefersStaticPlatform(window.matchMedia("(prefers-reduced-motion: reduce)")) || !content.animate) { onClose(); return; }
    closing.current = true;
    animationRef.current?.cancel();
    const animation = content.animate([{ transform: "translateY(0) scale(1)", opacity: 1 }, { transform: "translateY(18px) scale(.94)", opacity: 0 }], { duration: 180, easing: "ease-in", fill: "forwards" });
    animationRef.current = animation;
    animation.finished.then(onClose).catch(() => {});
  }
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closing.current = false;
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
    const content = contentRef.current;
    if (content?.animate && !prefersStaticPlatform(window.matchMedia("(prefers-reduced-motion: reduce)"))) animationRef.current = content.animate([{ transform: "translateY(24px) scale(.94)", opacity: 0 }, { transform: "translateY(0) scale(1)", opacity: 1 }], { duration: 240, easing: "cubic-bezier(.2,.7,.25,1)" });
    return () => {
      animationRef.current?.cancel();
      dialog.close();
      document.body.style.overflow = overflow;
      requestAnimationFrame(() => {
        const candidates = [...document.querySelectorAll<HTMLElement>(`.spatialGamePanel[data-game-id="${currentGameId.current}"] button`)];
        const panelAction = candidates.find(element => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden");
        const target = panelAction ?? document.querySelector<HTMLElement>('.spatialWorldChoices button[aria-pressed="true"]') ?? (opener?.isConnected ? opener : null);
        target?.focus({ preventScroll: true });
      });
    };
  }, [open]);

  return <dialog ref={dialogRef} className="spatialDetail" aria-labelledby="spatial-detail-title" aria-describedby="spatial-detail-description" onCancel={event => { event.preventDefault(); closePanel(); }} onClick={event => { if (event.target === event.currentTarget) closePanel(); }}>
    <div className="spatialDetailInner" ref={contentRef}>
      <div className="spatialDetailTop"><a href="/games/">BLACKCROWN / ИГРОВОЙ МИР</a><button ref={closeRef} type="button" onClick={closePanel} aria-label="Закрыть панель и вернуться к выбранной игре">ЗАКРЫТЬ <span aria-hidden="true">×</span></button></div>
      <div className="spatialDetailTitle"><p className="spatialEyebrow">{game.genre} / {game.status}</p><h2 id="spatial-detail-title">{game.title}</h2></div>
      <div className="spatialDetailBody">
        <figure className="spatialDetailMedia"><img key={game.id} src={game.image} alt={game.imageAlt} width="1280" height="720"/><figcaption>Обложка / {game.title}</figcaption></figure>
        <div className="spatialDetailCopy" key={game.id}><p id="spatial-detail-description">{game.description}</p><dl><div><dt>Жанр</dt><dd>{game.genre}</dd></div><div><dt>Состояние</dt><dd>{game.status}</dd></div><div><dt>В игре</dt><dd>{game.detail}</dd></div></dl><a className="platButton" href={game.href}>{game.id === "crown-front" ? "Открыть альфу" : "Запустить игру"}<span aria-hidden="true">↗</span></a></div>
      </div>
      <div className="spatialDetailBottom"><button type="button" disabled={!canCycle} onClick={onPrevious}>← Предыдущая игра</button><button type="button" disabled={!canCycle} onClick={onNext}>Следующая игра →</button><button className="spatialDetailPause" type="button" aria-pressed={paused} onClick={onTogglePause}>{paused ? "▷ Продолжить сцену" : "Ⅱ Пауза сцены"}</button></div>
    </div>
  </dialog>;
}

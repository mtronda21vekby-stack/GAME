import { useEffect, useRef } from "react";
import type { PlatformGame } from "../../lib/platformGames";

type Props = { open: boolean; game: PlatformGame; canCycle: boolean; paused: boolean; onTogglePause: () => void; onClose: () => void; onPrevious: () => void; onNext: () => void };

/** Native dialog owns focus, Escape and inert background; the WebGL scene can stay alive. */
export function GameDetail({ open, game, canCycle, paused, onTogglePause, onClose, onPrevious, onNext }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      opener?.focus({ preventScroll: true });
    };
  }, [open]);

  return <dialog ref={dialogRef} className="spatialDetail" aria-labelledby="spatial-detail-title" aria-describedby="spatial-detail-description" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="spatialDetailInner">
      <div className="spatialDetailTop"><a href="/games/">BLACKCROWN / ИГРЫ</a><button type="button" autoFocus onClick={onClose} aria-label="Закрыть описание игры">ЗАКРЫТЬ <span aria-hidden="true">×</span></button></div>
      <figure className="spatialDetailMedia"><img key={game.id} src={game.image} alt={game.imageAlt} width="1280" height="720"/><figcaption>{game.status}</figcaption></figure>
      <div className="spatialDetailCopy" key={game.id}>
        <div><p className="spatialEyebrow">{game.genre} / {game.detail}</p><h2 id="spatial-detail-title">{game.title}</h2><p id="spatial-detail-description">{game.description}</p></div>
        <a className="platButton" href={game.href}>{game.id === "crown-front" ? "Открыть альфу" : "Запустить игру"}<span aria-hidden="true">↗</span></a>
      </div>
      <div className="spatialDetailBottom"><button type="button" disabled={!canCycle} onClick={onPrevious}>← Предыдущая игра</button><button type="button" disabled={!canCycle} onClick={onNext}>Следующая игра →</button><button className="spatialDetailPause" type="button" aria-pressed={paused} onClick={onTogglePause}>{paused ? "▷ Продолжить сцену" : "Ⅱ Пауза сцены"}</button></div>
    </div>
  </dialog>;
}

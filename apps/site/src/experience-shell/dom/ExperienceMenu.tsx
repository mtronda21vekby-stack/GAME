import React from "react";
import { EXPERIENCE_CHAPTERS, type ExperienceChapterId } from "../experienceShellConfig";

type ExperienceMenuProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  activeChapter: ExperienceChapterId;
};

export function ExperienceMenu({ open, onClose, triggerRef, activeChapter }: ExperienceMenuProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const documentOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const focusable = panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    focusable?.[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.overflow = documentOverflow;
      document.body.style.overflow = bodyOverflow;
      if (triggerRef.current?.isConnected) triggerRef.current.focus({ preventScroll: true });
    };
  }, [onClose, open, triggerRef]);

  if (!open) return null;
  return (
    <div className="bcExperienceMenu" role="dialog" aria-modal="true" aria-label="BlackCrown worlds menu">
      <button className="bcExperienceMenu__backdrop" type="button" aria-label="Close menu" onClick={onClose} />
      <div ref={panelRef} className="bcExperienceMenu__panel">
        <header><span>BLACKCROWN / WORLDS</span><button type="button" onClick={onClose} aria-label="Close menu">CLOSE</button></header>
        <nav aria-label="Spatial chapters">
          {EXPERIENCE_CHAPTERS.slice(1).map((chapter) => (
            <a key={chapter.id} data-bc-spatial-chapter="true" href={`#${chapter.hash}`} aria-current={activeChapter === chapter.id ? "step" : undefined} onClick={onClose}>
              <span>{chapter.index}</span>{chapter.label}
            </a>
          ))}
        </nav>
        <footer>
          <a href="/store">STORE</a>
          <a href="/account">PROFILE</a>
          <a href="/lobby/">LOBBY</a>
        </footer>
      </div>
    </div>
  );
}


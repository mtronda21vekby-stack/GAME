import React from "react";
import { activateModal } from "../../lib/modalInteraction";
import "./experience-menu.css";
import { EXPERIENCE_CHAPTERS } from "../experienceShellConfig";

type ExperienceMenuProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
};

export function ExperienceMenu({ open, onClose, triggerRef }: ExperienceMenuProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    return activateModal(panel, onClose, triggerRef.current);
  }, [onClose, open, triggerRef]);

  if (!open) return null;
  return (
    <div id="bc-experience-menu" className="bcExperienceMenu" role="dialog" aria-modal="true" aria-label="BlackCrown worlds menu">
      <button className="bcExperienceMenu__backdrop" type="button" tabIndex={-1} aria-label="Close menu" onClick={onClose} />
      <div ref={panelRef} className="bcExperienceMenu__panel" tabIndex={-1}>
        <header><span>BLACKCROWN / WORLDS</span><button type="button" onClick={onClose} aria-label="Close menu">CLOSE</button></header>
        <nav aria-label="Spatial chapters">
          {EXPERIENCE_CHAPTERS.slice(1).map((chapter) => (
            <a key={chapter.id} data-bc-spatial-chapter="true" href={`#${chapter.hash}`} onClick={onClose}>
              <span>{chapter.index}</span>{chapter.label}
            </a>
          ))}
        </nav>
        <footer>
          <a href="/store" onClick={onClose}>STORE</a>
          <a href="/account" onClick={onClose}>PROFILE</a>
          <a href="/lobby/">LOBBY</a>
        </footer>
      </div>
    </div>
  );
}


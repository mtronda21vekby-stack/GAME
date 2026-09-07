import React from "react";
import { nav } from "../../lib/nav";
import { useExperience } from "../../experience/ExperienceContext";
import { QualityControl } from "../../components/nexus/QualityControl";
import { SoundControl } from "../../components/nexus/SoundControl";
import { CHAPTER_BY_ID } from "../experienceShellConfig";
import { ChapterRail } from "./ChapterRail";
import { ExperienceMenu } from "./ExperienceMenu";

export function ExperienceChrome({ finalBlackout }: { finalBlackout: boolean }) {
  const { snapshot } = useExperience();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const chapter = CHAPTER_BY_ID.get(snapshot.chapterId) ?? CHAPTER_BY_ID.get("boot")!;
  const closeMenu = React.useCallback(() => setMenuOpen(false), []);
  const menuVisible = menuOpen && !finalBlackout;

  React.useEffect(() => {
    if (finalBlackout) closeMenu();
  }, [closeMenu, finalBlackout]);

  return (
    <>
      <a className="bcExperienceSkip" href="#bc-experience-story">SKIP TO EXPERIENCE</a>
      <header className="bcExperienceChrome" aria-label="BlackCrown experience navigation">
        <div className="bcExperienceChrome__identity">
          <button type="button" onClick={() => nav("/")}>BLACKCROWN</button>
          <span>{chapter.index} / {chapter.label}</span>
        </div>
        <ChapterRail />
        <div className="bcExperienceChrome__controls">
          <QualityControl />
          <SoundControl />
          <button ref={triggerRef} className="bcExperienceChrome__menuButton" type="button" aria-expanded={menuVisible} onClick={() => setMenuOpen(true)}>
            MENU
          </button>
        </div>
      </header>
      <ExperienceMenu open={menuVisible} onClose={closeMenu} triggerRef={triggerRef} />
    </>
  );
}

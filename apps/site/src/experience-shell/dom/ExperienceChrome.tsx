import React from "react";
import { nav } from "../../lib/nav";
import { useExperience } from "../../experience/ExperienceContext";
import { QualityControl } from "../../components/nexus/QualityControl";
import { SoundControl } from "../../components/nexus/SoundControl";
import { CHAPTER_BY_ID, EXPERIENCE_CHAPTERS } from "../experienceShellConfig";
import { ChapterRail } from "./ChapterRail";
import { ExperienceMenu } from "./ExperienceMenu";

export function ExperienceChrome() {
  const { entered, snapshot } = useExperience();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const chapter = CHAPTER_BY_ID.get(snapshot.chapterId) ?? CHAPTER_BY_ID.get("boot")!;
  const nextChapter = EXPERIENCE_CHAPTERS[EXPERIENCE_CHAPTERS.findIndex((item) => item.id === chapter.id) + 1];
  const closeMenu = React.useCallback(() => setMenuOpen(false), []);

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
          <button ref={triggerRef} className="bcExperienceChrome__menuButton" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            MENU
          </button>
        </div>
      </header>
      {entered && nextChapter && (chapter.id === "boot" || chapter.id === "crown-chamber") ? (
        <a className="bcExperienceContinue" href={`#${nextChapter.hash}`} data-bc-spatial-chapter="true" aria-label={`Continue to ${nextChapter.label}`}>
          <span>SCROLL TO EXPLORE</span><span aria-hidden="true">↓</span>
        </a>
      ) : null}
      <ExperienceMenu open={menuOpen} onClose={closeMenu} triggerRef={triggerRef} activeChapter={chapter.id} />
    </>
  );
}


import { useExperience } from "../../experience/ExperienceContext";
import { EXPERIENCE_CHAPTERS } from "../experienceShellConfig";

export function ChapterRail() {
  const { snapshot } = useExperience();
  return (
    <nav className="bcExperienceChapterRail" aria-label="Experience chapters">
      {EXPERIENCE_CHAPTERS.slice(1).map((chapter) => (
        <a
          key={chapter.id}
          data-bc-spatial-chapter="true"
          href={`#${chapter.hash}`}
          aria-label={`${chapter.index} ${chapter.label}`}
          aria-current={snapshot.chapterId === chapter.id ? "step" : undefined}
        >
          <span>{chapter.index}</span>
        </a>
      ))}
    </nav>
  );
}


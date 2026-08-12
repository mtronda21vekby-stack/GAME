import { useExperience } from "../../experience/ExperienceContext";
import { NEXUS_CHAPTERS } from "../../experience/scroll/ScrollStory";

export function ChapterProgress() {
  const { snapshot } = useExperience();
  const chapter = NEXUS_CHAPTERS.find((candidate) => candidate.id === snapshot.chapterId) ?? NEXUS_CHAPTERS[0];
  return (
    <div className="bcNexusChapterMeter" aria-label={`${chapter.index} ${chapter.label}, ${Math.round(snapshot.chapterProgress * 100)} percent`}>
      <span>{chapter.index}</span>
      <i style={{ "--bc-chapter-progress": snapshot.chapterProgress } as React.CSSProperties} />
      <small>{chapter.label}</small>
    </div>
  );
}

import { useExperience } from "../../experience/ExperienceContext";
import { EXPERIENCE_CHAPTERS } from "../experienceShellConfig";
import { StoryChapter } from "./StoryChapter";
import { StoryNavigation } from "./StoryNavigation";
import "./static-story.css";

export function StorySpine() {
  const { snapshot, storyRef, webglAvailable } = useExperience();
  const staticMode = !webglAvailable;
  return (
    <main ref={storyRef} className="bcNexusStory bcExperienceStory" id="bc-experience-story" data-bc-static-mode={staticMode ? "true" : undefined}>
      <StoryNavigation />
      {staticMode ? (
        <p className="bcExperienceStaticNotice" role="status">
          Упрощённый режим: 3D-сцена недоступна. Игры, магазин и профиль остаются доступны.
        </p>
      ) : null}
      {EXPERIENCE_CHAPTERS.map((chapter) => (
        <StoryChapter key={chapter.id} chapter={chapter} active={staticMode ? chapter.id !== "boot" : snapshot.chapterId === chapter.id} />
      ))}
    </main>
  );
}

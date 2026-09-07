import { useExperience } from "../../experience/ExperienceContext";
import { EXPERIENCE_CHAPTERS } from "../experienceShellConfig";
import { StoryChapter } from "./StoryChapter";
import { StoryNavigation } from "./StoryNavigation";

export function StorySpine() {
  const { snapshot, storyRef } = useExperience();
  return (
    <main ref={storyRef} className="bcNexusStory bcExperienceStory" id="bc-experience-story">
      <StoryNavigation />
      {EXPERIENCE_CHAPTERS.map((chapter) => (
        <StoryChapter
          key={chapter.id}
          chapter={chapter}
          active={snapshot.chapterId === chapter.id}
          progress={snapshot.progress}
        />
      ))}
    </main>
  );
}

import React from "react";
import { EXPERIENCE_STORY_HEIGHT, type ExperienceChapterConfig } from "../experienceShellConfig";
import { SceneCopy } from "../dom/SceneCopy";

export function StoryChapter({ chapter, active }: { chapter: ExperienceChapterConfig; active: boolean }) {
  const span = chapter.range[1] - chapter.range[0];
  return (
    <section
      id={chapter.hash}
      className="bcExperienceStoryChapter"
      data-chapter={chapter.id}
      data-scene={chapter.sceneId}
      data-tone={chapter.tone}
      data-layout={chapter.layout}
      data-range-start={chapter.range[0]}
      data-range-end={chapter.range[1]}
      data-active={active ? "true" : "false"}
      aria-hidden={active ? undefined : true}
      aria-label={`${chapter.index} ${chapter.label}`}
      style={{
        "--bc-chapter-desktop-vh": span * EXPERIENCE_STORY_HEIGHT.desktopVh,
        "--bc-chapter-mobile-vh": span * EXPERIENCE_STORY_HEIGHT.mobileVh,
        "--bc-chapter-landscape-vh": span * EXPERIENCE_STORY_HEIGHT.landscapeVh,
        "--bc-chapter-reduced-vh": span * EXPERIENCE_STORY_HEIGHT.reducedVh,
      } as React.CSSProperties}
      ref={(node) => {
        if (node) (node as HTMLElement & { inert: boolean }).inert = !active;
      }}
    >
      <SceneCopy chapter={chapter} active={active} />
    </section>
  );
}

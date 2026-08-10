import { COMMERCE_CATALOG } from "@blackcrown/commerce";
import type { ExperienceChapterConfig } from "../experienceShellConfig";
import { ExperienceFooter } from "./ExperienceFooter";
import { SceneActions } from "./SceneActions";
import { WorldIndex } from "./WorldIndex";

export function SceneCopy({ chapter, active }: { chapter: ExperienceChapterConfig; active: boolean }) {
  const Heading = chapter.id === "crown-chamber" ? "h1" : "h2";
  return (
    <div className="bcExperienceSceneCopy" data-compact-title={chapter.mobile?.compactTitle ? "true" : undefined}>
      <span>{chapter.eyebrow}</span>
      <Heading>{chapter.title}</Heading>
      {chapter.body ? <p data-mobile-hide={chapter.mobile?.hideBody ? "true" : undefined}>{chapter.body}</p> : null}
      {chapter.id === "network-core" ? <WorldIndex active={active} /> : null}
      {chapter.id === "collection-vault" ? (
        <div className="bcExperienceCollectionIndex" aria-label="Featured catalog items">
          {COMMERCE_CATALOG.slice(0, 4).map((item) => <span key={item.id}>{item.title}</span>)}
        </div>
      ) : null}
      <SceneActions actions={chapter.actions} active={active} />
      {chapter.id === "crown-front-reactor" ? <small>APPROVED ENVIRONMENT ART / PENDING</small> : null}
      {chapter.id === "identity-enter" ? <ExperienceFooter active={active} /> : null}
    </div>
  );
}


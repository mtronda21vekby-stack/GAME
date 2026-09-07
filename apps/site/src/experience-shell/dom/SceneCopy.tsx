import type { ExperienceChapterConfig } from "../experienceShellConfig";
import { getFeaturedCollectionItems } from "../featuredCatalog";
import { SceneActions } from "./SceneActions";
import { WorldIndex } from "./WorldIndex";

export function SceneCopy({ chapter, active }: { chapter: ExperienceChapterConfig; active: boolean }) {
  const finalIdentity = chapter.id === "identity-enter";
  const Heading = chapter.id === "boot" || chapter.id === "crown-chamber" || finalIdentity ? "h1" : "h2";
  const featuredItems = chapter.id === "collection-vault" ? getFeaturedCollectionItems(3) : [];

  return (
    <div
      className="bcExperienceSceneCopy"
      data-compact-title={chapter.mobile?.compactTitle ? "true" : undefined}
      data-final-copy={finalIdentity ? "true" : undefined}
    >
      <span>{chapter.eyebrow}</span>
      <Heading>{chapter.title}</Heading>
      {chapter.body ? <p data-mobile-hide={chapter.mobile?.hideBody ? "true" : undefined}>{chapter.body}</p> : null}
      {chapter.id === "network-core" ? <WorldIndex active={active} /> : null}
      {chapter.id === "collection-vault" ? (
        <div className="bcExperienceCollectionIndex" aria-label="Featured catalog items">
          {featuredItems.map((item) => (
            <span key={item.id} data-category={item.category} data-rarity={item.rarity}>
              <strong>{item.title}</strong>
              <small>{item.category} / {item.rarity}</small>
            </span>
          ))}
        </div>
      ) : null}
      <SceneActions actions={chapter.actions} active={active} />
    </div>
  );
}

import React from "react";
import { useExperience } from "../ExperienceContext";
import type { ScrollChapterId } from "../types";

export const NEXUS_CHAPTERS: readonly {
  id: ScrollChapterId;
  index: string;
  label: string;
  title: string;
  copy: string;
}[] = [
  { id: "awakening", index: "01", label: "AWAKENING", title: "BLACKCROWN SYSTEM ONLINE", copy: "A protected signal wakes inside the network." },
  { id: "assembly", index: "02", label: "ASSEMBLY", title: "THE CROWN ASSEMBLES", copy: "Black titanium segments converge around a living compute core." },
  { id: "inspection", index: "03", label: "INSPECTION", title: "DIGITAL CROWN NEXUS", copy: "One artifact coordinates identity, worlds and player progression." },
  { id: "core-reveal", index: "04", label: "CORE", title: "OPEN THE REACTOR", copy: "The shell parts. Energy channels align with the inner rings." },
  { id: "crown-front", index: "05", label: "CROWN//FRONT", title: "TACTICAL HEIST EXPERIENCE", copy: "A black-and-orange operation forms beyond the portal axis." },
  { id: "ecosystem", index: "06", label: "ECOSYSTEM", title: "ONE CROWN. MANY WORLDS.", copy: "Game, Lobby, Store, Arsenal, Network and Account orbit one identity." },
  { id: "enter", index: "07", label: "ENTER", title: "ENTER THE BLACKCROWN", copy: "Choose the world. The system waits for your command." },
];

function ChapterActions({ id, active }: { id: ScrollChapterId; active: boolean }) {
  const tabIndex = active ? undefined : -1;
  if (id === "inspection") {
    return (
      <div className="bcNexusChapter__actions">
        <a tabIndex={tabIndex} className="bcNexusAction bcNexusAction--primary" href="#bc-nexus-core-reveal">EXPLORE THE NEXUS</a>
        <a tabIndex={tabIndex} className="bcNexusAction" href="/games/crown-front/">ENTER CROWN//FRONT</a>
      </div>
    );
  }
  if (id === "crown-front") {
    return (
      <div className="bcNexusChapter__actions">
        <a tabIndex={tabIndex} className="bcNexusAction bcNexusAction--orange" href="/games/crown-front/">ENTER THE OPERATION</a>
        <span className="bcNexusChapter__development">DEVELOPMENT STATUS / LOCAL PROTOTYPE</span>
      </div>
    );
  }
  if (id === "ecosystem") {
    const primaryModules = [["GAME", "/game/"], ["LOBBY", "/lobby/"], ["STORE", "/store"]] as const;
    const secondaryModules = [["ACCOUNT", "/account"], ["ARSENAL", "/store"], ["COSMETICS", "/store"]] as const;
    const tertiaryModules = [["ROADMAP", "/about"], ["NETWORK", "/about"]] as const;
    const modules = [...primaryModules, ...secondaryModules, ...tertiaryModules];
    return (
      <>
        <div className="bcNexusModules" aria-label="BlackCrown ecosystem">
          {modules.map(([label, href], index) => (
            <a
              tabIndex={tabIndex}
              key={label}
              href={href}
              data-priority={index < 3 ? "primary" : index < 6 ? "secondary" : "tertiary"}
              data-mobile-hidden={index > 3 ? "true" : undefined}
            >{label}</a>
          ))}
        </div>
        <details className="bcNexusModulesMore">
          <summary>MORE WORLDS</summary>
          <div>
            {[...secondaryModules.slice(1), ...tertiaryModules].map(([label, href]) => (
              <a tabIndex={tabIndex} key={label} href={href}>{label}</a>
            ))}
          </div>
        </details>
      </>
    );
  }
  if (id === "enter") {
    return (
      <div className="bcNexusChapter__actions">
        <a tabIndex={tabIndex} className="bcNexusAction bcNexusAction--primary" data-nexus-primary-cta="true" href="/game/">ENTER GAME</a>
        <a tabIndex={tabIndex} className="bcNexusAction" href="/store">OPEN STORE</a>
      </div>
    );
  }
  return null;
}

export function ScrollStory() {
  const { snapshot, storyRef } = useExperience();
  return (
    <main ref={storyRef} className="bcNexusStory">
      {NEXUS_CHAPTERS.map((chapter) => {
        const active = snapshot.chapterId === chapter.id;
        const Heading = chapter.id === "awakening" ? "h1" : "h2";
        return (
          <section
            key={chapter.id}
            id={`bc-nexus-${chapter.id}`}
            className="bcNexusChapter"
            data-chapter={chapter.id}
            data-active={active ? "true" : "false"}
            aria-hidden={active ? undefined : true}
            aria-label={`${chapter.index} ${chapter.label}`}
            ref={(node) => {
              if (node) (node as HTMLElement & { inert: boolean }).inert = !active;
            }}
          >
            <div className="bcNexusChapter__copy">
              <span>{chapter.index} / {chapter.label}</span>
              <Heading>{chapter.title}</Heading>
              <p>{chapter.copy}</p>
              <ChapterActions id={chapter.id} active={active} />
            </div>
          </section>
        );
      })}
    </main>
  );
}

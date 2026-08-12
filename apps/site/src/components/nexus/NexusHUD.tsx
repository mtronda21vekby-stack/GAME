import { nav } from "../../lib/nav";
import { useExperience } from "../../experience/ExperienceContext";
import { NEXUS_CHAPTERS } from "../../experience/scroll/ScrollStory";
import { QualityControl } from "./QualityControl";
import { SoundControl } from "./SoundControl";

export function NexusHUD() {
  const { snapshot } = useExperience();
  const currentChapter = NEXUS_CHAPTERS.find((chapter) => chapter.id === snapshot.chapterId) ?? NEXUS_CHAPTERS[0];
  return (
    <header className="bcNexusHud" aria-label="Nexus navigation">
      <div className="bcNexusHud__identity">
        <button className="bcNexusHud__brand" type="button" onClick={() => nav("/")}>BLACKCROWN</button>
        <span className="bcNexusHud__current">{currentChapter.index} / {currentChapter.label}</span>
      </div>
      <nav className="bcNexusHud__chapters" aria-label="Experience chapters">
        {NEXUS_CHAPTERS.map((chapter) => (
          <a
            key={chapter.id}
            href={`#bc-nexus-${chapter.id}`}
            aria-label={`${chapter.index} ${chapter.label}`}
            aria-current={snapshot.chapterId === chapter.id ? "step" : undefined}
          >
            {chapter.index}
          </a>
        ))}
      </nav>
      <div className="bcNexusHud__controls">
        <span className="bcNexusHud__mode">NEXUS</span>
        <QualityControl />
        <SoundControl />
        <details className="bcNexusHud__menu">
          <summary>MENU</summary>
          <nav aria-label="Nexus destinations">
            <a href="/">HOME</a>
            <a href="/store">STORE</a>
            <a href="/account">ACCOUNT</a>
          </nav>
        </details>
      </div>
    </header>
  );
}

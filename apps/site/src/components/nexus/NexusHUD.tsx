import { nav } from "../../lib/nav";
import { useExperience } from "../../experience/ExperienceContext";
import { NEXUS_CHAPTERS } from "../../experience/scroll/ScrollStory";
import { QualityControl } from "./QualityControl";
import { SoundControl } from "./SoundControl";

export function NexusHUD() {
  const { snapshot } = useExperience();
  return (
    <header className="bcNexusHud" aria-label="Nexus navigation">
      <button className="bcNexusHud__brand" type="button" onClick={() => nav("/")}>BLACKCROWN</button>
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
      </div>
    </header>
  );
}

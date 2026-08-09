import { BlackCrownExperience } from "../../experience/BlackCrownExperience";
import { ExperienceProvider } from "../../experience/ExperienceProvider";
import { useExperience } from "../../experience/ExperienceContext";
import { ScrollStory } from "../../experience/scroll/ScrollStory";
import { ChapterProgress } from "./ChapterProgress";
import { ExperienceDebugPanel } from "./ExperienceDebugPanel";
import { NexusBoot } from "./NexusBoot";
import { NexusHUD } from "./NexusHUD";
import "../../experience/experience.css";

function NexusExperienceShell() {
  const { bootStage, entered, snapshot, webglAvailable } = useExperience();
  return (
    <div
      className="bcNexusLab"
      data-bc-nexus-shell="ready"
      data-active-chapter={snapshot.chapterId}
      data-boot-stage={bootStage}
      data-entered={entered ? "true" : "false"}
      data-webgl={webglAvailable ? "ready" : "fallback"}
    >
      <div className="bcNexusLab__staticScene" aria-hidden="true">
        <div className="bcNexusLab__horizon" />
        <div className="bcNexusLab__ring bcNexusLab__ring--outer" />
        <div className="bcNexusLab__ring bcNexusLab__ring--inner" />
        <div className="bcNexusLab__core" />
      </div>
      <BlackCrownExperience />
      <NexusHUD />
      <ScrollStory />
      <ChapterProgress />
      <ExperienceDebugPanel />
      <NexusBoot />
    </div>
  );
}

export function NexusLabPage() {
  return (
    <ExperienceProvider>
      <NexusExperienceShell />
    </ExperienceProvider>
  );
}

export default NexusLabPage;

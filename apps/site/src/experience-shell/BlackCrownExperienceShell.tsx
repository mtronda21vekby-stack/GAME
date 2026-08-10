import { BlackCrownExperience } from "../experience/BlackCrownExperience";
import { useExperience } from "../experience/ExperienceContext";
import { DeviceQAPanel } from "../components/nexus/DeviceQAPanel";
import { ExperienceDebugPanel } from "../components/nexus/ExperienceDebugPanel";
import { ExperienceChrome } from "./dom/ExperienceChrome";
import { ExperienceBoot } from "./dom/ExperienceBoot";
import { SkeletonDebugPanel } from "./debug/SkeletonDebugPanel";
import { StorySpine } from "./story/StorySpine";

export function BlackCrownExperienceShell() {
  const { bootStage, entered, snapshot, webglAvailable } = useExperience();
  return (
    <div
      className="bcNexusLab bcExperienceShell"
      data-bc-nexus-shell="ready"
      data-active-chapter={snapshot.chapterId}
      data-boot-stage={bootStage}
      data-entered={entered ? "true" : "false"}
      data-webgl={webglAvailable ? "ready" : "fallback"}
    >
      <div className="bcExperienceShell__fallback" aria-hidden="true">
        <div className="bcExperienceShell__fallbackGrid" />
        <div className="bcExperienceShell__fallbackCore" />
      </div>
      <BlackCrownExperience />
      <ExperienceChrome />
      <StorySpine />
      <ExperienceDebugPanel />
      <SkeletonDebugPanel />
      <DeviceQAPanel />
      <ExperienceBoot />
    </div>
  );
}

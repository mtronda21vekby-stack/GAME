import { BlackCrownExperienceShell } from "../../experience-shell/BlackCrownExperienceShell";
import { ExperienceShellProvider } from "../../experience-shell/ExperienceShellProvider";
import "../../experience/experience.css";
import "../../experience-shell/experience-shell.css";
import "../../experience-shell/cinematic-parallax-v1.css";

export function NexusLabPage() {
  return (
    <ExperienceShellProvider>
      <BlackCrownExperienceShell />
    </ExperienceShellProvider>
  );
}

export default NexusLabPage;

import React from "react";
import { useExperience } from "../../experience/ExperienceContext";
import type { ExperienceBootStage } from "../../experience/types";

const BOOT_LABELS: Record<ExperienceBootStage, string> = {
  idle: "INITIALIZING BLACKCROWN",
  renderer: "CALIBRATING SPATIAL CORE",
  scene: "CONNECTING WORLDS",
  geometry: "CONNECTING WORLDS",
  materials: "CONNECTING WORLDS",
  "first-frame": "CALIBRATING SPATIAL CORE",
  ready: "NEXUS READY",
  fallback: "NEXUS READY / STATIC MODE",
  error: "NEXUS READY / STATIC MODE",
};

export function ExperienceBoot() {
  const { bootStage, entered, enter, setSoundEnabled, snapshot, webglAvailable } = useExperience();
  const ready = bootStage === "ready" || bootStage === "fallback" || bootStage === "error";

  const enterWithSound = () => {
    // ENTER is the explicit user gesture that unlocks both the music bed and
    // spatial ambience without relying on autoplay exceptions.
    setSoundEnabled(true);
    enter();
  };

  React.useEffect(() => {
    if (ready && snapshot.reducedMotion) enter();
  }, [enter, ready, snapshot.reducedMotion]);

  if (entered) return null;
  return (
    <div className="bcNexusBoot bcExperienceBoot" role="dialog" aria-modal="true" aria-label="BlackCrown readiness">
      <div className="bcExperienceBoot__mark" aria-hidden="true"><i /><i /><i /></div>
      <span>{BOOT_LABELS[bootStage]}</span>
      <div className="bcExperienceBoot__progress" aria-hidden="true"><i data-stage={bootStage} /></div>
      {ready ? <button type="button" onClick={enterWithSound}>ENTER</button> : null}
      {!webglAvailable ? <small>SPATIAL FALLBACK ACTIVE</small> : null}
    </div>
  );
}

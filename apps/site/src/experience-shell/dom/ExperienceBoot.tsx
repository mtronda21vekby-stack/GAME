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
  const { bootStage, entered, enter, snapshot, webglAvailable } = useExperience();
  const ready = bootStage === "ready" || bootStage === "fallback" || bootStage === "error";

  React.useEffect(() => {
    if (ready && snapshot.reducedMotion) enter();
  }, [enter, ready, snapshot.reducedMotion]);

  if (entered) return null;
  return (
    <div className="bcExperienceBoot" role="dialog" aria-modal="true" aria-label="BlackCrown readiness">
      <div className="bcExperienceBoot__mark" aria-hidden="true"><i /><i /><i /></div>
      <span>{BOOT_LABELS[bootStage]}</span>
      <div className="bcExperienceBoot__progress" aria-hidden="true"><i data-stage={bootStage} /></div>
      {ready ? <button type="button" onClick={enter}>ENTER</button> : null}
      {!webglAvailable ? <small>SPATIAL FALLBACK ACTIVE</small> : null}
    </div>
  );
}


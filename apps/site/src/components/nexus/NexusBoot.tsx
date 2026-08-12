import React from "react";
import { useExperience } from "../../experience/ExperienceContext";
import type { ExperienceBootStage } from "../../experience/types";

const bootLabels: Record<ExperienceBootStage, string> = {
  idle: "INITIALIZING BLACKCROWN NEXUS",
  renderer: "INITIALIZING BLACKCROWN NEXUS",
  scene: "CALIBRATING CROWN CORE",
  geometry: "SYNCHRONIZING SPATIAL LAYERS",
  materials: "SYNCHRONIZING SPATIAL LAYERS",
  "first-frame": "CALIBRATING CROWN CORE",
  ready: "NEXUS READY",
  fallback: "NEXUS READY / STATIC MODE",
  error: "NEXUS READY / STATIC MODE",
};

export function NexusBoot() {
  const { bootStage, entered, enter, snapshot, webglAvailable } = useExperience();
  const ready = bootStage === "ready" || bootStage === "fallback" || bootStage === "error";

  React.useEffect(() => {
    if (ready && snapshot.reducedMotion) enter();
  }, [enter, ready, snapshot.reducedMotion]);

  if (entered) return null;
  return (
    <div className="bcNexusBoot" role="dialog" aria-modal="true" aria-label="BlackCrown Nexus readiness">
      <div className="bcNexusBoot__signal" aria-hidden="true"><i /><i /><i /></div>
      <span>{bootLabels[bootStage]}</span>
      <div className="bcNexusBoot__progress" aria-hidden="true"><i data-stage={bootStage} /></div>
      {ready ? (
        <button type="button" onClick={enter}>ENTER THE NEXUS</button>
      ) : null}
      {!webglAvailable ? <small>SPATIAL FALLBACK ACTIVE</small> : null}
    </div>
  );
}

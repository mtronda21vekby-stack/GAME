import React from "react";
import { useExperience } from "../../experience/ExperienceContext";

// The scene is already an explicit opt-in route. Do not impose a second ENTER gate.
export function ExperienceBoot() {
  const { bootStage, entered, enter } = useExperience();
  React.useEffect(() => {
    if (!entered && (bootStage === "ready" || bootStage === "fallback" || bootStage === "error")) enter();
  }, [bootStage, entered, enter]);
  return null;
}

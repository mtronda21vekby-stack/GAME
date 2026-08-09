import { useExperience } from "../../experience/ExperienceContext";

export function SoundControl() {
  const { soundEnabled, setSoundEnabled } = useExperience();
  return (
    <button
      className="bcNexusSound"
      type="button"
      aria-pressed={soundEnabled}
      aria-label={soundEnabled ? "Disable Nexus sound" : "Enable Nexus sound"}
      onClick={() => setSoundEnabled(!soundEnabled)}
    >
      SOUND {soundEnabled ? "ON" : "OFF"}
    </button>
  );
}

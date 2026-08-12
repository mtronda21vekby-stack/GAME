import type { BlackCrownExperienceQuality } from "../../experience/experienceConfig";
import { useExperience } from "../../experience/ExperienceContext";

const qualityOptions: readonly { value: BlackCrownExperienceQuality; label: string }[] = [
  { value: "auto", label: "A" },
  { value: "low", label: "L" },
  { value: "medium", label: "M" },
  { value: "high", label: "H" },
];

export function QualityControl() {
  const { requestedQuality, setRequestedQuality } = useExperience();
  return (
    <div className="bcNexusQuality" role="radiogroup" aria-label="Render quality">
      {qualityOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={requestedQuality === option.value}
          title={`${option.value} quality`}
          onClick={() => setRequestedQuality(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

import type { BlackCrownCrownReviewSelection } from "../../experience/experienceConfig";
import { useExperience } from "../../experience/ExperienceContext";

const OPTIONS: readonly { value: BlackCrownCrownReviewSelection; label: string }[] = [
  { value: "procedural", label: "PROCEDURAL" },
  { value: "candidate-a", label: "CANDIDATE A" },
  { value: "candidate-b", label: "CANDIDATE B" },
];

export function CrownCandidateSelector() {
  const { metrics, setCrownAsset } = useExperience();
  const selected: BlackCrownCrownReviewSelection = metrics.crownAssetId.includes("candidate-b")
    ? "candidate-b"
    : metrics.crownAssetId.includes("candidate-a") ? "candidate-a" : "procedural";

  return (
    <div className="bcNexusCandidateSelector" role="radiogroup" aria-label="Local Crown review candidate">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={selected === option.value}
          onClick={() => setCrownAsset(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

import type { ExperienceActionConfig } from "../experienceShellConfig";

export function SceneActions({ actions, active }: { actions: readonly ExperienceActionConfig[]; active: boolean }) {
  if (!actions.length) return null;
  return (
    <div className="bcExperienceSceneActions">
      {actions.map((action) => (
        <a
          key={`${action.href}:${action.label}`}
          className="bcExperienceAction"
          data-kind={action.kind ?? "secondary"}
          data-nexus-primary-cta={action.primaryTarget ? "true" : undefined}
          data-bc-spatial-chapter={action.href.startsWith("#") ? "true" : undefined}
          href={action.href}
          tabIndex={active ? undefined : -1}
        >
          {action.label}
        </a>
      ))}
    </div>
  );
}


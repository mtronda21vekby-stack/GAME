import { useExperience } from "../../experience/ExperienceContext";

export function SkeletonDebugPanel() {
  const { metrics, snapshot } = useExperience();
  if (!import.meta.env.DEV && !new URLSearchParams(window.location.search).has("bcdebug")) return null;
  return (
    <details className="bcExperienceSkeletonDebug">
      <summary>SKELETON DIAGNOSTICS</summary>
      <dl>
        <dt>CHAPTER</dt><dd>{snapshot.chapterId}</dd>
        <dt>PROGRESS</dt><dd>{snapshot.progress.toFixed(3)}</dd>
        <dt>SCENES</dt><dd>{metrics.activeSceneCount}</dd>
        <dt>QUALITY</dt><dd>{metrics.quality}</dd>
        <dt>FRAME P95</dt><dd>{metrics.frameP95.toFixed(1)} ms</dd>
        <dt>CALLS</dt><dd>{metrics.drawCalls}</dd>
        <dt>TRIANGLES</dt><dd>{metrics.triangles}</dd>
        <dt>CROWN</dt><dd>{metrics.crownBackend} / {metrics.crownLod}</dd>
        <dt>RAF</dt><dd>{metrics.rafOwnerCount}</dd>
      </dl>
    </details>
  );
}


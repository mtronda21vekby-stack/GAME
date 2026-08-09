import { experienceConfig } from "../../experience/experienceConfig";
import { useExperience } from "../../experience/ExperienceContext";

export function ExperienceDebugPanel() {
  const enabled = experienceConfig.debug || new URLSearchParams(window.location.search).get("bcdebug") === "1";
  const { metrics, snapshot, webglAvailable } = useExperience();
  if (!enabled) return null;

  return (
    <details className="bcNexusDebug">
      <summary>DEBUG</summary>
      <dl>
        <dt>FPS</dt><dd>{metrics.fps}</dd>
        <dt>FRAME</dt><dd>{metrics.frameTime} ms</dd>
        <dt>DPR</dt><dd>{metrics.dpr}</dd>
        <dt>QUALITY</dt><dd>{metrics.quality}</dd>
        <dt>PROGRESS</dt><dd>{snapshot.progress.toFixed(3)} / {snapshot.targetProgress.toFixed(3)}</dd>
        <dt>CHAPTER</dt><dd>{snapshot.chapterId} {snapshot.chapterProgress.toFixed(2)}</dd>
        <dt>VELOCITY</dt><dd>{snapshot.velocity.toFixed(3)} / {snapshot.direction}</dd>
        <dt>VIEWPORT</dt><dd>{snapshot.viewportWidth}x{snapshot.viewportHeight}</dd>
        <dt>RENDERER</dt><dd>{webglAvailable ? metrics.renderer : "fallback"}</dd>
        <dt>DRAW</dt><dd>{metrics.drawCalls} / {metrics.triangles}</dd>
        <dt>CONTEXT</dt><dd>{metrics.contextState}</dd>
      </dl>
    </details>
  );
}

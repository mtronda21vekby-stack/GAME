import { experienceConfig } from "../../experience/experienceConfig";
import { useExperience } from "../../experience/ExperienceContext";
import { CrownCandidateSelector } from "./CrownCandidateSelector";

export function ExperienceDebugPanel() {
  const parameters = new URLSearchParams(window.location.search);
  const enabled = experienceConfig.debug || parameters.get("bcdebug") === "1" || parameters.get("bcdeviceqa") === "1";
  const { metrics, snapshot, webglAvailable } = useExperience();
  if (!enabled) return null;

  return (
    <details className="bcNexusDebug">
      <summary>DEBUG</summary>
      <CrownCandidateSelector />
      <dl>
        <dt>FPS</dt><dd>{metrics.fps}</dd>
        <dt>FRAME</dt><dd>{metrics.frameP50} / {metrics.frameP95} / {metrics.worstFrame} ms</dd>
        <dt>DPR</dt><dd>{metrics.dpr}</dd>
        <dt>QUALITY</dt><dd>{metrics.quality}</dd>
        <dt>CROWN</dt><dd>{metrics.crownBackend} / {metrics.crownLod}</dd>
        <dt>ASSET</dt><dd>{metrics.crownStatus} / {metrics.crownReason}</dd>
        <dt>BYTES</dt><dd>{metrics.crownAssetBytes}</dd>
        <dt>LOAD</dt><dd>{metrics.crownFetchTime} / {metrics.crownParseTime} / {metrics.crownBindTime} ms</dd>
        <dt>CROWN FRAME</dt><dd>{metrics.crownFirstFrameTime} ms</dd>
        <dt>MATERIALS</dt><dd>{metrics.crownMaterials} / {metrics.crownTextures}</dd>
        <dt>PROGRESS</dt><dd>{snapshot.progress.toFixed(3)} / {snapshot.targetProgress.toFixed(3)}</dd>
        <dt>CHAPTER</dt><dd>{snapshot.chapterId} {snapshot.chapterProgress.toFixed(2)}</dd>
        <dt>VELOCITY</dt><dd>{snapshot.velocity.toFixed(3)} / {snapshot.direction}</dd>
        <dt>VIEWPORT</dt><dd>{snapshot.viewportWidth}x{snapshot.viewportHeight}</dd>
        <dt>RENDERER</dt><dd>{webglAvailable ? metrics.renderer : "fallback"}</dd>
        <dt>DRAW</dt><dd>{metrics.drawCalls} / {metrics.triangles}</dd>
        <dt>CONTEXT</dt><dd>{metrics.contextState}</dd>
        <dt>LOST</dt><dd>{metrics.contextLostCount}</dd>
      </dl>
    </details>
  );
}

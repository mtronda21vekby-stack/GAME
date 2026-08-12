import React from "react";
import { experienceConfig, isNexusRouteEnabled } from "../../experience/experienceConfig";
import { useExperience } from "../../experience/ExperienceContext";
import { serializeDeviceReport } from "../../experience/quality/DeviceReport";

function canUseDeviceQa() {
  const requested = new URLSearchParams(window.location.search).get("bcdeviceqa") === "1";
  return requested && isNexusRouteEnabled() && (import.meta.env.DEV || experienceConfig.debug);
}

export function DeviceQAPanel() {
  const { metrics, snapshot, resetPerformanceSample } = useExperience();
  const [status, setStatus] = React.useState("READY");
  if (!canUseDeviceQa()) return null;

  const report = () => serializeDeviceReport(metrics, snapshot);
  const copy = async () => {
    const value = report();
    try {
      await navigator.clipboard.writeText(value);
      setStatus("COPIED");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      setStatus(copied ? "COPIED" : "COPY BLOCKED");
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([report()], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `blackcrown-device-report-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("DOWNLOADED");
  };
  const reset = () => {
    resetPerformanceSample();
    setStatus("SAMPLE RESET");
  };

  return (
    <details className="bcNexusDeviceQa" data-bc-device-qa="ready">
      <summary>DEVICE QA</summary>
      <output aria-live="polite">{status}</output>
      <dl>
        <dt>QUALITY</dt><dd>{metrics.requestedQuality} / {metrics.quality}</dd>
        <dt>CROWN</dt><dd>{metrics.crownBackend} / {metrics.crownLod}</dd>
        <dt>FRAME</dt><dd>{metrics.frameP50} / {metrics.frameP95} / {metrics.worstFrame} ms</dd>
        <dt>SCENE</dt><dd>{metrics.drawCalls} calls / {metrics.triangles} tris</dd>
        <dt>CONTEXT</dt><dd>{metrics.contextState} / {metrics.contextLostCount}</dd>
      </dl>
      <div>
        <button type="button" onClick={copy}>COPY DEVICE REPORT</button>
        <button type="button" onClick={download}>DOWNLOAD DEVICE REPORT</button>
        <button type="button" onClick={reset}>RESET QA SAMPLE</button>
      </div>
      <script type="application/json" data-bc-device-report>{report()}</script>
    </details>
  );
}

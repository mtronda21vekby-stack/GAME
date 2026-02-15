import React, { useEffect, useRef, useState } from "react";
import type { GameSettings } from "./SettingsPanel";
import { Button } from "@blackcrown/ui";

export function EvoFishFrame(props: { src: string; settings: GameSettings }) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [props.src]);

  const requestFs = () => {
    const el = ref.current?.parentElement;
    el?.requestFullscreen?.().catch(() => {});
  };

  return (
    <div className="bc-container">
      <div className="glassStrong" style={{ padding: 12 }}>
        <div className="bc-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <div className="bc-col" style={{ gap: 2 }}>
            <div style={{ fontWeight: 850 }}>EvoFish</div>
            <div className="bc-p">
              Quality: <b>{props.settings.quality}</b>, Input: <b>{props.settings.inputMode}</b>,
              FPS: <b>{props.settings.fpsCounter ? "ON" : "OFF"}</b>, Sound: <b>{props.settings.sound ? "ON" : "OFF"}</b>
            </div>
          </div>

          <div className="bc-row" style={{ flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={requestFs}>Fullscreen</Button>
            <Button variant="ghost" onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </div>

        <div style={{ height: 10 }} />

        <div style={{ borderRadius: 16, border: "1px solid var(--stroke)", background: "rgba(0,0,0,0.28)", overflow: "hidden", aspectRatio: "16 / 9" }}>
          <iframe
            ref={ref}
            title="EvoFish"
            src={props.src}
            loading="eager"
            onLoad={() => setLoaded(true)}
            style={{ width: "100%", height: "100%", border: 0 }}
          />
        </div>

        {!loaded ? <div className="bc-p" style={{ marginTop: 10, opacity: 0.9 }}>Loading EvoFish…</div> : null}
      </div>
    </div>
  );
}

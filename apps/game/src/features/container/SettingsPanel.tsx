import React from "react";
import { Toggle, Tabs } from "@blackcrown/ui";
import { track } from "@blackcrown/core";

export type GameSettings = {
  sound: boolean;
  fpsCounter: boolean;
  quality: "low" | "med" | "high";
  inputMode: "auto" | "touch" | "mouse";
};

export function SettingsPanel(props: { settings: GameSettings; onChange: (s: GameSettings) => void; }) {
  const s = props.settings;

  return (
    <div className="bc-col" style={{ gap: 14 }}>
      <Toggle
        label="Sound"
        value={s.sound}
        description="Default OFF. Container-only toggle; does not modify EvoFish logic."
        onChange={(v) => { props.onChange({ ...s, sound: v }); track({ type: "ui_toggle", id: "sound", value: v }); }}
      />

      <Toggle
        label="FPS Counter"
        value={s.fpsCounter}
        description="UI toggle for container overlay (actual counter can be wired later)."
        onChange={(v) => { props.onChange({ ...s, fpsCounter: v }); track({ type: "ui_toggle", id: "fpsCounter", value: v }); }}
      />

      <div className="bc-divider" />

      <div className="bc-col" style={{ gap: 8 }}>
        <div style={{ fontWeight: 850 }}>Quality</div>
        <Tabs
          value={s.quality}
          onChange={(v) => { props.onChange({ ...s, quality: v }); track({ type: "ui_toggle", id: "quality", value: v }); }}
          items={[{ id: "low", label: "Low" }, { id: "med", label: "Med" }, { id: "high", label: "High" }]}
        />
        <div className="bc-p">Container preference. If you later add different EvoFish builds — can select here.</div>
      </div>

      <div className="bc-divider" />

      <div className="bc-col" style={{ gap: 8 }}>
        <div style={{ fontWeight: 850 }}>Input mode</div>
        <Tabs
          value={s.inputMode}
          onChange={(v) => { props.onChange({ ...s, inputMode: v }); track({ type: "ui_toggle", id: "inputMode", value: v }); }}
          items={[{ id: "auto", label: "Auto" }, { id: "touch", label: "Touch" }, { id: "mouse", label: "Mouse" }]}
        />
        <div className="bc-p">For future: map to controller/touch overlays without touching EvoFish code.</div>
      </div>
    </div>
  );
}

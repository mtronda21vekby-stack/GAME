import React, { useState } from "react";
import { userStorage } from "@blackcrown/core";
import { Drawer } from "@blackcrown/ui";
import { EvoFishFrame } from "../features/container/EvoFishFrame";
import { EVOFISH_VERSION } from "../features/container/evoFishRuntime";
import { SettingsPanel, GameSettings } from "../features/container/SettingsPanel";

export function Game() {
  const [drawer, setDrawer] = useState(false);

  const [settings, setSettings] = useState<GameSettings>(() =>
    userStorage.getJSON<GameSettings>("gameSettings", {
      sound: false,
      fpsCounter: false,
      quality: "high",
      inputMode: "auto"
    })
  );

  const saveSettings = (next: GameSettings) => {
    setSettings(next);
    userStorage.setJSON("gameSettings", next);
  };

  return (
    <main
      className="apple-bg"
      style={{
        minHeight: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#031827"
      }}
    >
      <EvoFishFrame
        src={`/game/evofish/index.html?v=${encodeURIComponent(EVOFISH_VERSION)}`}
        settings={settings}
        onOpenSettings={() => setDrawer(true)}
      />

      <Drawer open={drawer} title="Настройки игры" onClose={() => setDrawer(false)}>
        <SettingsPanel settings={settings} onChange={saveSettings} />
      </Drawer>
    </main>
  );
}

export default Game;

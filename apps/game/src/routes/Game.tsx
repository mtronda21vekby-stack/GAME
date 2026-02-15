import React, { useMemo, useState } from "react";
import { Button, Drawer } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import { userStorage, track } from "@blackcrown/core";
import { EvoFishFrame } from "../features/container/EvoFishFrame";
import { SettingsPanel, GameSettings } from "../features/container/SettingsPanel";

export function Game() {
  const nickname = userStorage.getString("nickname", "");
  const name = nickname || "Player";

  const [drawer, setDrawer] = useState(false);
  const [started, setStarted] = useState(false);

  const [settings, setSettings] = useState<GameSettings>(() => userStorage.getJSON<GameSettings>("gameSettings", {
    sound: false,
    fpsCounter: false,
    quality: "high",
    inputMode: "auto"
  }));

  const saveSettings = (next: GameSettings) => {
    setSettings(next);
    userStorage.setJSON("gameSettings", next);
  };

  const topBar = useMemo(() => (
    <div className="bc-row" style={{
      justifyContent: "space-between",
      padding: "max(12px, env(safe-area-inset-top)) 12px 12px",
      position: "sticky",
      top: 0,
      zIndex: 10,
      background: "linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0))",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)"
    }}>
      <div className="bc-row" style={{ gap: 10 }}>
        <img alt="" src={Icons.crown} width="20" height="20" />
        <div style={{ fontWeight: 850 }}>Game</div>
        <div className="bc-faint">— {name}</div>
      </div>

      <div className="bc-row" style={{ flexWrap: "wrap" }}>
        <Button variant="secondary" leftIconSrc={Icons.settings} onClick={() => setDrawer(true)}>
          Settings
        </Button>
        <Button
          variant="primary"
          leftIconSrc={Icons.play}
          onClick={() => {
            track({ type: "cta_click", id: "play_container" });
            setStarted(true);
          }}
        >
          {started ? "Reload" : "Play"}
        </Button>
      </div>
    </div>
  ), [name, started]);

  return (
    <main className="apple-bg" style={{ minHeight: "100%" }}>
      {topBar}

      <div style={{ padding: 12 }}>
        {!started ? (
          <div className="glassStrong bc-container" style={{ padding: 18 }}>
            <div className="bc-h2">EvoFish Container</div>
            <div className="bc-p" style={{ marginTop: 8 }}>
              Sound is <b>OFF</b> by default. Click Play to load EvoFish in isolated iframe.
            </div>

            <div className="bc-row" style={{ marginTop: 12, flexWrap: "wrap" }}>
              <Button variant="primary" leftIconSrc={Icons.play} onClick={() => setStarted(true)}>
                Open EvoFish
              </Button>
              <Button variant="secondary" leftIconSrc={Icons.settings} onClick={() => setDrawer(true)}>
                Settings
              </Button>
              <Button variant="ghost" onClick={() => { document.documentElement.requestFullscreen?.().catch(() => {}); }}>
                Fullscreen
              </Button>
            </div>
          </div>
        ) : (
          <EvoFishFrame src="/evofish/index.html" settings={settings} />
        )}
      </div>

      <Drawer open={drawer} title="Game Settings" onClose={() => setDrawer(false)}>
        <SettingsPanel settings={settings} onChange={saveSettings} />
      </Drawer>
    </main>
  );
}

import React, { useMemo, useState } from "react";
import { userStorage, track } from "@blackcrown/core";
import { Button, Drawer } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import { EvoFishFrame } from "../features/container/EvoFishFrame";
import { SettingsPanel, GameSettings } from "../features/container/SettingsPanel";
import { LandscapeHint } from "../features/container/LandscapeHint";

const PATHS = {
  site: "/",
  lobby: "/lobby/"
} as const;

export function Game() {
  const nickname = userStorage.getString("nickname", "");
  const name = nickname || "Игрок";

  const [drawer, setDrawer] = useState(false);
  const [started, setStarted] = useState(false);

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

  const topBar = useMemo(
    () => (
      <div
        className="bc-row"
        style={{
          justifyContent: "space-between",
          padding: "max(12px, env(safe-area-inset-top)) 12px 12px",
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0))",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)"
        }}
      >
        <div className="bc-row" style={{ gap: 10 }}>
          <img alt="" src={Icons.crown} width="20" height="20" />
          <div style={{ fontWeight: 850 }}>Игра</div>
          <div className="bc-faint">— {name}</div>
        </div>

        <div className="bc-row" style={{ flexWrap: "wrap" }}>
          <Button variant="ghost" onClick={() => (window.location.href = PATHS.site)}>
            На сайт
          </Button>

          <Button variant="secondary" leftIconSrc={Icons.settings} onClick={() => setDrawer(true)}>
            Настройки
          </Button>

          <Button
            variant="primary"
            leftIconSrc={Icons.play}
            onClick={() => {
              track({ type: "cta_click", id: "play_container" });
              setStarted(true);
            }}
          >
            {started ? "Перезапуск" : "Играть"}
          </Button>
        </div>
      </div>
    ),
    [name, started]
  );

  return (
    <main className="apple-bg" style={{ minHeight: "100%" }}>
      {topBar}

      <div style={{ padding: 12 }}>
        {!started ? (
          <div
            className="glassStrong bc-container bc-motion"
            style={{
              padding: 18,
              borderRadius: 22,
              background: "rgba(0,0,0,0.18)"
            }}
          >
            <div className="bc-h2">Контейнер EvoFish</div>

            <div className="bc-p" style={{ marginTop: 8, opacity: 0.9 }}>
              Звук по умолчанию <b>ВЫКЛ</b>. Нажми “Открыть EvoFish”.
            </div>

            <div className="bc-row" style={{ marginTop: 14, flexWrap: "wrap" }}>
              <Button variant="primary" size="lg" leftIconSrc={Icons.play} onClick={() => setStarted(true)}>
                Открыть EvoFish
              </Button>

              <Button variant="secondary" size="lg" leftIconSrc={Icons.settings} onClick={() => setDrawer(true)}>
                Настройки
              </Button>

              <Button variant="ghost" size="lg" onClick={() => (window.location.href = PATHS.lobby)}>
                Lobby
              </Button>
            </div>
          </div>
        ) : (
          <EvoFishFrame src="/game/evofish/index.html" settings={settings} />
        )}
      </div>

      <Drawer open={drawer} title="Настройки игры" onClose={() => setDrawer(false)}>
        <SettingsPanel settings={settings} onChange={saveSettings} />
      </Drawer>

      <LandscapeHint />
    </main>
  );
}
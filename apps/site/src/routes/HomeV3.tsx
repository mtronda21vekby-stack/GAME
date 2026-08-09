import React from "react";
import { userStorage } from "@blackcrown/core";
import AICoachV3 from "../components/AICoachV3";
import CinematicExperience from "../components/CinematicExperience";
import LiveFeedV3 from "../components/LiveFeedV3";
import StoreV3 from "../components/StoreV3";
import {
  BLACKCROWN_WORLD_STATUS_FALLBACK,
  loadBlackCrownWorldStatuses,
  type BlackCrownWorldStatusSnapshot,
} from "../lib/blackcrownWorldStatus";
import { openTelegramBot } from "../lib/telegram";
import "../styles/services-v3.css";
import "../styles/home-v3-services.css";
import "../styles/v3-4-services-visual.css";

const FALLBACK_STATUS_SNAPSHOT: BlackCrownWorldStatusSnapshot = {
  statuses: BLACKCROWN_WORLD_STATUS_FALLBACK,
  source: "fallback",
  syncedAt: null,
};

function getPlayerName() {
  return userStorage.getString("nickname", "") || "Игрок";
}

function navigateSite(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "auto" });
}

function navigateExternal(path: string) {
  window.location.assign(path);
}

export function HomeV3() {
  const playerName = getPlayerName();
  const [statusSnapshot, setStatusSnapshot] = React.useState<BlackCrownWorldStatusSnapshot>(FALLBACK_STATUS_SNAPSHOT);

  React.useEffect(() => {
    const controller = new AbortController();
    loadBlackCrownWorldStatuses(controller.signal).then((snapshot) => {
      if (!controller.signal.aborted) setStatusSnapshot(snapshot);
    });
    return () => controller.abort();
  }, []);

  const evofish = statusSnapshot.statuses.evofish ?? BLACKCROWN_WORLD_STATUS_FALLBACK.evofish;
  const crownFront = statusSnapshot.statuses["crown-front"] ?? BLACKCROWN_WORLD_STATUS_FALLBACK["crown-front"];
  const network = statusSnapshot.statuses["blackcrown-network"] ?? BLACKCROWN_WORLD_STATUS_FALLBACK["blackcrown-network"];

  return (
    <main
      className="bcHomeV3"
      data-experience="blackcrown-cinematic-v1"
      data-status-source={statusSnapshot.source}
      data-player={playerName}
    >
      <CinematicExperience
        evofish={evofish}
        crownFront={crownFront}
        network={network}
        statusSource={statusSnapshot.source}
        onNavigate={navigateSite}
        onPlay={() => navigateExternal("/game/")}
        onOpenCrownFront={() => navigateExternal("/games/crown-front/")}
        onOpenLobby={() => navigateExternal("/lobby/")}
      />

      <StoreV3 onOpenStore={() => navigateSite("/store")} onOpenAccount={() => navigateSite("/account")} />
      <AICoachV3 onOpenCoach={openTelegramBot} onOpenSupport={() => navigateSite("/support")} />
      <LiveFeedV3 />
    </main>
  );
}

export default HomeV3;

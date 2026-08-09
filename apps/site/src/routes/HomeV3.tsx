import React from "react";
import { userStorage } from "@blackcrown/core";
import AICoachV3 from "../components/AICoachV3";
import CinematicExperience from "../experience/CinematicExperience";
import LiveFeedV3 from "../components/LiveFeedV3";
import StoreV3 from "../components/StoreV3";
import {
  BLACKCROWN_WORLD_STATUS_FALLBACK,
  loadBlackCrownWorldStatuses,
  type BlackCrownWorldStatusSnapshot,
} from "../lib/blackcrownWorldStatus";
import { openTelegramBot } from "../lib/telegram";
import { nav, navExternal } from "../lib/nav";
import "../styles/home.css";
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
      data-experience="blackcrown-cinematic-v2"
      data-status-source={statusSnapshot.source}
      data-player={playerName}
    >
      <CinematicExperience
        evofish={evofish}
        crownFront={crownFront}
        network={network}
        statusSource={statusSnapshot.source}
        onNavigate={nav}
        onPlay={() => navExternal("/game/")}
        onOpenCrownFront={() => navExternal("/games/crown-front/")}
        onOpenLobby={() => navExternal("/lobby/")}
      />

      <StoreV3 onOpenStore={() => nav("/store")} onOpenAccount={() => nav("/account")} />
      <AICoachV3 onOpenCoach={openTelegramBot} onOpenSupport={() => nav("/support")} />
      <LiveFeedV3 />
    </main>
  );
}

export default HomeV3;

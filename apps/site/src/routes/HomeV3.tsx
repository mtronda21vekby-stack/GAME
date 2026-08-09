import React from "react";
import { userStorage } from "@blackcrown/core";
import AICoachV3 from "../components/AICoachV3";
import CinematicWorldTransition from "../components/CinematicWorldTransition";
import GlassSurface from "../components/GlassSurface";
import HeroScene, { type HeroStatus, type HeroStatusTone } from "../components/HeroScene";
import LiveFeedV3 from "../components/LiveFeedV3";
import PlatformV3 from "../components/PlatformV3";
import StoreV3 from "../components/StoreV3";
import WorldStageV2 from "../components/WorldStageV2";
import {
  BLACKCROWN_WORLD_STATUS_FALLBACK,
  loadBlackCrownWorldStatuses,
  type BlackCrownStatusTone,
  type BlackCrownWorldStatusSnapshot,
} from "../lib/blackcrownWorldStatus";
import { openTelegramBot } from "../lib/telegram";
import "../styles/services-v3.css";
import "../styles/home-v3-services.css";
import "../styles/v3-4-services-visual.css";

const WORLD_ART = {
  evofish: "/art/evofish-world.jpg",
  crownFront: "/assets/games/crown-front/crown-front-preview.svg",
} as const;

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

function scrollToWorlds() {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("worlds")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

function toHeroTone(tone: BlackCrownStatusTone): HeroStatusTone {
  if (tone === "orange") return "orange";
  if (tone === "green") return "green";
  return "cyan";
}

function formatSyncTime(timestamp: number | null) {
  if (!timestamp) return "LOCAL FALLBACK";
  try {
    return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
  } catch {
    return "SYNCED";
  }
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

  const heroStatuses = React.useMemo<HeroStatus[]>(() => [
    { label: "EVOFISH", value: evofish.status, tone: toHeroTone(evofish.tone) },
    { label: "CROWN//FRONT", value: crownFront.status, tone: toHeroTone(crownFront.tone) },
    { label: "BLACKCROWN NETWORK", value: network.status === "LIVE" ? "ONLINE" : network.status, tone: toHeroTone(network.tone) },
  ], [crownFront.status, crownFront.tone, evofish.status, evofish.tone, network.status, network.tone]);

  const feedTitle = statusSnapshot.source === "supabase" ? "LIVE STATUS" : statusSnapshot.source === "cache" ? "CACHED STATUS" : "SAFE STATUS";
  const feedDetail = statusSnapshot.source === "supabase"
    ? `BLACKCROWN DB · ${formatSyncTime(statusSnapshot.syncedAt)}`
    : statusSnapshot.source === "cache"
      ? `LAST SYNC · ${formatSyncTime(statusSnapshot.syncedAt)}`
      : "RESILIENT FALLBACK";

  return (
    <main className="bcHomeV3" data-experience="blackcrown-v3" data-status-source={statusSnapshot.source}>
      <HeroScene playerName={playerName} onNavigate={navigateSite} onPlay={() => navigateExternal("/game/")} onExploreWorlds={scrollToWorlds} statuses={heroStatuses} />

      <CinematicWorldTransition tone="ocean" index="01" title="EvoFish" detail="ABYSSAL LINK / DESCENT ACTIVE" />

      <section id="worlds" className="bcWorldsV2" aria-labelledby="bc-worlds-v2-title">
        <GlassSurface material="frosted" tone="cyan" className="bcWorldsV2__intro">
          <div className="bcWorldsV2__head">
            <span>FEATURED WORLDS / V3.4</span>
            <div className="bcWorldsV2__statusFeed" data-source={statusSnapshot.source} aria-live="polite" title={`${feedTitle}: ${feedDetail}`}>
              <i aria-hidden="true" /><strong>{feedTitle}</strong><small>{feedDetail}</small>
            </div>
            <h2 id="bc-worlds-v2-title">Миры внутри BlackCrown.</h2>
            <p>Два визуальных языка, связанные одной системой: океанская биолюминесценция EvoFish и реакторный black-metal CROWN//FRONT.</p>
          </div>
        </GlassSurface>

        <div className="bcWorldsV2__list">
          <WorldStageV2
            index="01" title="EvoFish" subtitle="Эволюция начинается в глубине."
            description="Исследуй океан, развивай хищника и выживай в мире, где каждый новый уровень меняет форму, скорость и стиль игры."
            status={evofish.status} imageSrc={WORLD_ART.evofish} imageAlt="EvoFish — океанский мир BlackCrown" tone="ocean"
            primaryLabel="Войти в EvoFish" onPrimary={() => navigateExternal("/game/")} secondaryLabel="О мире" onSecondary={() => navigateSite("/about")}
          />

          <CinematicWorldTransition tone="reactor" index="02" title="CROWN//FRONT" detail="REACTOR LINK / INDUSTRIAL CHANNEL" />

          <WorldStageV2
            index="02" title="CROWN//FRONT" subtitle="Тактическая война на теле механического короля."
            description="Сражайся за контроль над живой машиной, захватывай ключевые узлы и меняй ход боя в мобильной WebGL alpha."
            status={crownFront.status} imageSrc={WORLD_ART.crownFront} imageAlt="CROWN FRONT — тактический мир BlackCrown" tone="reactor" reverse
            primaryLabel="Войти в Alpha" onPrimary={() => navigateExternal("/games/crown-front/")} secondaryLabel="Открыть Lobby" onSecondary={() => navigateExternal("/lobby/")}
          />
        </div>
      </section>

      <PlatformV3 onNavigate={navigateSite} onOpenLobby={() => navigateExternal("/lobby/")} />
      <StoreV3 onOpenStore={() => navigateSite("/store")} onOpenAccount={() => navigateSite("/account")} />
      <AICoachV3 onOpenCoach={openTelegramBot} onOpenSupport={() => navigateSite("/support")} />
      <LiveFeedV3 />
    </main>
  );
}

export default HomeV3;

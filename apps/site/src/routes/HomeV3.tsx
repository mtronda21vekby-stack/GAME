import React from "react";
import { userStorage } from "@blackcrown/core";
import AICoachV3 from "../components/AICoachV3";
import GlassSurface from "../components/GlassSurface";
import HeroScene from "../components/HeroScene";
import LiveFeedV3 from "../components/LiveFeedV3";
import PlatformV3 from "../components/PlatformV3";
import StoreV3 from "../components/StoreV3";
import WorldStageV2 from "../components/WorldStageV2";
import { openTelegramBot } from "../lib/telegram";
import "../styles/services-v3.css";
import "../styles/home-v3-services.css";

const WORLD_ART = {
  evofish: "/assets/site/neon/evofish.svg",
  crownFront: "/assets/games/crown-front/crown-front-preview.svg",
} as const;

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
  document.getElementById("worlds")?.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

export function HomeV3() {
  const playerName = getPlayerName();

  return (
    <main className="bcHomeV3" data-experience="blackcrown-v3">
      <HeroScene
        playerName={playerName}
        onNavigate={navigateSite}
        onPlay={() => navigateExternal("/game/")}
        onExploreWorlds={scrollToWorlds}
      />

      <section id="worlds" className="bcWorldsV2" aria-labelledby="bc-worlds-v2-title">
        <GlassSurface material="frosted" tone="cyan" className="bcWorldsV2__intro">
          <div className="bcWorldsV2__head">
            <span>FEATURED WORLDS / V3</span>
            <h2 id="bc-worlds-v2-title">Миры внутри BlackCrown.</h2>
            <p>
              Два визуальных языка, связанные одной системой: океанская биолюминесценция EvoFish и реакторный black-metal CROWN//FRONT.
            </p>
          </div>
        </GlassSurface>

        <div className="bcWorldsV2__list">
          <WorldStageV2
            index="01"
            title="EvoFish"
            subtitle="Эволюция начинается в глубине."
            description="Исследуй океан, развивай хищника и выживай в мире, где каждый новый уровень меняет форму, скорость и стиль игры."
            status="LIVE"
            imageSrc={WORLD_ART.evofish}
            imageAlt="EvoFish — океанский мир BlackCrown"
            tone="ocean"
            primaryLabel="Войти в EvoFish"
            onPrimary={() => navigateExternal("/game/")}
            secondaryLabel="О мире"
            onSecondary={() => navigateSite("/about")}
          />

          <WorldStageV2
            index="02"
            title="CROWN//FRONT"
            subtitle="Тактическая война на теле механического короля."
            description="Сражайся за контроль над живой машиной, захватывай ключевые узлы и меняй ход боя в мобильной WebGL alpha."
            status="ALPHA"
            imageSrc={WORLD_ART.crownFront}
            imageAlt="CROWN FRONT — тактический мир BlackCrown"
            tone="reactor"
            reverse
            primaryLabel="Войти в Alpha"
            onPrimary={() => navigateExternal("/games/crown-front/")}
            secondaryLabel="Открыть Lobby"
            onSecondary={() => navigateExternal("/lobby/")}
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

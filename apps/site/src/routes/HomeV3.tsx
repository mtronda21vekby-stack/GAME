import React from "react";
import { userStorage } from "@blackcrown/core";
import HeroScene from "../components/HeroScene";
import { Home as NexusHome } from "./Home";

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

/**
 * Transitional V3 composition.
 *
 * HeroScene owns the new first viewport while the existing NexusHome continues
 * to provide the world, platform, AI-Coach and live-content sections. The old
 * inline hero is hidden by home-v3.css, so production behavior remains intact
 * while the monolithic Home.tsx is split into dedicated components file by file.
 */
export function HomeV3() {
  const playerName = getPlayerName();

  return (
    <div className="bcHomeV3" data-experience="blackcrown-v3">
      <HeroScene
        playerName={playerName}
        onNavigate={navigateSite}
        onPlay={() => navigateExternal("/game/")}
        onExploreWorlds={scrollToWorlds}
      />

      <div className="bcHomeV3__journey">
        <NexusHome />
      </div>
    </div>
  );
}

export default HomeV3;

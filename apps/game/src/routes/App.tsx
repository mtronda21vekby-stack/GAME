import React, { useEffect, useState } from "react";
import { Router, navigate } from "../router";
import { Game } from "./Game";
import { AIDebugLab } from "../evofish-next/ui/AIDebugLab";
import { BetaCacheDoctor } from "../evofish-next/ui/BetaCacheDoctor";
import { BetaChecklist } from "../evofish-next/ui/BetaChecklist";
import { BetaErrorBoundary } from "../evofish-next/ui/BetaErrorBoundary";
import { BetaHome } from "../evofish-next/ui/BetaHome";
import { BetaProgress } from "../evofish-next/ui/BetaProgress";
import { BetaQA } from "../evofish-next/ui/BetaQA";
import { BetaReport } from "../evofish-next/ui/BetaReport";
import { DeepTreasuresHub } from "../evofish-next/ui/DeepTreasuresHub";
import { GameSettingsHub } from "../evofish-next/ui/GameSettingsHub";
import { Leaderboard } from "../evofish-next/ui/Leaderboard";
import { LobbyDailyLoginReward } from "../evofish-next/ui/LobbyDailyLoginReward";
import { LobbySkinCarousel } from "../evofish-next/ui/LobbySkinCarousel";
import { ProfileHub } from "../evofish-next/ui/ProfileHub";
import { SeasonHub } from "../evofish-next/ui/SeasonHub";
import { SkinLab } from "../evofish-next/ui/SkinLab";
import { NextPlaySession } from "../evofish-next/ui/NextPlaySession";
import { attachConsoleAnalytics, track } from "@blackcrown/core";

function disableGameServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.filter((registration) => registration.scope.includes("/game/")).map((registration) => registration.unregister())))
    .catch(() => {});
}

function withBoundary(element: React.ReactNode) {
  return <BetaErrorBoundary>{element}</BetaErrorBoundary>;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true'], [data-allow-select='true']"));
}

function lockGameShellInteractions() {
  const preventPageSelection = (event: Event) => {
    if (isEditableTarget(event.target)) return;
    event.preventDefault();
  };

  document.addEventListener("selectstart", preventPageSelection);
  document.addEventListener("dragstart", preventPageSelection);
  document.addEventListener("contextmenu", preventPageSelection);

  return () => {
    document.removeEventListener("selectstart", preventPageSelection);
    document.removeEventListener("dragstart", preventPageSelection);
    document.removeEventListener("contextmenu", preventPageSelection);
  };
}

function GameModeEntry() {
  const mode = new URLSearchParams(window.location.search).get("mode");
  if (mode === "classic") return <Game />;
  if (mode === "next") return <NextPlaySession />;
  return <BetaHome />;
}

function isLobbyPath(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return ["/", "/game", "/game/lobby", "/game/next", "/game/next/lobby", "/next", "/next/lobby"].includes(path);
}

function LobbyDailyLoginMount() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener("popstate", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return isLobbyPath(path) ? <LobbyDailyLoginReward /> : null;
}

function DeepTreasuresMenuTab() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const isMenuPath = ["/", "/game", "/game/lobby", "/game/next", "/game/next/lobby", "/next", "/next/lobby"].includes(path.replace(/\/+$/, "") || "/");
  if (!isMenuPath) return null;

  return (
    <button className="efDeepMenuTab" type="button" onClick={() => navigate("/game/deep-treasures")}>
      <span>◆</span>
      <b>ВПАДИНА</b>
      <small>Рулетка · ключи · дроп</small>
      <style>{`
        .efDeepMenuTab{position:fixed;right:max(18px,env(safe-area-inset-right));top:calc(326px + env(safe-area-inset-top));z-index:60;appearance:none;border:1px solid rgba(255,214,102,.46);border-radius:22px;padding:11px 14px;min-width:188px;display:grid;grid-template-columns:auto 1fr;grid-template-areas:"icon title" "icon sub";gap:2px 10px;text-align:left;background:radial-gradient(circle at 18% 50%,rgba(255,214,102,.22),transparent 44%),linear-gradient(135deg,rgba(53,216,255,.24),rgba(255,214,102,.16)),rgba(2,14,28,.86);color:#ecfbff;box-shadow:0 18px 55px rgba(0,0,0,.38),0 0 34px rgba(53,216,255,.18),inset 0 1px 0 rgba(255,255,255,.12);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;overflow:hidden}.efDeepMenuTab:before{content:"";position:absolute;inset:-1px;background:linear-gradient(110deg,transparent 0 36%,rgba(255,255,255,.28) 46%,transparent 58%);transform:translateX(-120%);animation:efDeepMenuShine 4.8s ease-in-out infinite;pointer-events:none}.efDeepMenuTab:after{content:"NEW ZONE";position:absolute;right:10px;top:7px;color:rgba(255,214,102,.82);font-size:9px;letter-spacing:.14em;font-weight:1000}.efDeepMenuTab span{grid-area:icon;align-self:center;width:42px;height:42px;border-radius:999px;display:grid;place-items:center;background:rgba(255,214,102,.18);color:#ffd666;box-shadow:inset 0 0 24px rgba(255,214,102,.14),0 0 24px rgba(255,214,102,.12)}.efDeepMenuTab b{grid-area:title;font-size:16px;line-height:1.08;letter-spacing:.04em;padding-right:58px}.efDeepMenuTab small{grid-area:sub;color:rgba(236,251,255,.72);font-weight:900;font-size:11px}.efDeepMenuTab:hover{transform:translateY(-1px);box-shadow:0 22px 62px rgba(0,0,0,.42),0 0 44px rgba(53,216,255,.22)}@keyframes efDeepMenuShine{0%,62%{transform:translateX(-130%)}78%,100%{transform:translateX(130%)}}@media(max-width:640px){.efDeepMenuTab{right:10px;left:auto;top:calc(334px + env(safe-area-inset-top));bottom:auto;min-width:154px;max-width:190px;border-radius:18px;padding:9px 10px}.efDeepMenuTab span{width:36px;height:36px}.efDeepMenuTab b{font-size:14px;padding-right:42px}.efDeepMenuTab small{font-size:10px}.efDeepMenuTab:after{right:8px;top:6px;font-size:8px}}
      `}</style>
    </button>
  );
}

export function App() {
  useEffect(() => attachConsoleAnalytics(), []);
  useEffect(() => track({ type: "page_view", path: window.location.pathname }), []);
  useEffect(() => disableGameServiceWorker(), []);
  useEffect(() => lockGameShellInteractions(), []);

  return (
    <>
      <Router
        routes={[
          { path: "/", element: withBoundary(<BetaHome />) },
          { path: "/game", element: withBoundary(<GameModeEntry />) },
          { path: "/game/lobby", element: withBoundary(<BetaHome />) },
          { path: "/game/account", element: withBoundary(<ProfileHub />) },
          { path: "/game/profiles", element: withBoundary(<ProfileHub />) },
          { path: "/game/settings", element: withBoundary(<GameSettingsHub />) },
          { path: "/game/play", element: withBoundary(<NextPlaySession />) },
          { path: "/game/debug", element: withBoundary(<AIDebugLab />) },
          { path: "/game/progress", element: withBoundary(<BetaProgress />) },
          { path: "/game/repair", element: withBoundary(<BetaProgress />) },
          { path: "/game/leaderboard", element: withBoundary(<Leaderboard />) },
          { path: "/game/season", element: withBoundary(<SeasonHub />) },
          { path: "/game/qa", element: withBoundary(<BetaQA />) },
          { path: "/game/report", element: withBoundary(<BetaReport />) },
          { path: "/game/checklist", element: withBoundary(<BetaChecklist />) },
          { path: "/game/cache", element: withBoundary(<BetaCacheDoctor />) },
          { path: "/game/skins", element: withBoundary(<SkinLab />) },
          { path: "/game/deep-treasures", element: withBoundary(<DeepTreasuresHub />) },
          { path: "/game/classic", element: withBoundary(<Game />) },
          { path: "/game/next", element: withBoundary(<BetaHome />) },
          { path: "/game/next/lobby", element: withBoundary(<BetaHome />) },
          { path: "/game/next/account", element: withBoundary(<ProfileHub />) },
          { path: "/game/next/profiles", element: withBoundary(<ProfileHub />) },
          { path: "/game/next/settings", element: withBoundary(<GameSettingsHub />) },
          { path: "/game/next/debug", element: withBoundary(<AIDebugLab />) },
          { path: "/game/next/progress", element: withBoundary(<BetaProgress />) },
          { path: "/game/next/leaderboard", element: withBoundary(<Leaderboard />) },
          { path: "/game/next/season", element: withBoundary(<SeasonHub />) },
          { path: "/game/next/qa", element: withBoundary(<BetaQA />) },
          { path: "/game/next/report", element: withBoundary(<BetaReport />) },
          { path: "/game/next/checklist", element: withBoundary(<BetaChecklist />) },
          { path: "/game/next/cache", element: withBoundary(<BetaCacheDoctor />) },
          { path: "/game/next/skins", element: withBoundary(<SkinLab />) },
          { path: "/game/next/deep-treasures", element: withBoundary(<DeepTreasuresHub />) },
          { path: "/game/next/play", element: withBoundary(<NextPlaySession />) },
          { path: "/classic", element: withBoundary(<Game />) },
          { path: "/next", element: withBoundary(<BetaHome />) },
          { path: "/next/lobby", element: withBoundary(<BetaHome />) },
          { path: "/next/account", element: withBoundary(<ProfileHub />) },
          { path: "/next/profiles", element: withBoundary(<ProfileHub />) },
          { path: "/next/settings", element: withBoundary(<GameSettingsHub />) },
          { path: "/next/debug", element: withBoundary(<AIDebugLab />) },
          { path: "/next/progress", element: withBoundary(<BetaProgress />) },
          { path: "/next/leaderboard", element: withBoundary(<Leaderboard />) },
          { path: "/next/season", element: withBoundary(<SeasonHub />) },
          { path: "/next/qa", element: withBoundary(<BetaQA />) },
          { path: "/next/report", element: withBoundary(<BetaReport />) },
          { path: "/next/checklist", element: withBoundary(<BetaChecklist />) },
          { path: "/next/cache", element: withBoundary(<BetaCacheDoctor />) },
          { path: "/next/skins", element: withBoundary(<SkinLab />) },
          { path: "/next/deep-treasures", element: withBoundary(<DeepTreasuresHub />) },
          { path: "/next/play", element: withBoundary(<NextPlaySession />) },
        ]}
        notFound={withBoundary(<BetaHome />)}
      />
      <LobbySkinCarousel />
      <LobbyDailyLoginMount />
      <DeepTreasuresMenuTab />
    </>
  );
}

export default App;

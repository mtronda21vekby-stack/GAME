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
import { ProfileHub } from "../evofish-next/ui/ProfileHub";
import { SeasonHub } from "../evofish-next/ui/SeasonHub";
import { SkinLab } from "../evofish-next/ui/SkinLab";
import { TrenchLocation } from "../evofish-next/ui/TrenchLocation";
import { NextPlaySession } from "../evofish-next/ui/NextPlaySession";
import { attachConsoleAnalytics, track } from "@blackcrown/core";

function disableGameServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.filter((registration) => registration.scope.includes("/game/")).map((registration) => registration.unregister())))
    .catch(() => {});
}

function withBoundary(element: React.ReactNode) { return <BetaErrorBoundary>{element}</BetaErrorBoundary>; }
function GameModeEntry() { const mode = new URLSearchParams(window.location.search).get("mode"); if (mode === "classic") return <Game />; if (mode === "next") return <NextPlaySession />; return <BetaHome />; }

function TrenchMenuTab() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => { const onPop = () => setPath(window.location.pathname); window.addEventListener("popstate", onPop); return () => window.removeEventListener("popstate", onPop); }, []);
  const isMenuPath = ["/", "/game", "/game/lobby", "/game/next", "/game/next/lobby", "/next", "/next/lobby"].includes(path.replace(/\/+$/, "") || "/");
  if (!isMenuPath) return null;
  return <button className="efDeepMenuTab" type="button" onClick={() => navigate("/game/deep-treasures")}><span>🌊</span><b>ВПАДИНА</b><small>Новая карта · рулетка</small><style>{`.efDeepMenuTab{position:fixed;left:max(18px,env(safe-area-inset-left));bottom:calc(92px + env(safe-area-inset-bottom));z-index:60;appearance:none;border:1px solid rgba(255,214,102,.38);border-radius:22px;padding:12px 15px;min-width:210px;display:grid;grid-template-columns:auto 1fr;grid-template-areas:"icon title" "icon sub";gap:1px 10px;text-align:left;background:linear-gradient(135deg,rgba(255,214,102,.18),rgba(53,216,255,.18)),rgba(2,14,28,.82);color:#ecfbff;box-shadow:0 18px 55px rgba(0,0,0,.38),0 0 34px rgba(53,216,255,.16);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.efDeepMenuTab span{grid-area:icon;align-self:center;width:40px;height:40px;border-radius:999px;display:grid;place-items:center;background:rgba(255,214,102,.16);color:#ffd666;box-shadow:inset 0 0 24px rgba(255,214,102,.12)}.efDeepMenuTab b{grid-area:title;font-size:14px;line-height:1.1}.efDeepMenuTab small{grid-area:sub;color:rgba(236,251,255,.66);font-weight:800}@media(max-width:640px){.efDeepMenuTab{left:10px;right:10px;bottom:calc(84px + env(safe-area-inset-bottom));min-width:0;border-radius:18px}}`}</style></button>;
}

export function App() {
  useEffect(() => attachConsoleAnalytics(), []);
  useEffect(() => track({ type: "page_view", path: window.location.pathname }), []);
  useEffect(() => disableGameServiceWorker(), []);
  return <><Router routes={[
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
    { path: "/game/trench", element: withBoundary(<TrenchLocation />) },
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
    { path: "/game/next/trench", element: withBoundary(<TrenchLocation />) },
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
    { path: "/next/trench", element: withBoundary(<TrenchLocation />) },
    { path: "/next/play", element: withBoundary(<NextPlaySession />) }
  ]} notFound={withBoundary(<BetaHome />)} /><TrenchMenuTab /></>;
}

export default App;

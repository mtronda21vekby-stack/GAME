import React, { useMemo, useState } from "react";
import { Link } from "../../router";
import type { NextEngineState, NextFishEntity } from "../core/engineTypes";
import type { EvoFishFormId } from "../core/types";
import { EVOFISH_SKIN_BY_ID } from "../content/skins";
import { formForLevel, xpToNextLevel, xpToNextTier } from "../content/progression";
import { defaultNextProgress, type EvoFishNextProgressState } from "../state/skinSaveAdapter";
import { createNextWorld } from "../systems/createWorld";

const QA_LEVELS = [1, 10, 21, 40] as const;

type LevelScenario = typeof QA_LEVELS[number];

type ScenarioReport = {
  level: number;
  tier: number;
  form: EvoFishFormId;
  enemyCount: number;
  nearEnemies: number;
  nearPredators: number;
  nearElite: number;
  avgNpcLevel: number;
  maxNpcLevel: number;
  maxNearNpcLevel: number;
  threatScore: number;
  estimatedXpPerMinute: number;
  estimatedPearlsPerTenMinutes: number;
  estimatedCoralsPerTenMinutes: number;
  status: "PASS" | "WARN" | "FAIL";
  notes: string[];
};

function fmt(value: number) {
  return Math.max(0, Math.round(value)).toLocaleString("ru-RU");
}

function isElite(enemy: NextFishEntity) {
  return enemy.aiType === "apex" || enemy.aiType === "leviathan" || enemy.aiType === "stalker";
}

function isPredator(enemy: NextFishEntity) {
  return enemy.aiType === "hunter" || enemy.aiType === "brute" || isElite(enemy);
}

function npcLevel(enemy: NextFishEntity) {
  return Math.max(1, Math.floor(enemy.npcLevel || Math.round(enemy.mass * 4)));
}

function formHp(form: EvoFishFormId) {
  if (form === "fish") return 120;
  if (form === "shark") return 220;
  return 420;
}

function formMass(level: number, form: EvoFishFormId) {
  const growth = Math.max(0, level - 1) * 0.18;
  if (form === "megalodon") return 6.5 + growth * 0.32;
  if (form === "shark") return 3.2 + growth * 0.44;
  return 1.2 + growth;
}

function progressForLevel(level: number): EvoFishNextProgressState {
  const tier = Math.max(1, Math.min(12, Math.ceil(level / 3)));
  const form = formForLevel(level, "fish");
  const hpMax = Math.round(formHp(form) + tier * 12);
  return {
    ...defaultNextProgress(),
    level,
    tier,
    xp: 0,
    xpToNext: xpToNextTier(tier),
    levelXp: 0,
    levelXpToNext: xpToNextLevel(level),
    mass: formMass(level, form),
    hp: hpMax,
    hpMax,
    form
  };
}

function rewardEstimate(state: NextEngineState, enemy: NextFishEntity) {
  const levelDiff = npcLevel(enemy) - state.player.level;
  const diffBonus = levelDiff >= 16 ? 2.35 : levelDiff >= 10 ? 1.95 : levelDiff >= 6 ? 1.62 : levelDiff >= 3 ? 1.36 : levelDiff >= 0 ? 1.15 : Math.max(0.78, 1 + levelDiff * 0.018);
  const formBonus = enemy.form === "megalodon" ? 1.55 : enemy.form === "shark" ? 1.18 : 1;
  const archetypeBonus = enemy.aiType === "apex" ? 2.7 : enemy.aiType === "leviathan" ? 2.2 : enemy.aiType === "stalker" ? 1.7 : enemy.aiType === "brute" ? 1.45 : enemy.aiType === "hunter" ? 1.22 : enemy.aiType === "neutral" ? 1.04 : 0.86;
  const currencyBonus = enemy.aiType === "apex" ? 4.3 : enemy.aiType === "leviathan" ? 3.1 : enemy.aiType === "stalker" ? 2.15 : enemy.aiType === "brute" ? 1.85 : enemy.aiType === "hunter" ? 1.35 : enemy.aiType === "neutral" ? 1.05 : 0.9;
  const base = state.player.level >= 22 ? 38 : 28;
  const xp = Math.round((base + enemy.mass * 18 + enemy.hpMax * 0.092 + npcLevel(enemy) * 4.8) * formBonus * archetypeBonus * diffBonus * (enemy.familyRewardMultiplier || 1));
  const pearls = Math.max(1, Math.round((1 + enemy.mass * 1.35) * currencyBonus * (enemy.familyRewardMultiplier || 1) * (1 + (diffBonus - 1) * 0.55)));
  const coralChance = Math.min(0.13, 0.004 + enemy.mass * 0.003 + (enemy.aiType === "brute" ? 0.018 : 0) + (enemy.aiType === "stalker" ? 0.012 : 0));
  return { xp, pearls, coralChance };
}

function analyze(level: LevelScenario): ScenarioReport {
  const skin = EVOFISH_SKIN_BY_ID.default;
  const state = createNextWorld(skin, progressForLevel(level));
  const player = state.player;
  const near = state.enemies.filter((enemy) => Math.hypot(enemy.x - player.x, enemy.y - player.y) < 960);
  const levels = state.enemies.map(npcLevel);
  const nearLevels = near.map(npcLevel);
  const rewards = state.enemies.map((enemy) => rewardEstimate(state, enemy));
  const avgRewardXp = rewards.reduce((sum, item) => sum + item.xp, 0) / Math.max(1, rewards.length);
  const avgRewardPearls = rewards.reduce((sum, item) => sum + item.pearls, 0) / Math.max(1, rewards.length);
  const avgCoralChance = rewards.reduce((sum, item) => sum + item.coralChance, 0) / Math.max(1, rewards.length);
  const nearPredators = near.filter(isPredator).length;
  const nearElite = near.filter(isElite).length;
  const threatScore = near.reduce((sum, enemy) => sum + (isElite(enemy) ? 3.8 : isPredator(enemy) ? 1.6 : 0.35) + Math.max(0, npcLevel(enemy) - level) * 0.16, 0);
  const avgNpcLevel = levels.reduce((sum, value) => sum + value, 0) / Math.max(1, levels.length);
  const maxNpcLevel = Math.max(...levels, 1);
  const maxNearNpcLevel = Math.max(...nearLevels, 1);
  const notes: string[] = [];

  if (level === 21 && maxNearNpcLevel >= 40) notes.push("LV21 near field still has LV40+ enemies");
  if (level === 21 && nearElite > 1) notes.push("Too many elite enemies near LV21 player");
  if (nearPredators > (level <= 25 ? 2 : 4)) notes.push("Predator pressure is above target");
  if (threatScore > (level <= 25 ? 10 : 16)) notes.push("Threat score is high");
  if (notes.length === 0) notes.push("Target envelope OK");

  return {
    level,
    tier: player.tier,
    form: player.form,
    enemyCount: state.enemies.length,
    nearEnemies: near.length,
    nearPredators,
    nearElite,
    avgNpcLevel,
    maxNpcLevel,
    maxNearNpcLevel,
    threatScore,
    estimatedXpPerMinute: avgRewardXp * 2.2,
    estimatedPearlsPerTenMinutes: avgRewardPearls * 18,
    estimatedCoralsPerTenMinutes: avgCoralChance * 18,
    status: notes.some((note) => note.includes("LV40+")) ? "FAIL" : notes.length > 1 || threatScore > (level <= 25 ? 10 : 16) ? "WARN" : "PASS",
    notes
  };
}

export function AIDebugLab() {
  const [activeLevel, setActiveLevel] = useState<LevelScenario>(21);
  const reports = useMemo(() => QA_LEVELS.map(analyze), []);
  const active = reports.find((report) => report.level === activeLevel) || reports[0];

  return (
    <main className="efAiLab">
      <section className="shell">
        <nav className="nav"><Link to="/game">Главная</Link><Link to="/game/play">Играть</Link><Link to="/game/leaderboard">Лидеры</Link></nav>
        <header className="hero"><span>MAX AI / ENGINE PASS</span><h1>AI Debug Lab</h1><p>Проверка Director 2.0, pressure limit, LV21 bridge, экономики и плотности врагов.</p></header>
        <section className="buttons">{QA_LEVELS.map((level) => <button key={level} className={activeLevel === level ? "active" : ""} onClick={() => setActiveLevel(level)}>Симуляция LV{level}</button>)}</section>
        <section className={`summary ${active.status.toLowerCase()}`}>
          <b>{active.status}</b>
          <h2>LV {active.level} · Tier {active.tier} · {active.form}</h2>
          <p>{active.notes.join(" · ")}</p>
        </section>
        <section className="grid">
          <article><span>Near enemies</span><b>{active.nearEnemies}</b><small>predators {active.nearPredators} · elite {active.nearElite}</small></article>
          <article><span>NPC LV</span><b>{active.maxNearNpcLevel}</b><small>avg {active.avgNpcLevel.toFixed(1)} · max world {active.maxNpcLevel}</small></article>
          <article><span>Threat score</span><b>{active.threatScore.toFixed(1)}</b><small>target LV21 ≤ 10</small></article>
          <article><span>Economy est.</span><b>{fmt(active.estimatedPearlsPerTenMinutes)}</b><small>pearls/10m · {active.estimatedCoralsPerTenMinutes.toFixed(1)} corals/10m</small></article>
        </section>
        <section className="table"><h2>All scenarios</h2>{reports.map((report) => <button key={report.level} onClick={() => setActiveLevel(report.level as LevelScenario)}><b>{report.status}</b><span>LV{report.level}</span><span>Near {report.nearEnemies}</span><span>Pred {report.nearPredators}</span><span>Elite {report.nearElite}</span><span>Max near LV {report.maxNearNpcLevel}</span><span>Threat {report.threatScore.toFixed(1)}</span></button>)}</section>
      </section>
      <style>{`.efAiLab{min-height:100vh;background:linear-gradient(180deg,#031827,#010711);color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.shell{width:min(1080px,calc(100vw - 28px));margin:0 auto;padding:22px 0;display:grid;gap:14px}.nav{display:flex;gap:8px;overflow:auto;padding:8px;border:1px solid rgba(150,230,255,.16);border-radius:999px;background:rgba(2,11,21,.68)}.nav a,.buttons button,.table button{color:#e7f2ff;text-decoration:none;border:1px solid rgba(150,230,255,.16);background:rgba(255,255,255,.06);border-radius:999px;padding:10px 14px;font-weight:950}.hero,.summary,.grid article,.table{border:1px solid rgba(150,230,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.095),rgba(255,255,255,.038));border-radius:28px;padding:18px;box-shadow:0 24px 80px rgba(0,0,0,.34)}.hero span,.grid span{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(231,242,255,.62);font-weight:1000}.hero h1{font-size:44px;margin:6px 0}.hero p,.summary p,.grid small{color:rgba(231,242,255,.72)}.buttons{display:flex;gap:8px;overflow:auto}.buttons button.active{border-color:rgba(255,220,120,.56);background:rgba(255,220,120,.14)}.summary b{display:inline-block;border-radius:999px;padding:8px 12px}.summary.pass b{background:rgba(100,255,170,.18)}.summary.warn b{background:rgba(255,220,120,.18)}.summary.fail b{background:rgba(255,80,80,.22)}.summary h2{margin:10px 0 4px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.grid b{display:block;font-size:30px;margin:4px 0}.table{display:grid;gap:8px}.table h2{margin:0 0 6px}.table button{border-radius:18px;display:grid;grid-template-columns:80px repeat(6,minmax(0,1fr));gap:8px;text-align:left;align-items:center}@media(max-width:800px){.grid{grid-template-columns:1fr 1fr}.table button{grid-template-columns:1fr 1fr}.hero h1{font-size:36px}}`}</style>
    </main>
  );
}

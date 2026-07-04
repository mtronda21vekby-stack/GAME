import type { EvoFishEconomyState, EvoFishFormId, EvoFishSkinDefinition } from "../core/types";
import type { NextEngineState, NextFishEntity, NextQuestState, NextWorldConfig } from "../core/engineTypes";
import { defaultNextAccount, normalizeNextAccount, type NextAccountState } from "../content/account";
import { defaultAchievementState, type NextAchievementState } from "../content/achievements";
import { chooseEnemyArchetype } from "../content/enemyArchetypes";
import { pickEnemyFamily } from "../content/enemyFamilies";
import { defaultCraftState } from "../content/craft";
import { EVOFISH_FORMS } from "../content/forms";
import { defaultMutationState, getMutationBonus, getMutationTotalLevel, type NextMutationState } from "../content/mutations";
import { xpToNextLevel, xpToNextTier } from "../content/progression";
import { createResourceField } from "../content/resources";
import { buildQuestBoard } from "../content/quests";
import { EVOFISH_SKIN_BY_ID } from "../content/skins";
import { getZoneAt } from "../content/zones";
import { defaultNextQuests, type EvoFishNextProgressState } from "../state/skinSaveAdapter";

export const NEXT_WORLD_CONFIG: NextWorldConfig = {
  width: 3640,
  height: 2340,
  enemyTarget: 46,
  resourceTarget: 42
};

type Point = { x: number; y: number };

function storedAccount(): NextAccountState {
  try {
    const raw = localStorage.getItem("evofish_next_save_v1");
    if (!raw) return defaultNextAccount();
    return normalizeNextAccount(JSON.parse(raw)?.account);
  } catch {
    return defaultNextAccount();
  }
}

function storedAchievements(): NextAchievementState {
  try {
    const raw = localStorage.getItem("evofish_next_save_v1");
    if (!raw) return defaultAchievementState();
    return normalizeAchievementState(JSON.parse(raw)?.achievements);
  } catch {
    return defaultAchievementState();
  }
}

export function enemyThreatLevel(level: number, tier: number, mass: number) {
  return Math.max(1, Math.floor(level || 1), Math.floor((mass || 1) * 4), Math.floor((tier || 1) * 3));
}

function threatScale(threatLevel: number) {
  return 1 + Math.min(4.8, Math.max(0, threatLevel - 1) * 0.045);
}

function randomWorldPoint(config: NextWorldConfig, pad = 190): Point {
  return {
    x: pad + Math.random() * (config.width - pad * 2),
    y: pad + Math.random() * (config.height - pad * 2)
  };
}

function pointAwayFrom(config: NextWorldConfig, avoidX?: number, avoidY?: number, radius = 0): Point {
  if (!Number.isFinite(avoidX) || !Number.isFinite(avoidY) || radius <= 0) return randomWorldPoint(config);

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const point = randomWorldPoint(config);
    if (Math.hypot(point.x - Number(avoidX), point.y - Number(avoidY)) >= radius) return point;
  }

  const angle = Math.random() * Math.PI * 2;
  return {
    x: Math.max(190, Math.min(config.width - 190, Number(avoidX) + Math.cos(angle) * radius)),
    y: Math.max(190, Math.min(config.height - 190, Number(avoidY) + Math.sin(angle) * radius))
  };
}

export function safePlayerSpawn(config: NextWorldConfig, enemies: NextFishEntity[] = []): Point {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const point = randomWorldPoint(config, 260);
    const zone = getZoneAt(point.x, point.y);
    const nearEnemy = enemies.some((enemy) => Math.hypot(enemy.x - point.x, enemy.y - point.y) < enemy.radius + 720);
    if (!nearEnemy && zone.risk <= 1) return point;
  }

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const point = randomWorldPoint(config, 240);
    const nearEnemy = enemies.some((enemy) => Math.hypot(enemy.x - point.x, enemy.y - point.y) < enemy.radius + 560);
    if (!nearEnemy) return point;
  }

  return { x: config.width * 0.34, y: config.height * 0.34 };
}

export function formFromSkin(skin: EvoFishSkinDefinition): EvoFishFormId {
  return skin.form === "any" ? "fish" : skin.form;
}

export function radiusFromForm(form: EvoFishFormId) {
  if (form === "fish") return 24;
  if (form === "shark") return 31;
  return 39;
}

export function massFromForm(form: EvoFishFormId) {
  if (form === "fish") return 1.2;
  if (form === "shark") return 3.2;
  return 6.5;
}

export function speedFromForm(form: EvoFishFormId) {
  if (form === "fish") return 430;
  if (form === "shark") return 385;
  return 330;
}

export function hpFromForm(form: EvoFishFormId) {
  if (form === "fish") return 120;
  if (form === "shark") return 220;
  return 420;
}

export function damageFromForm(form: EvoFishFormId) {
  if (form === "fish") return 28;
  if (form === "shark") return 46;
  return 76;
}

function familySkin(familySkinId: string, fallback: EvoFishSkinDefinition) {
  return EVOFISH_SKIN_BY_ID[familySkinId] || fallback;
}

function wanderPoint(config: NextWorldConfig) {
  return randomWorldPoint(config, 180);
}

function normalizeQuestState(quests?: NextQuestState): NextQuestState {
  const fallback = defaultNextQuests();
  return {
    completed: {
      ...fallback.completed,
      ...(quests?.completed || {})
    },
    baselines: {
      ...fallback.baselines,
      ...(quests?.baselines || {})
    },
    counters: {
      ...fallback.counters,
      ...(quests?.counters || {})
    },
    dailyKey: quests?.dailyKey || fallback.dailyKey,
    weeklyKey: quests?.weeklyKey || fallback.weeklyKey,
    directorFocus: quests?.directorFocus || fallback.directorFocus
  };
}

function normalizeMutationState(mutations?: NextMutationState): NextMutationState {
  return {
    ...defaultMutationState(),
    levels: { ...(mutations?.levels || {}) }
  };
}

function normalizeAchievementState(achievements?: NextAchievementState): NextAchievementState {
  return {
    ...defaultAchievementState(),
    unlocked: { ...(achievements?.unlocked || {}) }
  };
}

export function makeEnemy(
  id: number,
  config: NextWorldConfig = NEXT_WORLD_CONFIG,
  threatLevel = 1,
  playerMass = 1.2,
  avoidX?: number,
  avoidY?: number,
  safeRadius = 0
): NextFishEntity {
  const archetype = chooseEnemyArchetype(id, threatLevel);
  const family = pickEnemyFamily(id, archetype.id);
  const scale = threatScale(threatLevel);
  const apex = archetype.id === "apex";
  const leviathan = archetype.id === "leviathan";
  const stalker = archetype.id === "stalker";
  const big = archetype.id === "brute" || apex || leviathan || stalker;
  const form: EvoFishFormId = apex || leviathan ? "megalodon" : big ? "shark" : "fish";

  const baseSmall = 0.48 + Math.random() * 0.72;
  const mass = apex
    ? Math.max(10.5 * scale, playerMass * 1.34)
    : leviathan
      ? Math.max(7.4 * scale, playerMass * 1.16)
      : stalker
        ? Math.max(2.35 * scale, playerMass * 0.72)
        : archetype.id === "brute"
          ? Math.max(2.4 * scale, playerMass * 0.48)
          : archetype.id === "hunter"
            ? Math.max((1.2 + Math.random() * 0.85) * scale, playerMass * 0.28)
            : baseSmall * Math.max(1, scale * 0.78);

  const baseHp = apex
    ? Math.round(760 + mass * 68)
    : leviathan
      ? Math.round(520 + mass * 58)
      : stalker
        ? Math.round(210 + mass * 46)
        : Math.round((big ? 170 : archetype.id === "hunter" ? 105 : 48 + Math.random() * 42) * Math.max(0.8, mass));
  const hp = Math.round(baseHp * family.hpMultiplier * (1 + Math.min(1.5, threatLevel * 0.018)));
  const spawn = pointAwayFrom(config, avoidX, avoidY, safeRadius + (apex || leviathan ? 260 : stalker ? 160 : 0));
  const target = wanderPoint(config);
  const fallbackSkin = apex
    ? (EVOFISH_SKIN_BY_ID.mega_lava || EVOFISH_SKIN_BY_ID.mega_deep)
    : leviathan
      ? (EVOFISH_SKIN_BY_ID.mega_ice || EVOFISH_SKIN_BY_ID.mega_deep)
      : stalker
        ? (EVOFISH_SKIN_BY_ID.shark_shadow || EVOFISH_SKIN_BY_ID.shark_classic)
        : big
          ? EVOFISH_SKIN_BY_ID.shark_classic
          : EVOFISH_SKIN_BY_ID.default;
  const damageBase = apex ? 46 : leviathan ? 38 : stalker ? 28 : big ? 24 : 8 + Math.random() * 8;

  return {
    id,
    x: spawn.x,
    y: spawn.y,
    vx: -50 + Math.random() * 100,
    vy: -50 + Math.random() * 100,
    radius: apex ? 46 : leviathan ? 52 : stalker ? 30 : big ? 25 : archetype.id === "hunter" ? 21 : 14 + Math.random() * 8,
    mass,
    hp,
    hpMax: hp,
    damage: damageBase * archetype.damageMultiplier * (1 + Math.min(1.35, threatLevel * 0.022)),
    speed: archetype.baseSpeed * family.speedMultiplier * (1 + Math.min(0.42, threatLevel * 0.006)),
    form,
    skin: apex || leviathan ? fallbackSkin : familySkin(family.skinId, fallbackSkin),
    angle: 0,
    hitT: 0,
    aiType: archetype.id,
    aiState: "wander",
    familyName: family.name,
    familyRewardMultiplier: family.rewardMultiplier,
    aggroRadius: archetype.aggroRadius,
    attackRange: archetype.attackRange,
    attackCd: apex || leviathan ? 1.05 : stalker ? 0.72 : 0.4 + Math.random() * 0.8,
    thinkT: Math.random() * 0.4,
    wanderX: target.x,
    wanderY: target.y,
    wanderT: apex || leviathan ? 0.5 : stalker ? 0.65 : 0.8 + Math.random() * 2.2
  };
}

export function createNextWorld(
  playerSkin: EvoFishSkinDefinition,
  savedProgress?: EvoFishNextProgressState,
  savedEconomy?: EvoFishEconomyState,
  savedQuests?: NextQuestState,
  savedMutations?: NextMutationState,
  savedAccount?: NextAccountState,
  savedAchievements?: NextAchievementState
): NextEngineState {
  const form = savedProgress?.form || formFromSkin(playerSkin);
  const config = NEXT_WORLD_CONFIG;
  const account = normalizeNextAccount(savedAccount || storedAccount());
  const achievements = normalizeAchievementState(savedAchievements || storedAchievements());
  const craft = defaultCraftState();
  const mutations = normalizeMutationState(savedMutations);
  const level = Math.max(1, Math.floor(savedProgress?.level || 1));
  const tier = Math.max(1, Math.min(12, Math.floor(savedProgress?.tier || 1)));
  const hpBonus = getMutationBonus(mutations, "hp");
  const damageBonus = getMutationBonus(mutations, "damage");
  const speedBonus = getMutationBonus(mutations, "speed");
  const baseHpMax = Math.round((hpFromForm(form) + tier * 12) * (1 + hpBonus));
  const hpMax = Math.max(baseHpMax, Math.floor(savedProgress?.hpMax || baseHpMax));
  const hp = Math.max(1, Math.min(hpMax, Math.floor(savedProgress?.hp || hpMax)));
  const mass = Math.max(massFromForm(form), Number(savedProgress?.mass || massFromForm(form)));
  const economy: EvoFishEconomyState = {
    pearls: Math.max(0, Math.floor(savedEconomy?.pearls || 0)),
    corals: Math.max(0, Math.floor(savedEconomy?.corals || 0))
  };
  const quests = normalizeQuestState(savedQuests);
  const board = buildQuestBoard();
  const completedQuests = Object.keys(quests.completed).length;
  const spawnThreat = enemyThreatLevel(level, tier, mass);
  const playerSpawn = safePlayerSpawn(config);
  const enemySafeRadius = level <= 3 ? 920 : 680;
  const enemies = Array.from({ length: config.enemyTarget }, (_, index) => makeEnemy(index + 1, config, spawnThreat, mass, playerSpawn.x, playerSpawn.y, enemySafeRadius));
  const resources = createResourceField(config.resourceTarget, config.width, config.height);
  const apexEnemy = enemies.find((enemy) => enemy.aiType === "apex");
  const playerDamage = Math.round((damageFromForm(form) + tier * 3) * (1 + damageBonus));
  const playerSpeed = speedFromForm(form) * (1 + speedBonus);
  const startZone = getZoneAt(playerSpawn.x, playerSpawn.y);

  return {
    config,
    account,
    economy,
    achievements,
    craft,
    mutations,
    quests,
    frame: 0,
    nextFloatId: 1,
    player: {
      id: 0,
      x: playerSpawn.x,
      y: playerSpawn.y,
      vx: 0,
      vy: 0,
      radius: Math.max(radiusFromForm(form), Math.min(58, 18 + Math.sqrt(mass) * 5.2)),
      mass,
      hp,
      hpMax,
      damage: playerDamage,
      speed: playerSpeed,
      biteCd: 0,
      dashCd: 0,
      dashT: 0,
      invulnT: level <= 3 ? 4.2 : 2.4,
      dead: false,
      downed: false,
      deathT: 0,
      downT: 0,
      respawnT: 0,
      reviveT: 0,
      level,
      tier,
      xp: Math.max(0, Math.floor(savedProgress?.xp || 0)),
      xpToNext: xpToNextTier(tier),
      levelXp: Math.max(0, Math.floor(savedProgress?.levelXp || 0)),
      levelXpToNext: xpToNextLevel(level),
      form,
      skin: playerSkin,
      angle: 0,
      hitT: 0,
      aiType: "neutral",
      aiState: "wander",
      familyName: "Player",
      familyRewardMultiplier: 1,
      aggroRadius: 0,
      attackRange: 0,
      attackCd: 0,
      thinkT: 0,
      wanderX: playerSpawn.x,
      wanderY: playerSpawn.y,
      wanderT: 0
    },
    enemies,
    resources,
    floats: [],
    stats: {
      mass,
      kills: Math.max(0, Math.floor(savedProgress?.kills || 0)),
      deaths: Math.max(0, Math.floor(savedProgress?.deaths || 0)),
      downs: Math.max(0, Math.floor(savedProgress?.deaths || 0)),
      accountName: account.name,
      accountLevel: account.level,
      accountXp: account.xp,
      accountXpToNext: account.xpToNext,
      lastRunAccountXp: account.lastRunXp,
      hp,
      hpMax,
      level,
      tier,
      xp: Math.max(0, Math.floor(savedProgress?.xp || 0)),
      xpToNext: xpToNextTier(tier),
      levelXp: Math.max(0, Math.floor(savedProgress?.levelXp || 0)),
      levelXpToNext: xpToNextLevel(level),
      pearls: economy.pearls,
      corals: economy.corals,
      mutationLevel: getMutationTotalLevel(mutations),
      achievementsUnlocked: Object.keys(achievements.unlocked).length,
      craftUses: quests.counters?.craft || 0,
      mutationPurchases: quests.counters?.mutations || 0,
      questDirectorFocus: board.directorFocus,
      dailyQuestKey: board.dailyKey,
      weeklyQuestKey: board.weeklyKey,
      craftBarrierT: 0,
      craftBiteBoostT: 0,
      craftSonarT: 0,
      resourcesCollected: quests.counters?.resources || 0,
      activeResources: resources.length,
      zoneId: startZone.id,
      zoneName: startZone.name,
      zoneEffect: startZone.description,
      zoneRisk: startZone.risk,
      zoneRewardBoost: startZone.rewardMultiplier,
      completedQuests,
      activeQuestTitle: "—",
      activeQuestProgress: 0,
      activeQuestTarget: 1,
      apexAlive: Boolean(apexEnemy),
      apexName: apexEnemy ? "Apex Megalodon" : "—",
      apexHp: apexEnemy?.hp || 0,
      apexHpMax: apexEnemy?.hpMax || 1,
      dead: false,
      downed: false,
      respawnTime: 0,
      reviveTime: 0,
      skinName: playerSkin.name,
      formName: EVOFISH_FORMS[form].name,
      lastEvent: savedProgress ? `Safe spawn · threat ${spawnThreat}` : `Safe spawn · threat ${spawnThreat}`
    }
  };
}

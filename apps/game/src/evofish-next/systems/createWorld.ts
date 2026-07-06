import type { EvoFishEconomyState, EvoFishFormId, EvoFishSkinDefinition } from "../core/types";
import type { NextEngineState, NextFishEntity, NextQuestState, NextWorldConfig } from "../core/engineTypes";
import { defaultNextAccount, normalizeNextAccount, type NextAccountState } from "../content/account";
import { defaultAchievementState, type NextAchievementState } from "../content/achievements";
import { chooseEnemyArchetype, type NextEnemyArchetypeId } from "../content/enemyArchetypes";
import { pickEnemyFamily } from "../content/enemyFamilies";
import { defaultCraftState } from "../content/craft";
import { DARK_CAVE_STORY_TITLE, darkCaveStoryStep } from "../content/darkCaveStory";
import { EVOFISH_SHARED_FISH_HITBOX_RADIUS } from "../content/fishHitbox";
import { EVOFISH_FORMS } from "../content/forms";
import { defaultMutationState, getMutationBonus, getMutationTotalLevel, type NextMutationState } from "../content/mutations";
import { xpToNextLevel, xpToNextTier } from "../content/progression";
import { createResourceField } from "../content/resources";
import { buildQuestBoard } from "../content/quests";
import { EVOFISH_SKIN_BY_ID } from "../content/skins";
import { getWorldMap, EVOFISH_WORLD_CONFIG } from "../content/worldMaps";
import { getZoneAt } from "../content/zones";
import { darkCavePortalUnlocked } from "../assets/visuals/visualCatalog";
import { defaultNextQuests, type EvoFishNextProgressState } from "../state/skinSaveAdapter";

export const NEXT_WORLD_CONFIG: NextWorldConfig = EVOFISH_WORLD_CONFIG;
export const POST_LEVEL_21_BALANCE_START = 21;

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

export function postLevel21EnemyThreatBonus(level: number) {
  const playerLevel = Math.max(1, Math.floor(level || 1));
  const late = Math.max(0, playerLevel - POST_LEVEL_21_BALANCE_START);
  if (late <= 0) return 0;
  return Math.min(24, Math.floor(late * 0.52 + Math.sqrt(late) * 0.95));
}

export function enemyThreatLevel(level: number, tier: number, mass: number) {
  const playerLevel = Math.max(1, Math.floor(level || 1));
  const playerTier = Math.max(1, Math.floor(tier || 1));
  const playerMass = Math.max(1, Number(mass || 1));
  const post21Bonus = postLevel21EnemyThreatBonus(playerLevel);
  const midPressure = Math.max(0, playerTier - 6) * 0.32 + Math.max(0, playerMass - 6) * 0.42;
  const pressureCap = playerLevel < 30 ? 4.5 : 7;
  const pressureScore = Math.min(pressureCap, midPressure);
  const levelScore = playerLevel + post21Bonus;
  return Math.max(1, Math.round(levelScore + pressureScore));
}

function threatScale(threatLevel: number) {
  return 1 + Math.min(4.4, Math.max(0, threatLevel - 1) * 0.038);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function enemyLevelBias(archetype: NextEnemyArchetypeId) {
  if (archetype === "leviathan") return 14;
  if (archetype === "apex") return 12;
  if (archetype === "stalker") return 7;
  if (archetype === "brute") return 5;
  if (archetype === "hunter") return 2;
  if (archetype === "neutral") return -2;
  return -7;
}

function post21MinimumLevelOffset(archetype: NextEnemyArchetypeId, playerLevel: number) {
  const late = Math.max(0, Math.floor(playerLevel || 1) - POST_LEVEL_21_BALANCE_START);
  if (late <= 0) return 0;
  const ramp = Math.min(8, Math.floor(late * 0.22 + Math.sqrt(late) * 0.6));
  const role = archetype === "prey" ? -2 : archetype === "neutral" ? -1 : archetype === "hunter" ? 1 : archetype === "brute" ? 3 : archetype === "stalker" ? 5 : 8;
  return Math.max(0, ramp + role);
}

function enemyNpcLevel(archetype: NextEnemyArchetypeId, threatLevel: number, mass: number, playerMass: number, playerLevel = 1) {
  const base = Math.max(1, Math.floor(threatLevel || 1));
  const levelAnchor = Math.max(1, Math.floor(playerLevel || 1));
  const massPressure = clamp(Math.round((mass - playerMass) * 0.42), -5, 10);
  const bodyScale = Math.round(Math.sqrt(Math.max(1, mass)) * 1.08);
  const variance = Math.floor(Math.random() * 5) - 2;
  const minimum = levelAnchor + post21MinimumLevelOffset(archetype, levelAnchor);
  const capBonus = Math.max(10, post21MinimumLevelOffset(archetype, levelAnchor) + 10);
  const softCap = archetype === "apex" || archetype === "leviathan" ? levelAnchor + 24 : levelAnchor + capBonus;
  const raw = base + enemyLevelBias(archetype) + bodyScale + massPressure + variance;
  return Math.round(clamp(Math.max(raw, minimum), 1, Math.max(softCap, levelAnchor + 4)));
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
    const zone = getZoneAt(point.x, point.y, "main_reef");
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

export function radiusFromForm(_form: EvoFishFormId) {
  return EVOFISH_SHARED_FISH_HITBOX_RADIUS;
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
  safeRadius = 0,
  playerLevel = threatLevel
): NextFishEntity {
  const archetype = chooseEnemyArchetype(id, threatLevel);
  const family = pickEnemyFamily(id, archetype.id);
  const scale = threatScale(threatLevel);
  const apex = archetype.id === "apex";
  const leviathan = archetype.id === "leviathan";
  const stalker = archetype.id === "stalker";
  const big = archetype.id === "brute" || apex || leviathan || stalker;
  const form: EvoFishFormId = apex || leviathan ? "megalodon" : big ? "shark" : "fish";
  const late = Math.max(0, Math.floor(playerLevel || 1) - POST_LEVEL_21_BALANCE_START);
  const lateBodyMultiplier = 1 + Math.min(0.34, late * 0.011);
  const lateHpMultiplier = 1 + Math.min(0.38, late * 0.014);
  const lateDamageMultiplier = 1 + Math.min(0.2, late * 0.007);

  const baseSmall = 0.48 + Math.random() * 0.72;
  const rawMass = apex
    ? Math.max(9.2 * scale, playerMass * 1.2)
    : leviathan
      ? Math.max(6.8 * scale, playerMass * 1.06)
      : stalker
        ? Math.max(2.15 * scale, playerMass * 0.62)
        : archetype.id === "brute"
          ? Math.max(2.15 * scale, playerMass * 0.42)
          : archetype.id === "hunter"
            ? Math.max((1.05 + Math.random() * 0.78) * scale, playerMass * 0.24)
            : baseSmall * Math.max(1, scale * 0.68);
  const mass = rawMass * lateBodyMultiplier;

  const baseHp = apex
    ? Math.round(680 + mass * 62)
    : leviathan
      ? Math.round(500 + mass * 54)
      : stalker
        ? Math.round(190 + mass * 42)
        : Math.round((big ? 150 : archetype.id === "hunter" ? 92 : 42 + Math.random() * 38) * Math.max(0.8, mass));
  const hp = Math.round(baseHp * family.hpMultiplier * (1 + Math.min(1.15, threatLevel * 0.014)) * lateHpMultiplier);
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
  const damageBase = apex ? 42 : leviathan ? 34 : stalker ? 24 : big ? 21 : 7 + Math.random() * 7;

  return {
    id,
    x: spawn.x,
    y: spawn.y,
    vx: -50 + Math.random() * 100,
    vy: -50 + Math.random() * 100,
    radius: radiusFromForm(form),
    mass,
    hp,
    hpMax: hp,
    damage: damageBase * archetype.damageMultiplier * (1 + Math.min(1.0, threatLevel * 0.017)) * lateDamageMultiplier,
    speed: archetype.baseSpeed * family.speedMultiplier * (1 + Math.min(0.34, threatLevel * 0.0048)),
    form,
    skin: apex || leviathan ? fallbackSkin : familySkin(family.skinId, fallbackSkin),
    angle: 0,
    hitT: 0,
    npcLevel: enemyNpcLevel(archetype.id, threatLevel, mass, playerMass, playerLevel),
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
  const world = getWorldMap("main_reef");
  const config = world.config;
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
  const enemies = Array.from({ length: config.enemyTarget }, (_, index) => makeEnemy(index + 1, config, spawnThreat, mass, playerSpawn.x, playerSpawn.y, enemySafeRadius, level));
  const resources = createResourceField(config.resourceTarget, config.width, config.height);
  const apexEnemy = enemies.find((enemy) => enemy.aiType === "apex");
  const playerDamage = Math.round((damageFromForm(form) + tier * 3) * (1 + damageBonus));
  const playerSpeed = speedFromForm(form) * (1 + speedBonus);
  const startZone = getZoneAt(playerSpawn.x, playerSpawn.y, "main_reef");
  const artifactsFound = Math.max(0, Math.floor(quests.counters?.artifacts || 0));
  const storyStep = darkCaveStoryStep(artifactsFound, false, level);

  return {
    config,
    worldId: "main_reef",
    portalTransition: null,
    story: {
      darkCaveUnlocked: darkCavePortalUnlocked(artifactsFound, level),
      darkCaveEntered: false,
      currentTitle: storyStep.title,
      currentObjective: storyStep.objective,
      completed: {}
    },
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
      radius: radiusFromForm(form),
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
      worldName: world.name,
      storyTitle: DARK_CAVE_STORY_TITLE,
      storyObjective: storyStep.objective,
      portalLoading: 0,
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

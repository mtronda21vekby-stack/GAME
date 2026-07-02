import type { EvoFishEconomyState, EvoFishFormId, EvoFishSkinDefinition } from "../core/types";
import type { NextEngineState, NextFishEntity, NextQuestState, NextWorldConfig } from "../core/engineTypes";
import { chooseEnemyArchetype } from "../content/enemyArchetypes";
import { pickEnemyFamily } from "../content/enemyFamilies";
import { defaultCraftState } from "../content/craft";
import { EVOFISH_FORMS } from "../content/forms";
import { defaultMutationState, getMutationBonus, getMutationTotalLevel, type NextMutationState } from "../content/mutations";
import { xpToNextLevel, xpToNextTier } from "../content/progression";
import { EVOFISH_SKIN_BY_ID } from "../content/skins";
import { getZoneAt } from "../content/zones";
import { defaultNextQuests, type EvoFishNextProgressState } from "../state/skinSaveAdapter";

export const NEXT_WORLD_CONFIG: NextWorldConfig = {
  width: 2800,
  height: 1800,
  enemyTarget: 34
};

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
  return {
    x: 180 + Math.random() * (config.width - 360),
    y: 180 + Math.random() * (config.height - 360)
  };
}

function normalizeQuestState(quests?: NextQuestState): NextQuestState {
  return {
    completed: {
      ...defaultNextQuests().completed,
      ...(quests?.completed || {})
    }
  };
}

function normalizeMutationState(mutations?: NextMutationState): NextMutationState {
  return {
    ...defaultMutationState(),
    levels: { ...(mutations?.levels || {}) }
  };
}

export function makeEnemy(id: number, config: NextWorldConfig = NEXT_WORLD_CONFIG): NextFishEntity {
  const archetype = chooseEnemyArchetype(id);
  const family = pickEnemyFamily(id, archetype.id);
  const apex = archetype.id === "apex";
  const big = archetype.id === "brute" || apex;
  const form: EvoFishFormId = apex ? "megalodon" : big ? "shark" : "fish";
  const mass = apex ? 9.2 + Math.random() * 1.8 : big ? 2.4 : archetype.id === "hunter" ? 1.2 + Math.random() * 0.75 : 0.45 + Math.random() * 0.7;
  const baseHp = apex
    ? Math.round(720 + mass * 52)
    : Math.round((big ? 155 : archetype.id === "hunter" ? 95 : 45 + Math.random() * 38) * Math.max(0.75, mass));
  const hp = Math.round(baseHp * family.hpMultiplier);
  const target = wanderPoint(config);
  const fallbackSkin = apex ? (EVOFISH_SKIN_BY_ID.mega_lava || EVOFISH_SKIN_BY_ID.mega_deep) : big ? EVOFISH_SKIN_BY_ID.shark_classic : EVOFISH_SKIN_BY_ID.default;

  return {
    id,
    x: 180 + Math.random() * (config.width - 360),
    y: 180 + Math.random() * (config.height - 360),
    vx: -50 + Math.random() * 100,
    vy: -50 + Math.random() * 100,
    radius: apex ? 44 : big ? 24 : archetype.id === "hunter" ? 20 : 14 + Math.random() * 8,
    mass,
    hp,
    hpMax: hp,
    damage: (apex ? 42 : big ? 24 : 8 + Math.random() * 8) * archetype.damageMultiplier,
    speed: archetype.baseSpeed * family.speedMultiplier,
    form,
    skin: apex ? fallbackSkin : familySkin(family.skinId, fallbackSkin),
    angle: 0,
    hitT: 0,
    aiType: archetype.id,
    aiState: "wander",
    familyName: family.name,
    familyRewardMultiplier: family.rewardMultiplier,
    aggroRadius: archetype.aggroRadius,
    attackRange: archetype.attackRange,
    attackCd: apex ? 1.1 : 0.4 + Math.random() * 0.8,
    thinkT: Math.random() * 0.4,
    wanderX: target.x,
    wanderY: target.y,
    wanderT: apex ? 0.5 : 0.8 + Math.random() * 2.2
  };
}

export function createNextWorld(
  playerSkin: EvoFishSkinDefinition,
  savedProgress?: EvoFishNextProgressState,
  savedEconomy?: EvoFishEconomyState,
  savedQuests?: NextQuestState,
  savedMutations?: NextMutationState
): NextEngineState {
  const form = savedProgress?.form || formFromSkin(playerSkin);
  const config = NEXT_WORLD_CONFIG;
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
  const completedQuests = Object.keys(quests.completed).length;
  const enemies = Array.from({ length: config.enemyTarget }, (_, index) => makeEnemy(index + 1, config));
  const apexEnemy = enemies.find((enemy) => enemy.aiType === "apex");
  const playerDamage = Math.round((damageFromForm(form) + tier * 3) * (1 + damageBonus));
  const playerSpeed = speedFromForm(form) * (1 + speedBonus);
  const startZone = getZoneAt(config.width / 2, config.height / 2);

  return {
    config,
    economy,
    craft,
    mutations,
    quests,
    frame: 0,
    nextFloatId: 1,
    player: {
      id: 0,
      x: config.width / 2,
      y: config.height / 2,
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
      invulnT: 1.2,
      dead: false,
      downed: false,
      deathT: 0,
      downT: 0,
      respawnT: 0,
      reviveT: 0,
      level,
      tier,
      xp: Math.max(0, Math.floor(savedProgress?.xp || 0)),
      xpToNext: Math.max(1, Math.floor(savedProgress?.xpToNext || xpToNextTier(tier))),
      levelXp: Math.max(0, Math.floor(savedProgress?.levelXp || 0)),
      levelXpToNext: Math.max(1, Math.floor(savedProgress?.levelXpToNext || xpToNextLevel(level))),
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
      wanderX: config.width / 2,
      wanderY: config.height / 2,
      wanderT: 0
    },
    enemies,
    floats: [],
    stats: {
      mass,
      kills: Math.max(0, Math.floor(savedProgress?.kills || 0)),
      deaths: Math.max(0, Math.floor(savedProgress?.deaths || 0)),
      downs: Math.max(0, Math.floor(savedProgress?.deaths || 0)),
      hp,
      hpMax,
      level,
      tier,
      xp: Math.max(0, Math.floor(savedProgress?.xp || 0)),
      xpToNext: Math.max(1, Math.floor(savedProgress?.xpToNext || xpToNextTier(tier))),
      levelXp: Math.max(0, Math.floor(savedProgress?.levelXp || 0)),
      levelXpToNext: Math.max(1, Math.floor(savedProgress?.levelXpToNext || xpToNextLevel(level))),
      pearls: economy.pearls,
      corals: economy.corals,
      mutationLevel: getMutationTotalLevel(mutations),
      craftBarrierT: 0,
      craftBiteBoostT: 0,
      craftSonarT: 0,
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
      lastEvent: savedProgress ? "Сейв загружен" : "Готов"
    }
  };
}

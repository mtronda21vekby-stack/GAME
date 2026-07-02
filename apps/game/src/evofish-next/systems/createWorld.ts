import type { EvoFishFormId, EvoFishSkinDefinition } from "../core/types";
import type { NextEngineState, NextFishEntity, NextWorldConfig } from "../core/engineTypes";
import { chooseEnemyArchetype } from "../content/enemyArchetypes";
import { EVOFISH_FORMS } from "../content/forms";
import { xpToNextLevel, xpToNextTier } from "../content/progression";
import { EVOFISH_SKIN_BY_ID } from "../content/skins";

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

function enemySkin(id: number) {
  const skins = [
    EVOFISH_SKIN_BY_ID.premium_fish,
    EVOFISH_SKIN_BY_ID.neon_koi,
    EVOFISH_SKIN_BY_ID.clown_pop,
    EVOFISH_SKIN_BY_ID.deep_sapphire
  ].filter(Boolean);
  return skins[id % skins.length] || EVOFISH_SKIN_BY_ID.default;
}

function wanderPoint(config: NextWorldConfig) {
  return {
    x: 180 + Math.random() * (config.width - 360),
    y: 180 + Math.random() * (config.height - 360)
  };
}

export function makeEnemy(id: number, config: NextWorldConfig = NEXT_WORLD_CONFIG): NextFishEntity {
  const archetype = chooseEnemyArchetype(id);
  const big = archetype.id === "brute";
  const form: EvoFishFormId = big ? "shark" : "fish";
  const mass = big ? 2.4 : archetype.id === "hunter" ? 1.2 + Math.random() * 0.75 : 0.45 + Math.random() * 0.7;
  const hp = Math.round((big ? 155 : archetype.id === "hunter" ? 95 : 45 + Math.random() * 38) * Math.max(0.75, mass));
  const target = wanderPoint(config);

  return {
    id,
    x: 180 + Math.random() * (config.width - 360),
    y: 180 + Math.random() * (config.height - 360),
    vx: -50 + Math.random() * 100,
    vy: -50 + Math.random() * 100,
    radius: big ? 24 : archetype.id === "hunter" ? 20 : 14 + Math.random() * 8,
    mass,
    hp,
    hpMax: hp,
    damage: (big ? 24 : 8 + Math.random() * 8) * archetype.damageMultiplier,
    speed: archetype.baseSpeed,
    form,
    skin: big ? EVOFISH_SKIN_BY_ID.shark_classic : enemySkin(id),
    angle: 0,
    hitT: 0,
    aiType: archetype.id,
    aiState: "wander",
    aggroRadius: archetype.aggroRadius,
    attackRange: archetype.attackRange,
    attackCd: 0.4 + Math.random() * 0.8,
    thinkT: Math.random() * 0.4,
    wanderX: target.x,
    wanderY: target.y,
    wanderT: 0.8 + Math.random() * 2.2
  };
}

export function createNextWorld(playerSkin: EvoFishSkinDefinition): NextEngineState {
  const form = formFromSkin(playerSkin);
  const config = NEXT_WORLD_CONFIG;
  const hp = hpFromForm(form);

  return {
    config,
    frame: 0,
    nextFloatId: 1,
    player: {
      id: 0,
      x: config.width / 2,
      y: config.height / 2,
      vx: 0,
      vy: 0,
      radius: radiusFromForm(form),
      mass: massFromForm(form),
      hp,
      hpMax: hp,
      damage: damageFromForm(form),
      speed: speedFromForm(form),
      biteCd: 0,
      dashCd: 0,
      dashT: 0,
      invulnT: 0,
      level: 1,
      tier: 1,
      xp: 0,
      xpToNext: xpToNextTier(1),
      levelXp: 0,
      levelXpToNext: xpToNextLevel(1),
      form,
      skin: playerSkin,
      angle: 0,
      hitT: 0,
      aiType: "neutral",
      aiState: "wander",
      aggroRadius: 0,
      attackRange: 0,
      attackCd: 0,
      thinkT: 0,
      wanderX: config.width / 2,
      wanderY: config.height / 2,
      wanderT: 0
    },
    enemies: Array.from({ length: config.enemyTarget }, (_, index) => makeEnemy(index + 1, config)),
    floats: [],
    stats: {
      mass: massFromForm(form),
      kills: 0,
      hp,
      hpMax: hp,
      level: 1,
      tier: 1,
      xp: 0,
      xpToNext: xpToNextTier(1),
      levelXp: 0,
      levelXpToNext: xpToNextLevel(1),
      skinName: playerSkin.name,
      formName: EVOFISH_FORMS[form].name,
      lastEvent: "Готов"
    }
  };
}

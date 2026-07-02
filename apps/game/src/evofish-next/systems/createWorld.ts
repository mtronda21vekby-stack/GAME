import type { EvoFishFormId, EvoFishSkinDefinition } from "../core/types";
import type { NextEngineState, NextFishEntity, NextWorldConfig } from "../core/engineTypes";
import { EVOFISH_FORMS } from "../content/forms";
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

function enemySkin(id: number) {
  const skins = [
    EVOFISH_SKIN_BY_ID.premium_fish,
    EVOFISH_SKIN_BY_ID.neon_koi,
    EVOFISH_SKIN_BY_ID.clown_pop,
    EVOFISH_SKIN_BY_ID.deep_sapphire
  ].filter(Boolean);
  return skins[id % skins.length] || EVOFISH_SKIN_BY_ID.default;
}

export function makeEnemy(id: number, config: NextWorldConfig = NEXT_WORLD_CONFIG): NextFishEntity {
  const big = id % 7 === 0;
  const skin = big ? EVOFISH_SKIN_BY_ID.shark_classic : enemySkin(id);
  return {
    id,
    x: 180 + Math.random() * (config.width - 360),
    y: 180 + Math.random() * (config.height - 360),
    vx: -50 + Math.random() * 100,
    vy: -50 + Math.random() * 100,
    radius: big ? 22 : 14 + Math.random() * 8,
    mass: big ? 2.4 : 0.45 + Math.random() * 0.7,
    form: big ? "shark" : "fish",
    skin,
    angle: 0
  };
}

export function createNextWorld(playerSkin: EvoFishSkinDefinition): NextEngineState {
  const form = formFromSkin(playerSkin);
  const config = NEXT_WORLD_CONFIG;

  return {
    config,
    frame: 0,
    player: {
      id: 0,
      x: config.width / 2,
      y: config.height / 2,
      vx: 0,
      vy: 0,
      radius: radiusFromForm(form),
      mass: massFromForm(form),
      speed: speedFromForm(form),
      form,
      skin: playerSkin,
      angle: 0
    },
    enemies: Array.from({ length: config.enemyTarget }, (_, index) => makeEnemy(index + 1, config)),
    stats: {
      mass: massFromForm(form),
      kills: 0,
      skinName: playerSkin.name,
      formName: EVOFISH_FORMS[form].name
    }
  };
}

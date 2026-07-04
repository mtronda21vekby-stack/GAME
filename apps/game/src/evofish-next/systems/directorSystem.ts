import type { NextEngineState, NextFishEntity } from "../core/engineTypes";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isElite(enemy: NextFishEntity) {
  return enemy.aiType === "apex" || enemy.aiType === "leviathan" || enemy.aiType === "stalker";
}

function isPredator(enemy: NextFishEntity) {
  return enemy.aiType === "hunter" || enemy.aiType === "brute" || isElite(enemy);
}

function isMidGameLevel(level: number) {
  return level >= 14 && level <= 23;
}

function allowedPredatorsNear(level: number) {
  if (level < 5) return 2;
  if (level < 14) return 3;
  if (level <= 23) return 2;
  if (level < 35) return 4;
  return 5;
}

function normalize(x: number, y: number) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length, length };
}

function push(enemy: NextFishEntity, x: number, y: number, force: number, dt: number) {
  enemy.vx += x * force * dt;
  enemy.vy += y * force * dt;
}

function keepAwayFromPlayer(state: NextEngineState, enemy: NextFishEntity, rank: number, dt: number) {
  const player = state.player;
  const midGame = isMidGameLevel(player.level);
  const dx = enemy.x - player.x;
  const dy = enemy.y - player.y;
  const n = normalize(dx, dy);
  const minGap = player.radius + enemy.radius + (isElite(enemy) ? (midGame ? 330 : 260) : enemy.aiType === "brute" ? (midGame ? 265 : 210) : (midGame ? 220 : 165));

  if (n.length < minGap) {
    const force = (minGap - n.length) * (isElite(enemy) ? (midGame ? 13 : 10) : (midGame ? 11 : 8));
    push(enemy, n.x, n.y, force, dt);
    if (!isElite(enemy)) enemy.aiState = midGame ? "wander" : "hunt";
  }

  const laneAngle = ((enemy.id % 10) / 10) * Math.PI * 2 + (state.frame % 420) * (midGame ? 0.002 : 0.003);
  const desired = player.radius + enemy.radius + (midGame ? 470 : 360) + (rank % 5) * (midGame ? 106 : 82);
  const tx = clamp(player.x + Math.cos(laneAngle) * desired, 140, state.config.width - 140);
  const ty = clamp(player.y + Math.sin(laneAngle) * desired, 140, state.config.height - 140);
  const toSlot = normalize(tx - enemy.x, ty - enemy.y);
  push(enemy, toSlot.x, toSlot.y, isElite(enemy) ? (midGame ? 92 : 74) : (midGame ? 122 : 92), dt);
  enemy.wanderX = tx;
  enemy.wanderY = ty;
  enemy.wanderT = Math.min(enemy.wanderT, midGame ? 0.32 : 0.45);
}

function limitPredatorPressure(state: NextEngineState, dt: number) {
  const player = state.player;
  const midGame = isMidGameLevel(player.level);
  const pressureRange = midGame ? 700 : 560;
  const predators = state.enemies
    .filter(isPredator)
    .map((enemy) => ({ enemy, distance: Math.hypot(enemy.x - player.x, enemy.y - player.y) }))
    .filter((item) => item.distance < pressureRange)
    .sort((a, b) => a.distance - b.distance);

  const allowed = allowedPredatorsNear(player.level);

  for (let index = 0; index < predators.length; index += 1) {
    const enemy = predators[index].enemy;
    if (index < allowed) continue;
    if (enemy.aiState === "attack") enemy.aiState = midGame ? "wander" : "hunt";
    if (midGame && enemy.aiState === "hunt") enemy.aiState = "wander";
    keepAwayFromPlayer(state, enemy, index, dt);
  }
}

function separateDenseCells(state: NextEngineState, dt: number) {
  const cellSize = 300;
  const cells = new Map<string, NextFishEntity[]>();

  for (const enemy of state.enemies) {
    const key = `${Math.floor(enemy.x / cellSize)}:${Math.floor(enemy.y / cellSize)}`;
    const bucket = cells.get(key) || [];
    bucket.push(enemy);
    cells.set(key, bucket);
  }

  for (const bucket of cells.values()) {
    if (bucket.length <= 4) continue;

    const centerX = bucket.reduce((sum, enemy) => sum + enemy.x, 0) / bucket.length;
    const centerY = bucket.reduce((sum, enemy) => sum + enemy.y, 0) / bucket.length;

    for (const enemy of bucket) {
      const out = normalize(enemy.x - centerX, enemy.y - centerY);
      const force = bucket.length >= 8 ? 260 : bucket.length >= 6 ? 185 : 135;
      push(enemy, out.x, out.y, force, dt);
      if (!isElite(enemy) && enemy.aiState === "attack") enemy.aiState = "hunt";
      enemy.wanderT = Math.min(enemy.wanderT, 0.28);
    }
  }
}

function separatePairs(state: NextEngineState, dt: number) {
  for (let i = 0; i < state.enemies.length; i += 1) {
    const a = state.enemies[i];
    for (let j = i + 1; j < state.enemies.length; j += 1) {
      const b = state.enemies[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.hypot(dx, dy) || 1;
      const desired = a.radius + b.radius + (isElite(a) || isElite(b) ? 160 : 88);
      if (distance >= desired) continue;

      const force = (desired - distance) * 7.2;
      const nx = dx / distance;
      const ny = dy / distance;
      push(a, nx, ny, force, dt);
      push(b, -nx, -ny, force, dt);
    }
  }
}

function avoidWorldEdges(state: NextEngineState, dt: number) {
  for (const enemy of state.enemies) {
    const margin = isElite(enemy) ? 210 : 135;
    if (enemy.x < margin) push(enemy, 1, 0, margin - enemy.x, dt * 5);
    if (enemy.x > state.config.width - margin) push(enemy, -1, 0, enemy.x - (state.config.width - margin), dt * 5);
    if (enemy.y < margin) push(enemy, 0, 1, margin - enemy.y, dt * 5);
    if (enemy.y > state.config.height - margin) push(enemy, 0, -1, enemy.y - (state.config.height - margin), dt * 5);
  }
}

function distributeWanderTargets(state: NextEngineState) {
  if (state.frame % 180 !== 0) return;

  const cols = 4;
  const rows = 3;
  for (const enemy of state.enemies) {
    if (enemy.aiState !== "wander") continue;
    const slot = enemy.id % (cols * rows);
    const col = slot % cols;
    const row = Math.floor(slot / cols);
    enemy.wanderX = ((col + 0.5) / cols) * state.config.width + (Math.random() - 0.5) * 180;
    enemy.wanderY = ((row + 0.5) / rows) * state.config.height + (Math.random() - 0.5) * 160;
  }
}

export function updateDirectorSystem(state: NextEngineState, dt: number) {
  if (state.enemies.length <= 1) return;

  distributeWanderTargets(state);
  limitPredatorPressure(state, dt);
  separateDenseCells(state, dt);
  separatePairs(state, dt);
  avoidWorldEdges(state, dt);
}

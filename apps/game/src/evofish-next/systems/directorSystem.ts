import type { NextDirectorState, NextEngineState, NextFishEntity } from "../core/engineTypes";

const CELL_SIZE = 320;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

function isBridgeLevel(level: number) {
  return level >= 14 && level <= 25;
}

function eliteLimit(level: number) {
  if (level < 18) return 1;
  if (level <= 29) return 1;
  if (level < 45) return 2;
  return 3;
}

function predatorPressureLimit(level: number) {
  if (level < 5) return 2;
  if (level < 14) return 3;
  if (level <= 25) return 2;
  if (level < 35) return 3;
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

function directorState(state: NextEngineState): NextDirectorState {
  if (!state.director) {
    state.director = {
      safeWindowT: 0,
      lastPlayerHp: state.player.hp,
      lowHpFrames: 0,
      economyClock: 0,
      economyStartPearls: state.economy.pearls,
      economyStartCorals: state.economy.corals,
      economyStartXp: state.player.levelXp + state.player.xp,
      economyXpPerMinute: 0,
      pearlsPerTenMinutes: 0,
      coralsPerTenMinutes: 0,
      nearbyChecks: 0,
      spatialCells: 0,
      directorMode: "normal"
    };
  }

  return state.director;
}

function cellKey(x: number, y: number) {
  return `${Math.floor(x / CELL_SIZE)}:${Math.floor(y / CELL_SIZE)}`;
}

function buildSpatialGrid(enemies: NextFishEntity[]) {
  const grid = new Map<string, NextFishEntity[]>();
  for (const enemy of enemies) {
    const key = cellKey(enemy.x, enemy.y);
    const bucket = grid.get(key);
    if (bucket) bucket.push(enemy);
    else grid.set(key, [enemy]);
  }
  return grid;
}

function nearby(grid: Map<string, NextFishEntity[]>, enemy: NextFishEntity, radiusCells = 1) {
  const cx = Math.floor(enemy.x / CELL_SIZE);
  const cy = Math.floor(enemy.y / CELL_SIZE);
  const items: NextFishEntity[] = [];

  for (let x = cx - radiusCells; x <= cx + radiusCells; x += 1) {
    for (let y = cy - radiusCells; y <= cy + radiusCells; y += 1) {
      const bucket = grid.get(`${x}:${y}`);
      if (bucket) items.push(...bucket);
    }
  }

  return items;
}

function enemyThreatScore(state: NextEngineState, enemy: NextFishEntity, distance: number) {
  const player = state.player;
  const levelGap = npcLevel(enemy) - Math.max(1, player.level);
  const massGap = enemy.mass / Math.max(0.5, player.mass);
  const role = enemy.aiType === "leviathan" ? 4.4 : enemy.aiType === "apex" ? 4 : enemy.aiType === "stalker" ? 2.7 : enemy.aiType === "brute" ? 2.1 : enemy.aiType === "hunter" ? 1.5 : 0.5;
  const proximity = clamp(1 - distance / 980, 0, 1.5);
  return Math.max(0, role + Math.max(0, levelGap) * 0.22 + Math.max(0, massGap - 1) * 1.2) * (0.35 + proximity);
}

function keepAwayFromPlayer(state: NextEngineState, enemy: NextFishEntity, rank: number, dt: number) {
  const player = state.player;
  const bridge = isBridgeLevel(player.level);
  const dx = enemy.x - player.x;
  const dy = enemy.y - player.y;
  const n = normalize(dx, dy);
  const baseGap = isElite(enemy) ? (bridge ? 390 : 310) : enemy.aiType === "brute" ? (bridge ? 300 : 230) : (bridge ? 240 : 180);
  const minGap = player.radius + enemy.radius + baseGap;

  if (n.length < minGap) {
    const force = (minGap - n.length) * (isElite(enemy) ? 15 : 11);
    push(enemy, n.x, n.y, force, dt);
    if (enemy.aiState === "attack" || enemy.aiState === "hunt") enemy.aiState = "regroup";
  }

  const laneAngle = ((enemy.id % 12) / 12) * Math.PI * 2 + (state.frame % 480) * (bridge ? 0.0014 : 0.0022);
  const desired = player.radius + enemy.radius + (bridge ? 560 : 430) + (rank % 6) * (bridge ? 116 : 88);
  const tx = clamp(player.x + Math.cos(laneAngle) * desired, 160, state.config.width - 160);
  const ty = clamp(player.y + Math.sin(laneAngle) * desired, 160, state.config.height - 160);
  const toSlot = normalize(tx - enemy.x, ty - enemy.y);
  push(enemy, toSlot.x, toSlot.y, isElite(enemy) ? 94 : 128, dt);
  enemy.wanderX = tx;
  enemy.wanderY = ty;
  enemy.wanderT = Math.min(enemy.wanderT, 0.34);
}

function applySafeWindow(state: NextEngineState, threatScore: number, nearbyPredators: number, dt: number) {
  const director = directorState(state);
  const player = state.player;
  const hpDrop = Math.max(0, director.lastPlayerHp - player.hp);
  const hpRatio = player.hp / Math.max(1, player.hpMax);
  director.safeWindowT = Math.max(0, director.safeWindowT - dt);

  if (hpRatio < 0.38) director.lowHpFrames += 1;
  else director.lowHpFrames = Math.max(0, director.lowHpFrames - 2);

  const heavyHit = hpDrop >= player.hpMax * 0.18;
  const unfairPressure = hpRatio < 0.42 && (nearbyPredators > predatorPressureLimit(player.level) || threatScore > 9);

  if (!player.downed && !player.dead && (heavyHit || unfairPressure) && director.safeWindowT <= 0) {
    director.safeWindowT = heavyHit ? 1.8 : 1.25;
    player.invulnT = Math.max(player.invulnT, director.safeWindowT);
    player.dashCd = Math.min(player.dashCd, 0.28);
    state.stats.lastEvent = heavyHit ? "SAFE WINDOW · heavy hit" : "SAFE WINDOW · pressure";
  }

  director.lastPlayerHp = Math.max(0, player.hp);
  state.stats.aiSafeWindow = director.safeWindowT;
}

function updateEconomyMetrics(state: NextEngineState, dt: number) {
  const director = directorState(state);
  director.economyClock += dt;
  if (director.economyClock < 10) return;

  const elapsedMinutes = Math.max(0.1, director.economyClock / 60);
  const currentXp = state.player.levelXp + state.player.xp;
  director.economyXpPerMinute = Math.max(0, (currentXp - director.economyStartXp) / elapsedMinutes);
  director.pearlsPerTenMinutes = Math.max(0, (state.economy.pearls - director.economyStartPearls) / elapsedMinutes * 10);
  director.coralsPerTenMinutes = Math.max(0, (state.economy.corals - director.economyStartCorals) / elapsedMinutes * 10);

  state.stats.economyXpPerMinute = director.economyXpPerMinute;
  state.stats.economyPearlsPerTenMinutes = director.pearlsPerTenMinutes;
  state.stats.economyCoralsPerTenMinutes = director.coralsPerTenMinutes;
}

function updateDebugStats(state: NextEngineState, grid: Map<string, NextFishEntity[]>, threatScore: number, near: number, predators: number, elite: number) {
  const director = directorState(state);
  const totalLevel = state.enemies.reduce((sum, enemy) => sum + npcLevel(enemy), 0);
  const avg = state.enemies.length ? totalLevel / state.enemies.length : 0;

  director.spatialCells = grid.size;
  director.directorMode = director.safeWindowT > 0 ? "safe-window" : threatScore > 9 ? "pressure-relief" : elite > eliteLimit(state.player.level) ? "elite-limit" : "normal";

  state.stats.aiDirectorMode = director.directorMode;
  state.stats.aiNearEnemies = near;
  state.stats.aiNearPredators = predators;
  state.stats.aiNearElite = elite;
  state.stats.aiAvgNpcLevel = avg;
  state.stats.aiThreatScore = threatScore;
  state.stats.perfSpatialCells = grid.size;
  state.stats.perfNearbyChecks = director.nearbyChecks;
  state.stats.debugSimLevel = state.player.level;
}

function limitEliteAndPredatorPressure(state: NextEngineState, dt: number) {
  const player = state.player;
  const pressureRange = isBridgeLevel(player.level) ? 820 : 640;
  const predators = state.enemies
    .filter(isPredator)
    .map((enemy) => ({ enemy, distance: Math.hypot(enemy.x - player.x, enemy.y - player.y) }))
    .filter((item) => item.distance < pressureRange)
    .sort((a, b) => a.distance - b.distance);
  const allowedPredators = predatorPressureLimit(player.level);

  for (let index = 0; index < predators.length; index += 1) {
    const enemy = predators[index].enemy;
    if (index < allowedPredators) continue;
    if (enemy.aiState === "attack" || enemy.aiState === "hunt" || enemy.aiState === "ambush") enemy.aiState = "regroup";
    keepAwayFromPlayer(state, enemy, index, dt);
  }

  const elites = predators.filter((item) => isElite(item.enemy));
  const allowedElite = eliteLimit(player.level);
  for (let index = 0; index < elites.length; index += 1) {
    const enemy = elites[index].enemy;
    if (index < allowedElite) continue;
    enemy.aiState = "regroup";
    keepAwayFromPlayer(state, enemy, index + allowedPredators, dt);
  }
}

function separateDenseCells(state: NextEngineState, grid: Map<string, NextFishEntity[]>, dt: number) {
  for (const bucket of grid.values()) {
    if (bucket.length <= 4) continue;
    const centerX = bucket.reduce((sum, enemy) => sum + enemy.x, 0) / bucket.length;
    const centerY = bucket.reduce((sum, enemy) => sum + enemy.y, 0) / bucket.length;

    for (const enemy of bucket) {
      const out = normalize(enemy.x - centerX, enemy.y - centerY);
      const force = bucket.length >= 8 ? 280 : bucket.length >= 6 ? 205 : 145;
      push(enemy, out.x, out.y, force, dt);
      if (!isElite(enemy) && enemy.aiState === "attack") enemy.aiState = "regroup";
      enemy.wanderT = Math.min(enemy.wanderT, 0.28);
    }
  }
}

function separatePairs(state: NextEngineState, grid: Map<string, NextFishEntity[]>, dt: number) {
  const director = directorState(state);
  for (const enemy of state.enemies) {
    const neighbors = nearby(grid, enemy, 1);
    director.nearbyChecks += neighbors.length;
    for (const other of neighbors) {
      if (other.id <= enemy.id) continue;
      const dx = enemy.x - other.x;
      const dy = enemy.y - other.y;
      const distance = Math.hypot(dx, dy) || 1;
      const desired = enemy.radius + other.radius + (isElite(enemy) || isElite(other) ? 170 : 94);
      if (distance >= desired) continue;
      const force = (desired - distance) * 7.4;
      const nx = dx / distance;
      const ny = dy / distance;
      push(enemy, nx, ny, force, dt);
      push(other, -nx, -ny, force, dt);
    }
  }
}

function avoidWorldEdges(state: NextEngineState, dt: number) {
  for (const enemy of state.enemies) {
    const margin = isElite(enemy) ? 220 : 140;
    if (enemy.x < margin) push(enemy, 1, 0, margin - enemy.x, dt * 5);
    if (enemy.x > state.config.width - margin) push(enemy, -1, 0, enemy.x - (state.config.width - margin), dt * 5);
    if (enemy.y < margin) push(enemy, 0, 1, margin - enemy.y, dt * 5);
    if (enemy.y > state.config.height - margin) push(enemy, 0, -1, enemy.y - (state.config.height - margin), dt * 5);
  }
}

function distributeWanderTargets(state: NextEngineState) {
  if (state.frame % 150 !== 0) return;
  const cols = 5;
  const rows = 4;
  for (const enemy of state.enemies) {
    if (enemy.aiState !== "wander" && enemy.aiState !== "idle" && enemy.aiState !== "patrol") continue;
    const slot = enemy.id % (cols * rows);
    const col = slot % cols;
    const row = Math.floor(slot / cols);
    enemy.wanderX = clamp(((col + 0.5) / cols) * state.config.width + (Math.random() - 0.5) * 220, 160, state.config.width - 160);
    enemy.wanderY = clamp(((row + 0.5) / rows) * state.config.height + (Math.random() - 0.5) * 190, 160, state.config.height - 160);
    enemy.wanderT = Math.min(enemy.wanderT, 1.2);
  }
}

export function updateDirectorSystem(state: NextEngineState, dt: number) {
  const director = directorState(state);
  director.nearbyChecks = 0;
  if (state.enemies.length <= 0) return;

  const grid = buildSpatialGrid(state.enemies);
  const player = state.player;
  let near = 0;
  let predators = 0;
  let elites = 0;
  let threatScore = 0;

  for (const enemy of state.enemies) {
    const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (distance > 960) continue;
    near += 1;
    if (isPredator(enemy)) predators += 1;
    if (isElite(enemy)) elites += 1;
    enemy.threatScore = enemyThreatScore(state, enemy, distance);
    threatScore += enemy.threatScore;
  }

  distributeWanderTargets(state);
  applySafeWindow(state, threatScore, predators, dt);
  limitEliteAndPredatorPressure(state, dt);
  separateDenseCells(state, grid, dt);
  separatePairs(state, grid, dt);
  avoidWorldEdges(state, dt);
  updateEconomyMetrics(state, dt);
  updateDebugStats(state, grid, threatScore, near, predators, elites);
}

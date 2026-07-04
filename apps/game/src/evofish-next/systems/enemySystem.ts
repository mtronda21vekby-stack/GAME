import type { NextEngineState, NextFishEntity } from "../core/engineTypes";
import { canDevour } from "./collisionSystem";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function addFloat(state: NextEngineState, x: number, y: number, text: string, kind: "damage" | "kill" | "danger") {
  state.floats.push({ id: state.nextFloatId++, x, y, text, ttl: 0.75, kind });
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

function predatorPressureLimit(level: number) {
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

function setWanderTarget(state: NextEngineState, enemy: NextFishEntity) {
  const lane = enemy.id % 12;
  const ring = 0.22 + (lane % 4) * 0.18;
  const angle = ((lane / 12) * Math.PI * 2) + Math.random() * 0.55;
  const centerX = state.config.width * 0.5;
  const centerY = state.config.height * 0.5;
  const rx = state.config.width * ring * 0.95;
  const ry = state.config.height * ring * 0.9;

  enemy.wanderX = clamp(centerX + Math.cos(angle) * rx + (Math.random() - 0.5) * 260, 160, state.config.width - 160);
  enemy.wanderY = clamp(centerY + Math.sin(angle) * ry + (Math.random() - 0.5) * 220, 160, state.config.height - 160);
  enemy.wanderT = isElite(enemy) ? 0.7 + Math.random() * 1.4 : 1.4 + Math.random() * 3.4;
}

function wanderTarget(state: NextEngineState, enemy: NextFishEntity) {
  enemy.wanderT -= 1 / 60;
  const wx = enemy.wanderX - enemy.x;
  const wy = enemy.wanderY - enemy.y;
  const wDistance = Math.hypot(wx, wy) || 1;
  if (enemy.wanderT <= 0 || wDistance < 90) setWanderTarget(state, enemy);
  return { x: wx / wDistance, y: wy / wDistance, distance: wDistance, playerDistance: Infinity };
}

function attackSlotTarget(state: NextEngineState, enemy: NextFishEntity, playerDistance: number) {
  const player = state.player;
  const midGame = isMidGameLevel(player.level);
  const slots = enemy.aiType === "leviathan" ? 4 : enemy.aiType === "apex" ? 5 : enemy.aiType === "stalker" ? 7 : 9;
  const slot = enemy.id % slots;
  const drift = (state.frame % 360) * (midGame ? 0.0014 : 0.0025) * (enemy.id % 2 === 0 ? 1 : -1);
  const angle = (slot / slots) * Math.PI * 2 + drift;
  const ring = player.radius + enemy.radius + (enemy.aiType === "leviathan" ? 175 : enemy.aiType === "apex" ? 145 : enemy.aiType === "stalker" ? 110 : midGame ? 92 : 64);
  const targetX = clamp(player.x + Math.cos(angle) * ring, 120, state.config.width - 120);
  const targetY = clamp(player.y + Math.sin(angle) * ring, 120, state.config.height - 120);
  const dx = targetX - enemy.x;
  const dy = targetY - enemy.y;
  const n = normalize(dx, dy);

  return { x: n.x, y: n.y, distance: n.length, playerDistance };
}

function countPredatorsNearPlayer(state: NextEngineState) {
  const player = state.player;
  const range = isMidGameLevel(player.level) ? 460 : 360;
  let count = 0;

  for (const enemy of state.enemies) {
    if (!isPredator(enemy)) continue;
    if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < range) count += 1;
  }

  return count;
}

function localSeparation(state: NextEngineState, enemy: NextFishEntity) {
  let ax = 0;
  let ay = 0;
  let crowd = 0;

  for (const other of state.enemies) {
    if (other === enemy) continue;
    const dx = enemy.x - other.x;
    const dy = enemy.y - other.y;
    const distance = Math.hypot(dx, dy) || 1;
    const desired = enemy.radius + other.radius + (isElite(enemy) || isElite(other) ? 145 : 78);
    if (distance >= desired) continue;

    const force = (desired - distance) / desired;
    ax += (dx / distance) * force;
    ay += (dy / distance) * force;
    crowd += 1;
  }

  const player = state.player;
  const pdx = enemy.x - player.x;
  const pdy = enemy.y - player.y;
  const playerDistance = Math.hypot(pdx, pdy) || 1;
  const midGame = isMidGameLevel(player.level);
  const minPlayerGap = enemy.aiState === "attack"
    ? enemy.radius + player.radius + (midGame ? 48 : 24)
    : enemy.radius + player.radius + (midGame ? 128 : 96);
  if (playerDistance < minPlayerGap && !isElite(enemy)) {
    const force = (minPlayerGap - playerDistance) / minPlayerGap;
    ax += (pdx / playerDistance) * force * (midGame ? 0.9 : 0.65);
    ay += (pdy / playerDistance) * force * (midGame ? 0.9 : 0.65);
    crowd += 1;
  }

  const n = normalize(ax, ay);
  return { x: crowd > 0 ? n.x : 0, y: crowd > 0 ? n.y : 0, crowd };
}

function aiTarget(state: NextEngineState, enemy: NextFishEntity) {
  const player = state.player;

  if (player.downed || player.dead) {
    enemy.aiState = "wander";
    return wanderTarget(state, enemy);
  }

  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const distance = Math.hypot(dx, dy) || 1;
  const playerCanEat = canDevour(player.mass, enemy.mass);
  const enemyCanThreaten = canDevour(enemy.mass * 1.08, player.mass) || isPredator(enemy);
  const predatorPressure = countPredatorsNearPlayer(state);
  const pressureLimit = predatorPressureLimit(player.level);
  const midGame = isMidGameLevel(player.level);
  const aggroScale = midGame && isPredator(enemy) ? 0.78 : 1;

  enemy.thinkT -= 1 / 60;
  if (enemy.thinkT <= 0) {
    enemy.thinkT = isElite(enemy) ? 0.16 + Math.random() * 0.22 : midGame ? 0.34 + Math.random() * 0.42 : 0.2 + Math.random() * 0.34;
    if (playerCanEat && !isElite(enemy) && distance < enemy.aggroRadius * 1.22) enemy.aiState = "flee";
    else if (enemyCanThreaten && distance < enemy.attackRange + player.radius && predatorPressure <= pressureLimit) enemy.aiState = "attack";
    else if (enemyCanThreaten && distance < enemy.aggroRadius * aggroScale && predatorPressure <= pressureLimit + 1) enemy.aiState = "hunt";
    else enemy.aiState = "wander";
  }

  if (enemy.aiState === "flee") return { x: -dx / distance, y: -dy / distance, distance, playerDistance: distance };
  if (enemy.aiState === "hunt" || enemy.aiState === "attack") return attackSlotTarget(state, enemy, distance);

  return wanderTarget(state, enemy);
}

function attackPlayer(state: NextEngineState, enemy: NextFishEntity, playerDistance: number) {
  const player = state.player;
  enemy.attackCd = Math.max(0, enemy.attackCd - 1 / 60);
  if (player.downed || player.dead || playerDistance > enemy.attackRange + player.radius || enemy.attackCd > 0 || player.invulnT > 0) return;
  if (countPredatorsNearPlayer(state) > predatorPressureLimit(player.level)) {
    enemy.aiState = "hunt";
    return;
  }

  const midGame = isMidGameLevel(player.level);
  const damageSoftener = midGame ? (isElite(enemy) ? 0.72 : isPredator(enemy) ? 0.84 : 1) : 1;
  const damage = Math.round(enemy.damage * damageSoftener);
  player.hp = Math.max(0, player.hp - damage);
  player.hitT = 0.22;
  player.invulnT = midGame ? 0.62 : enemy.aiType === "stalker" ? 0.38 : 0.5;
  enemy.attackCd = enemy.aiType === "leviathan" ? 1.45 : enemy.aiType === "apex" ? 1.18 : enemy.aiType === "stalker" ? 0.72 : enemy.aiType === "brute" ? 1.18 : 0.9;

  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const len = Math.hypot(dx, dy) || 1;
  const knockback = enemy.aiType === "leviathan" ? 260 : enemy.aiType === "apex" ? 230 : enemy.aiType === "stalker" ? 185 : 160;
  player.vx += (dx / len) * knockback;
  player.vy += (dy / len) * knockback;

  state.stats.lastEvent = `${enemy.aiType} hit -${damage}`;
  addFloat(state, player.x, player.y - player.radius * 2, `-${damage} HP`, "danger");
}

export function updateEnemySystem(state: NextEngineState, dt: number) {
  const midGame = isMidGameLevel(state.player.level);
  for (const enemy of state.enemies) {
    enemy.attackCd = Math.max(0, enemy.attackCd - dt);
    enemy.thinkT = Math.max(0, enemy.thinkT - dt);
    enemy.wanderT = Math.max(0, enemy.wanderT - dt);

    const target = aiTarget(state, enemy);
    const separation = localSeparation(state, enemy);
    const crowdPenalty = separation.crowd >= 5 ? 0.78 : separation.crowd >= 3 ? 0.9 : 1;
    const huntBoost = midGame && isPredator(enemy) ? 1.02 : enemy.aiType === "leviathan" ? 1.12 : enemy.aiType === "apex" ? 1.16 : enemy.aiType === "stalker" ? 1.22 : 1.06;
    const impulse = midGame && isPredator(enemy) ? 1.7 : enemy.aiType === "leviathan" ? 1.9 : enemy.aiType === "apex" ? 2.1 : enemy.aiType === "stalker" ? 2.35 : 2.0;
    const stateSpeed = enemy.aiState === "flee" ? enemy.speed * 1.14 : enemy.aiState === "hunt" ? enemy.speed * huntBoost : enemy.aiState === "attack" ? enemy.speed * (midGame ? 0.84 : 0.94) : enemy.speed * 0.72;
    const separationWeight = isElite(enemy) ? 1.25 : enemy.aiState === "attack" ? (midGame ? 1.82 : 1.55) : enemy.aiState === "hunt" ? (midGame ? 1.55 : 1.35) : 1.05;
    const moveX = target.x + separation.x * separationWeight;
    const moveY = target.y + separation.y * separationWeight;
    const move = normalize(moveX, moveY);

    enemy.vx += move.x * stateSpeed * dt * impulse * crowdPenalty;
    enemy.vy += move.y * stateSpeed * dt * impulse * crowdPenalty;

    if (separation.crowd >= 4 && enemy.aiState !== "attack") {
      enemy.vx += separation.x * enemy.speed * dt * (midGame ? 3.1 : 2.4);
      enemy.vy += separation.y * enemy.speed * dt * (midGame ? 3.1 : 2.4);
      enemy.wanderT = Math.min(enemy.wanderT, 0.35);
    }

    const maxSpeed = enemy.aiState === "flee" ? enemy.speed * 1.34 : isElite(enemy) ? enemy.speed * (midGame ? 1.08 : 1.18) : enemy.speed * (midGame && isPredator(enemy) ? 1.0 : 1.08);
    const speed = Math.hypot(enemy.vx, enemy.vy) || 1;
    if (speed > maxSpeed) {
      enemy.vx = (enemy.vx / speed) * maxSpeed;
      enemy.vy = (enemy.vy / speed) * maxSpeed;
    }

    enemy.vx *= enemy.aiState === "attack" ? 0.92 : 0.965;
    enemy.vy *= enemy.aiState === "attack" ? 0.92 : 0.965;
    enemy.x = clamp(enemy.x + enemy.vx * dt, 80, state.config.width - 80);
    enemy.y = clamp(enemy.y + enemy.vy * dt, 80, state.config.height - 80);

    if (enemy.x <= 82 || enemy.x >= state.config.width - 82) enemy.vx *= -0.72;
    if (enemy.y <= 82 || enemy.y >= state.config.height - 82) enemy.vy *= -0.72;

    enemy.angle = Math.atan2(enemy.vy, enemy.vx);
    if (enemy.aiState === "attack") attackPlayer(state, enemy, target.playerDistance);
  }
}

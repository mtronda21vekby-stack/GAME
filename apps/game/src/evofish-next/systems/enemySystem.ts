import type { NextEngineState, NextFishEntity } from "../core/engineTypes";
import { canDevour } from "./collisionSystem";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function addFloat(state: NextEngineState, x: number, y: number, text: string, kind: "damage" | "kill" | "danger") {
  state.floats.push({ id: state.nextFloatId++, x, y, text, ttl: 0.75, kind });
}

function setWanderTarget(state: NextEngineState, enemy: NextFishEntity) {
  enemy.wanderX = 180 + Math.random() * (state.config.width - 360);
  enemy.wanderY = 180 + Math.random() * (state.config.height - 360);
  enemy.wanderT = 1.2 + Math.random() * 3.2;
}

function aiTarget(state: NextEngineState, enemy: NextFishEntity) {
  const player = state.player;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const distance = Math.hypot(dx, dy) || 1;
  const playerCanEat = canDevour(player.mass, enemy.mass);
  const enemyCanThreaten = canDevour(enemy.mass * 1.05, player.mass) || enemy.aiType === "hunter" || enemy.aiType === "brute";

  enemy.thinkT -= 1 / 60;
  if (enemy.thinkT <= 0) {
    enemy.thinkT = 0.18 + Math.random() * 0.28;
    if (playerCanEat && distance < enemy.aggroRadius * 1.25) enemy.aiState = "flee";
    else if (enemyCanThreaten && distance < enemy.attackRange) enemy.aiState = "attack";
    else if (enemyCanThreaten && distance < enemy.aggroRadius) enemy.aiState = "hunt";
    else enemy.aiState = "wander";
  }

  if (enemy.aiState === "flee") return { x: -dx / distance, y: -dy / distance, distance };
  if (enemy.aiState === "hunt" || enemy.aiState === "attack") return { x: dx / distance, y: dy / distance, distance };

  enemy.wanderT -= 1 / 60;
  const wx = enemy.wanderX - enemy.x;
  const wy = enemy.wanderY - enemy.y;
  const wDistance = Math.hypot(wx, wy) || 1;
  if (enemy.wanderT <= 0 || wDistance < 80) setWanderTarget(state, enemy);
  return { x: wx / wDistance, y: wy / wDistance, distance };
}

function attackPlayer(state: NextEngineState, enemy: NextFishEntity, distance: number) {
  const player = state.player;
  enemy.attackCd = Math.max(0, enemy.attackCd - 1 / 60);
  if (distance > enemy.attackRange + player.radius || enemy.attackCd > 0 || player.invulnT > 0) return;

  const damage = Math.round(enemy.damage);
  player.hp = Math.max(0, player.hp - damage);
  player.hitT = 0.22;
  player.invulnT = 0.5;
  enemy.attackCd = enemy.aiType === "brute" ? 1.15 : 0.85;

  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const len = Math.hypot(dx, dy) || 1;
  player.vx += (dx / len) * 160;
  player.vy += (dy / len) * 160;

  state.stats.lastEvent = `${enemy.aiType} hit -${damage}`;
  addFloat(state, player.x, player.y - player.radius * 2, `-${damage} HP`, "danger");
}

export function updateEnemySystem(state: NextEngineState, dt: number) {
  for (const enemy of state.enemies) {
    enemy.attackCd = Math.max(0, enemy.attackCd - dt);
    enemy.thinkT = Math.max(0, enemy.thinkT - dt);
    enemy.wanderT = Math.max(0, enemy.wanderT - dt);

    const target = aiTarget(state, enemy);
    const stateSpeed = enemy.aiState === "flee" ? enemy.speed * 1.16 : enemy.aiState === "hunt" ? enemy.speed * 1.08 : enemy.speed * 0.72;
    enemy.vx += target.x * stateSpeed * dt * 2.2;
    enemy.vy += target.y * stateSpeed * dt * 2.2;

    const maxSpeed = enemy.aiState === "flee" ? enemy.speed * 1.36 : enemy.speed * 1.12;
    const speed = Math.hypot(enemy.vx, enemy.vy) || 1;
    if (speed > maxSpeed) {
      enemy.vx = (enemy.vx / speed) * maxSpeed;
      enemy.vy = (enemy.vy / speed) * maxSpeed;
    }

    enemy.vx *= enemy.aiState === "attack" ? 0.94 : 0.97;
    enemy.vy *= enemy.aiState === "attack" ? 0.94 : 0.97;
    enemy.x = clamp(enemy.x + enemy.vx * dt, 80, state.config.width - 80);
    enemy.y = clamp(enemy.y + enemy.vy * dt, 80, state.config.height - 80);

    if (enemy.x <= 82 || enemy.x >= state.config.width - 82) enemy.vx *= -0.72;
    if (enemy.y <= 82 || enemy.y >= state.config.height - 82) enemy.vy *= -0.72;

    enemy.angle = Math.atan2(enemy.vy, enemy.vx);
    if (enemy.aiState === "attack") attackPlayer(state, enemy, target.distance);
  }
}

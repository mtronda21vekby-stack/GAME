import type { NextAIState, NextCameraState, NextEngineState, NextFishEntity, NextViewport } from "../core/engineTypes";
import { drawEvoFishSkin } from "./canvasSkinRenderer";
import { getNextCamera } from "../systems/cameraSystem";
import { canDevour } from "../systems/collisionSystem";

function drawWorldBackground(ctx: CanvasRenderingContext2D, state: NextEngineState, camera: NextCameraState, viewport: NextViewport) {
  const g = ctx.createLinearGradient(0, 0, 0, viewport.height);
  g.addColorStop(0, "#06304a");
  g.addColorStop(1, "#020b15");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  ctx.strokeStyle = "rgba(150,230,255,.055)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= state.config.width; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, state.config.height);
    ctx.stroke();
  }

  for (let y = 0; y <= state.config.height; y += 120) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(state.config.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(150,230,255,.16)";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, state.config.width, state.config.height);
  ctx.restore();
}

function aiColor(state: NextAIState) {
  if (state === "attack") return "rgba(255,80,80,.48)";
  if (state === "hunt") return "rgba(255,180,90,.42)";
  if (state === "flee") return "rgba(110,255,180,.38)";
  return "rgba(150,230,255,.18)";
}

function drawApexFrame(ctx: CanvasRenderingContext2D, enemy: NextFishEntity) {
  if (enemy.aiType !== "apex") return;

  ctx.save();
  ctx.strokeStyle = "rgba(255,220,120,.50)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius * 2.55, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,90,90,.34)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius * 3.05, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.font = "1000 16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "rgba(255,240,180,.95)";
  ctx.fillText("APEX", enemy.x, enemy.y - enemy.radius * 3.2);
  ctx.restore();
}

function drawAiRing(ctx: CanvasRenderingContext2D, enemy: NextFishEntity) {
  drawApexFrame(ctx, enemy);

  ctx.strokeStyle = enemy.aiType === "apex" ? "rgba(255,220,120,.42)" : aiColor(enemy.aiState);
  ctx.lineWidth = enemy.aiType === "apex" ? 4 : enemy.aiState === "attack" ? 4 : enemy.aiState === "hunt" ? 3 : 2;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius * (enemy.aiType === "apex" ? 2.05 : enemy.aiState === "attack" ? 2.2 : 1.85), 0, Math.PI * 2);
  ctx.stroke();

  if (enemy.aiState === "hunt" || enemy.aiState === "attack") {
    ctx.fillStyle = enemy.aiType === "apex" ? "rgba(255,220,120,.72)" : aiColor(enemy.aiState);
    ctx.beginPath();
    ctx.arc(enemy.x + Math.cos(enemy.angle) * enemy.radius * 1.8, enemy.y + Math.sin(enemy.angle) * enemy.radius * 1.8, enemy.aiType === "apex" ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHpBar(ctx: CanvasRenderingContext2D, entity: NextFishEntity, width: number) {
  const pct = Math.max(0, Math.min(1, entity.hp / entity.hpMax));
  const x = entity.x - width / 2;
  const y = entity.y - entity.radius * 2.15;
  ctx.fillStyle = "rgba(2,12,20,.64)";
  ctx.fillRect(x, y, width, 5);
  ctx.fillStyle = entity.aiType === "apex" ? "rgba(255,220,120,.92)" : pct > 0.45 ? "rgba(110,255,180,.88)" : "rgba(255,90,90,.9)";
  ctx.fillRect(x, y, width * pct, 5);
}

function drawCombatAura(ctx: CanvasRenderingContext2D, state: NextEngineState) {
  const player = state.player;

  if (player.downed || player.dead) {
    ctx.strokeStyle = "rgba(255,120,120,.42)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 2.35, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (player.invulnT > 0) {
    ctx.strokeStyle = "rgba(120,240,255,.38)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 2.05, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.dashT > 0) {
    ctx.strokeStyle = "rgba(120,240,255,.42)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 2.25, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.biteCd > 0.25) {
    ctx.strokeStyle = "rgba(255,255,255,.34)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(player.angle) * player.radius * 1.25, player.y + Math.sin(player.angle) * player.radius * 1.25, player.radius * 1.35, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawFloatText(ctx: CanvasRenderingContext2D, state: NextEngineState) {
  ctx.textAlign = "center";
  ctx.font = "900 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

  for (const float of state.floats) {
    const alpha = Math.max(0, Math.min(1, float.ttl / 0.75));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = float.kind === "kill" ? "#fff3a0" : float.kind === "danger" ? "#ff7878" : "#e7f2ff";
    ctx.fillText(float.text, float.x, float.y);
  }

  ctx.globalAlpha = 1;
}

export function renderNextWorld(ctx: CanvasRenderingContext2D, state: NextEngineState, viewport: NextViewport) {
  const camera = getNextCamera(state, viewport);
  const playerDowned = Boolean(state.player.downed || state.player.dead);

  drawWorldBackground(ctx, state, camera, viewport);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  for (const enemy of state.enemies) {
    const safeToEat = canDevour(state.player.mass, enemy.mass);
    drawAiRing(ctx, enemy);
    ctx.strokeStyle = enemy.aiType === "apex" ? "rgba(255,220,120,.30)" : safeToEat ? "rgba(110,255,180,.24)" : "rgba(255,90,90,.32)";
    ctx.lineWidth = enemy.hitT > 0 ? 4 : 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius * 1.52, 0, Math.PI * 2);
    ctx.stroke();
    drawEvoFishSkin(ctx, enemy.skin, enemy.form, {
      x: enemy.x,
      y: enemy.y,
      radius: enemy.radius,
      angle: enemy.angle,
      alpha: enemy.hitT > 0 ? 0.55 : safeToEat ? 0.82 : 0.92
    });
    drawHpBar(ctx, enemy, enemy.radius * (enemy.aiType === "apex" ? 4.1 : 2.8));
  }

  drawCombatAura(ctx, state);
  drawEvoFishSkin(ctx, state.player.skin, state.player.form, {
    x: state.player.x,
    y: state.player.y,
    radius: state.player.radius,
    angle: state.player.angle,
    alpha: playerDowned ? 0.34 : state.player.hitT > 0 ? 0.68 : 1
  });
  drawHpBar(ctx, state.player, state.player.radius * 3.2);
  drawFloatText(ctx, state);

  ctx.restore();
}

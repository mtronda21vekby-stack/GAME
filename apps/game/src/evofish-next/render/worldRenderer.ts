import type { NextCameraState, NextEngineState, NextViewport } from "../core/engineTypes";
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

export function renderNextWorld(ctx: CanvasRenderingContext2D, state: NextEngineState, viewport: NextViewport) {
  const camera = getNextCamera(state, viewport);

  drawWorldBackground(ctx, state, camera, viewport);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  for (const enemy of state.enemies) {
    const safeToEat = canDevour(state.player.mass, enemy.mass);
    ctx.strokeStyle = safeToEat ? "rgba(110,255,180,.24)" : "rgba(255,90,90,.32)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius * 1.85, 0, Math.PI * 2);
    ctx.stroke();
    drawEvoFishSkin(ctx, enemy.skin, enemy.form, {
      x: enemy.x,
      y: enemy.y,
      radius: enemy.radius,
      angle: enemy.angle,
      alpha: safeToEat ? 0.82 : 0.92
    });
  }

  drawEvoFishSkin(ctx, state.player.skin, state.player.form, {
    x: state.player.x,
    y: state.player.y,
    radius: state.player.radius,
    angle: state.player.angle,
    alpha: 1
  });

  ctx.restore();
}

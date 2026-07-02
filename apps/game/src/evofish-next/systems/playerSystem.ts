import type { NextCameraState, NextEngineState, NextInputState } from "../core/engineTypes";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function updatePlayerSystem(state: NextEngineState, input: NextInputState, camera: NextCameraState, dt: number) {
  const player = state.player;

  if (input.down) {
    const targetX = camera.x + input.pointerX;
    const targetY = camera.y + input.pointerY;
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const len = Math.hypot(dx, dy) || 1;

    player.vx += (dx / len) * player.speed * dt * 3.2;
    player.vy += (dy / len) * player.speed * dt * 3.2;
    player.angle = Math.atan2(dy, dx);
  }

  player.vx *= 0.9;
  player.vy *= 0.9;
  player.x = clamp(player.x + player.vx * dt, 40, state.config.width - 40);
  player.y = clamp(player.y + player.vy * dt, 40, state.config.height - 40);
}

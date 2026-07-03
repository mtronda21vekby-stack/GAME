import type { NextCameraState, NextEngineState, NextInputState } from "../core/engineTypes";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function aimVector(state: NextEngineState, input: NextInputState, camera: NextCameraState) {
  const moveX = input.moveX || 0;
  const moveY = input.moveY || 0;
  const moveLen = Math.hypot(moveX, moveY);

  if (moveLen > 0.08) {
    return { x: moveX / moveLen, y: moveY / moveLen, angle: Math.atan2(moveY, moveX) };
  }

  const scale = camera.scale || 1;
  const targetX = camera.x + input.pointerX / scale;
  const targetY = camera.y + input.pointerY / scale;
  const dx = targetX - state.player.x;
  const dy = targetY - state.player.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len, angle: Math.atan2(dy, dx) };
}

export function updatePlayerSystem(state: NextEngineState, input: NextInputState, camera: NextCameraState, dt: number) {
  const player = state.player;

  player.biteCd = Math.max(0, player.biteCd - dt);
  player.dashCd = Math.max(0, player.dashCd - dt);
  player.dashT = Math.max(0, player.dashT - dt);
  player.invulnT = Math.max(0, player.invulnT - dt);
  player.hitT = Math.max(0, player.hitT - dt);

  if (input.down) {
    const aim = aimVector(state, input, camera);
    const moveLen = Math.min(1, Math.hypot(input.moveX || 0, input.moveY || 0) || 1);
    player.vx += aim.x * player.speed * dt * 3.2 * moveLen;
    player.vy += aim.y * player.speed * dt * 3.2 * moveLen;
    player.angle = aim.angle;
  }

  if (input.dash && player.dashCd <= 0) {
    const aim = input.down ? aimVector(state, input, camera) : { x: Math.cos(player.angle), y: Math.sin(player.angle), angle: player.angle };
    player.vx += aim.x * player.speed * 1.45;
    player.vy += aim.y * player.speed * 1.45;
    player.angle = aim.angle;
    player.dashCd = 1.05;
    player.dashT = 0.18;
    player.invulnT = 0.16;
    state.stats.lastEvent = "Рывок";
  }

  input.dash = false;

  const friction = player.dashT > 0 ? 0.96 : 0.9;
  player.vx *= friction;
  player.vy *= friction;
  player.x = clamp(player.x + player.vx * dt, 40, state.config.width - 40);
  player.y = clamp(player.y + player.vy * dt, 40, state.config.height - 40);
}

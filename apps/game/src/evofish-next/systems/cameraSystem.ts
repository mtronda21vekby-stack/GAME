import type { NextCameraState, NextEngineState, NextViewport } from "../core/engineTypes";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getNextCamera(state: NextEngineState, viewport: NextViewport): NextCameraState {
  const screenWidth = Math.max(1, viewport.width);
  const screenHeight = Math.max(1, viewport.height);
  const scale = clamp(Number(viewport.zoom || 1), 0.52, 1.28);
  const width = Math.max(1, screenWidth / scale);
  const height = Math.max(1, screenHeight / scale);

  return {
    x: clamp(state.player.x - width / 2, 0, Math.max(0, state.config.width - width)),
    y: clamp(state.player.y - height / 2, 0, Math.max(0, state.config.height - height)),
    width,
    height,
    scale
  };
}

import { Matrix4, Vector3 } from "three";
import type { PerspectiveCamera } from "three";

/** Project live HTML into exactly the same camera space as the WebGL panel backing. */
export function panelCSSMatrix(camera: PerspectiveCamera, world: Matrix4, width: number, height: number, elementWidth: number, elementHeight: number, worldWidth: number) {
  const unit = worldWidth / elementWidth;
  const local = new Matrix4().makeScale(unit, -unit, unit);
  local.multiply(new Matrix4().makeTranslation(-elementWidth / 2, -elementHeight / 2, 0));
  const clip = new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(world).multiply(local);
  // Clip coordinates → CSS pixels. The homogeneous W preserves perspective and hit testing.
  const viewport = new Matrix4().set(width / 2, 0, 0, width / 2, 0, -height / 2, 0, height / 2, 0, 0, -1, 0, 0, 0, 0, 1);
  return viewport.multiply(clip);
}

export function panelStyle(matrix: Matrix4) {
  return `matrix3d(${matrix.elements.map(value => Math.abs(value) < 1e-10 ? 0 : value).join(",")})`;
}

export function panelFrontWidth(camera: PerspectiveCamera, width: number, worldWidth: number, position: Vector3) {
  const left = position.clone().add(new Vector3(-worldWidth / 2, 0, 0)).project(camera);
  const right = position.clone().add(new Vector3(worldWidth / 2, 0, 0)).project(camera);
  return Math.max(1, (right.x - left.x) * width / 2);
}

/** Follow the gallery's native document slot so panels never cover the controls below it. */
export function panelScrollOffset(camera: PerspectiveCamera, center: Vector3, targetScreenY: number, viewportHeight: number) {
  const m = new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).elements;
  const target = 1 - targetScreenY / viewportHeight * 2;
  const b = m[1] * center.x + m[9] * center.z + m[13], d = m[3] * center.x + m[11] * center.z + m[15];
  const denominator = m[5] - target * m[7];
  if (Math.abs(denominator) < 1e-8) return 0;
  return Math.max(-30, Math.min(30, (target * d - b) / denominator - center.y));
}

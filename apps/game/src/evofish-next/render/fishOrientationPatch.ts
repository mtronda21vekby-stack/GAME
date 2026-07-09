const PATCH_KEY = "__evofish_side_facing_rotate_patch__";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sideFacingPose(angle: number) {
  const normalized = Math.atan2(Math.sin(angle), Math.cos(angle));
  const cos = Math.cos(normalized);
  const sin = Math.sin(normalized);
  const facingLeft = cos < 0;
  const rawTilt = Math.atan2(sin, Math.max(0.24, Math.abs(cos)));
  const tilt = clamp(facingLeft ? -rawTilt : rawTilt, -0.72, 0.72);

  return { tilt, facingLeft };
}

export function installFishOrientationPatch() {
  if (typeof CanvasRenderingContext2D === "undefined") return;
  const proto = CanvasRenderingContext2D.prototype as CanvasRenderingContext2D & Record<string, unknown>;
  if (proto[PATCH_KEY]) return;

  const rotate = proto.rotate;
  const scale = proto.scale;

  proto.rotate = function patchedRotate(this: CanvasRenderingContext2D, angle: number) {
    if (Number.isFinite(angle) && Math.abs(Math.cos(angle)) < 0.999 && Math.abs(angle) > Math.PI / 2) {
      const pose = sideFacingPose(angle);
      rotate.call(this, pose.tilt);
      if (pose.facingLeft) scale.call(this, -1, 1);
      return;
    }

    rotate.call(this, angle);
  };

  proto[PATCH_KEY] = true;
}

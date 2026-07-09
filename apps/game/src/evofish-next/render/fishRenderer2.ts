import type { NextFishEntity, NextRenderQuality } from "../core/engineTypes";
import { drawEvoFishSkin } from "./canvasSkinRenderer";

type FishRenderer2Options = {
  image: HTMLImageElement | null;
  radius: number;
  alpha: number;
  quality: NextRenderQuality;
  time: number;
};

type Pose = {
  facingLeft: boolean;
  localAngle: number;
  speed: number;
  shimmer: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizedAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function entitySpeed(entity: NextFishEntity) {
  return Math.hypot(entity.vx || 0, entity.vy || 0);
}

function fishPose(entity: NextFishEntity, time: number): Pose {
  const angle = normalizedAngle(entity.angle || 0);
  const facingLeft = Math.cos(angle) < 0;
  const mirroredAngle = facingLeft
    ? normalizedAngle(angle + Math.PI)
    : angle;

  return {
    facingLeft,
    // Full enough rotation to feel responsive, but clamped before it can look upside-down.
    localAngle: clamp(mirroredAngle, -1.15, 1.15),
    speed: entitySpeed(entity),
    shimmer: Math.sin(time * 0.0032 + entity.id * 0.71) * 0.5 + 0.5
  };
}

function formScale(entity: NextFishEntity) {
  if (entity.form === "megalodon") return 5.25;
  if (entity.form === "shark") return 4.95;
  return 4.62;
}

function imageAspect(image: HTMLImageElement | null, entity: NextFishEntity) {
  if (image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
    return image.naturalHeight / Math.max(1, image.naturalWidth);
  }
  return entity.form === "fish" ? 0.42 : 0.38;
}

function materialKind(entity: NextFishEntity) {
  const id = `${entity.skin?.id || ""} ${entity.skin?.name || ""}`.toLowerCase();
  if (id.includes("cyber") || id.includes("кибер")) return "cyber";
  if (id.includes("lava") || id.includes("огн") || id.includes("ад")) return "lava";
  if (id.includes("ice") || id.includes("лед") || id.includes("frost")) return "ice";
  if (id.includes("deep") || id.includes("shadow") || id.includes("abyss")) return "deep";
  return "pearl";
}

function materialColors(entity: NextFishEntity) {
  const palette = entity.skin?.palette;
  const kind = materialKind(entity);
  if (kind === "lava") return { rim: "rgba(255,170,72,.40)", shine: "rgba(255,224,154,.28)", bubble: "rgba(255,185,90,.56)" };
  if (kind === "ice") return { rim: "rgba(190,240,255,.42)", shine: "rgba(245,255,255,.32)", bubble: "rgba(190,240,255,.58)" };
  if (kind === "deep") return { rim: "rgba(120,160,255,.32)", shine: "rgba(170,220,255,.24)", bubble: "rgba(120,190,255,.54)" };
  if (kind === "cyber") return { rim: palette?.glow || "rgba(90,245,255,.46)", shine: "rgba(220,255,255,.30)", bubble: "rgba(90,245,255,.58)" };
  return { rim: palette?.glow || "rgba(150,235,255,.34)", shine: "rgba(255,255,255,.26)", bubble: "rgba(170,235,255,.52)" };
}

function drawFishShadow(ctx: CanvasRenderingContext2D, width: number, height: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.22;
  ctx.fillStyle = "rgba(0,8,16,.58)";
  ctx.beginPath();
  ctx.ellipse(-width * 0.02, height * 0.35, width * 0.40, height * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDashBubbles(ctx: CanvasRenderingContext2D, entity: NextFishEntity, width: number, height: number, alpha: number, quality: NextRenderQuality, pose: Pose) {
  const dashT = (entity as NextFishEntity & { dashT?: number }).dashT || 0;
  if (quality === "low" || dashT <= 0) return;
  const colors = materialColors(entity);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha * clamp(dashT * 1.6, 0.14, 0.42);
  ctx.strokeStyle = colors.bubble;
  ctx.fillStyle = "rgba(230,255,255,.16)";
  ctx.lineWidth = Math.max(1, height * 0.018);
  const count = quality === "high" ? 7 : 5;
  for (let i = 0; i < count; i += 1) {
    const k = i / Math.max(1, count - 1);
    const x = -width * (0.44 + k * 0.42);
    const y = Math.sin(pose.shimmer * Math.PI * 2 + i * 1.7) * height * (0.08 + k * 0.12);
    const r = Math.max(2.2, height * (0.035 + k * 0.022));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawBase(ctx: CanvasRenderingContext2D, entity: NextFishEntity, options: FishRenderer2Options, width: number, height: number) {
  ctx.save();
  ctx.globalAlpha = options.alpha;
  const image = options.image;
  if (image?.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, -width * 0.5, -height * 0.5, width, height);
  } else {
    drawEvoFishSkin(ctx, entity.skin, entity.form, { x: 0, y: 0, radius: options.radius, angle: 0, alpha: 1 });
  }
  ctx.restore();
}

function drawSkinShimmer(ctx: CanvasRenderingContext2D, entity: NextFishEntity, width: number, height: number, alpha: number, quality: NextRenderQuality, pose: Pose) {
  if (quality === "low") return;
  const colors = materialColors(entity);
  ctx.save();
  // Clip to the fish body area. This prevents the shimmer from becoming a random field around the sprite.
  ctx.beginPath();
  ctx.ellipse(width * 0.06, -height * 0.03, width * 0.41, height * 0.36, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalCompositeOperation = "screen";

  const g = ctx.createLinearGradient(-width * 0.38, -height * 0.22, width * 0.48, height * 0.20);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(clamp(0.34 + pose.shimmer * 0.26, 0.18, 0.82), colors.shine);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalAlpha = alpha * 0.64;
  ctx.fillStyle = g;
  ctx.fillRect(-width * 0.48, -height * 0.42, width * 0.96, height * 0.84);

  ctx.globalAlpha = alpha * (quality === "high" ? 0.24 : 0.16);
  ctx.strokeStyle = colors.rim;
  ctx.lineWidth = Math.max(0.9, height * 0.020);
  ctx.beginPath();
  ctx.moveTo(-width * 0.24, -height * 0.26);
  ctx.quadraticCurveTo(width * 0.08, -height * 0.42, width * 0.36, -height * 0.22);
  ctx.stroke();

  ctx.restore();
}

function drawEyeLife(ctx: CanvasRenderingContext2D, entity: NextFishEntity, width: number, height: number, alpha: number, quality: NextRenderQuality) {
  if (quality === "low") return;
  const eyeX = width * (entity.form === "fish" ? 0.34 : 0.31);
  const eyeY = -height * 0.15;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha * 0.38;
  ctx.fillStyle = "rgba(255,255,255,.80)";
  ctx.beginPath();
  ctx.arc(eyeX + width * 0.018, eyeY - height * 0.040, Math.max(1.1, height * 0.030), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHitFlash(ctx: CanvasRenderingContext2D, entity: NextFishEntity, width: number, height: number, alpha: number) {
  if ((entity.hitT || 0) <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha * clamp(entity.hitT * 3.2, 0, 0.48);
  ctx.fillStyle = "rgba(255,255,255,.58)";
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.40, height * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawFishRenderer2(ctx: CanvasRenderingContext2D, entity: NextFishEntity, options: FishRenderer2Options) {
  const pose = fishPose(entity, options.time);
  const width = options.radius * formScale(entity);
  const height = width * imageAspect(options.image, entity);

  ctx.save();
  ctx.translate(entity.x, entity.y);
  if (pose.facingLeft) ctx.scale(-1, 1);
  ctx.rotate(pose.localAngle);
  drawDashBubbles(ctx, entity, width, height, options.alpha, options.quality, pose);
  drawFishShadow(ctx, width, height, options.alpha);
  drawBase(ctx, entity, options, width, height);
  drawSkinShimmer(ctx, entity, width, height, options.alpha, options.quality, pose);
  drawEyeLife(ctx, entity, width, height, options.alpha, options.quality);
  drawHitFlash(ctx, entity, width, height, options.alpha);
  ctx.restore();
}

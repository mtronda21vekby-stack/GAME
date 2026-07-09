import type { NextFishEntity, NextRenderQuality } from "../core/engineTypes";
import { drawEvoFishSkin } from "./canvasSkinRenderer";

type FishRenderer2Options = {
  image: HTMLImageElement | null;
  radius: number;
  alpha: number;
  quality: NextRenderQuality;
  time: number;
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

function fishPose(entity: NextFishEntity, time: number) {
  const angle = normalizedAngle(entity.angle || 0);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const facingLeft = cos < 0;
  const rawTilt = Math.atan2(sin, Math.max(0.28, Math.abs(cos)));
  const tilt = clamp(facingLeft ? -rawTilt : rawTilt, -0.64, 0.64);
  const speed = entitySpeed(entity);
  const swim = clamp(speed / 260, 0.25, 1.65);
  const phase = time * (0.008 + swim * 0.005) + entity.id * 1.71;

  return {
    facingLeft,
    tilt,
    speed,
    swim,
    phase,
    bob: Math.sin(phase * 0.55) * clamp(1.2 + swim * 1.2, 1.2, 3.6),
    wag: Math.sin(phase) * clamp(0.028 + swim * 0.024, 0.03, 0.07),
    shimmer: Math.sin(time * 0.004 + entity.id * 0.93) * 0.5 + 0.5
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
  if (entity.form === "fish") return 0.42;
  return 0.38;
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
  if (kind === "lava") return { rim: "rgba(255,170,72,.54)", glow: "rgba(255,95,60,.22)", shine: "rgba(255,224,154,.44)" };
  if (kind === "ice") return { rim: "rgba(190,240,255,.58)", glow: "rgba(100,220,255,.20)", shine: "rgba(245,255,255,.48)" };
  if (kind === "deep") return { rim: "rgba(120,160,255,.46)", glow: "rgba(80,110,255,.18)", shine: "rgba(170,220,255,.34)" };
  if (kind === "cyber") return { rim: palette?.glow || "rgba(90,245,255,.62)", glow: "rgba(80,255,230,.22)", shine: "rgba(220,255,255,.48)" };
  return { rim: palette?.glow || "rgba(150,235,255,.50)", glow: "rgba(160,220,255,.16)", shine: "rgba(255,255,255,.42)" };
}

function drawFishShadow(ctx: CanvasRenderingContext2D, width: number, height: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.28;
  ctx.fillStyle = "rgba(0,8,16,.62)";
  ctx.beginPath();
  ctx.ellipse(-width * 0.03, height * 0.37, width * 0.42, height * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTrail(ctx: CanvasRenderingContext2D, entity: NextFishEntity, width: number, height: number, alpha: number, quality: NextRenderQuality, pose: ReturnType<typeof fishPose>) {
  if (quality === "low" || pose.speed < 70) return;
  const colors = materialColors(entity);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha * clamp(pose.speed / 520, 0.08, 0.22);
  ctx.strokeStyle = colors.rim;
  ctx.lineWidth = Math.max(1.4, height * 0.05);
  ctx.lineCap = "round";
  for (let i = 0; i < 2; i += 1) {
    const y = (i - 0.5) * height * 0.16;
    ctx.beginPath();
    ctx.moveTo(-width * 0.42, y);
    ctx.quadraticCurveTo(-width * (0.58 + i * 0.1), y + Math.sin(pose.phase + i) * height * 0.14, -width * (0.78 + i * 0.1), y * 0.5);
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

function drawMaterial(ctx: CanvasRenderingContext2D, entity: NextFishEntity, width: number, height: number, alpha: number, quality: NextRenderQuality, pose: ReturnType<typeof fishPose>) {
  if (quality === "low") return;
  const colors = materialColors(entity);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha;

  const g = ctx.createLinearGradient(-width * 0.4, -height * 0.28, width * 0.46, height * 0.22);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.45 + pose.shimmer * 0.16, colors.shine);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(width * (pose.shimmer * 0.18 - 0.02), -height * 0.08, width * 0.36, height * 0.18, -0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colors.rim;
  ctx.lineWidth = Math.max(1.15, height * 0.038);
  ctx.globalAlpha = alpha * 0.34;
  ctx.beginPath();
  ctx.moveTo(-width * 0.28, -height * 0.26);
  ctx.quadraticCurveTo(width * 0.08, -height * 0.45, width * 0.36, -height * 0.22);
  ctx.stroke();

  if (quality === "high") {
    ctx.globalAlpha = alpha * 0.20;
    ctx.strokeStyle = colors.shine;
    ctx.lineWidth = Math.max(0.85, height * 0.024);
    for (let i = 0; i < 3; i += 1) {
      const x = -width * 0.14 + i * width * 0.14 + pose.shimmer * width * 0.035;
      ctx.beginPath();
      ctx.moveTo(x, -height * 0.22);
      ctx.lineTo(x + width * 0.08, height * 0.22);
      ctx.stroke();
    }
  }

  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = alpha * 0.18;
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.ellipse(-width * 0.42, 0, width * (0.11 + Math.abs(pose.wag)), height * 0.27, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEyeLife(ctx: CanvasRenderingContext2D, entity: NextFishEntity, width: number, height: number, alpha: number, quality: NextRenderQuality, pose: ReturnType<typeof fishPose>) {
  if (quality === "low") return;
  const eyeX = width * (entity.form === "fish" ? 0.34 : 0.31);
  const eyeY = -height * 0.13 + Math.sin(pose.phase * 0.6) * height * 0.01;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha * 0.48;
  ctx.fillStyle = "rgba(255,255,255,.86)";
  ctx.beginPath();
  ctx.arc(eyeX + width * 0.018, eyeY - height * 0.045, Math.max(1.2, height * 0.032), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHitFlash(ctx: CanvasRenderingContext2D, entity: NextFishEntity, width: number, height: number, alpha: number) {
  if ((entity.hitT || 0) <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha * clamp(entity.hitT * 4, 0, 0.65);
  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.42, height * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawFishRenderer2(ctx: CanvasRenderingContext2D, entity: NextFishEntity, options: FishRenderer2Options) {
  const pose = fishPose(entity, options.time);
  const width = options.radius * formScale(entity) * (1 + pose.wag * 0.35);
  const height = width * imageAspect(options.image, entity) * (1 - Math.abs(pose.wag) * 0.16);

  ctx.save();
  ctx.translate(entity.x, entity.y + pose.bob);
  if (pose.facingLeft) ctx.scale(-1, 1);
  ctx.rotate(pose.tilt);
  drawTrail(ctx, entity, width, height, options.alpha, options.quality, pose);
  drawFishShadow(ctx, width, height, options.alpha);
  drawBase(ctx, entity, options, width, height);
  drawMaterial(ctx, entity, width, height, options.alpha, options.quality, pose);
  drawEyeLife(ctx, entity, width, height, options.alpha, options.quality, pose);
  drawHitFlash(ctx, entity, width, height, options.alpha);
  ctx.restore();
}

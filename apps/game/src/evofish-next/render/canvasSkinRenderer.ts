import type { EvoFishFormId, EvoFishSkinDefinition } from "../core/types";

export type DrawSkinOptions = {
  x: number;
  y: number;
  radius: number;
  angle: number;
  alpha?: number;
};

function bodyGradient(ctx: CanvasRenderingContext2D, skin: EvoFishSkinDefinition, radius: number) {
  const g = ctx.createLinearGradient(-radius * 2.4, -radius, radius * 2.4, radius);
  g.addColorStop(0, skin.palette.primary);
  g.addColorStop(0.62, skin.palette.secondary);
  g.addColorStop(1, skin.palette.shadow || skin.palette.accent);
  return g;
}

function drawEye(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.fillStyle = "#f8fbff";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#07131f";
  ctx.beginPath();
  ctx.arc(x + radius * 0.35, y + radius * 0.08, radius * 0.42, 0, Math.PI * 2);
  ctx.fill();
}

function drawPattern(ctx: CanvasRenderingContext2D, skin: EvoFishSkinDefinition, form: EvoFishFormId, radius: number) {
  const accent = skin.palette.accent;
  const p = skin.pattern;
  if (p === "none") return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (p === "stripes" || p === "tiger") {
    ctx.globalAlpha = p === "tiger" ? 0.46 : 0.36;
    ctx.strokeStyle = accent;
    ctx.lineWidth = radius * 0.22;
    const lines = form === "fish" ? [-0.58, -0.2, 0.18] : [-0.72, -0.34, 0.02, 0.38];
    for (const x of lines) {
      ctx.beginPath();
      ctx.moveTo(radius * x, -radius * 0.8);
      ctx.lineTo(radius * (x - 0.18), radius * 0.75);
      ctx.stroke();
    }
  } else if (p === "koi" || p === "royal" || p === "stars") {
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = accent;
    for (const dot of [[-0.52, -0.18, 0.2], [-0.1, 0.22, 0.28], [0.34, -0.12, 0.16]]) {
      ctx.beginPath();
      ctx.arc(radius * dot[0], radius * dot[1], radius * dot[2], 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = radius * 0.14;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.48, radius * 0.52);
    ctx.bezierCurveTo(-radius * 0.12, radius * 0.2, radius * 0.22, radius * 0.72, radius * 0.58, radius * 0.34);
    ctx.stroke();
  } else if (p === "scales" || p === "circuit") {
    ctx.globalAlpha = 0.48;
    ctx.strokeStyle = accent;
    ctx.lineWidth = radius * 0.09;
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 4; i++) {
        const x = -radius * 0.62 + i * radius * 0.34 + row * radius * 0.16;
        const y = -radius * 0.08 + row * radius * 0.32;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.18, Math.PI, 0);
        ctx.stroke();
      }
    }
  } else if (p === "bone" || p === "plates" || p === "cracks") {
    ctx.globalAlpha = 0.58;
    ctx.strokeStyle = accent;
    ctx.lineWidth = radius * 0.15;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.72, -radius * 0.24);
    ctx.bezierCurveTo(-radius * 0.18, -radius * 0.52, radius * 0.28, -radius * 0.42, radius * 0.72, -radius * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-radius * 0.6, radius * 0.36);
    ctx.bezierCurveTo(-radius * 0.12, radius * 0.14, radius * 0.32, radius * 0.18, radius * 0.7, radius * 0.44);
    ctx.stroke();
  } else if (p === "glowdot" || p === "glow") {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = skin.palette.glow || accent;
    for (const dot of [[-0.74, -0.72, 0.18], [-0.3, -0.42, 0.1], [0.08, -0.5, 0.08]]) {
      ctx.beginPath();
      ctx.arc(radius * dot[0], radius * dot[1], radius * dot[2], 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (p === "pirate") {
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(radius * 0.72, -radius * 0.28, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = radius * 0.1;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.3, radius * 0.46);
    ctx.bezierCurveTo(radius * 0.1, radius * 0.72, radius * 0.44, radius * 0.6, radius * 0.72, radius * 0.34);
    ctx.stroke();
  }

  ctx.restore();
}

function fishShape(ctx: CanvasRenderingContext2D, skin: EvoFishSkinDefinition, radius: number) {
  const length = radius * 3.4;
  const height = radius * 1.35;
  ctx.fillStyle = skin.palette.secondary;
  ctx.beginPath();
  ctx.moveTo(-length * 0.5, 0);
  ctx.lineTo(-length * 0.8, -height * 0.48);
  ctx.lineTo(-length * 0.68, 0);
  ctx.lineTo(-length * 0.8, height * 0.48);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = bodyGradient(ctx, skin, radius);
  ctx.beginPath();
  ctx.moveTo(-length * 0.48, 0);
  ctx.bezierCurveTo(-length * 0.1, -height * 0.75, length * 0.56, -height * 0.58, length * 0.74, 0);
  ctx.bezierCurveTo(length * 0.56, height * 0.58, -length * 0.1, height * 0.75, -length * 0.48, 0);
  ctx.fill();

  drawPattern(ctx, skin, "fish", radius);
  drawEye(ctx, length * 0.44, -height * 0.14, radius * 0.16);
}

function sharkShape(ctx: CanvasRenderingContext2D, skin: EvoFishSkinDefinition, radius: number) {
  const length = radius * 4.1;
  const height = radius * 1.42;
  ctx.fillStyle = skin.palette.secondary;
  ctx.beginPath();
  ctx.moveTo(-length * 0.5, 0);
  ctx.lineTo(-length * 0.78, -height * 0.48);
  ctx.lineTo(-length * 0.68, 0);
  ctx.lineTo(-length * 0.78, height * 0.48);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = bodyGradient(ctx, skin, radius);
  ctx.beginPath();
  ctx.moveTo(-length * 0.48, 0);
  ctx.bezierCurveTo(-length * 0.08, -height * 0.9, length * 0.5, -height * 0.6, length * 0.72, -height * 0.04);
  ctx.bezierCurveTo(length * 0.5, height * 0.62, -length * 0.08, height * 0.88, -length * 0.48, 0);
  ctx.fill();

  ctx.fillStyle = skin.palette.secondary;
  ctx.globalAlpha = 0.82;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.1, -height * 0.24);
  ctx.lineTo(radius * 0.42, -height * 1.15);
  ctx.lineTo(radius * 0.62, -height * 0.18);
  ctx.fill();
  ctx.globalAlpha = 1;

  drawPattern(ctx, skin, "shark", radius);
  ctx.fillStyle = "rgba(5,10,14,.52)";
  ctx.beginPath();
  ctx.ellipse(length * 0.48, radius * 0.18, radius * 0.42, radius * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  drawEye(ctx, length * 0.38, -height * 0.18, radius * 0.13);
}

export function drawEvoFishSkin(
  ctx: CanvasRenderingContext2D,
  skin: EvoFishSkinDefinition,
  form: EvoFishFormId,
  options: DrawSkinOptions
) {
  const { x, y, radius, angle, alpha = 1 } = options;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (form === "megalodon") ctx.scale(1.16, 1.12);
  if (form === "fish") fishShape(ctx, skin, radius);
  else sharkShape(ctx, skin, radius);
  ctx.restore();
}

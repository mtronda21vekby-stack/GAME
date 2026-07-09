const PATCH_KEY = "__evofish_fish_material_drawimage_patch__";

function shouldDecorateDrawImage(args: IArguments) {
  if (args.length < 5) return null;
  const dx = Number(args[1]);
  const dy = Number(args[2]);
  const dw = Number(args[3]);
  const dh = Number(args[4]);
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(dw) || !Number.isFinite(dh)) return null;
  const width = Math.abs(dw);
  const height = Math.abs(dh);
  const ratio = width / Math.max(1, height);
  if (width < 86 || height < 22 || ratio < 1.45 || ratio > 5.8) return null;
  return { dx, dy, dw, dh, width, height };
}

function decorateFishMaterial(ctx: CanvasRenderingContext2D, box: { dx: number; dy: number; dw: number; dh: number; width: number; height: number }) {
  const time = typeof performance !== "undefined" ? performance.now() : Date.now();
  const phase = Math.sin(time * 0.0034 + box.width * 0.017) * 0.5 + 0.5;
  const pulse = Math.sin(time * 0.006 + box.height * 0.09) * 0.5 + 0.5;
  const x = box.dx;
  const y = box.dy;
  const w = box.dw;
  const h = box.dh;
  const absW = Math.abs(w);
  const absH = Math.abs(h);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const bodyGlow = ctx.createLinearGradient(x - absW * 0.45, y - absH * 0.2, x + absW * 0.55, y + absH * 0.28);
  bodyGlow.addColorStop(0, `rgba(80,220,255,${0.045 + phase * 0.03})`);
  bodyGlow.addColorStop(0.45, `rgba(255,255,255,${0.085 + phase * 0.052})`);
  bodyGlow.addColorStop(0.72, `rgba(255,190,255,${0.045 + pulse * 0.04})`);
  bodyGlow.addColorStop(1, "rgba(70,160,255,0)");
  ctx.fillStyle = bodyGlow;
  ctx.beginPath();
  ctx.ellipse(x + w * (0.1 + phase * 0.18), y + h * 0.36, absW * 0.34, absH * 0.18, -0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.13 + pulse * 0.09;
  ctx.strokeStyle = "rgba(170,245,255,.92)";
  ctx.lineWidth = Math.max(1.05, absH * 0.032);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.18, y + h * 0.18);
  ctx.quadraticCurveTo(x + w * 0.44, y - h * 0.06, x + w * 0.74, y + h * 0.18);
  ctx.stroke();

  ctx.globalAlpha = 0.09 + phase * 0.075;
  ctx.strokeStyle = "rgba(255,255,255,.82)";
  ctx.lineWidth = Math.max(0.75, absH * 0.022);
  for (let i = 0; i < 2; i += 1) {
    const k = 0.36 + i * 0.22 + phase * 0.035;
    ctx.beginPath();
    ctx.moveTo(x + w * k, y + h * 0.26);
    ctx.lineTo(x + w * (k + 0.08), y + h * 0.68);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.065 + pulse * 0.065;
  ctx.fillStyle = "rgba(120,240,255,.70)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.08, y + h * 0.5, absW * 0.095, absH * (0.22 + pulse * 0.03), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function installFishMaterialPatch() {
  if (typeof CanvasRenderingContext2D === "undefined") return;
  const proto = CanvasRenderingContext2D.prototype as CanvasRenderingContext2D & Record<string, unknown>;
  if (proto[PATCH_KEY]) return;

  const drawImage = proto.drawImage as unknown as (this: CanvasRenderingContext2D, ...args: unknown[]) => void;
  proto.drawImage = function patchedDrawImage(this: CanvasRenderingContext2D, ...args: unknown[]) {
    drawImage.apply(this, args);
    const box = shouldDecorateDrawImage(arguments);
    if (box) decorateFishMaterial(this, box);
  } as unknown as CanvasRenderingContext2D["drawImage"];

  proto[PATCH_KEY] = true;
}

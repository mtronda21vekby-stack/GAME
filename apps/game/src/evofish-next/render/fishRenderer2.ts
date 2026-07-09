import type { NextFishEntity, NextRenderQuality } from "../core/engineTypes";
import { drawEvoFishSkin } from "./canvasSkinRenderer";

type FishRenderer2Options = {
  image: HTMLImageElement | null;
  radius: number;
  alpha: number;
  quality: NextRenderQuality;
  time: number;
};

function formScale(entity: NextFishEntity) {
  if (entity.form === "megalodon") return 5.3;
  if (entity.form === "shark") return 5.0;
  return 4.75;
}

function imageAspect(image: HTMLImageElement | null, entity: NextFishEntity) {
  if (image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
    return image.naturalHeight / Math.max(1, image.naturalWidth);
  }
  return entity.form === "fish" ? 0.42 : 0.38;
}

function facingLeft(entity: NextFishEntity) {
  return Math.cos(entity.angle || 0) < 0;
}

export function drawFishRenderer2(ctx: CanvasRenderingContext2D, entity: NextFishEntity, options: FishRenderer2Options) {
  const width = options.radius * formScale(entity);
  const height = width * imageAspect(options.image, entity);

  ctx.save();
  ctx.translate(entity.x, entity.y);
  // Stability lock: fish sprites stay horizontal so the eye never rotates downward/upside-down.
  if (facingLeft(entity)) ctx.scale(-1, 1);
  ctx.globalAlpha = options.alpha;

  if (options.image?.complete && options.image.naturalWidth > 0) {
    ctx.drawImage(options.image, -width * 0.5, -height * 0.5, width, height);
  } else {
    drawEvoFishSkin(ctx, entity.skin, entity.form, { x: 0, y: 0, radius: options.radius, angle: 0, alpha: 1 });
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

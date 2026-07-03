import type { NextAIState, NextCameraState, NextEngineState, NextFishEntity, NextViewport } from "../core/engineTypes";
import { resourceDef, type NextResourceNode } from "../content/resources";
import { NEXT_MAP_ZONES } from "../content/zones";
import { drawEvoFishSkin } from "./canvasSkinRenderer";
import { getNextCamera } from "../systems/cameraSystem";
import { canDevour } from "../systems/collisionSystem";

const spriteCache = new Map<string, HTMLImageElement>();

function isVisible(camera: NextCameraState, x: number, y: number, pad = 160) {
  return x >= camera.x - pad && x <= camera.x + camera.width + pad && y >= camera.y - pad && y <= camera.y + camera.height + pad;
}

function skinSpriteSource(entity: NextFishEntity) {
  return entity.skin.assetPath || entity.skin.image || "";
}

function getSprite(src: string) {
  if (!src || typeof Image === "undefined") return null;
  const cached = spriteCache.get(src);
  if (cached) return cached;

  const img = new Image();
  img.decoding = "async";
  img.src = src;
  spriteCache.set(src, img);
  return img;
}

function drawSpriteSkin(ctx: CanvasRenderingContext2D, entity: NextFishEntity, alpha: number) {
  const src = skinSpriteSource(entity);
  const img = getSprite(src);
  if (!img || !img.complete || img.naturalWidth <= 0) return false;

  const formScale = entity.form === "megalodon" ? 5.3 : entity.form === "shark" ? 5.0 : 4.75;
  const width = entity.radius * formScale;
  const height = width * (img.naturalHeight / Math.max(1, img.naturalWidth));

  ctx.save();
  ctx.translate(entity.x, entity.y);
  ctx.rotate(entity.angle);
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, -width * 0.5, -height * 0.5, width, height);
  ctx.globalAlpha = 1;
  ctx.restore();
  return true;
}

function drawEntitySkin(ctx: CanvasRenderingContext2D, entity: NextFishEntity, alpha: number) {
  if (drawSpriteSkin(ctx, entity, alpha)) return;
  drawEvoFishSkin(ctx, entity.skin, entity.form, {
    x: entity.x,
    y: entity.y,
    radius: entity.radius,
    angle: entity.angle,
    alpha
  });
}

function eventColor(kind?: string) {
  if (kind === "hunt_pack") return "rgba(255,120,90,.30)";
  if (kind === "safe_spring") return "rgba(110,255,180,.26)";
  return "rgba(255,220,120,.28)";
}

function drawWorldBackground(ctx: CanvasRenderingContext2D, state: NextEngineState, camera: NextCameraState, viewport: NextViewport) {
  const g = ctx.createLinearGradient(0, 0, 0, viewport.height);
  g.addColorStop(0, "#06304a");
  g.addColorStop(1, "#020b15");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  ctx.save();
  ctx.scale(camera.scale, camera.scale);
  ctx.translate(-camera.x, -camera.y);
  ctx.strokeStyle = "rgba(150,230,255,.055)";
  ctx.lineWidth = 1 / camera.scale;

  const startX = Math.max(0, Math.floor(camera.x / 120) * 120);
  const endX = Math.min(state.config.width, camera.x + camera.width + 120);
  const startY = Math.max(0, Math.floor(camera.y / 120) * 120);
  const endY = Math.min(state.config.height, camera.y + camera.height + 120);

  for (let x = startX; x <= endX; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, Math.max(0, camera.y - 120));
    ctx.lineTo(x, Math.min(state.config.height, camera.y + camera.height + 120));
    ctx.stroke();
  }

  for (let y = startY; y <= endY; y += 120) {
    ctx.beginPath();
    ctx.moveTo(Math.max(0, camera.x - 120), y);
    ctx.lineTo(Math.min(state.config.width, camera.x + camera.width + 120), y);
    ctx.stroke();
  }

  for (const zone of NEXT_MAP_ZONES) {
    if (!isVisible(camera, zone.x, zone.y, zone.radius + 180)) continue;
    ctx.fillStyle = zone.color;
    ctx.strokeStyle = zone.id === state.stats.zoneId ? "rgba(255,255,255,.34)" : "rgba(255,255,255,.12)";
    ctx.lineWidth = (zone.id === state.stats.zoneId ? 4 : 2) / camera.scale;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if ((viewport.quality || "balanced") !== "low") {
      ctx.textAlign = "center";
      ctx.font = "900 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "rgba(231,242,255,.30)";
      ctx.fillText(zone.name.toUpperCase(), zone.x, zone.y - zone.radius * 0.12);
    }
  }

  ctx.strokeStyle = "rgba(150,230,255,.16)";
  ctx.lineWidth = 3 / camera.scale;
  ctx.strokeRect(0, 0, state.config.width, state.config.height);
  ctx.restore();
}

function aiColor(state: NextAIState) {
  if (state === "attack") return "rgba(255,80,80,.48)";
  if (state === "hunt") return "rgba(255,180,90,.42)";
  if (state === "flee") return "rgba(110,255,180,.38)";
  return "rgba(150,230,255,.18)";
}

function drawApexFrame(ctx: CanvasRenderingContext2D, enemy: NextFishEntity) {
  if (enemy.aiType !== "apex" && enemy.aiType !== "leviathan") return;

  ctx.save();
  ctx.strokeStyle = enemy.aiType === "leviathan" ? "rgba(180,140,255,.50)" : "rgba(255,220,120,.50)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius * 2.55, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,90,90,.34)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius * 3.05, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.font = "1000 16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = enemy.aiType === "leviathan" ? "rgba(220,205,255,.96)" : "rgba(255,240,180,.95)";
  ctx.fillText(enemy.aiType === "leviathan" ? "LEVIATHAN" : "APEX", enemy.x, enemy.y - enemy.radius * 3.2);
  ctx.restore();
}

function drawAiRing(ctx: CanvasRenderingContext2D, enemy: NextFishEntity, quality: string) {
  drawApexFrame(ctx, enemy);
  if (quality === "low" && enemy.aiState === "wander" && enemy.aiType !== "apex" && enemy.aiType !== "leviathan") return;

  ctx.strokeStyle = enemy.aiType === "apex" || enemy.aiType === "leviathan" ? "rgba(255,220,120,.42)" : aiColor(enemy.aiState);
  ctx.lineWidth = enemy.aiType === "apex" || enemy.aiType === "leviathan" ? 4 : enemy.aiState === "attack" ? 4 : enemy.aiState === "hunt" ? 3 : 2;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius * (enemy.aiType === "apex" || enemy.aiType === "leviathan" ? 2.05 : enemy.aiState === "attack" ? 2.2 : 1.85), 0, Math.PI * 2);
  ctx.stroke();

  if (enemy.aiState === "hunt" || enemy.aiState === "attack") {
    ctx.fillStyle = enemy.aiType === "apex" || enemy.aiType === "leviathan" ? "rgba(255,220,120,.72)" : aiColor(enemy.aiState);
    ctx.beginPath();
    ctx.arc(enemy.x + Math.cos(enemy.angle) * enemy.radius * 1.8, enemy.y + Math.sin(enemy.angle) * enemy.radius * 1.8, enemy.aiType === "apex" || enemy.aiType === "leviathan" ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHpBar(ctx: CanvasRenderingContext2D, entity: NextFishEntity, width: number) {
  const pct = Math.max(0, Math.min(1, entity.hp / entity.hpMax));
  const x = entity.x - width / 2;
  const y = entity.y - entity.radius * 2.15;
  ctx.fillStyle = "rgba(2,12,20,.64)";
  ctx.fillRect(x, y, width, 5);
  ctx.fillStyle = entity.aiType === "apex" || entity.aiType === "leviathan" ? "rgba(255,220,120,.92)" : pct > 0.45 ? "rgba(110,255,180,.88)" : "rgba(255,90,90,.9)";
  ctx.fillRect(x, y, width * pct, 5);
}

function drawEvents(ctx: CanvasRenderingContext2D, state: NextEngineState, camera: NextCameraState, quality: string) {
  if (!state.events?.length) return;

  for (const event of state.events) {
    if (!isVisible(camera, event.x, event.y, event.radius + 160)) continue;
    const pct = Math.max(0, Math.min(1, event.progress / Math.max(1, event.target)));

    ctx.fillStyle = eventColor(event.kind);
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(event.x, event.y, event.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,243,160,.82)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(event.x, event.y, event.radius + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.stroke();

    if (quality !== "low") {
      ctx.textAlign = "center";
      ctx.font = "1000 22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,.62)";
      ctx.fillText(event.name.toUpperCase(), event.x, event.y);
    }
  }
}

function drawPearlPickup(ctx: CanvasRenderingContext2D, node: NextResourceNode, pulse: number) {
  const r = node.radius;
  const shell = ctx.createRadialGradient(node.x - r * 0.35, node.y - r * 0.35, r * 0.2, node.x, node.y, r * 1.25);
  shell.addColorStop(0, "#ffffff");
  shell.addColorStop(0.46, "#fff3a0");
  shell.addColorStop(1, "#b88b32");

  ctx.save();
  ctx.translate(node.x, node.y);
  ctx.rotate(Math.sin(node.pulse) * 0.16);
  ctx.fillStyle = "rgba(255,220,120,.23)";
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.08 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(-node.x, -node.y);
  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.ellipse(node.x, node.y, r * 1.05, r * 0.82, -0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.72)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = "rgba(130,90,24,.24)";
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.ellipse(node.x + i * r * 0.18, node.y + r * 0.08, r * 0.15, r * 0.66, -0.12, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,.86)";
  ctx.beginPath();
  ctx.arc(node.x - r * 0.28, node.y - r * 0.26, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCrystalPickup(ctx: CanvasRenderingContext2D, node: NextResourceNode, pulse: number) {
  const r = node.radius;
  const g = ctx.createLinearGradient(node.x - r, node.y - r, node.x + r, node.y + r);
  g.addColorStop(0, "#d8fbff");
  g.addColorStop(0.38, "#8fe8ff");
  g.addColorStop(0.72, "#b48cff");
  g.addColorStop(1, "#5a5cff");

  ctx.save();
  ctx.translate(node.x, node.y);
  ctx.rotate(Math.sin(node.pulse * 0.7) * 0.2);
  ctx.fillStyle = "rgba(190,140,255,.24)";
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.2 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.15);
  ctx.lineTo(r * 0.95, -r * 0.18);
  ctx.lineTo(r * 0.58, r * 1.05);
  ctx.lineTo(-r * 0.58, r * 1.05);
  ctx.lineTo(-r * 0.95, -r * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.72)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,.32)";
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.15);
  ctx.lineTo(0, r * 1.05);
  ctx.moveTo(-r * 0.95, -r * 0.18);
  ctx.lineTo(r * 0.95, -r * 0.18);
  ctx.stroke();
  ctx.restore();
}

function drawOrbPickup(ctx: CanvasRenderingContext2D, node: NextResourceNode, fill: string, glow: string, pulse: number) {
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(node.x, node.y, node.radius * 2.15 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(node.x, node.y, node.radius + pulse * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.beginPath();
  ctx.arc(node.x - node.radius * 0.28, node.y - node.radius * 0.34, node.radius * 0.24, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,.55)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawResources(ctx: CanvasRenderingContext2D, state: NextEngineState, camera: NextCameraState, quality: string) {
  for (const node of state.resources) {
    if (node.respawnT > 0 || !isVisible(camera, node.x, node.y, 60)) continue;
    const def = resourceDef(node.kind);
    const pulse = Math.sin(node.pulse) * 2;

    if (node.kind === "pearls") {
      drawPearlPickup(ctx, node, pulse);
      continue;
    }

    if (node.kind === "coral") {
      drawCrystalPickup(ctx, node, pulse);
      continue;
    }

    drawOrbPickup(ctx, node, def.color, quality !== "low" ? def.glow : "rgba(255,255,255,.06)", pulse);
  }
}

function drawCombatAura(ctx: CanvasRenderingContext2D, state: NextEngineState) {
  const player = state.player;

  if (player.downed || player.dead) {
    ctx.strokeStyle = "rgba(255,120,120,.42)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 2.35, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (state.craft.barrierT > 0) {
    ctx.strokeStyle = "rgba(255,240,160,.50)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 2.38, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.invulnT > 0) {
    ctx.strokeStyle = "rgba(120,240,255,.38)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 2.05, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.dashT > 0) {
    ctx.strokeStyle = "rgba(120,240,255,.42)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 2.25, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.biteCd > 0.25) {
    ctx.strokeStyle = state.craft.biteBoostT > 0 ? "rgba(255,220,120,.48)" : "rgba(255,255,255,.34)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(player.angle) * player.radius * 1.25, player.y + Math.sin(player.angle) * player.radius * 1.25, player.radius * 1.35, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawFloatText(ctx: CanvasRenderingContext2D, state: NextEngineState) {
  ctx.textAlign = "center";
  ctx.font = "900 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

  for (const float of state.floats) {
    const alpha = Math.max(0, Math.min(1, float.ttl / 0.75));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = float.kind === "kill" ? "#fff3a0" : float.kind === "danger" ? "#ff7878" : "#e7f2ff";
    ctx.fillText(float.text, float.x, float.y);
  }

  ctx.globalAlpha = 1;
}

function mapX(state: NextEngineState, x: number, left: number, width: number) {
  return left + (x / state.config.width) * width;
}

function mapY(state: NextEngineState, y: number, top: number, height: number) {
  return top + (y / state.config.height) * height;
}

function drawMapDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke?: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawMiniMap(ctx: CanvasRenderingContext2D, state: NextEngineState, camera: NextCameraState, viewport: NextViewport) {
  const sonar = state.craft.sonarT > 0;
  const mapW = Math.min(sonar ? 168 : 150, Math.max(112, viewport.width * (sonar ? 0.2 : 0.18)));
  const mapH = Math.round(mapW * (state.config.height / state.config.width));
  const left = Math.max(12, viewport.width - mapW - 12);
  const top = Math.min(Math.max(58, viewport.height * 0.08), viewport.height - mapH - 16);
  const apex = state.enemies.find((enemy) => enemy.aiType === "apex" || enemy.aiType === "leviathan");

  ctx.save();
  ctx.fillStyle = "rgba(2,16,27,.68)";
  ctx.strokeStyle = sonar ? "rgba(255,220,120,.36)" : "rgba(150,230,255,.18)";
  ctx.lineWidth = 1;
  ctx.fillRect(left, top, mapW, mapH);
  ctx.strokeRect(left, top, mapW, mapH);

  ctx.fillStyle = "rgba(150,230,255,.06)";
  for (let gx = 1; gx < 4; gx += 1) ctx.fillRect(left + (mapW / 4) * gx, top, 1, mapH);
  for (let gy = 1; gy < 3; gy += 1) ctx.fillRect(left, top + (mapH / 3) * gy, mapW, 1);

  for (const zone of NEXT_MAP_ZONES) {
    drawMapDot(ctx, mapX(state, zone.x, left, mapW), mapY(state, zone.y, top, mapH), zone.id === state.stats.zoneId ? 3.6 : 2.6, zone.color, zone.id === state.stats.zoneId ? "rgba(255,255,255,.68)" : undefined);
  }

  for (const event of state.events || []) {
    drawMapDot(ctx, mapX(state, event.x, left, mapW), mapY(state, event.y, top, mapH), 4.2, eventColor(event.kind), "rgba(255,255,255,.68)");
  }

  for (const node of state.resources.slice(0, 18)) {
    if (node.respawnT > 0) continue;
    const def = resourceDef(node.kind);
    drawMapDot(ctx, mapX(state, node.x, left, mapW), mapY(state, node.y, top, mapH), node.kind === "coral" ? 2.5 : node.kind === "pearls" ? 2.2 : 1.7, def.color);
  }

  const camX = left + (camera.x / state.config.width) * mapW;
  const camY = top + (camera.y / state.config.height) * mapH;
  const camW = (camera.width / state.config.width) * mapW;
  const camH = (camera.height / state.config.height) * mapH;
  ctx.strokeStyle = "rgba(255,255,255,.24)";
  ctx.lineWidth = 1;
  ctx.strokeRect(camX, camY, camW, camH);

  const threatDots = state.enemies
    .filter((enemy) => enemy.aiType !== "apex")
    .sort((a, b) => Math.hypot(a.x - state.player.x, a.y - state.player.y) - Math.hypot(b.x - state.player.x, b.y - state.player.y))
    .slice(0, sonar ? 34 : 18);

  for (const enemy of threatDots) {
    const ex = mapX(state, enemy.x, left, mapW);
    const ey = mapY(state, enemy.y, top, mapH);
    const fill = enemy.aiType === "leviathan" ? "rgba(180,140,255,.84)" : enemy.aiType === "brute" ? "rgba(255,110,110,.78)" : enemy.aiType === "hunter" || enemy.aiType === "stalker" ? "rgba(255,180,90,.74)" : sonar ? "rgba(120,240,255,.70)" : "rgba(150,230,255,.48)";
    drawMapDot(ctx, ex, ey, enemy.aiType === "brute" || enemy.aiType === "leviathan" ? 3 : 2.2, fill);
  }

  if (apex) {
    const ax = mapX(state, apex.x, left, mapW);
    const ay = mapY(state, apex.y, top, mapH);
    const px = mapX(state, state.player.x, left, mapW);
    const py = mapY(state, state.player.y, top, mapH);
    ctx.strokeStyle = sonar ? "rgba(255,240,160,.70)" : "rgba(255,220,120,.42)";
    ctx.lineWidth = sonar ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    drawMapDot(ctx, ax, ay, sonar ? 6 : 5, apex.aiType === "leviathan" ? "rgba(180,140,255,.95)" : "rgba(255,220,120,.95)", "rgba(255,90,90,.85)");
  }

  drawMapDot(ctx, mapX(state, state.player.x, left, mapW), mapY(state, state.player.y, top, mapH), 4.5, "rgba(110,255,180,.95)", "rgba(255,255,255,.72)");

  ctx.textAlign = "left";
  ctx.font = "900 10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "rgba(231,242,255,.78)";
  ctx.fillText(sonar ? `SONAR · ${state.stats.zoneName}` : state.stats.zoneName || "MAP", left + 8, top + 14);
  ctx.restore();
}

export function renderNextWorld(ctx: CanvasRenderingContext2D, state: NextEngineState, viewport: NextViewport) {
  const camera = getNextCamera(state, viewport);
  const playerDowned = Boolean(state.player.downed || state.player.dead);
  const quality = viewport.quality || "balanced";

  drawWorldBackground(ctx, state, camera, viewport);

  ctx.save();
  ctx.scale(camera.scale, camera.scale);
  ctx.translate(-camera.x, -camera.y);

  drawEvents(ctx, state, camera, quality);
  drawResources(ctx, state, camera, quality);

  const visibleEnemies = state.enemies.filter((enemy) => isVisible(camera, enemy.x, enemy.y, enemy.radius * 4));
  for (const enemy of visibleEnemies) {
    const safeToEat = canDevour(state.player.mass, enemy.mass);
    drawAiRing(ctx, enemy, quality);
    ctx.strokeStyle = enemy.aiType === "apex" || enemy.aiType === "leviathan" ? "rgba(255,220,120,.30)" : safeToEat ? "rgba(110,255,180,.24)" : "rgba(255,90,90,.32)";
    ctx.lineWidth = enemy.hitT > 0 ? 4 : 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius * 1.52, 0, Math.PI * 2);
    ctx.stroke();
    drawEntitySkin(ctx, enemy, enemy.hitT > 0 ? 0.55 : safeToEat ? 0.82 : 0.92);
    if (quality !== "low" || enemy.aiType === "apex" || enemy.aiType === "leviathan") {
      drawHpBar(ctx, enemy, enemy.radius * (enemy.aiType === "apex" || enemy.aiType === "leviathan" ? 4.1 : 2.8));
    }
  }

  drawCombatAura(ctx, state);
  drawEntitySkin(ctx, state.player, playerDowned ? 0.34 : state.player.hitT > 0 ? 0.68 : 1);
  drawHpBar(ctx, state.player, state.player.radius * 3.2);
  drawFloatText(ctx, state);

  ctx.restore();
  drawMiniMap(ctx, state, camera, viewport);
}

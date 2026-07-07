import type { NextAIState, NextCameraState, NextEngineState, NextFishEntity, NextViewport } from "../core/engineTypes";
import type { NextResourceNode } from "../content/resources";
import { getZonesForWorld } from "../content/zones";
import { darkCavePortalPosition, darkCavePortalUnlocked, DARK_CAVE_ARTIFACTS_REQUIRED, getResourceVisual, getWaterThemeForLevel, oceanReturnPortalPosition } from "../assets/visuals/visualCatalog";
import { drawEvoFishSkin } from "./canvasSkinRenderer";
import { getNextCamera } from "../systems/cameraSystem";
import { canPlayerDevour, npcLevelGap } from "../systems/collisionSystem";
import { visualRadiusForFish } from "../content/fishHitbox";

const spriteCache = new Map<string, HTMLImageElement>();

type CombatReadability = {
  id: "eat" | "fight" | "danger" | "run" | "boss";
  label: string;
  sub: string;
  ring: string;
  fill: string;
  badge: string;
  text: string;
  priority: number;
};

function isVisible(camera: NextCameraState, x: number, y: number, pad = 160) {
  return x >= camera.x - pad && x <= camera.x + camera.width + pad && y >= camera.y - pad && y <= camera.y + camera.height + pad;
}

function entityVisualRadius(entity: NextFishEntity) {
  return visualRadiusForFish(entity.form, entity.mass, entity.aiType);
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

function drawEntitySkin(ctx: CanvasRenderingContext2D, entity: NextFishEntity, alpha: number) {
  const src = skinSpriteSource(entity);
  const img = getSprite(src);
  const radius = entityVisualRadius(entity);

  ctx.save();
  ctx.translate(entity.x, entity.y);
  ctx.rotate(entity.angle);
  ctx.globalAlpha = alpha;

  if (img?.complete && img.naturalWidth > 0) {
    const formScale = entity.form === "megalodon" ? 5.3 : entity.form === "shark" ? 5.0 : 4.75;
    const width = radius * formScale;
    const height = width * (img.naturalHeight / Math.max(1, img.naturalWidth));
    ctx.drawImage(img, -width * 0.5, -height * 0.5, width, height);
  } else {
    ctx.restore();
    drawEvoFishSkin(ctx, entity.skin, entity.form, { x: entity.x, y: entity.y, radius, angle: entity.angle, alpha });
    return;
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function npcDisplayLevel(enemy: NextFishEntity) {
  return Math.max(1, Math.floor(enemy.npcLevel || Math.max(1, Math.round(enemy.mass * 4))));
}

function isBoss(enemy: NextFishEntity) {
  return enemy.aiType === "apex" || enemy.aiType === "leviathan";
}

function isPredator(enemy: NextFishEntity) {
  return enemy.aiType === "hunter" || enemy.aiType === "brute" || enemy.aiType === "stalker" || isBoss(enemy);
}

function combatReadability(state: NextEngineState, enemy: NextFishEntity): CombatReadability {
  const gap = npcLevelGap(state.player, enemy);
  const massRatio = enemy.mass / Math.max(0.5, state.player.mass);
  const canEat = canPlayerDevour(state.player, enemy);

  if (isBoss(enemy)) {
    return { id: "boss", label: "BOSS", sub: "держи дистанцию", ring: "rgba(180,140,255,.82)", fill: "rgba(180,140,255,.14)", badge: "rgba(36,16,74,.88)", text: "rgba(230,210,255,.98)", priority: 5 };
  }

  if (canEat) {
    return { id: "eat", label: "EAT", sub: "можно съесть", ring: "rgba(90,255,170,.95)", fill: "rgba(90,255,170,.12)", badge: "rgba(8,54,34,.88)", text: "rgba(130,255,190,.98)", priority: 1 };
  }

  if (gap >= 7 || massRatio >= 1.22) {
    return { id: "run", label: "RUN", sub: "слишком силён", ring: "rgba(255,78,92,.95)", fill: "rgba(255,78,92,.13)", badge: "rgba(68,8,18,.9)", text: "rgba(255,150,150,.98)", priority: 4 };
  }

  if (gap >= 3 || massRatio >= 1.06 || isPredator(enemy)) {
    return { id: "danger", label: "DANGER", sub: "опасно", ring: "rgba(255,176,72,.95)", fill: "rgba(255,176,72,.13)", badge: "rgba(66,38,8,.88)", text: "rgba(255,214,120,.98)", priority: 3 };
  }

  return { id: "fight", label: "FIGHT", sub: "можно бить", ring: "rgba(255,240,130,.92)", fill: "rgba(255,240,130,.10)", badge: "rgba(58,52,10,.88)", text: "rgba(255,244,170,.98)", priority: 2 };
}

function aiColor(state: NextAIState) {
  if (state === "attack") return "rgba(255,80,80,.56)";
  if (state === "ambush") return "rgba(255,90,170,.50)";
  if (state === "hunt") return "rgba(255,180,90,.46)";
  if (state === "flee" || state === "regroup") return "rgba(110,255,180,.40)";
  if (state === "guard") return "rgba(255,240,130,.36)";
  return "rgba(150,230,255,.18)";
}

function drawWorldBackground(ctx: CanvasRenderingContext2D, state: NextEngineState, camera: NextCameraState, viewport: NextViewport) {
  const theme = getWaterThemeForLevel(state.player.level, state.worldId === "dark_cave");
  const g = ctx.createLinearGradient(0, 0, 0, viewport.height);
  g.addColorStop(0, theme.top);
  g.addColorStop(1, theme.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  ctx.save();
  ctx.scale(camera.scale, camera.scale);
  ctx.translate(-camera.x, -camera.y);
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1 / camera.scale;

  const grid = state.worldId === "dark_cave" ? 150 : 120;
  const startX = Math.max(0, Math.floor(camera.x / grid) * grid);
  const endX = Math.min(state.config.width, camera.x + camera.width + grid);
  const startY = Math.max(0, Math.floor(camera.y / grid) * grid);
  const endY = Math.min(state.config.height, camera.y + camera.height + grid);

  for (let x = startX; x <= endX; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, Math.max(0, camera.y - grid));
    ctx.lineTo(x, Math.min(state.config.height, camera.y + camera.height + grid));
    ctx.stroke();
  }

  for (let y = startY; y <= endY; y += grid) {
    ctx.beginPath();
    ctx.moveTo(Math.max(0, camera.x - grid), y);
    ctx.lineTo(Math.min(state.config.width, camera.x + camera.width + grid), y);
    ctx.stroke();
  }

  for (const zone of getZonesForWorld(state.worldId || "main_reef")) {
    if (!isVisible(camera, zone.x, zone.y, zone.radius + 180)) continue;
    ctx.fillStyle = zone.color;
    ctx.strokeStyle = zone.id === state.stats.zoneId ? "rgba(255,255,255,.38)" : "rgba(255,255,255,.12)";
    ctx.lineWidth = (zone.id === state.stats.zoneId ? 4 : 2) / camera.scale;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if ((viewport.quality || "balanced") !== "low") {
      ctx.textAlign = "center";
      ctx.font = "900 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "rgba(231,242,255,.28)";
      ctx.fillText(zone.name.toUpperCase(), zone.x, zone.y - zone.radius * 0.12);
    }
  }

  drawPortal(ctx, state, camera, viewport.quality || "balanced");
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 3 / camera.scale;
  ctx.strokeRect(0, 0, state.config.width, state.config.height);
  ctx.restore();
}

function drawPortal(ctx: CanvasRenderingContext2D, state: NextEngineState, camera: NextCameraState, quality: string) {
  const portal = state.worldId === "dark_cave" ? oceanReturnPortalPosition(state.config) : darkCavePortalPosition(state.config);
  const unlocked = state.worldId === "dark_cave" || darkCavePortalUnlocked(state.stats.artifactsFound || 0, state.player.level);
  if (state.worldId !== "dark_cave" && !unlocked && (state.stats.artifactsFound || 0) <= 0 && state.player.level < 8) return;
  if (!isVisible(camera, portal.x, portal.y, portal.radius + 220)) return;

  const pulse = Math.sin(state.frame * 0.045) * 0.5 + 0.5;
  const outer = portal.radius + pulse * 14;
  ctx.save();
  ctx.translate(portal.x, portal.y);
  const aura = ctx.createRadialGradient(0, 0, 6, 0, 0, outer * 1.8);
  aura.addColorStop(0, unlocked ? "rgba(190,140,255,.72)" : "rgba(130,120,170,.34)");
  aura.addColorStop(0.55, unlocked ? "rgba(90,60,210,.28)" : "rgba(90,90,120,.16)");
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, outer * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = unlocked ? "rgba(18,8,42,.92)" : "rgba(28,30,46,.78)";
  ctx.strokeStyle = unlocked ? "rgba(255,220,120,.78)" : "rgba(190,190,220,.28)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 0, outer * 0.82, outer, 0.06 * Math.sin(state.frame * 0.02), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (quality !== "low") {
    ctx.textAlign = "center";
    ctx.font = "1000 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = unlocked ? "rgba(255,243,160,.92)" : "rgba(231,242,255,.55)";
    ctx.fillText(state.worldId === "dark_cave" ? "OCEAN GATE" : unlocked ? "DARK CAVE" : `АРТЕФАКТЫ ${state.stats.artifactsFound || 0}/${DARK_CAVE_ARTIFACTS_REQUIRED}`, 0, -outer - 28);
  }
  ctx.restore();
}

function drawResource(ctx: CanvasRenderingContext2D, node: NextResourceNode, quality: string) {
  const visual = getResourceVisual(node.kind);
  const pulse = Math.sin(node.pulse) * 2;
  ctx.save();
  ctx.fillStyle = quality === "low" ? "rgba(255,255,255,.08)" : visual.glow;
  ctx.beginPath();
  ctx.arc(node.x, node.y, node.radius * 2.15 + pulse, 0, Math.PI * 2);
  ctx.fill();

  if (node.kind === "coral" || node.kind === "artifact_shell") {
    ctx.translate(node.x, node.y);
    ctx.rotate(Math.sin(node.pulse * 0.6) * 0.2);
    ctx.fillStyle = visual.color;
    ctx.beginPath();
    ctx.moveTo(0, -node.radius * 1.15);
    ctx.lineTo(node.radius, -node.radius * 0.18);
    ctx.lineTo(node.radius * 0.58, node.radius * 1.05);
    ctx.lineTo(-node.radius * 0.58, node.radius * 1.05);
    ctx.lineTo(-node.radius, -node.radius * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.66)";
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.fillStyle = visual.color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius + pulse * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.58)";
    ctx.beginPath();
    ctx.arc(node.x - node.radius * 0.28, node.y - node.radius * 0.34, node.radius * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawResources(ctx: CanvasRenderingContext2D, state: NextEngineState, camera: NextCameraState, quality: string) {
  for (const node of state.resources) {
    if (node.respawnT > 0 || !isVisible(camera, node.x, node.y, 70)) continue;
    drawResource(ctx, node, quality);
  }
}

function drawEvents(ctx: CanvasRenderingContext2D, state: NextEngineState, camera: NextCameraState, quality: string) {
  if (!state.events?.length) return;
  for (const event of state.events) {
    if (!isVisible(camera, event.x, event.y, event.radius + 160)) continue;
    const pct = Math.max(0, Math.min(1, event.progress / Math.max(1, event.target)));
    ctx.fillStyle = event.kind === "hunt_pack" ? "rgba(255,120,90,.30)" : event.kind === "safe_spring" ? "rgba(110,255,180,.26)" : "rgba(255,220,120,.28)";
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

function drawHpBar(ctx: CanvasRenderingContext2D, entity: NextFishEntity, width: number) {
  const pct = Math.max(0, Math.min(1, entity.hp / Math.max(1, entity.hpMax)));
  const x = entity.x - width / 2;
  const y = entity.y - entityVisualRadius(entity) * 2.15;
  ctx.fillStyle = "rgba(2,12,20,.64)";
  ctx.fillRect(x, y, width, 5);
  ctx.fillStyle = isBoss(entity) ? "rgba(255,220,120,.92)" : pct > 0.45 ? "rgba(110,255,180,.88)" : "rgba(255,90,90,.9)";
  ctx.fillRect(x, y, width * pct, 5);
}

function drawReadabilityRing(ctx: CanvasRenderingContext2D, state: NextEngineState, enemy: NextFishEntity, quality: string) {
  const info = combatReadability(state, enemy);
  const radius = entityVisualRadius(enemy);
  const boss = isBoss(enemy);
  const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
  if (quality === "low" && !boss && distance > 480 && info.id !== "eat" && enemy.aiState !== "attack") return;

  ctx.save();
  ctx.fillStyle = info.fill;
  ctx.strokeStyle = info.ring;
  ctx.lineWidth = boss ? 5 : info.id === "run" || info.id === "eat" ? 4 : 3;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, radius * (boss ? 2.42 : info.id === "run" ? 2.2 : 1.82), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = aiColor(enemy.aiState);
  ctx.lineWidth = enemy.aiState === "attack" || enemy.aiState === "ambush" ? 4 : 2;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, radius * (enemy.aiState === "attack" ? 2.55 : enemy.aiState === "ambush" ? 2.35 : 2.0), 0, Math.PI * 2);
  ctx.stroke();

  if (enemy.aiState === "hunt" || enemy.aiState === "attack" || enemy.aiState === "ambush") {
    ctx.fillStyle = info.ring;
    ctx.beginPath();
    ctx.arc(enemy.x + Math.cos(enemy.angle) * radius * 1.9, enemy.y + Math.sin(enemy.angle) * radius * 1.9, boss ? 7 : 4.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawReadabilityBadge(ctx: CanvasRenderingContext2D, state: NextEngineState, enemy: NextFishEntity, quality: string) {
  const info = combatReadability(state, enemy);
  const boss = isBoss(enemy);
  const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
  if (quality === "low" && !boss && distance > 440 && info.id !== "eat") return;

  const text = `${info.label} · LV ${npcDisplayLevel(enemy)}`;
  const y = enemy.y - entityVisualRadius(enemy) * (boss ? 4.05 : 3.18) - 8;

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = boss ? "1000 15px system-ui, -apple-system, BlinkMacSystemFont, sans-serif" : "950 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  const width = Math.max(boss ? 112 : 82, ctx.measureText(text).width + 18);
  const height = boss ? 25 : 20;
  const x = enemy.x - width / 2;
  ctx.fillStyle = info.badge;
  ctx.strokeStyle = info.ring;
  ctx.lineWidth = boss ? 2 : 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y - height * 0.5, width, height, height / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = info.text;
  ctx.fillText(text, enemy.x, y + 4);

  if (quality === "high" || boss || distance < 320) {
    ctx.font = "850 10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "rgba(231,242,255,.72)";
    ctx.fillText(info.sub, enemy.x, y + height * 0.88 + 8);
  }
  ctx.restore();
}

function drawApexFrame(ctx: CanvasRenderingContext2D, enemy: NextFishEntity) {
  if (!isBoss(enemy)) return;
  const radius = entityVisualRadius(enemy);
  ctx.save();
  ctx.strokeStyle = enemy.aiType === "leviathan" ? "rgba(180,140,255,.55)" : "rgba(255,220,120,.55)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, radius * 2.8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,90,90,.36)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, radius * 3.28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = "1000 16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = enemy.aiType === "leviathan" ? "rgba(220,205,255,.96)" : "rgba(255,240,180,.95)";
  ctx.fillText(enemy.aiType === "leviathan" ? "LEVIATHAN" : "APEX", enemy.x, enemy.y - radius * 3.45);
  ctx.restore();
}

function drawCombatAura(ctx: CanvasRenderingContext2D, state: NextEngineState) {
  const player = state.player;
  const radius = entityVisualRadius(player);
  ctx.save();

  if (player.downed || player.dead) {
    ctx.strokeStyle = "rgba(255,120,120,.42)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius * 2.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (state.craft.barrierT > 0) {
    ctx.strokeStyle = "rgba(255,240,160,.50)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius * 2.38, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.invulnT > 0) {
    ctx.strokeStyle = "rgba(120,240,255,.42)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius * 2.05, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.dashT > 0 || player.biteCd > 0.25) {
    const biteX = player.x + Math.cos(player.angle) * radius * 1.35;
    const biteY = player.y + Math.sin(player.angle) * radius * 1.35;
    ctx.strokeStyle = state.craft.biteBoostT > 0 ? "rgba(255,220,120,.58)" : "rgba(255,255,255,.42)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(biteX, biteY, radius * 1.45, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
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
  const mapW = Math.min(150, Math.max(112, viewport.width * 0.18));
  const mapH = Math.round(mapW * (state.config.height / state.config.width));
  const left = Math.max(12, viewport.width - mapW - 12);
  const top = Math.min(Math.max(58, viewport.height * 0.08), viewport.height - mapH - 16);
  ctx.save();
  ctx.fillStyle = "rgba(2,16,27,.68)";
  ctx.strokeStyle = "rgba(150,230,255,.18)";
  ctx.lineWidth = 1;
  ctx.fillRect(left, top, mapW, mapH);
  ctx.strokeRect(left, top, mapW, mapH);

  for (const enemy of state.enemies.slice(0, 42)) {
    const info = combatReadability(state, enemy);
    drawMapDot(ctx, mapX(state, enemy.x, left, mapW), mapY(state, enemy.y, top, mapH), isBoss(enemy) ? 5 : info.id === "run" ? 3 : 2.2, info.ring);
  }

  drawMapDot(ctx, mapX(state, state.player.x, left, mapW), mapY(state, state.player.y, top, mapH), 4.5, "rgba(110,255,180,.95)", "rgba(255,255,255,.72)");
  ctx.textAlign = "left";
  ctx.font = "900 10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "rgba(231,242,255,.78)";
  ctx.fillText(state.stats.zoneName || "MAP", left + 8, top + 14);
  ctx.restore();
}

function drawLoadingOverlay(ctx: CanvasRenderingContext2D, state: NextEngineState, viewport: NextViewport) {
  const progress = state.portalTransition?.active ? Math.max(0, Math.min(1, state.portalTransition.progress)) : 0;
  if (progress <= 0) return;
  const w = Math.min(440, viewport.width - 44);
  const h = 104;
  const x = (viewport.width - w) / 2;
  const y = (viewport.height - h) / 2;
  ctx.save();
  ctx.fillStyle = "rgba(1,4,10,.66)";
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  ctx.fillStyle = "rgba(2,16,27,.86)";
  ctx.strokeStyle = "rgba(190,140,255,.34)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 24);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = "1000 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "rgba(255,243,160,.94)";
  ctx.fillText(state.portalTransition?.message || "Загрузка", viewport.width / 2, y + 32);
  ctx.fillStyle = "rgba(255,255,255,.10)";
  ctx.fillRect(x + 22, y + 56, w - 44, 14);
  ctx.fillStyle = "#78f0ff";
  ctx.fillRect(x + 22, y + 56, (w - 44) * progress, 14);
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

  const visibleEnemies = state.enemies.filter((enemy) => isVisible(camera, enemy.x, enemy.y, entityVisualRadius(enemy) * 4.2));
  visibleEnemies.sort((a, b) => combatReadability(state, b).priority - combatReadability(state, a).priority);

  for (const enemy of visibleEnemies) {
    const radius = entityVisualRadius(enemy);
    const info = combatReadability(state, enemy);
    drawApexFrame(ctx, enemy);
    drawReadabilityRing(ctx, state, enemy, quality);
    drawEntitySkin(ctx, enemy, enemy.hitT > 0 ? 0.55 : info.id === "eat" ? 0.86 : 0.94);
    if (quality !== "low" || isBoss(enemy)) drawHpBar(ctx, enemy, radius * (isBoss(enemy) ? 4.1 : 2.8));
    drawReadabilityBadge(ctx, state, enemy, quality);
  }

  drawCombatAura(ctx, state);
  drawEntitySkin(ctx, state.player, playerDowned ? 0.34 : state.player.hitT > 0 ? 0.68 : 1);
  drawHpBar(ctx, state.player, entityVisualRadius(state.player) * 3.2);
  drawFloatText(ctx, state);

  ctx.restore();
  drawMiniMap(ctx, state, camera, viewport);
  drawLoadingOverlay(ctx, state, viewport);
}

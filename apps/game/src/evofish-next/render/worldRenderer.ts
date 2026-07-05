import type { NextAIState, NextCameraState, NextEngineState, NextFishEntity, NextViewport } from "../core/engineTypes";
import type { NextResourceNode } from "../content/resources";
import { getZonesForWorld } from "../content/zones";
import { darkCavePortalPosition, darkCavePortalUnlocked, DARK_CAVE_ARTIFACTS_REQUIRED, getResourceVisual, getWaterThemeForLevel, oceanReturnPortalPosition } from "../assets/visuals/visualCatalog";
import { drawEvoFishSkin } from "./canvasSkinRenderer";
import { getNextCamera } from "../systems/cameraSystem";
import { canDevour } from "../systems/collisionSystem";
import { visualRadiusForFish } from "../content/fishHitbox";

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

function entityVisualRadius(entity: NextFishEntity) {
  return visualRadiusForFish(entity.form, entity.mass, entity.aiType);
}

function drawSpriteSkin(ctx: CanvasRenderingContext2D, entity: NextFishEntity, alpha: number) {
  const src = skinSpriteSource(entity);
  const img = getSprite(src);
  if (!img || !img.complete || img.naturalWidth <= 0) return false;

  const formScale = entity.form === "megalodon" ? 5.3 : entity.form === "shark" ? 5.0 : 4.75;
  const width = entityVisualRadius(entity) * formScale;
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
    radius: entityVisualRadius(entity),
    angle: entity.angle,
    alpha
  });
}

function eventColor(kind?: string) {
  if (kind === "hunt_pack") return "rgba(255,120,90,.30)";
  if (kind === "safe_spring") return "rgba(110,255,180,.26)";
  return "rgba(255,220,120,.28)";
}

function drawWaterParticles(ctx: CanvasRenderingContext2D, state: NextEngineState, camera: NextCameraState, color: string) {
  const step = state.worldId === "dark_cave" ? 260 : 340;
  const startX = Math.max(0, Math.floor(camera.x / step) * step);
  const endX = Math.min(state.config.width, camera.x + camera.width + step);
  const startY = Math.max(0, Math.floor(camera.y / step) * step);
  const endY = Math.min(state.config.height, camera.y + camera.height + step);

  ctx.fillStyle = color;
  for (let x = startX; x <= endX; x += step) {
    for (let y = startY; y <= endY; y += step) {
      const wave = Math.sin((state.frame + x * 0.12 + y * 0.08) * 0.018);
      ctx.beginPath();
      ctx.arc(x + 70 * wave, y + 46 * Math.cos(wave), state.worldId === "dark_cave" ? 4.6 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPortalShape(ctx: CanvasRenderingContext2D, state: NextEngineState, x: number, y: number, radius: number, unlocked: boolean, label: string, quality: string) {
  const pulse = Math.sin(state.frame * 0.045) * 0.5 + 0.5;
  const outer = radius + pulse * 14;
  const inner = radius * 0.58 + pulse * 6;

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = unlocked ? 1 : 0.56;

  const aura = ctx.createRadialGradient(0, 0, inner * 0.25, 0, 0, outer * 1.75);
  aura.addColorStop(0, unlocked ? "rgba(190,140,255,.76)" : "rgba(130,120,170,.34)");
  aura.addColorStop(0.46, unlocked ? "rgba(90,60,210,.34)" : "rgba(90,90,120,.18)");
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, outer * 1.75, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(-inner * 0.22, -inner * 0.18, 6, 0, 0, outer);
  core.addColorStop(0, unlocked ? "rgba(255,243,160,.78)" : "rgba(220,220,240,.30)");
  core.addColorStop(0.28, unlocked ? "rgba(135,92,255,.92)" : "rgba(70,72,100,.72)");
  core.addColorStop(0.68, "rgba(8,4,22,.94)");
  core.addColorStop(1, "rgba(1,3,8,.98)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.ellipse(0, 0, outer * 0.82, outer, 0.06 * Math.sin(state.frame * 0.02), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = unlocked ? "rgba(255,220,120,.78)" : "rgba(190,190,220,.28)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 0, outer * 0.88, outer * 1.04, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = unlocked ? "rgba(120,240,255,.34)" : "rgba(120,240,255,.12)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(0, 0, inner + i * 18 + pulse * 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (quality !== "low") {
    ctx.textAlign = "center";
    ctx.font = "1000 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = unlocked ? "rgba(255,243,160,.92)" : "rgba(231,242,255,.55)";
    ctx.fillText(label, 0, -outer - 28);
  }

  ctx.restore();
}

function drawWorldPortal(ctx: CanvasRenderingContext2D, state: NextEngineState, camera: NextCameraState, quality: string) {
  if (state.worldId === "dark_cave") {
    const portal = oceanReturnPortalPosition(state.config);
    if (!isVisible(camera, portal.x, portal.y, portal.radius + 220)) return;
    drawPortalShape(ctx, state, portal.x, portal.y, portal.radius, true, "OCEAN GATE", quality);
    return;
  }

  const artifacts = state.stats.artifactsFound || 0;
  if (artifacts <= 0 && state.player.level < 8) return;
  const portal = darkCavePortalPosition(state.config);
  if (!isVisible(camera, portal.x, portal.y, portal.radius + 220)) return;
  const unlocked = darkCavePortalUnlocked(artifacts, state.player.level);
  drawPortalShape(ctx, state, portal.x, portal.y, portal.radius, unlocked, unlocked ? "DARK CAVE" : `АРТЕФАКТЫ ${artifacts}/${DARK_CAVE_ARTIFACTS_REQUIRED}`, quality);
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

  if ((viewport.quality || "balanced") !== "low") drawWaterParticles(ctx, state, camera, theme.particle);

  for (const zone of getZonesForWorld(state.worldId || "main_reef")) {
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

  drawWorldPortal(ctx, state, camera, viewport.quality || "balanced");

  ctx.strokeStyle = theme.border;
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
  const visualRadius = entityVisualRadius(enemy);

  ctx.save();
  ctx.strokeStyle = enemy.aiType === "leviathan" ? "rgba(180,140,255,.50)" : "rgba(255,220,120,.50)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, visualRadius * 2.55, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,90,90,.34)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, visualRadius * 3.05, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.font = "1000 16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = enemy.aiType === "leviathan" ? "rgba(220,205,255,.96)" : "rgba(255,240,180,.95)";
  ctx.fillText(enemy.aiType === "leviathan" ? "LEVIATHAN" : "APEX", enemy.x, enemy.y - visualRadius * 3.2);
  ctx.restore();
}

function drawAiRing(ctx: CanvasRenderingContext2D, enemy: NextFishEntity, quality: string) {
  drawApexFrame(ctx, enemy);
  if (quality === "low" && enemy.aiState === "wander" && enemy.aiType !== "apex" && enemy.aiType !== "leviathan") return;
  const visualRadius = entityVisualRadius(enemy);

  ctx.strokeStyle = enemy.aiType === "apex" || enemy.aiType === "leviathan" ? "rgba(255,220,120,.42)" : aiColor(enemy.aiState);
  ctx.lineWidth = enemy.aiType === "apex" || enemy.aiType === "leviathan" ? 4 : enemy.aiState === "attack" ? 4 : enemy.aiState === "hunt" ? 3 : 2;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, visualRadius * (enemy.aiType === "apex" || enemy.aiType === "leviathan" ? 2.05 : enemy.aiState === "attack" ? 2.2 : 1.85), 0, Math.PI * 2);
  ctx.stroke();

  if (enemy.aiState === "hunt" || enemy.aiState === "attack") {
    ctx.fillStyle = enemy.aiType === "apex" || enemy.aiType === "leviathan" ? "rgba(255,220,120,.72)" : aiColor(enemy.aiState);
    ctx.beginPath();
    ctx.arc(enemy.x + Math.cos(enemy.angle) * visualRadius * 1.8, enemy.y + Math.sin(enemy.angle) * visualRadius * 1.8, enemy.aiType === "apex" || enemy.aiType === "leviathan" ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHpBar(ctx: CanvasRenderingContext2D, entity: NextFishEntity, width: number) {
  const pct = Math.max(0, Math.min(1, entity.hp / entity.hpMax));
  const x = entity.x - width / 2;
  const y = entity.y - entityVisualRadius(entity) * 2.15;
  ctx.fillStyle = "rgba(2,12,20,.64)";
  ctx.fillRect(x, y, width, 5);
  ctx.fillStyle = entity.aiType === "apex" || entity.aiType === "leviathan" ? "rgba(255,220,120,.92)" : pct > 0.45 ? "rgba(110,255,180,.88)" : "rgba(255,90,90,.9)";
  ctx.fillRect(x, y, width * pct, 5);
}

function npcDisplayLevel(enemy: NextFishEntity) {
  return Math.max(1, Math.floor(enemy.npcLevel || Math.max(1, Math.round(enemy.mass * 4))));
}

function npcThreatInfo(state: NextEngineState, enemy: NextFishEntity, safeToEat: boolean) {
  const level = npcDisplayLevel(enemy);
  const levelDiff = level - state.player.level;
  const massRatio = enemy.mass / Math.max(1, state.player.mass);

  if (enemy.aiType === "apex" || enemy.aiType === "leviathan" || levelDiff >= 10 || massRatio >= 1.25) {
    return { label: "ОЧЕНЬ НИЗКИЙ", color: "rgba(255,90,90,.94)", background: "rgba(64,8,14,.82)", level };
  }

  if (levelDiff >= 4 || massRatio >= 1.06) {
    return { label: "НИЗКИЙ", color: "rgba(255,180,90,.94)", background: "rgba(64,38,8,.82)", level };
  }

  if (!safeToEat || levelDiff >= -2) {
    return { label: "СРЕДНИЙ", color: "rgba(255,243,160,.94)", background: "rgba(56,48,8,.82)", level };
  }

  return { label: "ВЫСОКИЙ", color: "rgba(110,255,180,.94)", background: "rgba(8,54,34,.82)", level };
}

function drawNpcThreatBadge(ctx: CanvasRenderingContext2D, state: NextEngineState, enemy: NextFishEntity, safeToEat: boolean, quality: string) {
  const boss = enemy.aiType === "apex" || enemy.aiType === "leviathan";
  const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
  if (quality === "low" && !boss && distance > 520 && enemy.aiState === "wander") return;

  const info = npcThreatInfo(state, enemy, safeToEat);
  const text = `LV ${info.level} · ${info.label}`;
  const y = enemy.y - entityVisualRadius(enemy) * (boss ? 4.1 : 3.15) - 8;

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = boss ? "1000 15px system-ui, -apple-system, BlinkMacSystemFont, sans-serif" : "900 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  const width = Math.max(boss ? 104 : 84, ctx.measureText(text).width + 18);
  const height = boss ? 24 : 20;
  const x = enemy.x - width / 2;
  ctx.fillStyle = info.background;
  ctx.strokeStyle = info.color;
  ctx.lineWidth = boss ? 2 : 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y - height * 0.5, width, height, height / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = info.color;
  ctx.fillText(text, enemy.x, y + 4);
  ctx.restore();
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

function drawArtifactPickup(ctx: CanvasRenderingContext2D, node: NextResourceNode, pulse: number) {
  const r = node.radius;
  ctx.save();
  ctx.translate(node.x, node.y);
  ctx.rotate(Math.sin(node.pulse * 0.5) * 0.18);
  ctx.fillStyle = "rgba(255,204,109,.24)";
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.45 + pulse, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, "#fff3a0");
  g.addColorStop(0.45, "#ffcc6d");
  g.addColorStop(1, "#7d4c1a");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.2);
  ctx.lineTo(r * 1.1, -r * 0.18);
  ctx.lineTo(r * 0.52, r * 1.08);
  ctx.lineTo(-r * 0.52, r * 1.08);
  ctx.lineTo(-r * 1.1, -r * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.72)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.36)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
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
    const visual = getResourceVisual(node.kind);
    const pulse = Math.sin(node.pulse) * 2;

    if (node.kind === "pearls") {
      drawPearlPickup(ctx, node, pulse);
      continue;
    }

    if (node.kind === "coral") {
      drawCrystalPickup(ctx, node, pulse);
      continue;
    }

    if (node.kind === "artifact_shell") {
      drawArtifactPickup(ctx, node, pulse);
      continue;
    }

    drawOrbPickup(ctx, node, visual.color, quality !== "low" ? visual.glow : "rgba(255,255,255,.06)", pulse);
  }
}

function drawCombatAura(ctx: CanvasRenderingContext2D, state: NextEngineState) {
  const player = state.player;
  const visualRadius = entityVisualRadius(player);

  if (player.downed || player.dead) {
    ctx.strokeStyle = "rgba(255,120,120,.42)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, visualRadius * 2.35, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (state.craft.barrierT > 0) {
    ctx.strokeStyle = "rgba(255,240,160,.50)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, visualRadius * 2.38, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.invulnT > 0) {
    ctx.strokeStyle = "rgba(120,240,255,.38)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, visualRadius * 2.05, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.dashT > 0) {
    ctx.strokeStyle = "rgba(120,240,255,.42)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, visualRadius * 2.25, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.biteCd > 0.25) {
    ctx.strokeStyle = state.craft.biteBoostT > 0 ? "rgba(255,220,120,.48)" : "rgba(255,255,255,.34)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(player.angle) * visualRadius * 1.25, player.y + Math.sin(player.angle) * visualRadius * 1.25, visualRadius * 1.35, 0, Math.PI * 2);
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

  for (const zone of getZonesForWorld(state.worldId || "main_reef")) {
    drawMapDot(ctx, mapX(state, zone.x, left, mapW), mapY(state, zone.y, top, mapH), zone.id === state.stats.zoneId ? 3.6 : 2.6, zone.color, zone.id === state.stats.zoneId ? "rgba(255,255,255,.68)" : undefined);
  }

  const portal = state.worldId === "dark_cave" ? oceanReturnPortalPosition(state.config) : darkCavePortalPosition(state.config);
  const portalUnlocked = state.worldId === "dark_cave" || darkCavePortalUnlocked(state.stats.artifactsFound || 0, state.player.level);
  if (state.worldId === "dark_cave" || (state.stats.artifactsFound || 0) > 0 || state.player.level >= 8) {
    drawMapDot(ctx, mapX(state, portal.x, left, mapW), mapY(state, portal.y, top, mapH), portalUnlocked ? 4.8 : 3.2, portalUnlocked ? "rgba(190,140,255,.95)" : "rgba(150,150,190,.45)", portalUnlocked ? "rgba(255,220,120,.76)" : undefined);
  }

  for (const event of state.events || []) {
    drawMapDot(ctx, mapX(state, event.x, left, mapW), mapY(state, event.y, top, mapH), 4.2, eventColor(event.kind), "rgba(255,255,255,.68)");
  }

  for (const node of state.resources.slice(0, 18)) {
    if (node.respawnT > 0) continue;
    const visual = getResourceVisual(node.kind);
    drawMapDot(ctx, mapX(state, node.x, left, mapW), mapY(state, node.y, top, mapH), node.kind === "coral" ? 2.5 : node.kind === "artifact_shell" ? 3 : node.kind === "pearls" ? 2.2 : 1.7, visual.color);
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

  const barX = x + 22;
  const barY = y + 56;
  const barW = w - 44;
  ctx.fillStyle = "rgba(255,255,255,.10)";
  ctx.fillRect(barX, barY, barW, 14);
  const g = ctx.createLinearGradient(barX, barY, barX + barW, barY);
  g.addColorStop(0, "#78f0ff");
  g.addColorStop(0.55, "#b48cff");
  g.addColorStop(1, "#fff3a0");
  ctx.fillStyle = g;
  ctx.fillRect(barX, barY, barW * progress, 14);

  ctx.font = "900 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "rgba(231,242,255,.66)";
  ctx.fillText(`${Math.round(progress * 100)}%`, viewport.width / 2, y + 90);
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

  const visibleEnemies = state.enemies.filter((enemy) => isVisible(camera, enemy.x, enemy.y, entityVisualRadius(enemy) * 4));
  for (const enemy of visibleEnemies) {
    const visualRadius = entityVisualRadius(enemy);
    const safeToEat = canDevour(state.player.mass, enemy.mass);
    drawAiRing(ctx, enemy, quality);
    ctx.strokeStyle = enemy.aiType === "apex" || enemy.aiType === "leviathan" ? "rgba(255,220,120,.30)" : safeToEat ? "rgba(110,255,180,.24)" : "rgba(255,90,90,.32)";
    ctx.lineWidth = enemy.hitT > 0 ? 4 : 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, visualRadius * 1.52, 0, Math.PI * 2);
    ctx.stroke();
    drawEntitySkin(ctx, enemy, enemy.hitT > 0 ? 0.55 : safeToEat ? 0.82 : 0.92);
    if (quality !== "low" || enemy.aiType === "apex" || enemy.aiType === "leviathan") {
      drawHpBar(ctx, enemy, visualRadius * (enemy.aiType === "apex" || enemy.aiType === "leviathan" ? 4.1 : 2.8));
    }
    drawNpcThreatBadge(ctx, state, enemy, safeToEat, quality);
  }

  drawCombatAura(ctx, state);
  drawEntitySkin(ctx, state.player, playerDowned ? 0.34 : state.player.hitT > 0 ? 0.68 : 1);
  drawHpBar(ctx, state.player, entityVisualRadius(state.player) * 3.2);
  drawFloatText(ctx, state);

  ctx.restore();
  drawMiniMap(ctx, state, camera, viewport);
  drawLoadingOverlay(ctx, state, viewport);
}

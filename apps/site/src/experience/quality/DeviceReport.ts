import { readDeviceCapabilities } from "./DeviceCapabilities";
import type { ExperienceMetrics, ScrollSnapshot } from "../types";

export type BlackCrownDeviceReport = ReturnType<typeof createDeviceReport>;

export function createDeviceReport(metrics: ExperienceMetrics, snapshot: ScrollSnapshot, timestamp = new Date().toISOString()) {
  const device = readDeviceCapabilities();
  return {
    schemaVersion: 1,
    timestamp,
    appCommit: import.meta.env.VITE_APP_COMMIT || "local",
    viewport: { width: window.innerWidth, height: window.innerHeight },
    visualViewport: window.visualViewport ? { width: window.visualViewport.width, height: window.visualViewport.height } : null,
    dpr: window.devicePixelRatio || 1,
    orientation: device.orientation,
    reducedMotion: device.reducedMotion,
    pointerType: device.pointerType,
    saveData: device.saveData,
    hardwareConcurrency: device.cores,
    deviceMemory: device.memory,
    webgl2: metrics.renderer === "WebGL2",
    renderer: metrics.renderer,
    maxTextureSize: metrics.maxTextureSize,
    maxRenderbufferSize: metrics.maxRenderbufferSize,
    qualityRequested: metrics.requestedQuality,
    qualityResolved: metrics.quality,
    crownBackend: metrics.crownBackend,
    crownLod: metrics.crownLod,
    manifestAssetId: metrics.crownAssetId,
    assetBytes: metrics.crownAssetBytes,
    parseTime: metrics.crownParseTime,
    firstFrameTime: metrics.firstFrameTime,
    frameP50: metrics.frameP50,
    frameP95: metrics.frameP95,
    worstFrame: metrics.worstFrame,
    derivedFps: metrics.frameP50 > 0 ? Math.round((1000 / metrics.frameP50) * 10) / 10 : 0,
    drawCalls: metrics.drawCalls,
    triangles: metrics.triangles,
    textures: metrics.textures,
    geometries: metrics.geometries,
    estimatedTextureMemory: metrics.estimatedTextureMemory,
    canvasCount: document.querySelectorAll("canvas[data-bc-nexus-canvas]").length,
    rafOwnerCount: metrics.rafOwnerCount,
    contextLostCount: metrics.contextLostCount,
    currentChapter: snapshot.chapterId,
    currentProgress: Math.round(snapshot.progress * 10_000) / 10_000,
    routeEntryCount: metrics.routeEntryCount,
    routeDisposeCount: metrics.routeDisposeCount,
    loader: metrics.loader,
    warnings: [...metrics.warnings],
  };
}

export function serializeDeviceReport(metrics: ExperienceMetrics, snapshot: ScrollSnapshot) {
  return JSON.stringify(createDeviceReport(metrics, snapshot), null, 2);
}

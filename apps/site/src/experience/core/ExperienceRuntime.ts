import * as THREE from "three";
import { experienceConfig, type BlackCrownCrownReviewSelection, type BlackCrownExperienceQuality } from "../experienceConfig";
import type { ExperienceBootStage, ExperienceMetrics, ScrollSnapshot } from "../types";
import { INITIAL_SCROLL_SNAPSHOT } from "../types";
import { CameraRig } from "../camera/CameraRig";
import { ScrollDirector } from "../scroll/ScrollDirector";
import { PointerParallax } from "../input/PointerParallax";
import { QualityManager } from "../quality/QualityManager";
import { readDeviceCapabilities } from "../quality/DeviceCapabilities";
import type { DeviceCapabilities } from "../quality/DeviceCapabilities";
import { FrameSampler } from "../quality/FrameSampler";
import { CrownAssetManager } from "../assets/CrownAssetLoader";
import type { CrownLoadResult, CrownVisual } from "../assets/CrownAssetAdapter";
import { readCrownAssetRequest, type CrownAssetRequest } from "../assets/CrownBackendSelector";
import { getCrownLoaderCounters } from "../assets/CrownAssetCache";
import { ParticleField } from "../scene/ParticleField";
import { NexusArchitecture } from "../scene/NexusArchitecture";
import { EcosystemNodes } from "../scene/EcosystemNodes";
import { PortalField } from "../scene/PortalField";
import { ChapterDirector } from "../timeline/ChapterDirector";
import { RendererHost } from "./RendererHost";
import { SceneRoot } from "./SceneRoot";
import { AudioController } from "../audio/AudioController";
import { getRuntimeLifecycleCounters, recordRuntimeDispose, recordRuntimeEntry } from "./RuntimeDiagnostics";
import { ExperienceShellRuntime } from "../../experience-shell/core/ExperienceShellRuntime";

export type ExperienceRuntimeOptions = {
  container: HTMLElement;
  story: HTMLElement;
  initialQuality: BlackCrownExperienceQuality;
  onBootStage: (stage: ExperienceBootStage) => void;
  onSnapshot: (snapshot: ScrollSnapshot) => void;
  onMetrics: (metrics: ExperienceMetrics) => void;
};

export class ExperienceRuntime {
  private readonly container: HTMLElement;
  private readonly story: HTMLElement;
  private readonly onBootStage: (stage: ExperienceBootStage) => void;
  private readonly onSnapshot: (snapshot: ScrollSnapshot) => void;
  private readonly onMetrics: (metrics: ExperienceMetrics) => void;
  private readonly quality: QualityManager;
  private readonly rendererHost: RendererHost;
  private readonly capabilities: DeviceCapabilities;
  private readonly sceneRoot: SceneRoot;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly cameraRig: CameraRig;
  private readonly scroll: ScrollDirector;
  private readonly pointer: PointerParallax;
  private readonly chapterDirector = new ChapterDirector();
  private readonly crownAssets: CrownAssetManager;
  private crownRequest: CrownAssetRequest;
  private crown: CrownVisual;
  private readonly particles: ParticleField;
  private readonly architecture: NexusArchitecture;
  private readonly ecosystem: EcosystemNodes;
  private readonly portal: PortalField;
  private readonly shellRuntime: ExperienceShellRuntime;
  private readonly audio = new AudioController();
  private snapshot = INITIAL_SCROLL_SNAPSHOT;
  private raf = 0;
  private disposed = false;
  private contextState: "ready" | "lost" = "ready";
  private lastFrameTime = 0;
  private elapsedSeconds = 0;
  private metricWindowStart = 0;
  private metricFrames = 0;
  private lastUiUpdate = 0;
  private firstFrameRendered = false;
  private readonly routeAbort = new AbortController();
  private readonly frameSampler = new FrameSampler();
  private readonly bootStartedAt = performance.now();
  private firstFrameTime = 0;
  private crownAttachedAt = 0;
  private crownFirstFrameTime = 0;
  private awaitingCrownFirstFrame = false;
  private contextLostCount = 0;

  constructor(options: ExperienceRuntimeOptions) {
    this.container = options.container;
    this.story = options.story;
    this.onBootStage = options.onBootStage;
    this.onSnapshot = options.onSnapshot;
    this.onMetrics = options.onMetrics;
    this.quality = new QualityManager(options.initialQuality);
    const debugCrown = experienceConfig.debug || import.meta.env.DEV
      || new URLSearchParams(window.location.search).has("bcdebug")
      || new URLSearchParams(window.location.search).has("bcdeviceqa");
    this.crownRequest = readCrownAssetRequest(experienceConfig.crownAssetMode, debugCrown);

    this.onBootStage("renderer");
    this.rendererHost = new RendererHost({
      container: options.container,
      preset: this.quality.preset,
      onContextState: this.handleContextState,
    });
    this.capabilities = readDeviceCapabilities(this.rendererHost.renderer);
    recordRuntimeEntry();
    this.onBootStage("scene");
    this.sceneRoot = new SceneRoot();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.05, 100);
    this.camera.position.set(0, 0, 10);
    this.cameraRig = new CameraRig(this.camera);
    this.scroll = new ScrollDirector({ story: options.story, onInput: this.requestFrame });
    this.pointer = new PointerParallax(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    this.onBootStage("geometry");
    const preset = this.quality.preset;
    this.crownAssets = new CrownAssetManager(preset.radialSegments, preset.tier);
    this.crown = this.crownAssets.visual;
    this.particles = new ParticleField(preset.particles, preset.foregroundParticles);
    this.architecture = new NexusArchitecture(preset.radialSegments);
    this.ecosystem = new EcosystemNodes(preset.ecosystemNodes);
    this.portal = new PortalField(preset.radialSegments);
    this.sceneRoot.root.add(this.architecture.root, this.particles.root, this.crown.root, this.ecosystem.root, this.portal.root);
    this.shellRuntime = new ExperienceShellRuntime({
      parent: this.sceneRoot.root,
      scene: this.sceneRoot.scene,
      signal: this.routeAbort.signal,
      requestFrame: this.requestFrame,
    });
    this.onBootStage("materials");

    this.container.dataset.bcExperienceRuntime = "active";
    this.container.dataset.bcExperienceRaf = "0";
    this.writeCrownDiagnostics(this.crownAssets.result);
    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  start() {
    this.onBootStage("first-frame");
    this.requestFrame();
    void this.loadCrownBackend();
  }

  private async loadCrownBackend(
    preferredLod?: "low" | "medium" | "high",
    downgrade = false,
    requestedMode: CrownAssetRequest = this.crownRequest,
  ) {
    try {
      const result = await this.crownAssets.load({
        requestedMode,
        quality: this.quality.requestedQuality,
        resolvedQuality: this.quality.preset.tier,
        capabilities: readDeviceCapabilities(this.rendererHost.renderer),
        renderer: this.rendererHost.renderer,
        debug: experienceConfig.debug || new URLSearchParams(window.location.search).has("bcdebug") || new URLSearchParams(window.location.search).has("bcdeviceqa"),
        signal: this.routeAbort.signal,
        preferredLod,
      });
      if (this.disposed || this.routeAbort.signal.aborted) {
        if (result.visual !== this.crown) result.visual.dispose();
        return;
      }
      if (requestedMode !== this.crownRequest) {
        if (result.visual !== this.crown) result.visual.dispose();
        return;
      }
      if (downgrade && result.backend !== "glb") return;
      this.activateCrownResult(result);
    } catch (error) {
      if (!this.disposed && !(error instanceof DOMException && error.name === "AbortError")) {
        console.warn("BlackCrown Crown backend did not activate:", error instanceof Error ? error.message : error);
      }
    }
  }

  private activateCrownResult(result: CrownLoadResult) {
    const previous = this.crown;
    if (result.visual !== previous) {
      this.sceneRoot.root.remove(previous.root);
      this.crown = result.visual;
      this.sceneRoot.root.add(this.crown.root);
    }
    const replaced = this.crownAssets.activate(result);
    if (replaced) replaced.dispose();
    if (result.backend === "glb") {
      this.crownAttachedAt = performance.now();
      this.awaitingCrownFirstFrame = true;
    }
    this.writeCrownDiagnostics(result);
    this.requestFrame();
  }

  private writeCrownDiagnostics(result: CrownLoadResult) {
    this.container.dataset.bcCrownBackend = result.backend;
    this.container.dataset.bcCrownLod = result.lod;
    this.container.dataset.bcCrownStatus = result.diagnostics.status;
    this.container.dataset.bcCrownReason = result.diagnostics.reason;
    this.container.dataset.bcCrownAssetId = result.diagnostics.assetId;
  }

  private requestFrame = () => {
    if (this.disposed || this.raf || document.hidden || this.contextState === "lost") return;
    this.raf = window.requestAnimationFrame(this.frame);
    this.container.dataset.bcExperienceRaf = "1";
  };

  private frame = (now: number) => {
    this.raf = 0;
    if (this.disposed || document.hidden || this.contextState === "lost") return;
    const deltaSeconds = this.lastFrameTime ? Math.min(0.05, Math.max(0.001, (now - this.lastFrameTime) / 1000)) : 1 / 60;
    this.lastFrameTime = now;
    this.elapsedSeconds += deltaSeconds;
    this.frameSampler.add(deltaSeconds * 1000, now);

    this.snapshot = this.scroll.update(deltaSeconds);
    const timeline = this.chapterDirector.evaluate(this.snapshot);
    const pointer = this.pointer.update(deltaSeconds);
    const { viewportWidth, viewportHeight } = this.snapshot;
    const compactViewport = viewportWidth <= 820 || viewportHeight <= 520;
    const narrowViewport = viewportWidth <= 820 && viewportHeight > 520;
    const glbComposition = this.crownAssets.result.backend === "glb";
    const identityReturn = Math.max(0, Math.min(1, (this.snapshot.progress - 0.89) / 0.08));
    const gateCentering = Math.max(0, Math.min(1, (this.snapshot.progress - 0.18) / 0.12));
    const crownX = compactViewport ? 0 : 1.15 - gateCentering * 0.5 + identityReturn * 0.05;
    const crownY = narrowViewport ? (glbComposition ? 0.9 : 1.25) : viewportHeight <= 520 ? 0.3 : glbComposition ? -0.12 : 0;
    this.rendererHost.resize(viewportWidth, viewportHeight);
    this.camera.aspect = Math.max(1, viewportWidth) / Math.max(1, viewportHeight);
    this.cameraRig.update(this.snapshot, pointer, this.elapsedSeconds);
    this.crown.root.position.set(crownX, crownY, 0);
    const crownScale = identityReturn > 0 ? 0.72 + identityReturn * 0.12 : 0.88 + gateCentering * 0.18;
    this.crown.root.scale.setScalar(narrowViewport ? crownScale * 0.7 : compactViewport ? crownScale * 0.78 : crownScale);
    this.architecture.root.position.set(crownX, crownY, 0);
    this.ecosystem.root.position.set(crownX, crownY, -0.4);
    this.portal.root.position.set(crownX, crownY - 0.12, -0.1);
    this.sceneRoot.updateLighting(timeline, crownX, crownY);

    const shell = this.shellRuntime.update(
      this.snapshot.progress,
      this.elapsedSeconds,
      this.snapshot.reducedMotion,
      this.quality.preset.tier,
      this.crown,
      this.particles,
      this.portal,
      this.ecosystem,
    );

    this.crown.setAssemblyProgress(timeline.assembly);
    this.crown.setOpenProgress(timeline.open);
    this.crown.setCoreIntensity(timeline.coreIntensity);
    this.crown.setPortalProgress(timeline.portal);
    this.crown.update(this.crown.root.visible ? deltaSeconds : 0, { ...timeline, elapsedSeconds: this.elapsedSeconds, reducedMotion: this.snapshot.reducedMotion });
    this.particles.update(this.elapsedSeconds, this.snapshot.progress, this.snapshot.reducedMotion);
    this.architecture.update(this.elapsedSeconds, this.snapshot.progress, this.snapshot.reducedMotion);
    if (this.ecosystem.root.visible) this.ecosystem.update(this.elapsedSeconds, timeline.ecosystem, timeline.enter, this.snapshot.reducedMotion);
    if (this.portal.root.visible) this.portal.update(this.elapsedSeconds, timeline.portal, timeline.tacticalOrange, timeline.enter, this.snapshot.reducedMotion);

    this.rendererHost.renderer.render(this.sceneRoot.scene, this.camera);
    if (this.awaitingCrownFirstFrame) {
      this.awaitingCrownFirstFrame = false;
      this.crownFirstFrameTime = performance.now() - this.crownAttachedAt;
    }
    this.container.dataset.bcExperienceProgress = this.snapshot.progress.toFixed(4);
    this.container.dataset.bcExperienceTarget = this.snapshot.targetProgress.toFixed(4);
    this.container.dataset.bcExperienceChapter = this.snapshot.chapterId;
    this.container.dataset.bcExperienceScene = shell.primary;
    this.container.dataset.bcExperienceActiveScenes = String(this.shellRuntime.activeSceneCount);
    this.container.dataset.bcExperienceEvofishAsset = this.shellRuntime.evofishAssetStatus;
    this.container.dataset.bcExperienceContext = this.contextState;
    this.container.style.setProperty("--bc-shell-progress", this.snapshot.progress.toFixed(4));
    this.story.style.setProperty("--bc-chapter-progress", this.snapshot.chapterProgress.toFixed(4));
    if (experienceConfig.debug || import.meta.env.DEV) {
      this.container.dataset.bcCrownPose = String(this.crown.root.userData.bcPoseSignature ?? "procedural");
    }

    const firstUiUpdate = !this.firstFrameRendered;
    if (firstUiUpdate) {
      this.firstFrameRendered = true;
      this.firstFrameTime = now - this.bootStartedAt;
      this.metricWindowStart = now;
      this.onBootStage("ready");
    }

    this.metricFrames += 1;
    if (firstUiUpdate || now - this.lastUiUpdate >= 125) {
      this.lastUiUpdate = now;
      this.onSnapshot({ ...this.snapshot });
      const elapsedWindow = Math.max(1, now - this.metricWindowStart);
      const sample = this.frameSampler.snapshot(now);
      const fps = sample.p50 > 0 ? 1000 / sample.p50 : (this.metricFrames * 1000) / elapsedWindow;
      const renderInfo = this.rendererHost.renderer.info.render;
      const memoryInfo = this.rendererHost.renderer.info.memory;
      const crown = this.crownAssets.result.diagnostics;
      const lifecycle = getRuntimeLifecycleCounters();
      const warnings = [...crown.warnings];
      if (renderInfo.calls > this.quality.preset.maxDrawCalls) warnings.push(`draw_calls_over_${this.quality.preset.tier}_target`);
      if (renderInfo.triangles > this.quality.preset.maxTriangles) warnings.push(`triangles_over_${this.quality.preset.tier}_target`);
      this.container.dataset.bcExperienceFrameP50 = sample.p50.toFixed(1);
      this.container.dataset.bcExperienceFrameP95 = sample.p95.toFixed(1);
      this.container.dataset.bcExperienceWorstFrame = sample.worst.toFixed(1);
      this.container.dataset.bcExperienceDrawCalls = String(renderInfo.calls);
      this.container.dataset.bcExperienceTriangles = String(renderInfo.triangles);
      this.container.dataset.bcExperienceTextures = String(memoryInfo.textures);
      this.onMetrics({
        fps: Math.round(fps * 10) / 10,
        frameTime: Math.round(deltaSeconds * 10000) / 10,
        firstFrameTime: Math.round(this.firstFrameTime * 10) / 10,
        frameP50: Math.round(sample.p50 * 10) / 10,
        frameP95: Math.round(sample.p95 * 10) / 10,
        worstFrame: Math.round(sample.worst * 10) / 10,
        droppedFrames: sample.droppedFrames,
        dpr: this.rendererHost.renderer.getPixelRatio(),
        quality: this.quality.preset.tier,
        requestedQuality: this.quality.requestedQuality,
        drawCalls: renderInfo.calls,
        triangles: renderInfo.triangles,
        textures: memoryInfo.textures,
        geometries: memoryInfo.geometries,
        renderer: this.capabilities.renderer,
        maxTextureSize: this.capabilities.maxTextureSize,
        maxRenderbufferSize: this.capabilities.maxRenderbufferSize,
        contextState: this.contextState,
        contextLostCount: this.contextLostCount,
        ...lifecycle,
        crownBackend: crown.backend,
        crownLod: crown.lod,
        crownStatus: crown.status,
        crownReason: crown.reason,
        crownAssetId: crown.assetId,
        crownAssetBytes: crown.bytes,
        crownFetchTime: crown.fetchTime,
        crownParseTime: crown.parseTime,
        crownBindTime: crown.bindTime,
        crownFirstFrameTime: Math.round(this.crownFirstFrameTime * 10) / 10,
        crownMaterials: crown.materials,
        crownTextures: crown.textures,
        crownTriangles: crown.triangles,
        crownDrawCalls: crown.drawCalls,
        estimatedTextureMemory: crown.estimatedTextureMemory,
        loader: getCrownLoaderCounters(),
        activeSceneCount: this.shellRuntime.activeSceneCount,
        warnings,
      });
      const lowAttention = this.snapshot.progress < 0.1 || this.snapshot.progress > 0.92;
      if (lowAttention) {
        const downgraded = this.quality.considerAutomaticDowngrade(sample);
        if (downgraded) {
          this.rendererHost.setPreset(downgraded);
          this.container.dataset.bcQualityDowngrade = downgraded.tier;
          this.frameSampler.reset(now);
          if (this.crownAssets.result.backend === "glb") void this.loadCrownBackend(downgraded.tier, true);
        }
      }
      if (elapsedWindow > 1000) {
        this.metricWindowStart = now;
        this.metricFrames = 0;
      }
    }

    const shouldIdle = this.snapshot.reducedMotion && this.scroll.isSettled();
    if (!shouldIdle) this.requestFrame();
    else this.container.dataset.bcExperienceRaf = "0";
  };

  private handleVisibility = () => {
    if (document.hidden) {
      if (this.raf) window.cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.container.dataset.bcExperienceRaf = "0";
      return;
    }
    this.lastFrameTime = 0;
    this.requestFrame();
  };

  private handleContextState = (state: "ready" | "lost") => {
    this.contextState = state;
    this.container.dataset.bcExperienceContext = state;
    if (state === "lost") this.contextLostCount += 1;
    if (state === "lost" && this.raf) {
      window.cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.container.dataset.bcExperienceRaf = "0";
    } else if (state === "ready") {
      this.lastFrameTime = 0;
      this.frameSampler.reset();
      this.requestFrame();
    }
  };

  setQuality(requested: BlackCrownExperienceQuality) {
    const previousTier = this.quality.preset.tier;
    const preset = this.quality.setRequested(requested);
    this.rendererHost.setPreset(preset);
    if (preset.tier !== previousTier && this.crownRequest !== "procedural") {
      void this.loadCrownBackend(preset.tier);
    }
    this.requestFrame();
  }

  setSoundEnabled(enabled: boolean) {
    void this.audio.setEnabled(enabled);
  }

  setCrownAsset(request: BlackCrownCrownReviewSelection) {
    const parameters = new URLSearchParams(window.location.search);
    const enabled = import.meta.env.DEV || experienceConfig.debug || parameters.has("bcdebug") || parameters.has("bcdeviceqa");
    if (!enabled || !["procedural", "candidate-a", "candidate-b"].includes(request)) return;
    void this.switchCrownAsset(request);
  }

  private async switchCrownAsset(request: BlackCrownCrownReviewSelection) {
    this.crownRequest = request;
    try {
      const fallback = await this.crownAssets.load({
        requestedMode: "procedural",
        quality: this.quality.requestedQuality,
        resolvedQuality: this.quality.preset.tier,
        capabilities: readDeviceCapabilities(this.rendererHost.renderer),
        renderer: this.rendererHost.renderer,
        debug: true,
        signal: this.routeAbort.signal,
      });
      if (this.disposed || this.routeAbort.signal.aborted) {
        if (fallback.visual !== this.crown) fallback.visual.dispose();
        return;
      }
      this.activateCrownResult(fallback);
      if (request !== "procedural") await this.loadCrownBackend(undefined, false, request);
    } catch (error) {
      if (!this.disposed && !(error instanceof DOMException && error.name === "AbortError")) {
        console.warn("BlackCrown Crown review switch failed:", error instanceof Error ? error.message : error);
      }
    }
  }

  resetPerformanceSample() {
    this.frameSampler.reset();
    this.requestFrame();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.routeAbort.abort();
    if (this.raf) window.cancelAnimationFrame(this.raf);
    this.raf = 0;
    document.removeEventListener("visibilitychange", this.handleVisibility);
    this.scroll.dispose();
    this.pointer.dispose();
    this.audio.dispose();
    this.portal.dispose();
    this.ecosystem.dispose();
    this.shellRuntime.dispose();
    this.crownAssets.dispose();
    this.particles.dispose();
    this.architecture.dispose();
    this.sceneRoot.dispose();
    this.rendererHost.dispose();
    recordRuntimeDispose();
    delete this.container.dataset.bcExperienceRuntime;
    delete this.container.dataset.bcExperienceRaf;
    delete this.container.dataset.bcExperienceProgress;
    delete this.container.dataset.bcExperienceTarget;
    delete this.container.dataset.bcExperienceChapter;
    delete this.container.dataset.bcExperienceScene;
    delete this.container.dataset.bcExperienceActiveScenes;
    delete this.container.dataset.bcExperienceEvofishAsset;
    delete this.container.dataset.bcExperienceFrameP50;
    delete this.container.dataset.bcExperienceFrameP95;
    delete this.container.dataset.bcExperienceWorstFrame;
    delete this.container.dataset.bcExperienceDrawCalls;
    delete this.container.dataset.bcExperienceTriangles;
    delete this.container.dataset.bcExperienceTextures;
    delete this.container.dataset.bcExperienceContext;
    delete this.container.dataset.bcCrownBackend;
    delete this.container.dataset.bcCrownLod;
    delete this.container.dataset.bcCrownStatus;
    delete this.container.dataset.bcCrownReason;
    delete this.container.dataset.bcQualityDowngrade;
    this.container.style.removeProperty("--bc-shell-progress");
    this.story.style.removeProperty("--bc-chapter-progress");
  }
}

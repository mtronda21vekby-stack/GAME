import * as THREE from "three";
import type { BlackCrownExperienceQuality } from "../experienceConfig";
import type { ExperienceBootStage, ExperienceMetrics, ScrollSnapshot } from "../types";
import { INITIAL_SCROLL_SNAPSHOT } from "../types";
import { CameraRig } from "../camera/CameraRig";
import { ScrollDirector } from "../scroll/ScrollDirector";
import { PointerParallax } from "../input/PointerParallax";
import { QualityManager } from "../quality/QualityManager";
import { CrownPrototype } from "../scene/CrownPrototype";
import { ParticleField } from "../scene/ParticleField";
import { NexusArchitecture } from "../scene/NexusArchitecture";
import { EcosystemNodes } from "../scene/EcosystemNodes";
import { PortalField } from "../scene/PortalField";
import { ChapterDirector } from "../timeline/ChapterDirector";
import { RendererHost } from "./RendererHost";
import { SceneRoot } from "./SceneRoot";
import { AudioController } from "../audio/AudioController";

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
  private readonly onBootStage: (stage: ExperienceBootStage) => void;
  private readonly onSnapshot: (snapshot: ScrollSnapshot) => void;
  private readonly onMetrics: (metrics: ExperienceMetrics) => void;
  private readonly quality: QualityManager;
  private readonly rendererHost: RendererHost;
  private readonly sceneRoot: SceneRoot;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly cameraRig: CameraRig;
  private readonly scroll: ScrollDirector;
  private readonly pointer: PointerParallax;
  private readonly chapterDirector = new ChapterDirector();
  private readonly crown: CrownPrototype;
  private readonly particles: ParticleField;
  private readonly architecture: NexusArchitecture;
  private readonly ecosystem: EcosystemNodes;
  private readonly portal: PortalField;
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

  constructor(options: ExperienceRuntimeOptions) {
    this.container = options.container;
    this.onBootStage = options.onBootStage;
    this.onSnapshot = options.onSnapshot;
    this.onMetrics = options.onMetrics;
    this.quality = new QualityManager(options.initialQuality);

    this.onBootStage("renderer");
    this.rendererHost = new RendererHost({
      container: options.container,
      preset: this.quality.preset,
      onContextState: this.handleContextState,
    });
    this.onBootStage("scene");
    this.sceneRoot = new SceneRoot();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.05, 100);
    this.camera.position.set(0, 0, 10);
    this.cameraRig = new CameraRig(this.camera);
    this.scroll = new ScrollDirector({ story: options.story, onInput: this.requestFrame });
    this.pointer = new PointerParallax(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    this.onBootStage("geometry");
    const preset = this.quality.preset;
    this.crown = new CrownPrototype(preset.radialSegments);
    this.particles = new ParticleField(preset.particles, preset.foregroundParticles);
    this.architecture = new NexusArchitecture(preset.radialSegments);
    this.ecosystem = new EcosystemNodes(preset.ecosystemNodes);
    this.portal = new PortalField(preset.radialSegments);
    this.sceneRoot.root.add(this.architecture.root, this.particles.root, this.crown.root, this.ecosystem.root, this.portal.root);
    this.onBootStage("materials");

    this.container.dataset.bcExperienceRuntime = "active";
    this.container.dataset.bcExperienceRaf = "0";
    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  start() {
    this.onBootStage("first-frame");
    this.requestFrame();
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

    this.snapshot = this.scroll.update(deltaSeconds);
    const timeline = this.chapterDirector.evaluate(this.snapshot);
    const pointer = this.pointer.update(deltaSeconds);
    const { viewportWidth, viewportHeight } = this.snapshot;
    this.rendererHost.resize(viewportWidth, viewportHeight);
    this.camera.aspect = Math.max(1, viewportWidth) / Math.max(1, viewportHeight);
    this.cameraRig.update(this.snapshot, pointer, this.elapsedSeconds);
    this.crown.root.position.x = viewportWidth > 820 ? 1.1 : 0;
    this.crown.root.position.y = viewportWidth > 820 ? -0.15 : 1.55;

    this.crown.setAssemblyProgress(timeline.assembly);
    this.crown.setOpenProgress(timeline.open);
    this.crown.setCoreIntensity(timeline.coreIntensity);
    this.crown.setPortalProgress(timeline.portal);
    this.crown.update(deltaSeconds, { ...timeline, elapsedSeconds: this.elapsedSeconds, reducedMotion: this.snapshot.reducedMotion });
    this.particles.update(this.elapsedSeconds, this.snapshot.progress, this.snapshot.reducedMotion);
    this.architecture.update(this.elapsedSeconds, this.snapshot.progress, this.snapshot.reducedMotion);
    this.ecosystem.update(this.elapsedSeconds, timeline.ecosystem, timeline.enter, this.snapshot.reducedMotion);
    this.portal.update(this.elapsedSeconds, timeline.portal, timeline.tacticalOrange, this.snapshot.reducedMotion);

    this.rendererHost.renderer.render(this.sceneRoot.scene, this.camera);
    this.container.dataset.bcExperienceProgress = this.snapshot.progress.toFixed(4);
    this.container.dataset.bcExperienceTarget = this.snapshot.targetProgress.toFixed(4);
    this.container.dataset.bcExperienceChapter = this.snapshot.chapterId;
    this.container.dataset.bcExperienceContext = this.contextState;

    if (!this.firstFrameRendered) {
      this.firstFrameRendered = true;
      this.metricWindowStart = now;
      this.onBootStage("ready");
    }

    this.metricFrames += 1;
    if (now - this.lastUiUpdate >= 125) {
      this.lastUiUpdate = now;
      this.onSnapshot({ ...this.snapshot });
      const elapsedWindow = Math.max(1, now - this.metricWindowStart);
      const fps = (this.metricFrames * 1000) / elapsedWindow;
      const renderInfo = this.rendererHost.renderer.info.render;
      this.onMetrics({
        fps: Math.round(fps * 10) / 10,
        frameTime: Math.round(deltaSeconds * 10000) / 10,
        dpr: this.rendererHost.renderer.getPixelRatio(),
        quality: this.quality.preset.tier,
        drawCalls: renderInfo.calls,
        triangles: renderInfo.triangles,
        renderer: this.rendererHost.renderer.capabilities.isWebGL2 ? "WebGL2" : "WebGL1",
        contextState: this.contextState,
      });
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
    if (state === "lost" && this.raf) {
      window.cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.container.dataset.bcExperienceRaf = "0";
    } else if (state === "ready") {
      this.lastFrameTime = 0;
      this.requestFrame();
    }
  };

  setQuality(requested: BlackCrownExperienceQuality) {
    const preset = this.quality.setRequested(requested);
    this.rendererHost.setPreset(preset);
    this.requestFrame();
  }

  setSoundEnabled(enabled: boolean) {
    void this.audio.setEnabled(enabled);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.raf) window.cancelAnimationFrame(this.raf);
    this.raf = 0;
    document.removeEventListener("visibilitychange", this.handleVisibility);
    this.scroll.dispose();
    this.pointer.dispose();
    this.audio.dispose();
    this.portal.dispose();
    this.ecosystem.dispose();
    this.crown.dispose();
    this.particles.dispose();
    this.architecture.dispose();
    this.sceneRoot.dispose();
    this.rendererHost.dispose();
    delete this.container.dataset.bcExperienceRuntime;
    delete this.container.dataset.bcExperienceRaf;
    delete this.container.dataset.bcExperienceProgress;
    delete this.container.dataset.bcExperienceTarget;
    delete this.container.dataset.bcExperienceChapter;
    delete this.container.dataset.bcExperienceContext;
  }
}

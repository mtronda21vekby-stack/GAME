import * as THREE from "three";
import { PMREMGenerator } from "three/src/extras/PMREMGenerator.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CameraRig } from "../../experience/camera/CameraRig";
import { RendererHost } from "../../experience/core/RendererHost";
import { QUALITY_PRESETS } from "../../experience/quality/qualityPresets";
import { INITIAL_SCROLL_SNAPSHOT } from "../../experience/types";
import { platformGames } from "../../lib/platformGames";
import { disposeModel, finishMetal } from "../platform/crownModel";
import { prefersStaticPlatform } from "../platform/usePlatformParallax";
import { SPATIAL_BRAND_MODEL } from "./brandModel";
import { adaptSpatialBrand } from "./SpatialBrandAdapter";
import { panelCSSMatrix, panelFrontWidth, panelScrollOffset, panelStyle } from "./panelProjection";
import { createOrbitCard, createParticles, createRibbons, createSpine, createWave } from "./SpatialObjects";
import { SpatialEnvironment } from "./SpatialEnvironment";
import { DampedScalar, SurfaceMotion, SPATIAL_TIMING } from "./spatialMotion";
import { ALL_WORLD_INDICES, DESKTOP_SPATIAL_CAMERA, MOBILE_SPATIAL_CAMERA, ORBIT_CARD_WIDTH, WORLD_ACCENTS, nearestOrbitTurn, orbitCardPose, spatialProgress } from "./spatialState";

// Small viewports keep the low geometry tier, with modest edge smoothing for the brand silhouette.
const COMPACT_PRESET = { ...QUALITY_PRESETS.low, dprCap: 1.25, antialias: true };

type SceneOptions = { host: HTMLElement; stage: HTMLElement; panelRoot: HTMLElement; onStatus: (status: "ready" | "fallback") => void; onProgress: (complete: number, total: number) => void };

/** One continuous scene: replaceable brand object → orbital games → reflective field. */
export class SpatialSceneRuntime {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  private readonly desktopCamera = new CameraRig(this.camera, DESKTOP_SPATIAL_CAMERA, true);
  private readonly mobileCamera = new CameraRig(this.camera, MOBILE_SPATIAL_CAMERA, true);
  private readonly brand = new THREE.Group();
  private readonly gallery = new THREE.Group();
  private readonly ribbons = createRibbons();
  private readonly accent = new THREE.Color(WORLD_ACCENTS[0]);
  private readonly desiredAccent = new THREE.Color(WORLD_ACCENTS[0]);
  private readonly accentLight = new THREE.PointLight(WORLD_ACCENTS[0], 38, 24, 2);
  private readonly abort = new AbortController();
  private readonly motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  private readonly compactQuery = window.matchMedia("(max-width: 760px)");
  private readonly pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  private readonly cards = platformGames.map(() => createOrbitCard());
  private readonly panelElements: HTMLElement[];
  private readonly panelSizes = platformGames.map(() => ({ width: 560, height: 370 }));
  private readonly dummy = new THREE.Object3D();
  private readonly spine: ReturnType<typeof createSpine>;
  private readonly wave: ReturnType<typeof createWave>;
  private readonly particles: ReturnType<typeof createParticles>;
  private readonly chamber: SpatialEnvironment;
  private rendererHost?: RendererHost;
  private environment?: THREE.WebGLRenderTarget;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private preferenceObserver?: MutationObserver;
  private frame = 0;
  private lastFrame = 0;
  private elapsed = 0;
  private progress = 0;
  private desiredProgress = 0;
  private orbit = 0;
  private desiredOrbit = 0;
  private readonly orbitMotion = new DampedScalar(0, SPATIAL_TIMING.orbit);
  private readonly detailMotion = new SurfaceMotion([0]);
  private pausedAt = 0;
  private readonly focusMotion = platformGames.map(() => new DampedScalar(0, SPATIAL_TIMING.focus));
  private detail = 0;
  private detailOpen = false;
  private detailFocus = false;
  private pointer = { x: 0, y: 0 };
  private desiredPointer = { x: 0, y: 0 };
  private stageTop = 0;
  private stageHeight = 1;
  private galleryCenterPage = 0;
  private viewportWidth = 1;
  private viewportHeight = 1;
  private compact = this.compactQuery.matches;
  private reduced = prefersStaticPlatform(this.motionQuery);
  private paused = false;
  private inView = true;
  private disposed = false;
  private worldIndex = 0;
  private visibleGames = [...ALL_WORLD_INDICES];
  private loadedAssets = 0;
  private portraitBrand = false;

  constructor(private readonly options: SceneOptions) {
    this.panelElements = [...options.panelRoot.querySelectorAll<HTMLElement>("[data-game-panel]")];
    this.spine = createSpine(this.compact);
    this.wave = createWave(this.compact);
    this.particles = createParticles(this.compact);
    this.chamber = new SpatialEnvironment(this.compact);
    this.cards.forEach(card => this.gallery.add(card.group));
    this.scene.add(this.chamber, this.brand, this.ribbons, this.spine, this.gallery, this.wave.mesh, this.particles);
    try {
      this.rendererHost = new RendererHost({ container: options.host, preset: this.compact ? COMPACT_PRESET : QUALITY_PRESETS.high, powerPreference: this.compact ? "low-power" : "high-performance", onContextState: state => { if (state === "lost") this.fail(); } });
      this.rendererHost.renderer.domElement.className = "spatialSceneCanvas";
      this.rendererHost.setExposure(0.97);
      this.scene.background = new THREE.Color(0x061014);
      this.scene.fog = new THREE.FogExp2(0x061014, 0.036);
      this.buildLighting();
      this.installObservers();
      this.resize();
      options.onProgress(0, 1);
      void this.loadBrand();
    } catch (error) { this.dispose(); throw error; }
  }

  private buildLighting() {
    const room = new RoomEnvironment(), pmrem = new PMREMGenerator(this.rendererHost!.renderer);
    try { this.environment = pmrem.fromScene(room, 0.04); this.scene.environment = this.environment.texture; }
    finally { room.dispose(); pmrem.dispose(); }
    this.scene.add(new THREE.HemisphereLight(0xb1d7dd, 0x080512, 1.05));
    const key = new THREE.DirectionalLight(0xe8eeec, 2.8); key.position.set(-4, 5, 7);
    const rim = new THREE.DirectionalLight(0x8ca6df, 3.2); rim.position.set(5, 2, -3);
    const copper = new THREE.PointLight(0xa2705f, 12, 18, 2); copper.position.set(-4, -3, 3);
    this.accentLight.position.set(1, 2, 3);
    this.scene.add(key, rim, copper, this.accentLight);
  }
  private assetComplete() { if (!this.disposed) this.options.onProgress(++this.loadedAssets, 1); }

  private async loadBrand() {
    try {
      const response = await fetch(SPATIAL_BRAND_MODEL.url, { signal: this.abort.signal });
      if (!response.ok) throw new Error("brand_" + response.status);
      const bytes = await response.arrayBuffer();
      if (this.disposed) return;
      const gltf = await new GLTFLoader().parseAsync(bytes, SPATIAL_BRAND_MODEL.url.slice(0, SPATIAL_BRAND_MODEL.url.lastIndexOf("/") + 1));
      if (this.disposed) { disposeModel(gltf.scene); return; }
      const model = gltf.scene;
      if (SPATIAL_BRAND_MODEL.finish === "blackcrown-metal") finishMetal(model);
      const adapted = adaptSpatialBrand(model, SPATIAL_BRAND_MODEL.fitSpan);
      this.portraitBrand = adapted.portrait;
      this.brand.add(adapted.group);
      this.options.onStatus("ready"); this.requestFrame();
    } catch { this.fail(); }
    finally { this.assetComplete(); }
  }

  setWorld(index: number, visibleGames: readonly number[] = ALL_WORLD_INDICES) {
    if (this.disposed) return;
    this.visibleGames = visibleGames.filter(value => value >= 0 && value < platformGames.length);
    if (!this.visibleGames.length) this.visibleGames = [...ALL_WORLD_INDICES];
    this.worldIndex = this.visibleGames.includes(index) ? index : this.visibleGames[0];
    this.desiredOrbit = nearestOrbitTurn(this.orbit, this.visibleGames.indexOf(this.worldIndex), this.visibleGames.length);
    if (this.paused) this.settleSelection();
    this.desiredAccent.set(WORLD_ACCENTS[this.worldIndex]);
    this.measurePanels();
    this.requestFrame();
  }
  setDetailOpen(open: boolean) { this.detailOpen = open; this.requestFrame(); }
  setDetailFocus(focused: boolean) {
    if (this.detailFocus === focused) return;
    this.detailFocus = focused;
    if (this.paused || this.reduced) { this.detailMotion.rebase([focused ? 1 : 0]); this.detail = focused ? 1 : 0; }
    else this.detailMotion.moveTo([focused ? 1 : 0],focused ? SPATIAL_TIMING.open : SPATIAL_TIMING.close,performance.now());
    this.requestFrame();
  }
  private settleSelection() {
    this.orbit = this.orbitMotion.snap(this.desiredOrbit);
    this.focusMotion.forEach((motion,index) => motion.snap(index === this.worldIndex ? 1 : 0));
  }
  setPaused(paused: boolean) {
    if (paused && !this.paused) { this.pausedAt = performance.now(); this.detailMotion.sample(this.pausedAt); this.detail = this.detailMotion.value[0]; }
    if (!paused && this.paused) this.detailMotion.delay(performance.now()-this.pausedAt);
    this.paused = paused;
    if (paused && this.elapsed === 0) { this.settleSelection(); this.progress = this.desiredProgress; }
    this.stop(); this.requestFrame();
  }

  private installObservers() {
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.options.host); this.resizeObserver.observe(this.options.stage);
    this.intersectionObserver = new IntersectionObserver(([entry]) => { this.inView = entry.isIntersecting; if (this.inView) this.requestFrame(); else this.stop(); });
    this.intersectionObserver.observe(this.options.stage);
    this.preferenceObserver = new MutationObserver(this.onPreferenceChange);
    this.preferenceObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-reduced-motion"] });
    this.motionQuery.addEventListener("change", this.onPreferenceChange); this.compactQuery.addEventListener("change", this.onPreferenceChange);
    window.addEventListener("scroll", this.onScroll, { passive: true }); window.addEventListener("resize", this.resize, { passive: true });
    window.addEventListener("pointermove", this.onPointer, { passive: true }); document.addEventListener("visibilitychange", this.onVisibility);
  }
  private resize = () => {
    if (this.disposed || !this.rendererHost) return;
    this.viewportWidth = this.options.host.clientWidth; this.viewportHeight = this.options.host.clientHeight;
    this.rendererHost.resize(this.viewportWidth, this.viewportHeight);
    this.camera.aspect = this.viewportWidth / Math.max(1, this.viewportHeight); this.camera.updateProjectionMatrix();
    const box = this.options.stage.getBoundingClientRect(); this.stageTop = box.top + window.scrollY; this.stageHeight = box.height;
    this.particles.material.uniforms.uDpr.value = this.rendererHost.renderer.getPixelRatio();
    this.measurePanels();
    const galleryBox = this.options.stage.querySelector(".spatialGalleryVisual")?.getBoundingClientRect();
    // On a phone the reference's project plane sits above the viewport midpoint,
    // leaving the lower part of the structure and the touch controls exposed.
    this.galleryCenterPage = galleryBox ? galleryBox.top + window.scrollY + galleryBox.height / 2 - (this.compact ? this.viewportHeight * 0.05 : 0) : this.stageTop + this.viewportHeight * 1.5;
    this.onScroll();
  };
  private measurePanels() {
    const sizing = new THREE.PerspectiveCamera(38, this.camera.aspect, 0.1, 100);
    new CameraRig(sizing, this.compact ? MOBILE_SPATIAL_CAMERA : DESKTOP_SPATIAL_CAMERA, true).update({ ...INITIAL_SCROLL_SNAPSHOT, progress: 0.5, viewportWidth: this.viewportWidth, viewportHeight: this.viewportHeight }, { x: 0, y: 0 }, 0);
    sizing.updateMatrixWorld();
    const width = Math.max(220, Math.min(540, panelFrontWidth(sizing, this.viewportWidth, ORBIT_CARD_WIDTH, new THREE.Vector3(0, 0.8, 3.6))));
    const hidden = this.panelElements.map(element => element.hidden);
    for (const element of this.panelElements) { element.hidden = false; element.style.width = width + "px"; }
    this.panelElements.forEach((element, index) => { const height = element.offsetHeight; if (height) this.panelSizes[index] = { width, height }; });
    this.panelElements.forEach((element, index) => { element.hidden = hidden[index]; });
  }
  private projectPanels() {
    this.options.panelRoot.dataset.projected = "1";
    this.panelElements.forEach((element, index) => {
      const slot = this.visibleGames.indexOf(index), card = this.cards[index];
      const pose = orbitCardPose(Math.max(0, slot), this.visibleGames.length, this.orbit);
      const showing = slot >= 0 && this.gallery.visible && this.progress > 0.24 && this.progress < 0.83 && !this.detailOpen && this.viewportHeight >= (this.compact ? 700 : 580) && pose.z > -1.1;
      element.hidden = !showing;
      if (!showing) return;
      const size = this.panelSizes[index];
      const world = card.group.matrixWorld.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.066));
      element.style.transform = panelStyle(panelCSSMatrix(this.camera, world, this.viewportWidth, this.viewportHeight, size.width, size.height, ORBIT_CARD_WIDTH));
      const entry = THREE.MathUtils.smoothstep(this.progress,.24,.4)*(1-THREE.MathUtils.smoothstep(this.progress,.74,.83));
      element.style.opacity = String((.58+.42*card.focus)*entry);
    });
  }
  private onScroll = () => { this.desiredProgress = spatialProgress(window.scrollY, this.stageTop, this.stageHeight, this.viewportHeight); if (this.paused) this.progress = this.desiredProgress; this.requestFrame(); };
  private onPointer = (event: PointerEvent) => {
    if (this.compact || this.reduced || this.paused || this.detailOpen || !this.pointerQuery.matches || event.pointerType !== "mouse") return;
    this.desiredPointer.x = event.clientX / Math.max(1, window.innerWidth) - 0.5; this.desiredPointer.y = event.clientY / Math.max(1, window.innerHeight) - 0.5; this.requestFrame();
  };
  private onPreferenceChange = () => {
    this.compact = this.compactQuery.matches; this.reduced = prefersStaticPlatform(this.motionQuery);
    this.desiredPointer.x = this.desiredPointer.y = 0;
    this.rendererHost?.setPreset(this.compact ? COMPACT_PRESET : QUALITY_PRESETS.high); this.resize();
  };
  private onVisibility = () => { if (document.hidden) this.stop(); else this.requestFrame(); };
  private stop() { cancelAnimationFrame(this.frame); this.frame = 0; this.lastFrame = 0; }
  private requestFrame = () => { if (!this.disposed && !this.frame && this.inView && !document.hidden) this.frame = requestAnimationFrame(this.tick); };

  private tick = (now: number) => {
    this.frame = 0;
    if (this.disposed || !this.inView || document.hidden || !this.rendererHost) return;
    const delta = this.lastFrame ? now - this.lastFrame : 33.34;
    if (this.lastFrame && delta < (this.compact ? 32 : 21)) { this.requestFrame(); return; }
    this.lastFrame = now;
    const staticScene = this.reduced || this.paused, blend = staticScene ? 1 : 1 - Math.exp(-Math.min(delta, 100) / 180);
    if (!staticScene) this.elapsed += Math.min(delta, 100) / 1000;
    // Reduced motion changes composition in discrete cuts; no camera journey or idle loop.
    const targetProgress = this.reduced ? (this.desiredProgress < 0.25 ? 0 : this.desiredProgress < 0.8 ? 0.5 : 1) : this.paused ? this.progress : this.desiredProgress;
    this.progress += (targetProgress - this.progress) * blend;
    this.orbit = this.reduced ? this.orbitMotion.snap(this.desiredOrbit) : this.paused ? this.orbitMotion.value : this.orbitMotion.update(this.desiredOrbit,delta);
    if (this.reduced) this.detailMotion.rebase([this.detailFocus ? 1 : 0]);
    else if (!this.paused) this.detailMotion.sample(now);
    this.detail = this.detailMotion.value[0];
    this.pointer.x += ((this.reduced || this.detailOpen ? 0 : this.paused ? this.pointer.x : this.desiredPointer.x) - this.pointer.x) * blend;
    this.pointer.y += ((this.reduced || this.detailOpen ? 0 : this.paused ? this.pointer.y : this.desiredPointer.y) - this.pointer.y) * blend;
    this.accent.lerp(this.desiredAccent, blend); this.accentLight.color.copy(this.accent);
    const snapshot = { ...INITIAL_SCROLL_SNAPSHOT, progress: this.progress, viewportWidth: this.viewportWidth, viewportHeight: this.viewportHeight, reducedMotion: this.reduced };
    (this.compact ? this.mobileCamera : this.desktopCamera).update(snapshot, this.pointer, this.elapsed);
    // Detail focus begins reversing while the native shared surface closes.
    this.camera.position.x += this.detail * (this.compact ? .55 : 1.05);
    this.camera.position.y += this.detail * .22;
    this.camera.position.z -= this.detail * (this.compact ? 2.1 : 1.6);
    const transit = this.progress < .45 ? Math.sin(this.progress / .45 * Math.PI)**2 : 0;
    if(!this.reduced) this.camera.rotateZ(transit * (this.compact ? .018 : .032));
    this.camera.updateMatrixWorld();
    this.updateObjects(delta);
    this.scene.updateMatrixWorld(); this.camera.updateMatrixWorld();
    this.projectPanels();
    try { this.rendererHost.renderer.render(this.scene, this.camera); } catch { this.fail(); return; }
    if (!staticScene) this.requestFrame(); else this.lastFrame = 0;
  };

  private updateObjects(delta: number) {
    const t = this.elapsed, p = this.progress;
    const galleryMix = THREE.MathUtils.smoothstep(p, 0.12, 0.4), fieldMix = THREE.MathUtils.smoothstep(p, 0.74, 1);
    this.brand.visible = this.portraitBrand ? fieldMix < .99 : galleryMix < .995;
    if (this.portraitBrand) {
      // A tall rigid GLB travels into the gallery as one object. Articulating its
      // vertebrae will need separate pivots or a bone chain in the supplied file.
      const heroScale = this.compact ? 1 : 1.4;
      this.brand.position.set((this.compact ? 1.3 : 2.65) * (1-galleryMix) + this.detail*.4, this.compact ? .6-galleryMix*.2 : .1+galleryMix*.3, -galleryMix*1.6);
      this.brand.rotation.set(.06, -.22+Math.sin(t*.08)*.12+galleryMix*.22, -.025);
      this.brand.scale.setScalar(THREE.MathUtils.lerp(heroScale, this.compact ? 2.7 : 3.6, galleryMix) * (1-fieldMix*.7) * (1+this.detail*.15));
    } else {
      this.brand.position.set((this.compact ? 1.3 : 2.65) + galleryMix * 4, 0.1 + Math.sin(t * .28) * .08, -galleryMix * 6);
      this.brand.rotation.set(.24 + Math.sin(t * .12) * .05, -.46 + Math.sin(t * .11) * .32 + galleryMix * 1.8, -.07);
      this.brand.scale.setScalar((this.compact ? 1.38 : 1.55) * (1 - galleryMix * .5));
    }
    this.ribbons.position.copy(this.brand.position); this.ribbons.position.y -= 1.7;
    this.ribbons.rotation.set(0.08, t * 0.055, -0.18);
    this.ribbons.scale.setScalar(1 - galleryMix * 0.8); this.ribbons.visible = this.brand.visible && !this.portraitBrand;
    this.spine.visible = !this.portraitBrand && galleryMix > 0.02 && fieldMix < 0.99;
    this.spine.rotation.y = t * .055 + p * .55;
    this.spine.scale.setScalar(galleryMix * (1 - fieldMix * .7) * (1 + this.detail * .4));
    this.spine.position.set(Math.sin(t*.06)*.1 + this.detail*.4, .4, -1.6);
    this.spine.update(t,this.accent);
    this.chamber.position.x = (1-galleryMix) * (this.compact ? 1.3 : 2.2);
    this.chamber.update(t,this.accent,p,this.detail);
    this.gallery.visible = galleryMix > 0.04 && fieldMix < 0.99;
    this.gallery.position.z = -8 * (1 - galleryMix) - fieldMix * 10;
    this.gallery.position.y = panelScrollOffset(this.camera, new THREE.Vector3(0, 0.8, 3.6 + this.gallery.position.z + this.cards[this.worldIndex].focus * (this.compact ? 0.25 : 0.6)), this.galleryCenterPage - window.scrollY, this.viewportHeight);
    this.cards.forEach((card, index) => {
      const slot = this.visibleGames.indexOf(index); card.group.visible = slot >= 0;
      if (slot < 0) return;
      const pose = orbitCardPose(slot, this.visibleGames.length, this.orbit);
      card.group.visible = pose.z > -1.1 && this.viewportHeight >= (this.compact ? 700 : 580);
      card.focus = this.reduced ? this.focusMotion[index].snap(index === this.worldIndex ? 1 : 0) : this.paused ? this.focusMotion[index].value : this.focusMotion[index].update(index === this.worldIndex ? 1 : 0,delta);
      card.group.position.set(pose.x, pose.y + Math.sin(t * 0.24 + index) * 0.035, pose.z + card.focus * (this.compact ? 0.25 : 0.6));
      card.backing.scale.y = ORBIT_CARD_WIDTH * this.panelSizes[index].height / this.panelSizes[index].width;
      card.backing.material.emissive.copy(this.accent).multiplyScalar(card.focus * 0.05);
      card.group.rotation.set(0.025, pose.rotation, pose.roll + Math.sin(t * 0.16 + index) * 0.012);
    });
    this.wave.mesh.visible = fieldMix > 0.01;
    this.wave.mesh.scale.setScalar(fieldMix * 1.35); this.wave.mesh.position.set(this.compact ? 0 : 2, 0.2, 0);
    this.wave.mesh.rotation.set(0.08, Math.sin(t * 0.14) * 0.24 - 0.18, -0.08);
    if (this.wave.mesh.visible) {
      for (let y = 0; y < this.wave.rows; y++) for (let x = 0; x < this.wave.columns; x++) {
        const dx = (x - (this.wave.columns - 1) / 2) * 0.22, dy = (y - (this.wave.rows - 1) / 2) * 0.195;
        const ripple = Math.sin(Math.hypot(dx, dy) * 2.2 - t * 0.7) * 0.36;
        this.dummy.position.set(dx, dy, ripple); this.dummy.rotation.set(Math.PI / 2 + ripple * 0.7, Math.cos(dx + t * 0.4) * 0.16, 0);
        this.dummy.updateMatrix(); this.wave.mesh.setMatrixAt(y * this.wave.columns + x, this.dummy.matrix);
      }
      this.wave.mesh.instanceMatrix.needsUpdate = true;
    }
    this.particles.material.uniforms.uTime.value = t;
    this.particles.material.uniforms.uJourney.value = galleryMix;
    this.particles.material.uniforms.uDetail.value = this.detail;
  }

  private fail() { if (!this.disposed) { this.options.onStatus("fallback"); this.dispose(); } }
  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.stop(); this.abort.abort();
    this.resizeObserver?.disconnect(); this.intersectionObserver?.disconnect(); this.preferenceObserver?.disconnect();
    this.motionQuery.removeEventListener("change", this.onPreferenceChange); this.compactQuery.removeEventListener("change", this.onPreferenceChange);
    window.removeEventListener("scroll", this.onScroll); window.removeEventListener("resize", this.resize); window.removeEventListener("pointermove", this.onPointer); document.removeEventListener("visibilitychange", this.onVisibility);
    this.options.panelRoot.removeAttribute("data-projected");
    for (const element of this.panelElements) { element.style.removeProperty("transform"); element.style.removeProperty("width"); element.style.removeProperty("opacity"); element.hidden = false; }
    disposeModel(this.scene);
    this.wave.mesh.dispose(); this.particles.geometry.dispose(); this.particles.material.dispose();
    this.scene.clear(); this.scene.environment = null; this.environment?.dispose(); this.rendererHost?.dispose();
  }
}

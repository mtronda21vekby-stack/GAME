import * as THREE from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CrownAssetManager } from "../../src/experience/assets/CrownAssetLoader";
import { getCrownLoaderCounters, resetCrownAssetCacheForTests, acquireCrownAsset } from "../../src/experience/assets/CrownAssetCache";
import { createFixtureManifest, parseCrownAssetManifest } from "../../src/experience/assets/CrownAssetManifest";
import { getLodFallbackOrder, readCrownAssetRequest, selectCrownLod } from "../../src/experience/assets/CrownBackendSelector";
import { bindGLBCrown } from "../../src/experience/assets/glb/GLBCrownBindings";
import { FrameSampler } from "../../src/experience/quality/FrameSampler";
import { QualityManager } from "../../src/experience/quality/QualityManager";
import { serializeDeviceReport } from "../../src/experience/quality/DeviceReport";
import { INITIAL_EXPERIENCE_METRICS, INITIAL_SCROLL_SNAPSHOT } from "../../src/experience/types";
import { evaluateExperienceTimeline } from "../../src/experience/timeline/timeline";
import { createTestCrownGlb } from "../helpers/crownFixture";

const capabilities = {
  reducedMotion: false, coarsePointer: false, finePointer: true, pointerType: "fine" as const,
  saveData: false, memory: 8, cores: 10, mobileViewport: false, weakProfile: false,
  viewportWidth: 1440, viewportHeight: 900, visualViewportWidth: 1440, visualViewportHeight: 900,
  dpr: 2, orientation: "landscape" as const, webgl2: true, maxTextureSize: 16_384,
  maxRenderbufferSize: 16_384, renderer: "WebGL2",
};
const renderer = { capabilities: { getMaxAnisotropy: () => 8, isWebGL2: true } } as unknown as THREE.WebGLRenderer;

function productionManifest(enabled: boolean) {
  const fixture = createFixtureManifest();
  return {
    ...fixture,
    enabled,
    lods: Object.fromEntries(Object.entries(fixture.lods).map(([tier, lod]) => [tier, { ...lod, url: `/experience/crown/${tier}/test.glb` }])),
  };
}

function loadOptions(signal: AbortSignal) {
  return { requestedMode: "fixture" as const, quality: "high" as const, resolvedQuality: "high" as const, capabilities, renderer, debug: true, signal };
}

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.resolve();
  resetCrownAssetCacheForTests();
});

describe("Crown manifest and backend selection", () => {
  it("parses the production contract and rejects malformed coordinates", () => {
    const productionShape = { ...productionManifest(true), features: { ktx2: false, meshopt: false, draco: false, skinnedShell: true } };
    expect(parseCrownAssetManifest(productionShape).assetId).toBe("blackcrown-test-fixture");
    expect(parseCrownAssetManifest(productionShape).features.skinnedShell).toBe(true);
    expect(() => parseCrownAssetManifest({ ...productionShape, upAxis: "+Z" })).toThrow("manifest_coordinates");
  });

  it("resolves explicit modes, capability LOD and lighter fallback order", () => {
    expect(readCrownAssetRequest("auto", true, "?bcasset=procedural")).toBe("procedural");
    expect(readCrownAssetRequest("auto", true, "?bcasset=fixture")).toBe("fixture");
    expect(readCrownAssetRequest("auto", true, "?nexuscrown=candidate-a", null, "lab")).toBe("candidate-a");
    expect(readCrownAssetRequest("auto", true, "?nexuscrown=candidate-b", null, "lab")).toBe("candidate-b");
    expect(readCrownAssetRequest("auto", true, "?nexuscrown=https://example.test/crown.glb", null, "lab")).toBe("auto");
    expect(readCrownAssetRequest("auto", true, "?nexuscrown=candidate-a", null, "off")).toBe("auto");
    expect(readCrownAssetRequest("auto", true, "?nexuscrown=candidate-b", null, "off")).toBe("auto");
    expect(readCrownAssetRequest("auto", false, "", "candidate-a", "lab")).toBe("candidate-a");
    expect(readCrownAssetRequest("auto", false, "", "candidate-b", "lab")).toBe("candidate-b");
    expect(selectCrownLod("high", capabilities)).toBe("high");
    expect(selectCrownLod("high", { ...capabilities, saveData: true })).toBe("low");
    expect(getLodFallbackOrder("high")).toEqual(["high", "medium", "low"]);
  });

  it("accepts bounded Candidate B presentation data and rejects unsafe tuning", () => {
    const candidateB = {
      ...productionManifest(true),
      assetId: "blackcrown-digital-crown-candidate-b-v1",
      presentation: {
        baseScale: 0.98,
        coreCenter: [0, 0.63, 0],
        segmentOpenDistance: 0.3,
        spireLift: 0.09,
        portalDepthScale: 1.08,
        cameraTargetOffset: [0, 0.025, 0],
      },
      features: { ktx2: false, meshopt: false, draco: false, skinnedShell: true, irisBones: 7 },
    };
    expect(parseCrownAssetManifest(candidateB)).toMatchObject({
      assetId: "blackcrown-digital-crown-candidate-b-v1",
      presentation: { baseScale: 0.98, portalDepthScale: 1.08 },
      features: { irisBones: 7 },
    });
    expect(() => parseCrownAssetManifest({
      ...candidateB,
      presentation: { ...candidateB.presentation, segmentOpenDistance: 4 },
    })).toThrow("manifest_presentation_segmentOpenDistance");
    expect(() => parseCrownAssetManifest({
      ...candidateB,
      features: { ...candidateB.features, irisBones: 2 },
    })).toThrow("manifest_iris_bones");
  });

  it("keeps procedural for disabled or missing manifests", async () => {
    vi.stubGlobal("window", { location: { search: "" } });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(productionManifest(false)), { status: 200 })));
    const disabled = new CrownAssetManager(28, "medium");
    const disabledResult = await disabled.load({ ...loadOptions(new AbortController().signal), requestedMode: "auto", resolvedQuality: "medium" });
    expect(disabledResult).toMatchObject({ backend: "procedural", diagnostics: { reason: "manifest_disabled" } });
    disabled.dispose();

    vi.stubGlobal("fetch", vi.fn(async () => new Response("missing", { status: 404 })));
    const missing = new CrownAssetManager(28, "medium");
    const missingResult = await missing.load({ ...loadOptions(new AbortController().signal), requestedMode: "auto", resolvedQuality: "medium" });
    expect(missingResult).toMatchObject({ backend: "procedural", diagnostics: { reason: "asset_missing" } });
    missing.dispose();
  });
});

describe("GLB Crown runtime", () => {
  it("loads a test-only GLB, binds required nodes and remains reversible", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(createTestCrownGlb(), { status: 200, headers: { "content-length": String(createTestCrownGlb().byteLength) } })));
    const manager = new CrownAssetManager(28, "high");
    const controller = new AbortController();
    const result = await manager.load(loadOptions(controller.signal));
    expect(result.backend).toBe("glb");
    expect(result.lod).toBe("high");
    expect(result.diagnostics).toMatchObject({ materials: 1, textures: 0, transmissionMaterials: 0 });
    const previous = manager.activate(result);
    previous?.dispose();

    const visual = result.visual;
    const state = { ...evaluateExperienceTimeline(0.56), elapsedSeconds: 2, reducedMotion: false };
    visual.setAssemblyProgress(state.assembly);
    visual.setOpenProgress(state.open);
    visual.setCoreIntensity(state.coreIntensity);
    visual.setPortalProgress(state.portal);
    visual.update(1 / 60, state);
    const segment = visual.root.getObjectByName("BC_SEG_03")!;
    const first = segment.position.toArray();
    visual.setAssemblyProgress(0.2);
    visual.setOpenProgress(0.1);
    visual.update(1 / 30, { ...state, assembly: 0.2, open: 0.1 });
    visual.setAssemblyProgress(state.assembly);
    visual.setOpenProgress(state.open);
    visual.update(1 / 60, state);
    expect(segment.position.toArray()).toEqual(first);

    manager.dispose();
    manager.dispose();
    await Promise.resolve();
    expect(getCrownLoaderCounters()).toMatchObject({ fetch: 1, parse: 1, attach: 1, activeReferences: 0 });
  });

  it("falls back safely for missing and duplicate bindings", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(createTestCrownGlb({ missingSegment: true }), { status: 200 })));
    const manager = new CrownAssetManager(28, "medium");
    const result = await manager.load({ ...loadOptions(new AbortController().signal), resolvedQuality: "medium" });
    expect(result.backend).toBe("procedural");
    expect(result.diagnostics.reason).toBe("binding_failed");
    manager.dispose();
  });

  it("falls back when the selected fixture asset cannot be fetched", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("missing", { status: 404 })));
    const manager = new CrownAssetManager(28, "high");
    const result = await manager.load(loadOptions(new AbortController().signal));
    expect(result).toMatchObject({ backend: "procedural", diagnostics: { reason: "asset_missing" } });
    manager.dispose();
  });

  it("reapplies the same absolute progress across a one-way LOD downgrade", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(createTestCrownGlb(), { status: 200 })));
    const manager = new CrownAssetManager(28, "high");
    const state = { ...evaluateExperienceTimeline(0.56), elapsedSeconds: 2, reducedMotion: false };
    const high = await manager.load(loadOptions(new AbortController().signal));
    high.visual.setAssemblyProgress(state.assembly);
    high.visual.setOpenProgress(state.open);
    high.visual.update(1 / 60, state);
    const highPosition = high.visual.root.getObjectByName("BC_SEG_03")!.position.toArray();
    const previous = manager.activate(high);
    previous?.dispose();

    const medium = await manager.load({ ...loadOptions(new AbortController().signal), resolvedQuality: "medium", preferredLod: "medium" });
    medium.visual.setAssemblyProgress(state.assembly);
    medium.visual.setOpenProgress(state.open);
    medium.visual.update(1 / 60, state);
    expect(medium.visual.root.getObjectByName("BC_SEG_03")!.position.toArray()).toEqual(highPosition);
    expect(medium.diagnostics).toMatchObject({ transmissionMaterials: 0, substitutions: ["standard_core_glass"] });
    const replaced = manager.activate(medium);
    replaced?.dispose();
    manager.dispose();
  });

  it("rejects incomplete binding graphs before partial attachment", () => {
    const scene = new THREE.Group();
    scene.add(Object.assign(new THREE.Group(), { name: "BC_CROWN_ROOT" }));
    expect(() => bindGLBCrown(scene, createFixtureManifest())).toThrow(/binding_failed:missing/iu);

    const duplicateScene = new THREE.Group();
    for (const name of ["BC_CROWN_ROOT", "BC_SHELL_ROOT", "BC_CORE_ROOT", "BC_PORTAL_ROOT", "BC_RING_INNER", "BC_RING_MIDDLE", "BC_RING_OUTER"]) {
      duplicateScene.add(Object.assign(new THREE.Group(), { name }));
    }
    for (let index = 0; index < 9; index += 1) {
      duplicateScene.add(Object.assign(new THREE.Group(), { name: `BC_SEG_${String(index).padStart(2, "0")}` }));
      duplicateScene.add(Object.assign(new THREE.Group(), { name: `BC_SPIRE_${String(index).padStart(2, "0")}` }));
    }
    duplicateScene.add(Object.assign(new THREE.Group(), { name: "BC_CORE_ROOT" }));
    expect(() => bindGLBCrown(duplicateScene, createFixtureManifest())).toThrow(/binding_failed:duplicate/iu);
  });

  it("binds segment and spire bones through the same Object3D contract", () => {
    const scene = new THREE.Group();
    for (const name of ["BC_CROWN_ROOT", "BC_SHELL_ROOT", "BC_CORE_ROOT", "BC_PORTAL_ROOT", "BC_RING_INNER", "BC_RING_MIDDLE", "BC_RING_OUTER"]) {
      scene.add(Object.assign(new THREE.Group(), { name }));
    }
    for (let index = 0; index < 9; index += 1) {
      scene.add(Object.assign(new THREE.Bone(), { name: `BC_SEG_${String(index).padStart(2, "0")}` }));
      scene.add(Object.assign(new THREE.Bone(), { name: `BC_SPIRE_${String(index).padStart(2, "0")}` }));
    }
    const bindings = bindGLBCrown(scene, createFixtureManifest());
    expect(bindings.segments.every((node) => (node as THREE.Bone).isBone)).toBe(true);
    expect(bindings.spires).toHaveLength(9);
  });

  it("binds the Candidate B mechanical iris without making it mandatory for Candidate A", () => {
    const scene = new THREE.Group();
    for (const name of ["BC_CROWN_ROOT", "BC_SHELL_ROOT", "BC_CORE_ROOT", "BC_PORTAL_ROOT", "BC_RING_INNER", "BC_RING_MIDDLE", "BC_RING_OUTER"]) {
      scene.add(Object.assign(new THREE.Group(), { name }));
    }
    for (let index = 0; index < 9; index += 1) {
      scene.add(Object.assign(new THREE.Bone(), { name: `BC_SEG_${String(index).padStart(2, "0")}` }));
      scene.add(Object.assign(new THREE.Bone(), { name: `BC_SPIRE_${String(index).padStart(2, "0")}` }));
    }
    for (let index = 0; index < 7; index += 1) {
      scene.add(Object.assign(new THREE.Bone(), { name: `BC_IRIS_BLADE_${String(index).padStart(2, "0")}` }));
    }
    scene.add(Object.assign(new THREE.Group(), { name: "BC_PORTAL_IRIS" }));
    scene.add(Object.assign(new THREE.Group(), { name: "BC_PORTAL_CAVITY" }));

    const bindings = bindGLBCrown(scene, {
      ...createFixtureManifest(),
      features: { ...createFixtureManifest().features, skinnedShell: true, irisBones: 7 },
    });
    expect(bindings.irisBlades).toHaveLength(7);
    expect(bindings.iris?.name).toBe("BC_PORTAL_IRIS");
    expect(bindings.portalCavity?.name).toBe("BC_PORTAL_CAVITY");
  });

  it("aborts pending fetch and disposes a parsed result before attachment", async () => {
    vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
    })));
    const aborted = new CrownAssetManager(28, "high");
    const controller = new AbortController();
    const pending = aborted.load(loadOptions(controller.signal));
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    aborted.dispose();

    vi.stubGlobal("fetch", vi.fn(async () => new Response(createTestCrownGlb(), { status: 200 })));
    const parsed = new CrownAssetManager(28, "high");
    const result = await parsed.load(loadOptions(new AbortController().signal));
    parsed.dispose();
    expect(parsed.activate(result)).toBeNull();
    await Promise.resolve();
    expect(getCrownLoaderCounters().activeReferences).toBe(0);
  });

  it("reference-counts duplicate cache acquisitions and releases once", async () => {
    let loads = 0;
    const loader = async () => { loads += 1; return { scene: new THREE.Group(), bytes: 4, fetchTime: 1, parseTime: 1 }; };
    const first = acquireCrownAsset("shared", loader);
    const second = acquireCrownAsset("shared", loader);
    await Promise.all([first.value, second.value]);
    expect(loads).toBe(1);
    expect(getCrownLoaderCounters().activeReferences).toBe(2);
    first.release();
    first.release();
    second.release();
    await Promise.resolve();
    expect(getCrownLoaderCounters()).toMatchObject({ activeReferences: 0, dispose: 1 });
  });
});

describe("adaptive quality and private device report", () => {
  it("downgrades AUTO once after a sustained sample", () => {
    vi.stubGlobal("window", { innerWidth: 1440, innerHeight: 900, devicePixelRatio: 2, matchMedia: () => ({ matches: false }) });
    vi.stubGlobal("navigator", { hardwareConcurrency: 12, deviceMemory: 8, connection: { saveData: false } });
    const manager = new QualityManager("auto");
    const slow = { count: 180, duration: 3_000, p50: 18, p95: 31, worst: 52, droppedFrames: 12, repeatedSlowFrames: 8, complete: true };
    expect(manager.considerAutomaticDowngrade(slow)?.tier).toBe("medium");
    expect(manager.considerAutomaticDowngrade(slow)).toBeNull();
  });

  it("samples percentiles without React state", () => {
    const sampler = new FrameSampler(0, 100);
    for (let index = 0; index < 10; index += 1) sampler.add(10 + index, index * 20 + 1);
    expect(sampler.snapshot(220)).toMatchObject({ p50: 14, p95: 19, complete: true });
  });

  it("serializes diagnostics without PII fields", () => {
    vi.stubGlobal("window", { innerWidth: 390, innerHeight: 844, devicePixelRatio: 3, visualViewport: { width: 390, height: 760 }, matchMedia: (query: string) => ({ matches: query.includes("coarse") }) });
    vi.stubGlobal("navigator", { hardwareConcurrency: 6, deviceMemory: 4, connection: { saveData: false } });
    vi.stubGlobal("document", { querySelectorAll: () => [1] });
    const json = serializeDeviceReport({ ...INITIAL_EXPERIENCE_METRICS, renderer: "WebGL2", quality: "low" }, INITIAL_SCROLL_SNAPSHOT);
    expect(json).toContain('"canvasCount": 1');
    expect(json).not.toMatch(/userAgent|email|token|session|ipAddress/iu);
  });
});

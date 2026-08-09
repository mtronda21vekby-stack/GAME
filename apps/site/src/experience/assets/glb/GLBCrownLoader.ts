import type * as THREE from "three";
import { acquireCrownAsset, recordCrownFetch, recordCrownParse, type CrownAssetLease } from "../CrownAssetCache";
import type { CrownAssetManifest } from "../CrownAssetManifest";
import type { CrownLOD } from "../CrownAssetAdapter";
import { inspectGlbContainer, inspectLoadedScene, type LoadedSceneMetrics } from "./GLBInspection";

export type LoadedCrownInstance = {
  scene: THREE.Group;
  lease: CrownAssetLease;
  bytes: number;
  parseTime: number;
  metrics: LoadedSceneMetrics;
};

async function createGLTFLoader(manifest: CrownAssetManifest, renderer: THREE.WebGLRenderer) {
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const loader = new GLTFLoader();
  if (manifest.features.meshopt) {
    const { MeshoptDecoder } = await import("three/examples/jsm/libs/meshopt_decoder.module.js");
    loader.setMeshoptDecoder(MeshoptDecoder);
  }
  if (manifest.features.draco) {
    if (!manifest.features.dracoDecoderPath) throw new Error("parse_failed:missing_draco_decoder_path");
    const { DRACOLoader } = await import("three/examples/jsm/loaders/DRACOLoader.js");
    const draco = new DRACOLoader().setDecoderPath(manifest.features.dracoDecoderPath);
    loader.setDRACOLoader(draco);
  }
  if (manifest.features.ktx2) {
    if (!manifest.features.ktx2TranscoderPath) throw new Error("parse_failed:missing_ktx2_transcoder_path");
    const { KTX2Loader } = await import("three/examples/jsm/loaders/KTX2Loader.js");
    const ktx2 = new KTX2Loader().setTranscoderPath(manifest.features.ktx2TranscoderPath).detectSupport(renderer);
    loader.setKTX2Loader(ktx2);
  }
  return loader;
}

export async function loadGLBCrown(
  manifest: CrownAssetManifest,
  lod: CrownLOD,
  renderer: THREE.WebGLRenderer,
  routeSignal: AbortSignal,
): Promise<LoadedCrownInstance> {
  const descriptor = manifest.lods[lod];
  const cacheKey = `${manifest.assetId}:${lod}:${descriptor.url}`;
  const lease = acquireCrownAsset(cacheKey, async (cacheSignal) => {
    recordCrownFetch();
    const response = await fetch(descriptor.url, { signal: cacheSignal, credentials: "same-origin" });
    if (!response.ok) throw new Error(response.status === 404 ? "asset_missing" : `fetch_failed:${response.status}`);
    const declaredBytes = Number(response.headers.get("content-length") || 0);
    if (declaredBytes > descriptor.maxBytes) throw new Error(`budget_failed:bytes:${declaredBytes}`);
    const buffer = await response.arrayBuffer();
    if (cacheSignal.aborted) throw new DOMException("Crown load aborted", "AbortError");
    if (buffer.byteLength > descriptor.maxBytes) throw new Error(`budget_failed:bytes:${buffer.byteLength}`);
    inspectGlbContainer(buffer);
    const loader = await createGLTFLoader(manifest, renderer);
    const parseStart = performance.now();
    recordCrownParse();
    const gltf = await loader.parseAsync(buffer, "");
    if (cacheSignal.aborted) throw new DOMException("Crown parse aborted", "AbortError");
    if (!(gltf.scene as THREE.Group).isGroup) throw new Error("parse_failed:scene_root");
    return { scene: gltf.scene as THREE.Group, bytes: buffer.byteLength, parseTime: performance.now() - parseStart };
  });

  const abort = () => lease.release();
  routeSignal.addEventListener("abort", abort, { once: true });
  try {
    const cached = await lease.value;
    if (routeSignal.aborted) throw new DOMException("Crown route aborted", "AbortError");
    const scene = cached.scene.clone(true);
    const metrics = inspectLoadedScene(scene, descriptor);
    return { scene, lease, bytes: cached.bytes, parseTime: cached.parseTime, metrics };
  } catch (error) {
    lease.release();
    throw error;
  } finally {
    routeSignal.removeEventListener("abort", abort);
  }
}

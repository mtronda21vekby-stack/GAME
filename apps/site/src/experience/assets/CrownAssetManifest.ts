import type { CrownLOD } from "./CrownAssetAdapter";

export const CROWN_MANIFEST_URL = "/experience/crown/crown.manifest.json";
export const CROWN_CANDIDATE_A_MANIFEST_URL = "/experience/crown/candidate-a/crown-candidate-a.manifest.json";
export const CROWN_CANDIDATE_B_MANIFEST_URL = "/experience/crown/candidate-b/crown-candidate-b.manifest.json";

export type CrownPresentation = {
  baseScale: number;
  coreCenter: [number, number, number];
  segmentOpenDistance: number;
  spireLift: number;
  portalDepthScale: number;
  cameraTargetOffset: [number, number, number];
};

export type CrownLODManifest = {
  url: string;
  maxTriangles: number;
  maxBytes: number;
  maxMaterials: number;
  maxDrawCalls: number;
};

export type CrownAssetManifest = {
  schemaVersion: 1;
  enabled: boolean;
  assetId: string;
  frontAxis: "+Z";
  upAxis: "+Y";
  units: "meters";
  segmentCount: number;
  spires: number;
  presentation?: CrownPresentation;
  lods: Record<CrownLOD, CrownLODManifest>;
  features: {
    ktx2: boolean;
    meshopt: boolean;
    draco: boolean;
    skinnedShell?: boolean;
    irisBones?: number;
    ktx2TranscoderPath?: string;
    dracoDecoderPath?: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function isLocalCrownPath(value: unknown) {
  return typeof value === "string" && value.startsWith("/experience/crown/") && value.endsWith(".glb") && !value.includes("..") && !/^https?:/iu.test(value);
}

function parseVector(value: unknown, min: number, max: number, name: string): [number, number, number] {
  if (!Array.isArray(value) || value.length !== 3 || value.some((entry) => typeof entry !== "number" || entry < min || entry > max)) {
    throw new Error(`manifest_presentation_${name}`);
  }
  return value as [number, number, number];
}

function parseNumber(value: unknown, min: number, max: number, name: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new Error(`manifest_presentation_${name}`);
  return value;
}

function parsePresentation(value: unknown): CrownPresentation | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) throw new Error("manifest_presentation");
  return {
    baseScale: parseNumber(value.baseScale, 0.75, 1.25, "baseScale"),
    coreCenter: parseVector(value.coreCenter, -2, 2, "coreCenter"),
    segmentOpenDistance: parseNumber(value.segmentOpenDistance, 0.1, 0.6, "segmentOpenDistance"),
    spireLift: parseNumber(value.spireLift, 0.02, 0.3, "spireLift"),
    portalDepthScale: parseNumber(value.portalDepthScale, 0.5, 1.5, "portalDepthScale"),
    cameraTargetOffset: parseVector(value.cameraTargetOffset, -0.5, 0.5, "cameraTargetOffset"),
  };
}

export function parseCrownAssetManifest(value: unknown): CrownAssetManifest {
  if (!isRecord(value)) throw new Error("manifest_not_object");
  if (value.schemaVersion !== 1) throw new Error("manifest_schema_version");
  if (typeof value.enabled !== "boolean") throw new Error("manifest_enabled");
  if (typeof value.assetId !== "string" || !value.assetId) throw new Error("manifest_asset_id");
  if (value.frontAxis !== "+Z" || value.upAxis !== "+Y" || value.units !== "meters") throw new Error("manifest_coordinates");
  if (!Number.isInteger(value.segmentCount) || Number(value.segmentCount) < 9 || Number(value.segmentCount) > 11) throw new Error("manifest_segment_count");
  if (!Number.isInteger(value.spires) || Number(value.spires) < 1 || Number(value.spires) > 32) throw new Error("manifest_spire_count");
  if (!isRecord(value.lods) || !isRecord(value.features)) throw new Error("manifest_sections");

  const lods = {} as Record<CrownLOD, CrownLODManifest>;
  for (const tier of ["low", "medium", "high"] as const) {
    const candidate = value.lods[tier];
    if (!isRecord(candidate) || !isLocalCrownPath(candidate.url)) throw new Error(`manifest_lod_${tier}`);
    if (![candidate.maxTriangles, candidate.maxBytes, candidate.maxMaterials, candidate.maxDrawCalls].every(isPositiveInteger)) {
      throw new Error(`manifest_budget_${tier}`);
    }
    lods[tier] = candidate as CrownLODManifest;
  }
  const features = value.features;
  if (![features.ktx2, features.meshopt, features.draco].every((flag) => typeof flag === "boolean")) throw new Error("manifest_features");
  if (features.skinnedShell !== undefined && typeof features.skinnedShell !== "boolean") throw new Error("manifest_skinned_shell");
  if (features.irisBones !== undefined && (!Number.isInteger(features.irisBones) || Number(features.irisBones) < 3 || Number(features.irisBones) > 12)) {
    throw new Error("manifest_iris_bones");
  }
  for (const key of ["ktx2TranscoderPath", "dracoDecoderPath"] as const) {
    if (features[key] !== undefined && (typeof features[key] !== "string" || !features[key].startsWith("/experience/crown/"))) {
      throw new Error(`manifest_${key}`);
    }
  }

  const presentation = parsePresentation(value.presentation);
  return { ...value, schemaVersion: 1, lods, features, presentation } as CrownAssetManifest;
}

export async function fetchCrownAssetManifest(signal: AbortSignal, url = CROWN_MANIFEST_URL) {
  const response = await fetch(url, { signal, credentials: "same-origin" });
  if (!response.ok) throw new Error(`manifest_fetch_${response.status}`);
  return parseCrownAssetManifest(await response.json());
}

export function createFixtureManifest(): CrownAssetManifest {
  const fixture = (tier: CrownLOD): CrownLODManifest => ({
    url: "/__test__/blackcrown-crown-fixture.glb",
    maxTriangles: tier === "high" ? 100_000 : tier === "medium" ? 50_000 : 20_000,
    maxBytes: 2_621_440,
    maxMaterials: 8,
    maxDrawCalls: 20,
  });
  return {
    schemaVersion: 1,
    enabled: true,
    assetId: "blackcrown-test-fixture",
    frontAxis: "+Z",
    upAxis: "+Y",
    units: "meters",
    segmentCount: 9,
    spires: 9,
    lods: { low: fixture("low"), medium: fixture("medium"), high: fixture("high") },
    features: { ktx2: false, meshopt: false, draco: false },
  };
}

import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { inspectCrownGlb, validateCrownAssetAtPath, validateCrownManifest } from "../../scripts/lib/crown-asset-validator.mjs";
import { createTestCrownGlb } from "../helpers/crownFixture";

const temporaryDirectories: string[] = [];
const manifest = {
  schemaVersion: 1, enabled: true, assetId: "test-fixture", frontAxis: "+Z", upAxis: "+Y", units: "meters",
  segmentCount: 9, spires: 9,
  lods: {
    high: { url: "/experience/crown/lod0/test.glb", maxTriangles: 100_000, maxBytes: 8_388_608, maxMaterials: 8, maxDrawCalls: 20 },
    medium: { url: "/experience/crown/lod1/test.glb", maxTriangles: 50_000, maxBytes: 5_242_880, maxMaterials: 6, maxDrawCalls: 14 },
    low: { url: "/experience/crown/lod2/test.glb", maxTriangles: 20_000, maxBytes: 2_621_440, maxMaterials: 4, maxDrawCalls: 8 },
  },
  features: { ktx2: false, meshopt: false, draco: false },
};

afterEach(async () => Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))));

describe("Crown asset validator", () => {
  it("accepts a disabled schema without requiring binary placeholders", () => {
    expect(validateCrownManifest({ ...manifest, enabled: false }).errors).toEqual([]);
  });

  it("accepts the in-memory TEST FIXTURE", () => {
    const result = inspectCrownGlb(createTestCrownGlb(), manifest, "high");
    expect(result.errors).toEqual([]);
    expect(result.metrics).toMatchObject({ triangles: 12, drawCalls: 1, materials: 1 });
  });

  it("rejects invalid headers and remote resources", () => {
    expect(inspectCrownGlb(new Uint8Array(20), manifest, "high").errors[0]).toMatch(/magic|header/iu);
    expect(inspectCrownGlb(createTestCrownGlb({ externalUri: "https://example.test/crown.bin" }), manifest, "high").errors).toContain("buffer contains a forbidden remote URI.");
  });

  it("rejects node, triangle, material and draw budgets", () => {
    expect(inspectCrownGlb(createTestCrownGlb({ missingSegment: true }), manifest, "high").errors.join(" ")).toMatch(/segments/iu);
    expect(inspectCrownGlb(createTestCrownGlb({ duplicateNode: true }), manifest, "high").errors.join(" ")).toMatch(/duplicate node/iu);
    expect(inspectCrownGlb(createTestCrownGlb({ triangleAccessorCount: 300_003 }), manifest, "high").errors.join(" ")).toMatch(/triangles/iu);
    expect(inspectCrownGlb(createTestCrownGlb({ materialCount: 9 }), manifest, "high").errors.join(" ")).toMatch(/materials/iu);
    expect(inspectCrownGlb(createTestCrownGlb({ primitiveCount: 21 }), manifest, "high").errors.join(" ")).toMatch(/draw calls/iu);
  });

  it("fails an enabled manifest when LOD files are missing", async () => {
    const siteDir = await mkdtemp(path.join(os.tmpdir(), "bc-crown-validator-"));
    temporaryDirectories.push(siteDir);
    const manifestPath = path.join(siteDir, "public/experience/crown/crown.manifest.json");
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, JSON.stringify(manifest));
    const result = await validateCrownAssetAtPath({ manifestPath, siteDir });
    expect(result.ok).toBe(false);
    expect(result.messages.filter((message: string) => message.includes("missing"))).toHaveLength(3);
  });
});

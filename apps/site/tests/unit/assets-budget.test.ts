import { describe, expect, it } from "vitest";
import { collectInitialAssets, validateBundle } from "../../scripts/check-bundle-budget.mjs";
import { getAssetDimensions, KEY_ART_ASSETS, runKeyArtValidation } from "../../scripts/validate-key-art.mjs";

describe("key-art validator", () => {
  it("validates canonical art, semantic previews and PWA surfaces", () => {
    const results = runKeyArtValidation(process.cwd());
    expect(results).toHaveLength(KEY_ART_ASSETS.length);
    expect(results.find((asset) => asset.file.endsWith("hero-crown.webp"))).toMatchObject({ width: 600, height: 750 });
    expect(results.find((asset) => asset.file.endsWith("icon-512.png"))).toMatchObject({ width: 512, height: 512 });
  });

  it("rejects corrupt binary signatures", () => {
    expect(() => getAssetDimensions(Buffer.from("not-a-png"), "png")).toThrow("invalid PNG signature");
    expect(() => getAssetDimensions(Buffer.from("not-webp"), "webp")).toThrow("invalid WebP container");
  });
});

describe("bundle budget parser", () => {
  it("extracts hashed entry assets without filename assumptions", () => {
    expect(collectInitialAssets('<link rel="stylesheet" href="/assets/index-a.css"><script type="module" src="/assets/index-b.js"></script>'))
      .toEqual({ scripts: ["/assets/index-b.js"], styles: ["/assets/index-a.css"] });
  });

  it("fails duplication, raster data URI and an oversized Nexus chunk", () => {
    const result = validateBundle({
      js: [{ asset: "assets/index.js", bytes: 10, gzipBytes: 8 }],
      css: [{ asset: "assets/index.css", bytes: 10, gzipBytes: 8 }],
      allJsFiles: ["Account-a.js", "Admin-a.js", "Checkout-a.js", "nexus-three-a.js"],
      allJsMetrics: [{ file: "nexus-three-a.js", bytes: 600 * 1024 }],
      embedsCssInline: true,
      embedsRasterDataUri: true,
    });
    expect(result.errors.join(" ")).toContain("?inline");
    expect(result.errors.join(" ")).toContain("data URI");
    expect(result.errors.join(" ")).toContain("Nexus async chunk");
  });
});

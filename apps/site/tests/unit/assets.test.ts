import { describe, expect, it } from "vitest";
import {
  getAssetDimensions,
  KEY_ART_ASSETS,
  runKeyArtValidation,
} from "../../scripts/validate-key-art.mjs";

describe("key-art validator", () => {
  it("validates every canonical art and PWA surface", () => {
    const results = runKeyArtValidation(process.cwd());
    expect(results).toHaveLength(KEY_ART_ASSETS.length);
    expect(results.find((asset) => asset.file.endsWith("blackcrown-og.jpg"))).toMatchObject({ width: 1200, height: 630 });
  });

  it("rejects a corrupt binary signature", () => {
    expect(() => getAssetDimensions(Buffer.from("not-a-png"), "png")).toThrow("invalid PNG signature");
  });
});

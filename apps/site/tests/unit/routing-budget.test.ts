import { describe, expect, it } from "vitest";
import { collectInitialAssets, validateBundle } from "../../scripts/check-bundle-budget.mjs";
import {
  getSiteRouteMetadata,
  isExternalAppPath,
  normalizePath,
  resolveRouteChrome,
  SITE_PATHS,
} from "../../src/routes/routeMetadata";

describe("route registry", () => {
  it("normalizes known routes and leaves unknown routes unmatched", () => {
    expect(normalizePath("/checkout/?order=1#done")).toBe("/checkout");
    expect(SITE_PATHS).toContain("/checkout/success");
    expect(getSiteRouteMetadata("/store")?.metadata.chrome.dock).toBe(true);
    expect(getSiteRouteMetadata("/checkout")?.metadata.chrome.music).toBe(false);
    expect(getSiteRouteMetadata("/missing")).toBeUndefined();
  });

  it("preserves protected app navigation", () => {
    expect(isExternalAppPath("/game/")).toBe(true);
    expect(isExternalAppPath("/lobby/room")).toBe(true);
    expect(isExternalAppPath("/games/crown-front/")).toBe(true);
    expect(isExternalAppPath("/store")).toBe(false);
  });

  it("suppresses global chrome when the experience owns production home", () => {
    const homeChrome = getSiteRouteMetadata("/")!.metadata.chrome;
    const storeChrome = getSiteRouteMetadata("/store")!.metadata.chrome;

    expect(resolveRouteChrome("/", homeChrome, true)).toEqual({ dock: false, footer: false, music: false });
    expect(resolveRouteChrome("/", homeChrome, false)).toBe(homeChrome);
    expect(resolveRouteChrome("/store", storeChrome, true)).toBe(storeChrome);
  });
});

describe("bundle budget parser", () => {
  it("extracts hashed entry assets without filename assumptions", () => {
    expect(
      collectInitialAssets('<link rel="stylesheet" href="/assets/index-a.css"><script type="module" src="/assets/index-b.js"></script>'),
    ).toEqual({ scripts: ["/assets/index-b.js"], styles: ["/assets/index-a.css"] });
  });

  it("fails CSS duplication, data URI, and missing route chunks", () => {
    const result = validateBundle({
      js: [{ asset: "assets/index.js", bytes: 10, gzipBytes: 8 }],
      css: [{ asset: "assets/index.css", bytes: 10, gzipBytes: 8 }],
      allJsFiles: ["Account-a.js"],
      embedsCssInline: true,
      embedsRasterDataUri: true,
    });
    expect(result.errors.join(" ")).toContain("?inline");
    expect(result.errors.join(" ")).toContain("data URI");
    expect(result.errors.join(" ")).toContain("CinematicExperience-*.js");
    expect(result.errors.join(" ")).toContain("Admin-*.js");
  });
});

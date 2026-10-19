import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { retireLegacySiteWorker } from "../../src/pwa/registerSW";

const origin = "https://blackcrown.test";

function registration(scope: string, activeScript: string | null, waitingScript?: string) {
  return {
    scope: origin + scope,
    active: activeScript ? { scriptURL: activeScript.startsWith("/") ? origin + activeScript : activeScript } : null,
    waiting: waitingScript ? { scriptURL: origin + waitingScript } : null,
    installing: null,
    unregister: vi.fn(async () => true),
  };
}

function pageStorage() {
  const contents = new Map([
    ["bc-site-v1", { shell: "old" }],
    ["ballcrown-save-cache", { save: "keep" }],
    ["quiet-valley-offline", { assets: "keep" }],
    ["bc-site-v2", { other: "keep" }],
  ]);
  const storage = {
    delete: vi.fn(async (key: string) => contents.delete(key)),
    keys: vi.fn(async () => [...contents.keys()]),
  };
  const location = { origin, href: origin + "/?bc-recovered=1#games", replace: vi.fn<(url: string) => void>(), reload: vi.fn() };
  const localStorage = { clear: vi.fn(), removeItem: vi.fn() };
  return { contents, storage, location, localStorage };
}

afterEach(() => vi.unstubAllGlobals());

describe("Legacy site worker retirement", () => {
  it("retires only the exact root site worker and cache while preserving game and unrelated registrations", async () => {
    const site = registration("/", "/sw.js");
    const firstInstall = registration("/", null, "/sw.js");
    const game = registration("/games/ballcrown/", "/games/ballcrown/sw.js");
    const nestedSiteScript = registration("/game/", "/sw.js");
    const otherRoot = registration("/", "/another-app-sw.js");
    const replacingSite = registration("/", "/sw.js", "/another-app-sw.js");
    const foreignScript = registration("/", "https://elsewhere.test/sw.js");
    const queryScript = registration("/", "/sw.js?different-worker=1");
    const registrations = [site, firstInstall, game, nestedSiteScript, otherRoot, replacingSite, foreignScript, queryScript];
    const state = pageStorage();
    vi.stubGlobal("window", { location: state.location, caches: state.storage, localStorage: state.localStorage });
    vi.stubGlobal("navigator", { serviceWorker: { getRegistrations: vi.fn(async () => registrations) } });

    await retireLegacySiteWorker();

    expect(site.unregister).toHaveBeenCalledOnce();
    expect(firstInstall.unregister).toHaveBeenCalledOnce();
    for (const untouched of registrations.slice(2)) expect(untouched.unregister).not.toHaveBeenCalled();
    expect(state.storage.delete).toHaveBeenCalledExactlyOnceWith("bc-site-v1");
    expect(state.storage.keys).not.toHaveBeenCalled();
    expect([...state.contents.keys()]).toEqual(["ballcrown-save-cache", "quiet-valley-offline", "bc-site-v2"]);
    expect(state.localStorage.clear).not.toHaveBeenCalled();
    expect(state.localStorage.removeItem).not.toHaveBeenCalled();
    expect(state.location.replace).not.toHaveBeenCalled();
    expect(state.location.reload).not.toHaveBeenCalled();
  });

  it("keeps healthy startup available when registration access fails, independently cleaning only the site cache", async () => {
    const state = pageStorage();
    vi.stubGlobal("window", { location: state.location, caches: state.storage });
    vi.stubGlobal("navigator", { serviceWorker: { getRegistrations: vi.fn(async () => { throw new Error("storage denied"); }) } });
    await expect(retireLegacySiteWorker()).resolves.toBeUndefined();
    expect(state.storage.delete).toHaveBeenCalledExactlyOnceWith("bc-site-v1");
    expect(state.contents.get("ballcrown-save-cache")).toEqual({ save: "keep" });
  });

  it("does not let a failed cache deletion prevent exact site registration retirement", async () => {
    const site = registration("/", "/sw.js");
    const state = pageStorage();
    state.storage.delete.mockRejectedValueOnce(new Error("cache denied"));
    vi.stubGlobal("window", { location: state.location, caches: state.storage });
    vi.stubGlobal("navigator", { serviceWorker: { getRegistrations: vi.fn(async () => [site]) } });
    await expect(retireLegacySiteWorker()).resolves.toBeUndefined();
    expect(site.unregister).toHaveBeenCalledOnce();
  });

  it("keeps manual pre-React recovery scoped and navigates only after explicit recovery invocation", async () => {
    const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    const inline = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
    expect(inline).toBeTruthy();
    const site = registration("/", "/sw.js");
    const game = registration("/games/ballcrown/", "/games/ballcrown/sw.js");
    const other = registration("/", "/another-app-sw.js");
    const state = pageStorage();
    const window = {
      location: state.location,
      caches: state.storage,
      history: { state: null, replaceState: vi.fn() },
      addEventListener: vi.fn(),
      __bcRecover: undefined as undefined | (() => Promise<void>),
    };
    runInNewContext(inline!, {
      window, URL,
      navigator: { serviceWorker: { getRegistrations: async () => [site, game, other] } },
      caches: state.storage,
    });
    expect(state.location.replace).not.toHaveBeenCalled();
    expect(site.unregister).not.toHaveBeenCalled();
    await window.__bcRecover!();
    expect(site.unregister).toHaveBeenCalledOnce();
    expect(game.unregister).not.toHaveBeenCalled();
    expect(other.unregister).not.toHaveBeenCalled();
    expect(state.storage.delete).toHaveBeenCalledExactlyOnceWith("bc-site-v1");
    expect(state.contents.get("ballcrown-save-cache")).toEqual({ save: "keep" });
    expect(state.location.replace).toHaveBeenCalledOnce();
    const recoveryURL = new URL(state.location.replace.mock.calls[0][0]);
    expect(recoveryURL.searchParams.has("bc-recovered")).toBe(false);
    expect(recoveryURL.searchParams.get("bc-recover")).toMatch(/^\d+$/);
    expect(recoveryURL.hash).toBe("#games");
  });

  it("ships a network-only retirement update without a fetch handler, game-cache deletion or client navigation", async () => {
    const worker = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
    const handlers = new Map<string, (event: { waitUntil: (task: Promise<unknown>) => void }) => void>();
    const state = pageStorage();
    const steps: string[] = [];
    const self = {
      addEventListener: (name: string, callback: (event: { waitUntil: (task: Promise<unknown>) => void }) => void) => handlers.set(name, callback),
      skipWaiting: vi.fn(async () => { steps.push("skipWaiting"); }),
      clients: { claim: vi.fn(async () => { steps.push("claim"); }) },
      registration: { unregister: vi.fn(async () => { steps.push("unregister"); return true; }) },
    };
    runInNewContext(worker, { self, caches: state.storage });
    expect([...handlers.keys()]).toEqual(["install", "activate"]);
    for (const event of ["install", "activate"]) {
      let work: Promise<unknown> | undefined;
      handlers.get(event)!({ waitUntil: (task) => { work = task; } });
      await work;
    }
    expect(steps).toEqual(["skipWaiting", "claim", "unregister"]);
    expect(state.storage.delete).toHaveBeenCalledExactlyOnceWith("bc-site-v1");
    expect(state.storage.keys).not.toHaveBeenCalled();
    expect(state.contents.get("quiet-valley-offline")).toEqual({ assets: "keep" });
    expect(state.contents.get("ballcrown-save-cache")).toEqual({ save: "keep" });
    expect(self.registration.unregister).toHaveBeenCalledOnce();
  });
});

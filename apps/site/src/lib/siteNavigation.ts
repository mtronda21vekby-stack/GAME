import { isExternalAppPath, normalizePath } from "../routes/routeMetadata";

export function routeLocation(location: Pick<Location, "pathname" | "search">) {
  const path = normalizePath(location.pathname);
  // Query changes may select another order or account action. Chapter hashes
  // are intentionally excluded: scrolling must not recreate the 3D runtime.
  return { path, key: path + location.search };
}

export type SiteLinkOptions = {
  target?: string;
  download?: boolean;
  external?: boolean;
  spatial?: boolean;
};

export function resolveSiteLink(
  href: string,
  currentHref: string,
  isKnownRoute: (path: string) => boolean,
  options: SiteLinkOptions = {},
): URL | null {
  if (!href.trim() || options.download || options.external || options.spatial) return null;
  if (options.target && options.target.toLowerCase() !== "_self") return null;
  try {
    const current = new URL(currentHref);
    const url = new URL(href, current);
    if (!/^https?:$/.test(url.protocol) || url.origin !== current.origin) return null;
    if (url.username || url.password) return null;
    const path = normalizePath(url.pathname);
    if (isExternalAppPath(path) || !isKnownRoute(path)) return null;
    if (path === normalizePath(current.pathname) && url.search === current.search && url.hash) return null;
    return url;
  } catch {
    return null;
  }
}

export function pushSiteLocation(url: URL): void {
  if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) return;
  const next = url.pathname + url.search + url.hash;
  const current = window.location.pathname + window.location.search + window.location.hash;
  if (next !== current) window.history.pushState(null, "", next);
  // nav() and ordinary links must notify the same subscribers.
  window.dispatchEvent(new PopStateEvent("popstate"));
  if (!url.hash) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

/** Wait for a lazy DOM page before resolving its fragment. Spatial chapters
 * retain their own scroll director and are never moved by this helper. */
export function followRouteHash(root: HTMLElement, hash: string): () => void {
  if (!hash) return () => {};
  let id: string;
  try { id = decodeURIComponent(hash.slice(1)); } catch { return () => {}; }
  let observer: MutationObserver | undefined;
  let timer = 0;
  const cleanup = () => { observer?.disconnect(); window.clearTimeout(timer); };
  const resolve = () => {
    if (window.location.hash !== hash) { cleanup(); return true; }
    if (root.querySelector("[data-bc-nexus-shell]")) { cleanup(); return true; }
    const target = document.getElementById(id);
    if (!target || !root.contains(target)) return false;
    target.scrollIntoView({ block: "start", behavior: "auto" });
    cleanup();
    return true;
  };
  if (!resolve()) {
    observer = new MutationObserver(resolve);
    observer.observe(root, { childList: true, subtree: true });
    timer = window.setTimeout(cleanup, 10000);
  }
  return cleanup;
}

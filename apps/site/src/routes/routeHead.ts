const PRODUCTION_ORIGIN = "https://blackcrown.work";

export function updateRouteHead(title: string, description: string, noIndex: boolean, path: string): void {
  document.title = title;
  const setMeta = (attribute: "name" | "property", key: string, content: string) => {
    let meta = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute(attribute, key);
      document.head.append(meta);
    }
    meta.content = content;
  };
  setMeta("name", "description", description);
  setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  // No query strings, order IDs, Telegram tokens, or fragments in metadata.
  const canonicalUrl = PRODUCTION_ORIGIN + (path.startsWith("/") ? path.split(/[?#]/)[0] : "/");
  setMeta("property", "og:url", canonicalUrl);
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = canonicalUrl;
}

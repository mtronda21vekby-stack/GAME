const LEGACY_SITE_CACHE = "bc-site-v1";

/** Retire only the old site shell; game workers, caches and saved data are separate. */
export async function retireLegacySiteWorker(): Promise<void> {
  if (typeof window === "undefined") return;
  const siteScope = new URL("/", window.location.origin).href;
  const siteScript = new URL("/sw.js", window.location.origin).href;

  await Promise.allSettled([
    (async () => {
      if (!("serviceWorker" in navigator)) return;
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(registrations.filter((registration) => {
        if (registration.scope !== siteScope) return false;
        const workers = [registration.active, registration.waiting, registration.installing].filter(Boolean);
        return workers.length > 0 && workers.every((worker) => worker!.scriptURL === siteScript);
      }).map((registration) => registration.unregister()));
    })(),
    (async () => {
      if ("caches" in window) await window.caches.delete(LEGACY_SITE_CACHE);
    })(),
  ]);
}

export function registerSW(): void {
  // Do not install a new offline shell or interrupt an already open page.
  void retireLegacySiteWorker();
}

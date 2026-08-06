const CONTROLLER_RELOAD_KEY = "bc.sw.controller-reload.v5";
const CSS_RECOVERY_KEY = "bc.css-recovery.v2";
const SITE_CACHE_PREFIX = "bc-site-";

function ensureCriticalStyles() {
  if (document.getElementById("bc-critical-runtime-styles")) return;

  const style = document.createElement("style");
  style.id = "bc-critical-runtime-styles";
  style.textContent = `
    :root{--bc-site-css-ready:1;--app-vh:100vh;--text:rgba(255,255,255,.94);--radius:22px;color-scheme:dark}
    *{box-sizing:border-box}
    html,body,#root{width:100%;min-width:0;min-height:100%;margin:0;padding:0;background:#000;color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif;-webkit-text-size-adjust:100%}
    body{overflow-x:hidden}
    img{max-width:100%;display:block}
    button,a{font:inherit}
    .bcAppShell,.bcAppContent,.bcSiteRoot{position:relative;width:100%;min-height:100%}
    .bcMatrixLayer{position:fixed;inset:0;z-index:0;pointer-events:none;background:#000;overflow:hidden}
    .bcMatrixBg{width:100vw!important;height:100%!important}
    .bcAppContent{z-index:1}
    .bcHero{position:relative;width:100%;min-height:var(--app-vh,100vh);padding:max(14px,env(safe-area-inset-top)) 14px 24px;overflow:hidden}
    .bcHeroBg{position:absolute;inset:0;pointer-events:none}
    .bcHeroAurora,.bcHeroNoise{display:none!important}
    .bcHeroVignette{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.8))}
    .bcTop{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:8px;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:rgba(8,12,20,.88)}
    .bcBrand,.bcRight{display:flex;align-items:center;gap:8px;min-width:0}
    .bcBrand,.bcAccountPill{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;border-radius:999px;min-height:40px;padding:0 12px}
    .bcBrand{border:0;background:transparent}
    .bcAccountPill{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .bcNav{display:none}
    .bcHeroGrid{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1fr);gap:14px;width:100%;margin-top:14px}
    .glassStrong{width:100%;min-width:0;border:1px solid rgba(255,255,255,.11);border-radius:var(--radius);background:rgba(8,14,24,.88);box-shadow:0 24px 80px rgba(0,0,0,.45)}
    .bcHeroCopy,.bcHeroPanel{padding:18px}
    .bcKicker{display:inline-flex;padding:8px 12px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(255,255,255,.05);font-size:12px;font-weight:800}
    .bcH1{margin:14px 0 10px;font-size:clamp(34px,10vw,48px);line-height:1;letter-spacing:-.04em;font-weight:900}
    .bcLead{margin:0;color:rgba(255,255,255,.78);font-size:15px;line-height:1.55}
    .bcCtas,.bcBadges{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}
    .bcSiteRoot button,.bcBtn{min-height:42px;max-width:100%;padding:0 14px;border-radius:13px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;font-weight:800}
    .bcPanelTitle{margin-bottom:10px;font-weight:900}
    .bcPanelRow{display:flex;gap:12px;padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:16px;background:rgba(255,255,255,.04)}
    .bcPanelRow+.bcPanelRow{margin-top:9px}
    .bcDot{flex:0 0 10px;width:10px;height:10px;margin-top:5px;border-radius:50%;background:#69dfff}
    .bcPanelH{font-weight:900}.bcPanelP{margin-top:3px;color:rgba(255,255,255,.7);line-height:1.4}
    .bcSection{position:relative;width:100%;padding:18px 14px 28px}
    .bcSectionHead,.bcCards{width:100%;max-width:980px;margin-left:auto;margin-right:auto}
    .bcSectionHead{margin-bottom:12px}.bcSectionTitle{font-size:20px;font-weight:900}.bcSectionSub{margin-top:6px;color:rgba(255,255,255,.7);line-height:1.45}
    .bcCards{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
    .bcCards>*,.bcHotCard{width:100%;min-width:0}
    @media(min-width:820px){.bcNav{display:flex}.bcAccountPill{max-width:none}}
    @media(min-width:980px){.bcHeroGrid{grid-template-columns:1.2fr .8fr}.bcCards{grid-template-columns:repeat(3,minmax(0,1fr))}.bcH1{font-size:54px}}
  `;
  document.head.appendChild(style);
}

function readSessionFlag(key: string) {
  try { return sessionStorage.getItem(key) === "1"; } catch { return false; }
}

function writeSessionFlag(key: string) {
  try { sessionStorage.setItem(key, "1"); } catch { /* ignored */ }
}

function clearSessionFlag(key: string) {
  try { sessionStorage.removeItem(key); } catch { /* ignored */ }
}

function isSiteCssReady() {
  return window.getComputedStyle(document.documentElement).getPropertyValue("--bc-site-css-ready").trim() === "1";
}

async function recoverFromMissingCss() {
  ensureCriticalStyles();
  if (readSessionFlag(CSS_RECOVERY_KEY)) return;
  writeSessionFlag(CSS_RECOVERY_KEY);

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch { /* continue */ }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith(SITE_CACHE_PREFIX)).map((key) => caches.delete(key)));
    }
  } catch { /* continue */ }
}

function scheduleSiteCssHealthCheck() {
  const check = () => window.setTimeout(() => {
    if (isSiteCssReady()) {
      clearSessionFlag(CSS_RECOVERY_KEY);
      clearSessionFlag(CONTROLLER_RELOAD_KEY);
      return;
    }
    ensureCriticalStyles();
    void recoverFromMissingCss();
  }, 250);

  if (document.readyState === "complete") check();
  else window.addEventListener("load", check, { once: true });

  window.addEventListener("error", (event) => {
    const target = event.target;
    if (target instanceof HTMLLinkElement && target.relList.contains("stylesheet")) {
      ensureCriticalStyles();
      void recoverFromMissingCss();
    }
  }, true);
}

function reloadOnceAfterControllerChange() {
  try {
    if (sessionStorage.getItem(CONTROLLER_RELOAD_KEY) === "1") return;
    sessionStorage.setItem(CONTROLLER_RELOAD_KEY, "1");
    window.location.reload();
  } catch { window.location.reload(); }
}

export function registerSW() {
  ensureCriticalStyles();
  scheduleSiteCssHealthCheck();
  if (!("serviceWorker" in navigator)) return;

  const register = () => {
    void (async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
        navigator.serviceWorker.addEventListener("controllerchange", reloadOnceAfterControllerChange, { once: true });
        await registration.update();
        if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
      } catch { /* site remains usable */ }
    })();
  };

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}

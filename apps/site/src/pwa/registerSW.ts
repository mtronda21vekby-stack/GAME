const CONTROLLER_RELOAD_KEY = "bc.sw.controller-reload.v4";
const CSS_RECOVERY_KEY = "bc.css-recovery.v1";
const SITE_CACHE_PREFIX = "bc-site-";

function readSessionFlag(key: string) {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeSessionFlag(key: string) {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // Private browsing can restrict session storage.
  }
}

function clearSessionFlag(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore storage restrictions.
  }
}

function isSiteCssReady() {
  const marker = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--bc-site-css-ready")
    .trim();

  return marker === "1";
}

function showCssRecoveryFailure() {
  if (document.getElementById("bc-css-recovery-alert")) return;

  const panel = document.createElement("section");
  panel.id = "bc-css-recovery-alert";
  panel.setAttribute("role", "alert");
  Object.assign(panel.style, {
    position: "fixed",
    inset: "max(18px, env(safe-area-inset-top, 0px)) 18px auto",
    zIndex: "2147483647",
    boxSizing: "border-box",
    maxWidth: "520px",
    margin: "0 auto",
    padding: "20px",
    border: "1px solid rgba(91, 226, 255, 0.38)",
    borderRadius: "18px",
    background: "rgba(2, 8, 14, 0.97)",
    color: "#effbff",
    boxShadow: "0 24px 90px rgba(0, 0, 0, 0.78)",
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    lineHeight: "1.45",
  });

  const title = document.createElement("strong");
  title.textContent = "BlackCrown не загрузил стили";
  Object.assign(title.style, { display: "block", fontSize: "18px", marginBottom: "8px" });

  const copy = document.createElement("div");
  copy.textContent = "Старый кэш Safari всё ещё отдаёт неполную версию сайта. Повтори очистку и загрузку.";
  Object.assign(copy.style, { color: "rgba(231, 246, 255, 0.72)", fontSize: "14px" });

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Очистить кэш и перезапустить";
  Object.assign(button.style, {
    minHeight: "46px",
    marginTop: "16px",
    padding: "0 16px",
    border: "1px solid rgba(0, 217, 255, 0.52)",
    borderRadius: "13px",
    background: "linear-gradient(135deg, rgba(0, 55, 72, 0.98), rgba(0, 110, 134, 0.94))",
    color: "#effeff",
    font: "inherit",
    fontWeight: "800",
  });

  button.addEventListener("click", () => {
    clearSessionFlag(CSS_RECOVERY_KEY);
    void recoverFromMissingCss();
  });

  panel.append(title, copy, button);
  document.body.appendChild(panel);
}

async function recoverFromMissingCss() {
  if (readSessionFlag(CSS_RECOVERY_KEY)) {
    showCssRecoveryFailure();
    return;
  }

  writeSessionFlag(CSS_RECOVERY_KEY);

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch {
    // Continue even when service-worker cleanup is unavailable.
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith(SITE_CACHE_PREFIX)).map((key) => caches.delete(key)));
    }
  } catch {
    // Continue even when Cache Storage is unavailable.
  }

  const url = new URL(window.location.href);
  url.searchParams.set("bc-css-recover", Date.now().toString());
  window.location.replace(`${url.pathname}${url.search}${url.hash}`);
}

function scheduleSiteCssHealthCheck() {
  const check = () => {
    window.setTimeout(() => {
      if (isSiteCssReady()) {
        clearSessionFlag(CSS_RECOVERY_KEY);
        clearSessionFlag(CONTROLLER_RELOAD_KEY);
        return;
      }

      void recoverFromMissingCss();
    }, 350);
  };

  if (document.readyState === "complete") check();
  else window.addEventListener("load", check, { once: true });

  window.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (target instanceof HTMLLinkElement && target.relList.contains("stylesheet")) {
        void recoverFromMissingCss();
      }
    },
    true
  );
}

function reloadOnceAfterControllerChange() {
  try {
    if (sessionStorage.getItem(CONTROLLER_RELOAD_KEY) === "1") return;
    sessionStorage.setItem(CONTROLLER_RELOAD_KEY, "1");
    window.location.reload();
  } catch {
    window.location.reload();
  }
}

export function registerSW() {
  scheduleSiteCssHealthCheck();

  if (!("serviceWorker" in navigator)) return;

  const register = () => {
    void (async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });

        navigator.serviceWorker.addEventListener("controllerchange", reloadOnceAfterControllerChange, {
          once: true,
        });

        await registration.update();

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      } catch {
        // The website must remain usable even when service workers are unavailable.
      }
    })();
  };

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}

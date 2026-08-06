const CONTROLLER_RELOAD_KEY = "bc.sw.controller-reload.v3";

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
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener(
    "load",
    () => {
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
    },
    { once: true }
  );
}

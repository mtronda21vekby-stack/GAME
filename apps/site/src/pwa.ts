// apps/site/src/pwa.ts
export function registerPwa() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

      // тихо проверяем апдейты
      setInterval(() => {
        reg.update().catch(() => {});
      }, 60_000);

      // если пришёл новый SW — активируем при следующем открытии
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          // installed + уже есть контроллер => новая версия готова
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            // Никаких alert — премиум “тихо”
            // Можно добавить маленький unobtrusive toast позже, если нужно
          }
        });
      });
    } catch {
      // ignore
    }
  });
}

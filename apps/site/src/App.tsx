import React from "react";
import MatrixBackground from "./components/MatrixBackground";
import { Router } from "./routes/Router";

function syncAppVh() {
  const h = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-vh", `${Math.round(h)}px`);
}

function measureTopBar() {
  const root = document.documentElement;
  const el = document.querySelector<HTMLElement>(".bcTop");
  if (!el) return;

  const rect = el.getBoundingClientRect();
  // высота реального бара (для точного сдвига)
  root.style.setProperty("--bc-topbar-h", `${Math.ceil(rect.height)}px`);
}

function setupAutoHideTopBar() {
  const root = document.documentElement;

  let lastY = window.scrollY || 0;
  let hidden = false;
  let ticking = false;

  const MIN_Y_TO_HIDE = 72; // пока вверху — не прячем
  const HIDE_DY = 10;       // вниз быстрее — прячем
  const SHOW_DY = -10;      // вверх быстрее — показываем

  const setHidden = (next: boolean) => {
    if (hidden === next) return;
    hidden = next;
    root.classList.toggle("bcChromeHidden", hidden);
  };

  const update = () => {
    ticking = false;

    const y = window.scrollY || 0;
    const dy = y - lastY;
    lastY = y;

    if (y < 16) {
      setHidden(false);
      return;
    }

    if (y > MIN_Y_TO_HIDE && dy > HIDE_DY) setHidden(true);
    else if (dy < SHOW_DY) setHidden(false);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  // первичный замер + на ресайз
  measureTopBar();
  const onResize = () => measureTopBar();
  window.addEventListener("resize", onResize);

  // если ResizeObserver доступен — подхватим изменения размера bcTop (шрифты/локаль и т.д.)
  let ro: ResizeObserver | null = null;
  const topEl = document.querySelector<HTMLElement>(".bcTop");
  if (topEl && "ResizeObserver" in window) {
    ro = new ResizeObserver(() => measureTopBar());
    ro.observe(topEl);
  }

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    ro?.disconnect();
  };
}

export function App() {
  React.useEffect(() => {
    syncAppVh();

    const onResize = () => syncAppVh();
    const vv = window.visualViewport;

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    vv?.addEventListener("resize", onResize);

    // автоскрытие верхней панели (как в Google)
    const cleanupAutoHide = setupAutoHideTopBar();

    return () => {
      cleanupAutoHide();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      vv?.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="bcAppShell">
      <div className="bcMatrixLayer" aria-hidden="true">
        <MatrixBackground />
      </div>

      <div className="bcAppContent">
        <Router />
      </div>
    </div>
  );
}

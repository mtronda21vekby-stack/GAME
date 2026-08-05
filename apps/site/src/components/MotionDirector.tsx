import React from "react";

const REVEAL_SELECTOR = [
  ".bcHeroCopy",
  ".bcHeroPanel",
  ".bcSectionHead",
  ".bcHotCard",
  ".bcSection .glassStrong",
].join(",");

const TILT_SELECTOR = [
  ".bcHotCard",
  ".bcHeroPanel",
  '.bcRouteView[data-route="/store"] [role="button"].glassStrong',
].join(",");

const BUTTON_SELECTOR = ".bcSiteRoot button.bc-focus.bc-motion";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Progressive-enhancement motion layer.
 * - reveal-on-scroll through IntersectionObserver
 * - subtle pointer tilt on fine pointers only
 * - site-local button presentation classes
 * - a CSS-driven page progress indicator
 * - a decorative desktop pointer aura
 *
 * The page remains fully usable when JavaScript, observers, or motion are unavailable.
 */
export function MotionDirector() {
  React.useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    root.classList.add("bcMotionReady");

    const registered = new WeakSet<Element>();
    const registeredButtons = new WeakSet<HTMLButtonElement>();
    let revealObserver: IntersectionObserver | null = null;

    if (!reducedMotion.matches && "IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-visible");
            revealObserver?.unobserve(entry.target);
          }
        },
        {
          threshold: 0.12,
          rootMargin: "0px 0px -9% 0px",
        }
      );
    }

    const registerRevealNodes = (scope: ParentNode) => {
      const nodes: HTMLElement[] = [];

      if (scope instanceof HTMLElement && scope.matches(REVEAL_SELECTOR)) {
        nodes.push(scope);
      }

      nodes.push(...Array.from(scope.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)));

      nodes.forEach((node, index) => {
        if (registered.has(node)) return;
        registered.add(node);

        node.classList.add("bcReveal");
        node.style.setProperty("--bc-reveal-order", String(index % 7));

        if (!revealObserver || reducedMotion.matches) {
          node.classList.add("is-visible");
          return;
        }

        revealObserver.observe(node);
      });
    };

    const registerButtonNodes = (scope: ParentNode) => {
      const buttons: HTMLButtonElement[] = [];

      if (scope instanceof HTMLButtonElement && scope.matches(BUTTON_SELECTOR)) {
        buttons.push(scope);
      }

      buttons.push(...Array.from(scope.querySelectorAll<HTMLButtonElement>(BUTTON_SELECTOR)));

      for (const button of buttons) {
        if (registeredButtons.has(button)) continue;
        registeredButtons.add(button);

        const background = button.style.background.toLowerCase();
        const variant = background.includes("linear-gradient")
          ? "primary"
          : background.includes("transparent")
            ? "ghost"
            : "secondary";
        const size = button.style.fontSize === "15.5px" ? "lg" : "md";

        button.classList.add("bcBtn", `bcBtn--${variant}`, `bcBtn--${size}`);
        button.dataset.variant = variant;
        button.dataset.size = size;
      }
    };

    const registerScope = (scope: ParentNode) => {
      registerRevealNodes(scope);
      registerButtonNodes(scope);
    };

    registerScope(document);

    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const addedNode of Array.from(record.addedNodes)) {
          if (addedNode instanceof HTMLElement) registerScope(addedNode);
        }
      }
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    let activeTilt: HTMLElement | null = null;

    const resetTilt = (element: HTMLElement | null) => {
      if (!element) return;
      element.style.removeProperty("--bc-tilt-x");
      element.style.removeProperty("--bc-tilt-y");
      element.style.removeProperty("--bc-glow-x");
      element.style.removeProperty("--bc-glow-y");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion.matches || !finePointer.matches) return;

      const origin = event.target instanceof Element ? event.target : null;
      const target = origin?.closest<HTMLElement>(TILT_SELECTOR) ?? null;

      if (!target) {
        resetTilt(activeTilt);
        activeTilt = null;
        return;
      }

      if (activeTilt !== target) {
        resetTilt(activeTilt);
        activeTilt = target;
      }

      const rect = target.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);

      target.style.setProperty("--bc-tilt-x", `${((0.5 - y) * 4.5).toFixed(2)}deg`);
      target.style.setProperty("--bc-tilt-y", `${((x - 0.5) * 5.5).toFixed(2)}deg`);
      target.style.setProperty("--bc-glow-x", `${(x * 100).toFixed(1)}%`);
      target.style.setProperty("--bc-glow-y", `${(y * 100).toFixed(1)}%`);
    };

    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      resetTilt(activeTilt);
      activeTilt = null;
    };

    let progressFrame = 0;

    const updateProgress = () => {
      progressFrame = 0;
      const documentHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = clamp((window.scrollY || 0) / documentHeight, 0, 1);
      root.style.setProperty("--bc-scroll-progress", progress.toFixed(5));
    };

    const requestProgressUpdate = () => {
      if (progressFrame) return;
      progressFrame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("scroll", requestProgressUpdate, { passive: true });
    window.addEventListener("resize", requestProgressUpdate, { passive: true });

    return () => {
      root.classList.remove("bcMotionReady");
      root.style.removeProperty("--bc-scroll-progress");

      resetTilt(activeTilt);
      revealObserver?.disconnect();
      mutationObserver.disconnect();

      if (progressFrame) window.cancelAnimationFrame(progressFrame);

      document.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("scroll", requestProgressUpdate);
      window.removeEventListener("resize", requestProgressUpdate);
    };
  }, []);

  return (
    <>
      <div className="bcScrollProgress" aria-hidden="true">
        <span />
      </div>

      <div className="bcCursor" aria-hidden="true">
        <span className="bcCursor__ring" />
        <span className="bcCursor__dot" />
      </div>
    </>
  );
}

export default MotionDirector;

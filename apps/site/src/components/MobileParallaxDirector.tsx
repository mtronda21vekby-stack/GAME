import React from "react";

type MobileParallaxTarget = {
  element: HTMLElement;
  amplitude: number;
  scale: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function heroExitProgress(rect: DOMRect, viewportHeight: number) {
  const distance = -rect.top - viewportHeight * 0.04;
  const travel = Math.max(viewportHeight * 0.82, rect.height * 0.72);
  return clamp(distance / travel, 0, 1);
}

/**
 * Lightweight mobile-only depth controller.
 *
 * Safari receives one geometry pass per animation frame while scrolling and
 * only three visual targets are transformed: the Crown Core and the two world
 * artworks. No pointer camera, no continuous interpolation loop and no service
 * section transforms.
 */
export function MobileParallaxDirector() {
  React.useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) return;

    root.classList.add("bcPremiumParallax", "bcMobileParallaxLite");

    let targets: MobileParallaxTarget[] = [];
    let home: HTMLElement | null = null;
    let hero: HTMLElement | null = null;
    let frame = 0;
    let refreshQueued = false;
    let viewportHeight = Math.max(1, window.visualViewport?.height ?? window.innerHeight);

    const clearTarget = (target: MobileParallaxTarget) => {
      target.element.style.removeProperty("--bc-parallax-x");
      target.element.style.removeProperty("--bc-parallax-y");
      target.element.style.removeProperty("--bc-parallax-rx");
      target.element.style.removeProperty("--bc-parallax-ry");
      target.element.style.removeProperty("--bc-parallax-scale");
    };

    const refreshTargets = () => {
      refreshQueued = false;
      targets.forEach(clearTarget);

      home = document.querySelector<HTMLElement>(".bcHomeV3");
      hero = home?.querySelector<HTMLElement>(".bcV3Hero") ?? null;

      if (!home) {
        targets = [];
        return;
      }

      const next: MobileParallaxTarget[] = [];
      const crown = home.querySelector<HTMLElement>(".bcV3Hero__core[data-bc-parallax]");
      if (crown) next.push({ element: crown, amplitude: 11, scale: 0.006 });

      home.querySelectorAll<HTMLElement>(".bcWorldStageV2__visual img[data-bc-parallax]").forEach((image) => {
        const reactor = Boolean(image.closest('.bcWorldStageV2[data-tone="reactor"]'));
        next.push({ element: image, amplitude: reactor ? 14 : 17, scale: 0.004 });
      });

      targets = next;
      requestTick();
    };

    const queueRefresh = () => {
      if (refreshQueued) return;
      refreshQueued = true;
      queueMicrotask(refreshTargets);
    };

    const tick = () => {
      frame = 0;

      for (const target of targets) {
        const rect = target.element.getBoundingClientRect();
        const center = rect.top + rect.height * 0.5;
        const delta = clamp((viewportHeight * 0.5 - center) / Math.max(viewportHeight, rect.height), -1, 1);
        const presence = 1 - Math.min(1, Math.abs(delta));

        target.element.style.setProperty("--bc-parallax-x", "0px");
        target.element.style.setProperty("--bc-parallax-y", `${(delta * target.amplitude).toFixed(2)}px`);
        target.element.style.setProperty("--bc-parallax-rx", "0deg");
        target.element.style.setProperty("--bc-parallax-ry", "0deg");
        target.element.style.setProperty("--bc-parallax-scale", (presence * target.scale).toFixed(5));
      }

      if (home && hero) {
        const exit = heroExitProgress(hero.getBoundingClientRect(), viewportHeight);
        home.style.setProperty("--bc-hero-core-scale-offset", (-0.045 * exit).toFixed(5));
        home.style.setProperty("--bc-hero-core-shift", `${(8 * exit).toFixed(2)}px`);
        home.style.setProperty("--bc-hero-core-opacity", (1 - 0.08 * exit).toFixed(5));
      }
    };

    function requestTick() {
      if (frame) return;
      frame = window.requestAnimationFrame(tick);
    }

    const onScroll = () => requestTick();
    const onResize = () => {
      viewportHeight = Math.max(1, window.visualViewport?.height ?? window.innerHeight);
      requestTick();
    };

    const mutationObserver = new MutationObserver(queueRefresh);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    refreshTargets();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onResize, { passive: true });

    return () => {
      root.classList.remove("bcPremiumParallax", "bcMobileParallaxLite");
      mutationObserver.disconnect();
      targets.forEach(clearTarget);
      home?.style.removeProperty("--bc-hero-core-scale-offset");
      home?.style.removeProperty("--bc-hero-core-shift");
      home?.style.removeProperty("--bc-hero-core-opacity");
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}

export default MobileParallaxDirector;

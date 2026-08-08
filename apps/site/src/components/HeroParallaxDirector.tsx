import React from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Dedicated mobile camera for the premium BlackCrown Hero.
 *
 * The generic mobile director intentionally sheds non-essential layers during
 * fast flicks. The new Hero uses isolated bcHeroConcept classes, so it needs an
 * explicit camera that remains visible even during a fast iPhone scroll.
 *
 * One RAF is scheduled per scroll event. Only transform + opacity are written.
 */
export function HeroParallaxDirector() {
  React.useEffect(() => {
    const mobile = window.matchMedia("(max-width: 820px), (pointer: coarse)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mobile.matches || reduced.matches) return;

    let hero: HTMLElement | null = null;
    let copy: HTMLElement | null = null;
    let art: HTMLElement | null = null;
    let image: HTMLImageElement | null = null;
    let cyan: HTMLElement | null = null;
    let violet: HTMLElement | null = null;
    let city: HTMLElement | null = null;
    let frame = 0;
    let refreshQueued = false;

    const clear = () => {
      for (const element of [copy, art, image, cyan, violet, city]) {
        if (!element) continue;
        element.style.removeProperty("transform");
        element.style.removeProperty("opacity");
        element.style.removeProperty("will-change");
      }
    };

    const refresh = () => {
      refreshQueued = false;
      clear();
      hero = document.querySelector<HTMLElement>(".bcHeroConcept");
      copy = hero?.querySelector<HTMLElement>(".bcHeroConcept__copy") ?? null;
      art = hero?.querySelector<HTMLElement>(".bcHeroConcept__art") ?? null;
      image = hero?.querySelector<HTMLImageElement>(".bcHeroConcept__artImage") ?? null;
      cyan = hero?.querySelector<HTMLElement>(".bcHeroConcept__ambient--cyan") ?? null;
      violet = hero?.querySelector<HTMLElement>(".bcHeroConcept__ambient--violet") ?? null;
      city = hero?.querySelector<HTMLElement>(".bcHeroConcept__city") ?? null;

      for (const element of [copy, art, image, cyan, violet, city]) {
        if (element) element.style.setProperty("will-change", "transform, opacity");
      }
      requestTick();
    };

    const queueRefresh = () => {
      if (refreshQueued) return;
      refreshQueued = true;
      queueMicrotask(refresh);
    };

    const tick = () => {
      frame = 0;
      if (!hero) return;

      const rect = hero.getBoundingClientRect();
      const viewport = Math.max(1, window.innerHeight);

      // Stop doing compositor work once the scene is far outside the viewport.
      if (rect.bottom < -viewport * 0.18 || rect.top > viewport * 1.18) return;

      const travel = Math.max(viewport * 0.82, rect.height * 0.62);
      const progress = clamp(-rect.top / travel, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);

      // Far atmosphere moves least; the crown stays closest to the camera.
      const violetY = eased * 24;
      const cyanY = eased * 44;
      const cityY = eased * 62;
      const copyY = eased * 30;
      const artY = eased * 78;
      const imageY = eased * 42;

      if (violet) {
        violet.style.transform = `translate3d(0, ${violetY.toFixed(2)}px, 0) scale(${(1 + eased * 0.012).toFixed(4)})`;
        violet.style.opacity = (1 - eased * 0.14).toFixed(4);
      }
      if (cyan) {
        cyan.style.transform = `translate3d(0, ${cyanY.toFixed(2)}px, 0) scale(${(1 + eased * 0.018).toFixed(4)})`;
        cyan.style.opacity = (1 - eased * 0.1).toFixed(4);
      }
      if (city) {
        city.style.transform = `translate3d(0, ${cityY.toFixed(2)}px, 0) scale(${(1 + eased * 0.025).toFixed(4)})`;
      }
      if (copy) {
        copy.style.transform = `translate3d(0, ${copyY.toFixed(2)}px, 0) scale(${(1 - eased * 0.018).toFixed(4)})`;
        copy.style.opacity = (1 - eased * 0.5).toFixed(4);
      }
      if (art) {
        art.style.transform = `translate3d(0, ${artY.toFixed(2)}px, 0) scale(${(1 + eased * 0.035).toFixed(4)})`;
        art.style.opacity = (1 - eased * 0.12).toFixed(4);
      }
      if (image) {
        // Preserve the image's -50% horizontal centering while creating an
        // additional near-camera plane inside the moving art container.
        image.style.transform = `translate3d(-50%, ${imageY.toFixed(2)}px, 0) scale(${(1 + eased * 0.075).toFixed(4)})`;
      }
    };

    function requestTick() {
      if (frame) return;
      frame = window.requestAnimationFrame(tick);
    }

    const onScroll = () => requestTick();
    const onResize = () => requestTick();

    const observer = new MutationObserver(queueRefresh);
    observer.observe(document.querySelector(".bcAppContent") ?? document.body, {
      childList: true,
      subtree: false,
    });

    refresh();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      clear();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}

export default HeroParallaxDirector;

import React from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

/**
 * Dedicated BlackCrown Hero camera.
 *
 * This scene owns the Hero on every device so generic parallax runtimes cannot
 * flatten the crown into a tiny generic transform. Scroll drives the crown like
 * a 3D presentation object: depth, scale and perspective rotation. Desktop also
 * gets a very small pointer bias; mobile remains scroll-only for stability.
 */
export function HeroParallaxDirector() {
  React.useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const coarse = window.matchMedia("(max-width: 820px), (pointer: coarse)");

    let hero: HTMLElement | null = null;
    let copy: HTMLElement | null = null;
    let art: HTMLElement | null = null;
    let image: HTMLImageElement | null = null;
    let cyan: HTMLElement | null = null;
    let violet: HTMLElement | null = null;
    let city: HTMLElement | null = null;
    let frame = 0;
    let refreshQueued = false;
    let pointerX = 0;
    let pointerY = 0;

    const elements = () => [copy, art, image, cyan, violet, city];

    const clear = () => {
      for (const element of elements()) {
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

      for (const element of elements()) {
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
      if (rect.bottom < -viewport * 0.2 || rect.top > viewport * 1.2) return;

      const travel = Math.max(viewport * 0.9, rect.height * 0.7);
      const progress = clamp(-rect.top / travel, 0, 1);
      const eased = smoothstep(progress);
      const mobile = coarse.matches;

      const pointerScale = mobile ? 0 : 1;
      const px = pointerX * pointerScale;
      const py = pointerY * pointerScale;

      const violetY = eased * (mobile ? 26 : 34);
      const cyanY = eased * (mobile ? 44 : 58);
      const cityY = eased * (mobile ? 66 : 86);
      const copyY = eased * (mobile ? 28 : 38);
      const artY = eased * (mobile ? 82 : 106);

      if (violet) {
        violet.style.transform = `translate3d(${(-px * 8).toFixed(2)}px, ${(violetY - py * 4).toFixed(2)}px, 0) scale(${(1 + eased * 0.015).toFixed(4)})`;
        violet.style.opacity = (1 - eased * 0.18).toFixed(4);
      }
      if (cyan) {
        cyan.style.transform = `translate3d(${(px * 10).toFixed(2)}px, ${(cyanY + py * 5).toFixed(2)}px, 0) scale(${(1 + eased * 0.022).toFixed(4)})`;
        cyan.style.opacity = (1 - eased * 0.13).toFixed(4);
      }
      if (city) {
        city.style.transform = `translate3d(${(-px * 5).toFixed(2)}px, ${cityY.toFixed(2)}px, 0) scale(${(1 + eased * 0.032).toFixed(4)})`;
      }
      if (copy) {
        copy.style.transform = `translate3d(${(px * 3).toFixed(2)}px, ${copyY.toFixed(2)}px, 0) scale(${(1 - eased * 0.025).toFixed(4)})`;
        copy.style.opacity = (1 - eased * 0.62).toFixed(4);
      }
      if (art) {
        const yaw = (mobile ? -7 : -9) + eased * (mobile ? 34 : 48) + px * 4;
        const pitch = 4 - eased * (mobile ? 8 : 11) - py * 2.5;
        const roll = -1.5 + eased * 3.5;
        const scale = 1 + eased * (mobile ? 0.08 : 0.12);
        art.style.transform = `translate3d(${(px * 10).toFixed(2)}px, ${artY.toFixed(2)}px, 0) rotateX(${pitch.toFixed(2)}deg) rotateY(${yaw.toFixed(2)}deg) rotateZ(${roll.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        art.style.opacity = (1 - eased * 0.16).toFixed(4);
      }
      if (image) {
        const localYaw = eased * (mobile ? 16 : 22) + px * 3;
        const localScale = 1 + eased * (mobile ? 0.12 : 0.17);
        image.style.transform = `translate3d(-50%, ${(eased * (mobile ? 34 : 44)).toFixed(2)}px, 42px) rotateY(${localYaw.toFixed(2)}deg) scale(${localScale.toFixed(4)})`;
      }
    };

    function requestTick() {
      if (frame) return;
      frame = window.requestAnimationFrame(tick);
    }

    const onScroll = () => requestTick();
    const onResize = () => requestTick();
    const onPointerMove = (event: PointerEvent) => {
      if (coarse.matches) return;
      pointerX = clamp((event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2, -1, 1);
      pointerY = clamp((event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2, -1, 1);
      requestTick();
    };

    const observer = new MutationObserver(queueRefresh);
    observer.observe(document.querySelector(".bcAppContent") ?? document.body, {
      childList: true,
      subtree: false,
    });

    refresh();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      clear();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return null;
}

export default HeroParallaxDirector;

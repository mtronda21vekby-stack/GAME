import { useEffect, type RefObject } from "react";

export const PLATFORM_DEPTH_EVENT = "bc:platform-depth";
export type PlatformDepthFrame = { x: number; y: number; scroll: number; compact: boolean; reduced: boolean };

export function prefersStaticPlatform(media: MediaQueryList) {
  return media.matches || document.documentElement.dataset.reducedMotion === "1";
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** One event-driven compositor for the page. Layout is measured only after layout changes. */
export function usePlatformParallax(rootRef: RefObject<HTMLElement>, contentKey = "", paused = false) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactQuery = window.matchMedia("(max-width: 760px)");
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 761px)");
    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax-scene]")).map(node => ({
      node,
      hero: node.dataset.parallaxScene === "hero",
      layers: Array.from(node.querySelectorAll<HTMLElement>("[data-parallax-layer]")).map(element => ({
        element,
        scroll: Number(element.dataset.parallaxScroll || 0),
        pointer: Number(element.dataset.parallaxPointer || 0),
        lastX: NaN,
        lastY: NaN,
      })),
      top: 0, left: 0, width: 1, height: 1, active: false,
      scroll: 0, targetScroll: 0, x: 0, y: 0, targetX: 0, targetY: 0,
    }));
    let compact = compactQuery.matches;
    let reduced = paused || prefersStaticPlatform(motionQuery);
    let viewportHeight = window.innerHeight;
    let scrollY = window.scrollY;
    let frame = 0;
    let measureFrame = 0;
    let lastFrame = 0;
    let disposed = false;

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
    }

    function writeScene(scene: typeof scenes[number]) {
      const strength = compact ? 0.42 : 1;
      for (const layer of scene.layers) {
        const x = reduced ? 0 : scene.x * layer.pointer;
        const y = reduced ? 0 : scene.scroll * layer.scroll * strength + scene.y * layer.pointer * 0.65;
        // Skip identical style writes, including when a scene has settled.
        const roundedX = Math.round(x * 100) / 100;
        const roundedY = Math.round(y * 100) / 100;
        if (roundedX !== layer.lastX) layer.element.style.setProperty("--depth-x", `${roundedX}px`);
        if (roundedY !== layer.lastY) layer.element.style.setProperty("--depth-y", `${roundedY}px`);
        layer.lastX = roundedX;
        layer.lastY = roundedY;
      }
      if (scene.hero) {
        scene.node.dispatchEvent(new CustomEvent<PlatformDepthFrame>(PLATFORM_DEPTH_EVENT, {
          detail: { x: scene.x, y: scene.y, scroll: scene.scroll, compact, reduced },
        }));
      }
    }

    function updateTargets() {
      for (const scene of scenes) {
        scene.targetScroll = reduced ? 0 : scene.hero
          ? clamp((scrollY - Math.max(0, scene.top - 120)) / scene.height, 0, 1)
          : clamp((viewportHeight / 2 - (scene.top + scene.height / 2 - scrollY)) / ((viewportHeight + scene.height) / 2), -1, 1);
      }
    }

    function tick(now: number) {
      frame = 0;
      if (disposed || document.hidden || reduced) return;
      const delta = lastFrame ? now - lastFrame : 1000 / 60;
      // Touch layouts update at 30fps and use less travel, without intercepting scroll.
      if (compact && lastFrame && delta < 1000 / 30 - 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      lastFrame = now;
      const blend = 1 - Math.exp(-Math.min(delta, 100) / (compact ? 65 : 105));
      let settling = false;
      for (const scene of scenes) {
        if (!scene.active) continue;
        const moving = Math.abs(scene.scroll - scene.targetScroll) > 0.0008 ||
          Math.abs(scene.x - scene.targetX) > 0.002 || Math.abs(scene.y - scene.targetY) > 0.002;
        scene.scroll = moving ? scene.scroll + (scene.targetScroll - scene.scroll) * blend : scene.targetScroll;
        scene.x = moving ? scene.x + (scene.targetX - scene.x) * blend : scene.targetX;
        scene.y = moving ? scene.y + (scene.targetY - scene.y) * blend : scene.targetY;
        writeScene(scene);
        settling ||= moving;
      }
      if (settling) frame = requestAnimationFrame(tick);
      else lastFrame = 0;
    }

    function schedule() {
      if (!frame && !disposed && !reduced && !document.hidden && scenes.some(scene => scene.active)) {
        frame = requestAnimationFrame(tick);
      }
    }

    function measure() {
      measureFrame = 0;
      if (disposed) return;
      viewportHeight = window.innerHeight;
      scrollY = window.scrollY;
      for (const scene of scenes) {
        const rect = scene.node.getBoundingClientRect();
        scene.top = rect.top + scrollY;
        scene.left = rect.left;
        scene.width = Math.max(1, rect.width);
        scene.height = Math.max(1, rect.height);
        scene.active = rect.bottom > -120 && rect.top < viewportHeight + 120;
        scene.node.toggleAttribute("data-depth-active", scene.active && !reduced);
      }
      updateTargets();
      for (const scene of scenes) {
        // Match the first frame to its position, including deep links into the catalogue.
        scene.scroll = scene.targetScroll;
        writeScene(scene);
      }
      schedule();
    }

    function queueMeasure() {
      if (!measureFrame && !disposed) measureFrame = requestAnimationFrame(measure);
    }

    function onScroll() {
      scrollY = window.scrollY;
      updateTargets();
      schedule();
    }

    function onPointerMove(event: PointerEvent) {
      if (reduced || !pointerQuery.matches || event.pointerType !== "mouse") return;
      for (const scene of scenes) {
        const localY = event.clientY - (scene.top - scrollY);
        const inside = scene.active && event.clientX >= scene.left && event.clientX <= scene.left + scene.width && localY >= 0 && localY <= scene.height;
        scene.targetX = inside ? clamp((event.clientX - scene.left) / scene.width * 2 - 1, -1, 1) : 0;
        scene.targetY = inside ? clamp(localY / scene.height * 2 - 1, -1, 1) : 0;
      }
      schedule();
    }

    function resetPointer() {
      for (const scene of scenes) scene.targetX = scene.targetY = 0;
      schedule();
    }

    function onPreferenceChange() {
      stop();
      compact = compactQuery.matches;
      reduced = paused || prefersStaticPlatform(motionQuery);
      root!.dataset.parallaxState = reduced ? "reduced" : "enabled";
      for (const scene of scenes) scene.x = scene.y = scene.targetX = scene.targetY = 0;
      measure();
    }

    function onVisibilityChange() {
      if (document.hidden) stop();
      else queueMeasure();
    }

    const intersectionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const scene = scenes.find(item => item.node === entry.target);
        if (!scene) continue;
        scene.active = entry.isIntersecting;
        scene.node.toggleAttribute("data-depth-active", scene.active && !reduced);
        if (scene.active) {
          scene.scroll = scene.targetScroll;
          writeScene(scene);
        }
      }
      schedule();
    }, { rootMargin: "120px" });
    const resizeObserver = new ResizeObserver(queueMeasure);
    const preferenceObserver = new MutationObserver(onPreferenceChange);
    for (const scene of scenes) intersectionObserver.observe(scene.node);
    resizeObserver.observe(root);
    preferenceObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-reduced-motion"] });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", queueMeasure, { passive: true });
    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerleave", resetPointer);
    root.addEventListener("load", queueMeasure, true);
    document.addEventListener("visibilitychange", onVisibilityChange);
    motionQuery.addEventListener("change", onPreferenceChange);
    compactQuery.addEventListener("change", onPreferenceChange);
    pointerQuery.addEventListener("change", resetPointer);
    onPreferenceChange();

    return () => {
      disposed = true;
      stop();
      cancelAnimationFrame(measureFrame);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      preferenceObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", queueMeasure);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", resetPointer);
      root.removeEventListener("load", queueMeasure, true);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onPreferenceChange);
      compactQuery.removeEventListener("change", onPreferenceChange);
      pointerQuery.removeEventListener("change", resetPointer);
      delete root.dataset.parallaxState;
      for (const scene of scenes) {
        scene.node.removeAttribute("data-depth-active");
        for (const { element } of scene.layers) {
          element.style.removeProperty("--depth-x");
          element.style.removeProperty("--depth-y");
        }
      }
    };
  }, [rootRef, contentKey, paused]);
}

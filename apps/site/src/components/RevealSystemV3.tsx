import React from "react";

const REVEAL_SELECTOR = [
  ".bcV3Hero__copy",
  ".bcV3Hero__core",
  ".bcWorldsV2__intro",
  ".bcWorldStageV2",
  ".bcPlatformV3",
  ".bcStoreV3",
  ".bcAICoachV3",
  ".bcLiveFeedV3",
].join(",");

const SECTION_SELECTOR = [
  ".bcV3Hero",
  ".bcWorldsV2",
  ".bcPlatformV3",
  ".bcStoreV3",
  ".bcAICoachV3",
  ".bcLiveFeedV3",
].join(",");

function getAmbientTone(element: Element) {
  if (element.matches(".bcStoreV3")) return "orange";
  if (element.matches(".bcAICoachV3")) return "violet";
  if (element.matches(".bcPlatformV3")) return "cyan";
  if (element.matches(".bcWorldsV2")) return "worlds";
  if (element.matches(".bcLiveFeedV3")) return "neutral";
  return "hero";
}

/**
 * V3-only progressive enhancement layer.
 *
 * Adds one-shot cinematic reveals and exposes the dominant viewport section as
 * `data-bc-ambient` on <html>. All content remains visible when observers are
 * unavailable or reduced motion is enabled.
 */
export function RevealSystemV3() {
  React.useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const reduced = Boolean(reducedMotion?.matches);

    const revealNodes = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
    const sectionNodes = Array.from(document.querySelectorAll<HTMLElement>(SECTION_SELECTOR));

    revealNodes.forEach((node, index) => {
      node.classList.add("bcV3Reveal");
      node.style.setProperty("--bc-v3-reveal-order", String(index % 6));
    });

    if (reduced || !("IntersectionObserver" in window)) {
      revealNodes.forEach((node) => node.classList.add("is-visible"));
      root.dataset.bcAmbient = "hero";
      return () => {
        revealNodes.forEach((node) => {
          node.classList.remove("bcV3Reveal", "is-visible");
          node.style.removeProperty("--bc-v3-reveal-order");
        });
        delete root.dataset.bcAmbient;
      };
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.13, rootMargin: "0px 0px -8% 0px" }
    );

    revealNodes.forEach((node) => revealObserver.observe(node));

    const visibleRatios = new Map<Element, number>();
    const ambientObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => visibleRatios.set(entry.target, entry.intersectionRatio));

        let active: Element | null = null;
        let bestRatio = -1;
        visibleRatios.forEach((ratio, element) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            active = element;
          }
        });

        if (active) root.dataset.bcAmbient = getAmbientTone(active);
      },
      { threshold: [0.08, 0.2, 0.38, 0.56, 0.74], rootMargin: "-16% 0px -34% 0px" }
    );

    sectionNodes.forEach((node) => ambientObserver.observe(node));

    return () => {
      revealObserver.disconnect();
      ambientObserver.disconnect();
      revealNodes.forEach((node) => {
        node.classList.remove("bcV3Reveal", "is-visible");
        node.style.removeProperty("--bc-v3-reveal-order");
      });
      delete root.dataset.bcAmbient;
    };
  }, []);

  return <div className="bcRevealSystemV3" aria-hidden="true" />;
}

export default RevealSystemV3;

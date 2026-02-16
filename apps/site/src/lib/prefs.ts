import { userStorage } from "@blackcrown/core";

const KEY_REDUCED_MOTION = "pref.reducedMotion";

function ensureStyleEl(): HTMLStyleElement {
  const id = "bc-reduced-motion-style";
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  return el;
}

export function getReducedMotion(): boolean {
  return (userStorage.getString(KEY_REDUCED_MOTION, "0") || "0") === "1";
}

export function setReducedMotion(v: boolean) {
  userStorage.setString(KEY_REDUCED_MOTION, v ? "1" : "0");
  applySitePrefs();
}

export function applySitePrefs() {
  if (typeof document === "undefined") return;

  const reduced = getReducedMotion();
  document.documentElement.setAttribute("data-reduced-motion", reduced ? "1" : "0");

  const styleEl = ensureStyleEl();
  styleEl.textContent = reduced
    ? `
html[data-reduced-motion="1"] * {
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
  scroll-behavior: auto !important;
}
`
    : "";
}

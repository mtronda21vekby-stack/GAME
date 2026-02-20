import type { XpEvent } from "./types";

export function xpForEvent(e: XpEvent): number {
  switch (e.type) {
    case "page_view":
      return 5;
    case "section_view":
      return 8;
    case "cta_click":
      return 15;
    case "theme_save":
      return 10;
    default:
      return 0;
  }
}

export function cooldownMsForEvent(e: XpEvent): number {
  // анти-спам: одинаковые события не чаще, чем:
  switch (e.type) {
    case "page_view":
      return 60_000;      // 1 мин
    case "section_view":
      return 45_000;
    case "cta_click":
      return 20_000;
    case "theme_save":
      return 30_000;
    default:
      return 60_000;
  }
}

export function dedupeKeyForEvent(e: XpEvent, timeBucket: number): string {
  // timeBucket = floor(now / cooldown)
  const k = e.key ? `:${e.key}` : "";
  return `${e.type}${k}:${timeBucket}`;
}

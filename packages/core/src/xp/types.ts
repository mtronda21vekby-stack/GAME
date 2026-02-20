export type XpEventType = "page_view" | "section_view" | "cta_click" | "theme_save";

export type XpEvent = {
  type: XpEventType;
  key?: string; // например "home", "hero", "cta_primary"
  meta?: Record<string, string | number | boolean | null>;
};

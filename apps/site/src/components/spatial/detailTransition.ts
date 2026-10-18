export type PanelOrigin = { gameId: string; left: number; top: number; width: number; height: number; viewportWidth: number; viewportHeight: number };
type MediaRect = Pick<DOMRectReadOnly, "left" | "top" | "width" | "height">;

/** A changed selection or viewport has no matching surface to return to. */
export function detailOriginTransform(origin: PanelOrigin | null | undefined, gameId: string, viewportWidth: number, viewportHeight: number, box: MediaRect | undefined) {
  if (!origin || !box || origin.gameId !== gameId || Math.abs(origin.viewportWidth-viewportWidth) > 1 || Math.abs(origin.viewportHeight-viewportHeight) > 1 || !box.width || !box.height) return "translateY(20px) scale(.98)";
  const x = origin.left + origin.width/2 - box.left - box.width/2;
  const y = origin.top + origin.height/2 - box.top - box.height/2;
  return `translate(${x}px,${y}px) scale(${origin.width/box.width},${origin.height/box.height})`;
}

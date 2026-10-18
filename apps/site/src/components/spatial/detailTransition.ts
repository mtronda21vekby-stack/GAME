export type PanelOrigin = { gameId: string; left: number; top: number; width: number; height: number; viewportWidth: number; viewportHeight: number };
type MediaRect = Pick<DOMRectReadOnly, "left" | "top" | "width" | "height">;

/** Keep the image's aspect ratio while moving between its panel and detail view. */
export function detailOriginPose(origin: PanelOrigin | null | undefined, gameId: string, viewportWidth: number, viewportHeight: number, box: MediaRect | undefined) {
  if (!origin || !box || origin.gameId !== gameId || Math.abs(origin.viewportWidth-viewportWidth) > 1 || Math.abs(origin.viewportHeight-viewportHeight) > 1 || !box.width || !box.height) return [0,20,.98,.98,.25];
  const scale = origin.width/box.width;
  return [origin.left+origin.width/2-box.left-box.width/2, origin.top+origin.height/2-box.top-box.height/2, scale, scale,.25];
}

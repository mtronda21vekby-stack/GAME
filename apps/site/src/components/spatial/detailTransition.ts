export type PanelOrigin = { gameId: string; left: number; top: number; width: number; height: number; viewportWidth: number; viewportHeight: number };
export type MediaRect = Pick<DOMRectReadOnly, "left" | "top" | "width" | "height">;

/** Match the outer crop exactly; the inner poster counter-scales to retain its aspect. */
export function detailOriginPose(origin: PanelOrigin | null | undefined, gameId: string, viewportWidth: number, viewportHeight: number, box: MediaRect | undefined) {
  if (!origin || !box || origin.gameId !== gameId || Math.abs(origin.viewportWidth-viewportWidth) > 1 || Math.abs(origin.viewportHeight-viewportHeight) > 1 || !box.width || !box.height) return [0,20,.98,.98,.25];
  return [origin.left+origin.width/2-box.left-box.width/2, origin.top+origin.height/2-box.top-box.height/2, origin.width/box.width, origin.height/box.height,.25];
}

/** Cover at the source, contain at arrival, without ever stretching image pixels. */
export function detailPosterSize(width:number,height:number,aspect:number,arrival:number,sourceContains=false) {
  const contain=Math.min(width/aspect,height),cover=sourceContains?contain:Math.max(width/aspect,height);
  const t=Math.max(0,Math.min(1,arrival)),h=cover+(contain-cover)*t;
  return {width:h*aspect,height:h};
}

export function detailReveal(arrival:number) {
  const smooth=(from:number,to:number)=>{const t=Math.max(0,Math.min(1,(arrival-from)/(to-from)));return t*t*(3-2*t);};
  return {frame:smooth(.06,.66),copy:smooth(.12,.78),source:1-smooth(0,.36)};
}

export type MediaPoint = { x:number; y:number };
/** Clockwise from the top left, in viewport CSS pixels. */
export type MediaQuad = readonly [MediaPoint,MediaPoint,MediaPoint,MediaPoint];
export type PanelOrigin = { gameId: string; left: number; top: number; width: number; height: number; viewportWidth: number; viewportHeight: number; quad?:MediaQuad };
export type MediaRect = Pick<DOMRectReadOnly, "left" | "top" | "width" | "height">;
const corners=[[0,0],[1,0],[1,1],[0,1]] as const;
export const DETAIL_REST=[0,0,1,1,1,1,0,0,0,0,0,0,0,0];
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
export function detailRectQuad(box:MediaRect):MediaQuad {
  return corners.map(([x,y])=>({x:box.left+x*box.width,y:box.top+y*box.height})) as unknown as MediaQuad;
}
function validQuad(quad:MediaQuad) {
  if(!quad.every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y)))return false;
  return quad.every((point,index)=>{
    const next=quad[(index+1)%4],after=quad[(index+2)%4];
    return (next.x-point.x)*(after.y-next.y)-(next.y-point.y)*(after.x-next.x)>1e-5;
  });
}

/** Read the native panel's existing homogeneous projection, not its axis-aligned
 * bounding box. The source CSS already normalises W for WebKit. */
export function detailProjectQuad(matrix:readonly number[],local:MediaRect,anchor:{left:number;top:number}):MediaQuad|null {
  if(matrix.length!==16||!matrix.every(Number.isFinite))return null;
  const points=detailRectQuad(local).map(point=>{
    const w=matrix[3]*point.x+matrix[7]*point.y+matrix[15];
    return w>1e-5?{x:anchor.left+(matrix[0]*point.x+matrix[4]*point.y+matrix[12])/w,y:anchor.top+(matrix[1]*point.x+matrix[5]*point.y+matrix[13])/w}:{x:NaN,y:NaN};
  }) as unknown as MediaQuad;
  return validQuad(points)?points:null;
}

/** The first six channels retain the existing crop/reveal clock; eight corner
 * residuals carry the plane's perspective on that same interruptible motion. */
export function detailQuadPose(quad:MediaQuad,box:MediaRect,opacity=1,arrival=0):number[]|null {
  if(!validQuad(quad)||![box.left,box.top,box.width,box.height].every(Number.isFinite)||!(box.width>0&&box.height>0))return null;
  const xs=quad.map(point=>point.x),ys=quad.map(point=>point.y),left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top;
  if(!(width>0&&height>0))return null;
  const residual=quad.flatMap((point,index)=>[(point.x-left)/width-corners[index][0],(point.y-top)/height-corners[index][1]]);
  if(residual.some(value=>Math.abs(value)>.24))return null;
  return [left+width/2-box.left-box.width/2,top+height/2-box.top-box.height/2,width/box.width,height/box.height,opacity,arrival,...residual];
}

/** Keep the measured direction at rest instead of flattening at arrival. A
 * shallow source is given a readable 4.5% inset, with bounded gain and corners. */
export function detailSettledPose(quad?:MediaQuad|null):number[] {
  if(!quad)return [...DETAIL_REST];
  const xs=quad.map(point=>point.x),ys=quad.map(point=>point.y),box={left:Math.min(...xs),top:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
  const pose=detailQuadPose(quad,box,1,1);
  if(!pose)return [...DETAIL_REST];
  const residual=pose.slice(6),magnitude=Math.max(...residual.map(Math.abs));
  const gain=magnitude>1e-6?clamp(.045/magnitude,1.5,6):1.5;
  return [...DETAIL_REST.slice(0,6),...residual.map(value=>clamp(value*gain,-.09,.09))];
}

export function detailSurfaceQuad(box:MediaRect,pose:readonly number[]):MediaQuad {
  const [x,y,rawX,rawY]=pose,sx=Math.max(.05,rawX),sy=Math.max(.05,rawY);
  const points=corners.map(([u,v],index)=>({x:box.left+box.width/2+x+(u-.5+clamp(pose[6+index*2]??0,-.24,.24))*box.width*sx,y:box.top+box.height/2+y+(v-.5+clamp(pose[7+index*2]??0,-.24,.24))*box.height*sy})) as unknown as MediaQuad;
  return validQuad(points)?points:corners.map(([u,v])=>({x:box.left+box.width/2+x+(u-.5)*box.width*sx,y:box.top+box.height/2+y+(v-.5)*box.height*sy})) as unknown as MediaQuad;
}

/** Unit-W homography maps the media alone onto its four moving corners. */
export function detailPlaneStyle(box:MediaRect,pose:readonly number[]) {
  const [p0,p1,p2,p3]=detailSurfaceQuad(box,pose).map(point=>({x:point.x-box.left,y:point.y-box.top}));
  const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x,dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
  const denominator=dx1*dy2-dx2*dy1;
  const g=Math.abs(denominator)>1e-8?(dx3*dy2-dx2*dy3)/denominator:0,h=Math.abs(denominator)>1e-8?(dx1*dy3-dx3*dy1)/denominator:0;
  const values=[(p1.x-p0.x+g*p1.x)/box.width,(p1.y-p0.y+g*p1.y)/box.width,0,g/box.width,(p3.x-p0.x+h*p3.x)/box.height,(p3.y-p0.y+h*p3.y)/box.height,0,h/box.height,0,0,1,0,p0.x,p0.y,0,1];
  return `matrix3d(${values.map(value=>Math.abs(value)<1e-10?0:Number(value.toFixed(9))).join(",")})`;
}

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

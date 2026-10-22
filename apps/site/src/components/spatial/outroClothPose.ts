type Box = { left:number; top:number; width:number; height:number };
type ClosingSpace = { width:number; height:number; headerBottom:number; copyRight:number; farewell:number; sheet:Box; slot:Box };
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const ease=(x:number,a:number,b:number)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

/** A native-scroll route with a real clear corridor, rather than an offscreen cut.
 * The same coordinate is used in reverse. No retained animation or extra clock.
 * The right lane holds the whole folded body while the closing copy passes;
 * expansion waits for the noninteractive native slot below the final link row.
 */
export function outroClothPose(space:ClosingSpace) {
  const {width:w,height:h,headerBottom,copyRight,farewell:f,sheet,slot}=space;
  const collect=ease(f,0,.46),travel=ease(f,.42,.82);
  const laneLeft=Math.max(w*.66,copyRight+18),laneRight=w-22;
  // Reserve an envelope for perspective, the loose hem and released drag.
  const laneWidth=clamp((laneRight-laneLeft)/1.22,1,96);
  const laneX=(laneLeft+laneRight)/2,laneHeight=Math.min(170,h*.2);
  const opening=ease(h-12-slot.top,laneHeight,slot.height-12);
  const bodyWidth=mix(mix(sheet.width,laneWidth,collect),slot.width,opening);
  const bodyHeight=mix(mix(sheet.height,laneHeight,collect),slot.height,opening);
  const sourceY=sheet.top+sheet.height/2;
  const heldY=mix(sourceY,clamp(sourceY,headerBottom+bodyHeight*.56+14,h-bodyHeight*.56-14),collect);
  const laneY=h-laneHeight*.57-12;
  return {
    x:mix(mix(sheet.left+sheet.width/2,laneX,collect),slot.left+slot.width/2,opening),
    y:mix(mix(heldY,laneY,travel),slot.top+slot.height/2,opening),
    width:bodyWidth,height:bodyHeight,opening,
    sculpture:1-ease(f,.35,.98),
  };
}

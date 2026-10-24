import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { panelFrontWidth, panelScreenPosition } from "./panelProjection";

/** Authored once per viewport, never fitted to the live DOM hit target. */
export function fitLabComposition(camera:PerspectiveCamera,width:number,height:number,compact:boolean) {
  const center=panelScreenPosition(camera,width*(compact?.54:.61),height*.54,width,height,4.4);
  const unit=panelFrontWidth(camera,width,1,center);
  return {
    center,
    scale:new Vector3(width*(compact?.94:.58)/unit,height*.78/unit,width*(compact?.88:.36)/unit),
    rotation:new Vector3(-.09,.12,-.105),
  };
}

/** One slow reversible arc, independent from interaction and the ambient clock. */
export function labCameraPass(progress:number,start:number,end:number,reduced:boolean) {
  if(reduced)return {x:0,y:0,z:0,targetX:0};
  const amount=MathUtils.smootherstep(Number.isFinite(progress)?progress:0,start,Math.max(start+.001,end));
  return {x:1.6*amount,y:-.32*amount,z:-2.1*amount,targetX:.4*amount};
}

export function labAnnotationPosition(point:Vector3,camera:PerspectiveCamera,width:number,height:number,kind:"title"|"note",compact:boolean) {
  const projected=point.clone().project(camera);
  const x=(projected.x+1)*width*.5,y=(1-projected.y)*height*.5;
  const textWidth=kind==="title"?(compact?210:300):(compact?150:205);
  return {
    x:MathUtils.clamp(x,compact?26:60,Math.max(compact?26:60,width-textWidth-(compact?22:50))),
    y:MathUtils.clamp(y,kind==="title"?height*.23:height*.60,kind==="title"?height*.40:height*.74),
  };
}

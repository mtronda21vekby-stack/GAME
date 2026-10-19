import type { CameraKeyframe } from "../../experience/camera/CameraKeyframes";

type AxisViewport = {
  compact:boolean;
  width:number;
  height:number;
  slot:{x:number;y:number;width:number;height:number};
};

/** One connected skull/spine axis; the camera travels from its head to its tip. */
export function spatialAxisJourney({compact,width,height,slot}:AxisViewport) {
  const fov=compact?36:38,depth=18.8+(compact&&width<=820?(height<=520?.9:1.8):0);
  const halfHeight=depth*Math.tan(fov*Math.PI/360),pixelsPerUnit=height/(halfHeight*2);
  const axisHeight=Math.min(compact?15.8:26,slot.width*.9/(pixelsPerUnit*.245),slot.height*.97/(pixelsPerUnit*.29));
  const headCenter=axisHeight*.35;
  const headX=-(slot.x/Math.max(1,width)*2-1)*halfHeight*width/Math.max(1,height);
  const headY=headCenter-(1-slot.y/Math.max(1,height)*2)*halfHeight;
  const frames:CameraKeyframe[]=[
    {progress:0,position:[headX,headY,18.8],target:[headX,headY,0],fov},
    {progress:.18,position:[compact?.45:-1.4,axisHeight*.20,compact?15:17.4],target:[compact?0:-.6,axisHeight*.19,0],fov},
    {progress:.32,position:[compact?-.7:1.4,axisHeight*.08,compact?12.8:16.8],target:[0,axisHeight*.08,0],fov},
    {progress:.48,position:[compact?.6:-1.2,-axisHeight*.09,compact?12.8:16.8],target:[0,-axisHeight*.09,0],fov},
    {progress:.74,position:[compact?-.5:1.3,-axisHeight*.29,compact?13.8:17.4],target:[0,-axisHeight*.29,0],fov},
    {progress:1,position:[compact?.3:-1.5,-axisHeight*.43,compact?16.5:19.8],target:[compact?0:-.6,-axisHeight*.43,0],fov:compact?38:40},
  ];
  return {axisHeight,frames};
}

/** The first turns happen while the skull is still framed; every pose is scroll-owned. */
export function spatialAxisTurn(progress:number,compact:boolean,reduced=false) {
  if(reduced)return -.14;
  const keys=compact?[[0,-.14],[.07,.32],[.17,-.38],[.32,.60],[.56,.83],[.8,.10],[1,-.22]]:
    [[0,-.14],[.07,.54],[.17,-.64],[.32,.90],[.56,1.16],[.8,.16],[1,-.32]];
  const p=Math.max(0,Math.min(1,progress));
  const index=Math.min(keys.length-2,Math.max(0,keys.findIndex((key,i)=>i<keys.length-1&&p<=keys[i+1][0])));
  const [a,b]=[keys[index],keys[index+1]],t=(p-a[0])/(b[0]-a[0]);
  const blend=t*t*t*(t*(t*6-15)+10);
  return a[1]+(b[1]-a[1])*blend;
}

/** Crossing the same scroll boundary in reverse reveals the previous real game. */
export function spatialScrollWorld(scrollY:number,start:number,end:number,visible:readonly number[]) {
  if(!visible.length||end<=start)return undefined;
  const phase=Math.max(0,Math.min(1,(scrollY-start)/(end-start)));
  return visible[Math.min(visible.length-1,Math.floor(phase*visible.length))];
}

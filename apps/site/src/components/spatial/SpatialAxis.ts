import type { CameraKeyframe } from "../../experience/camera/CameraKeyframes";

type AxisViewport = {
  compact:boolean;
  width:number;
  height:number;
  slot:{x:number;y:number;width:number;height:number};
  stops?:SpatialJourneyStops;
};

export type SpatialJourneyStops = {
  intro:number;
  projects:readonly number[];
  exit:number;
  lab:number;
};

/** One connected skull/spine axis; the camera travels from its head to its tip. */
export function spatialAxisJourney({compact,width,height,slot,stops}:AxisViewport) {
  const fov=compact?36:38,depth=18.8+(compact&&width<=820?(height<=520?.9:1.8):0);
  const halfHeight=depth*Math.tan(fov*Math.PI/360),pixelsPerUnit=height/(halfHeight*2);
  const axisHeight=Math.min(compact?15.8:26,slot.width*.9/(pixelsPerUnit*.245),slot.height*.97/(pixelsPerUnit*.29))*(compact?1.16:1.18);
  const headCenter=axisHeight*.35;
  const headX=-(slot.x/Math.max(1,width)*2-1)*halfHeight*width/Math.max(1,height);
  const headY=headCenter-(1-slot.y/Math.max(1,height)*2)*halfHeight;
  const frames:CameraKeyframe[]=[
    {progress:0,position:[headX,headY,18.8],target:[headX,headY,0],fov},
    {progress:.18,position:[headX,axisHeight*.20,18.8],target:[headX,axisHeight*.20,0],fov},
    {progress:.32,position:[headX*.45,axisHeight*.08,18.8],target:[headX*.45,axisHeight*.08,0],fov},
    {progress:.48,position:[0,-axisHeight*.09,18.8],target:[0,-axisHeight*.09,0],fov},
    {progress:.74,position:[0,-axisHeight*.29,18.8],target:[0,-axisHeight*.29,0],fov},
    {progress:1,position:[0,-axisHeight*.43,19.8],target:[0,-axisHeight*.43,0],fov},
  ];
  if(stops){
    // The path follows actual document chapters, including filtered collections.
    // It recentres once, then descends straight down: no lateral slalom or idle turn.
    frames.splice(1);
    const append=(progress:number,y:number,z=18.8)=>{
      const previous=frames[frames.length-1];
      if(progress<=previous.progress+.004||progress>=.995)return;
      const descent=Math.min(previous.position[1],y);
      frames.push({progress,position:[0,descent,z],target:[0,descent,0],fov});
    };
    // The jaw clears the collection heading before the first project arrives.
    append(stops.intro,axisHeight*.045);
    stops.projects.forEach((progress,index)=>append(progress,axisHeight*(-.035-.345*index/Math.max(1,stops.projects.length-1))));
    append(stops.exit,-axisHeight*.49);
    // Let the tip leave above the viewport before the sheet becomes the main subject.
    const belowTip=-axisHeight*.5-halfHeight*1.16;
    append(stops.lab,belowTip,19.8);
    const endY=Math.min(frames[frames.length-1].position[1],belowTip);
    frames.push({progress:1,position:[0,endY,19.8],target:[0,endY,0],fov});
  }
  return {axisHeight,frames};
}

/** One restrained turn around Y. Reverse scroll retraces it; pointer/time cannot add spin. */
export function spatialAxisTurn(progress:number,compact:boolean,reduced=false) {
  if(reduced)return -.12;
  const t=Math.max(0,Math.min(1,progress/.26));
  const blend=t*t*t*(t*(t*6-15)+10);
  return -.12+(compact?.32:.44)*blend;
}

/** Crossing the same scroll boundary in reverse reveals the previous real game. */
export function spatialScrollWorld(scrollY:number,start:number,end:number,visible:readonly number[]) {
  if(!visible.length||end<=start)return undefined;
  const phase=Math.max(0,Math.min(1,(scrollY-start)/(end-start)));
  return visible[Math.min(visible.length-1,Math.floor(phase*visible.length))];
}

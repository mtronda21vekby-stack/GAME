import type { CameraKeyframe } from "../../experience/camera/CameraKeyframes";
import { spatialArrivalEnd } from "./SpatialChoreography";

type AxisViewport = {
  compact:boolean;
  width:number;
  height:number;
  slot:{x:number;y:number;width:number;height:number};
  stops?:SpatialJourneyStops;
};

export type SpatialJourneyStops = {
  about?:number;
  intro:number;
  projects:readonly number[];
  exit:number;
  lab:number;
};

/** One connected skull/spine axis; the camera travels from its head to its tip. */
export function spatialAxisJourney({compact,width,height,slot,stops}:AxisViewport) {
  const fov=compact?36:38,depth=18.8+(compact?(height<=520?.9:1.8):0);
  const halfHeight=depth*Math.tan(fov*Math.PI/360),pixelsPerUnit=height/(halfHeight*2);
  const axisHeight=Math.min(compact?15.8:26,slot.width*.9/(pixelsPerUnit*.245),slot.height*.97/(pixelsPerUnit*.29))*(compact?1.16:1.18);
  const headCenter=axisHeight*.35;
  const headX=-(slot.x/Math.max(1,width)*2-1)*halfHeight*width/Math.max(1,height);
  const headY=headCenter-(1-slot.y/Math.max(1,height)*2)*halfHeight;
  const entranceDepth=compact?22.2:26.8;
  const entranceScale=(entranceDepth+depth-18.8)/depth;
  const entrancePosition:[number,number,number]=[headX*entranceScale,headCenter+(headY-headCenter)*entranceScale,entranceDepth];
  const frames:CameraKeyframe[]=[
    {progress:0,position:entrancePosition,target:[entrancePosition[0],entrancePosition[1],0],fov},
    {progress:.08,position:[headX,headY,18.8],target:[headX,headY,0],fov},
    {progress:.18,position:[headX,axisHeight*.20,18.8],target:[headX,axisHeight*.20,0],fov},
    {progress:.32,position:[headX*.45,axisHeight*.08,18.8],target:[headX*.45,axisHeight*.08,0],fov},
    {progress:.48,position:[0,-axisHeight*.09,18.8],target:[0,-axisHeight*.09,0],fov},
    {progress:.74,position:[0,-axisHeight*.29,18.8],target:[0,-axisHeight*.29,0],fov},
    {progress:.82,position:[0,-axisHeight*.49,20.4],target:[0,-axisHeight*.49,0],fov},
    {progress:.9,position:[0,-axisHeight*.5-halfHeight*1.16,17.8],target:[0,-axisHeight*.5-halfHeight*1.16,0],fov},
    {progress:1,position:[0,-axisHeight*.5-halfHeight*1.16,17.8],target:[0,-axisHeight*.5-halfHeight*1.16,0],fov},
  ];
  if(stops){
    // The opening gives the copy its own negative space, then recentres on the
    // spinal axis before the projects. Every pose is owned by the same scroll clock.
    frames.splice(1);
    frames.push({progress:spatialArrivalEnd(stops),position:[headX,headY,18.8],target:[headX,headY,0],fov});
    const append=(progress:number,y:number,z=18.8,x=0)=>{
      const previous=frames[frames.length-1];
      if(progress<=previous.progress+.004||progress>=.995)return;
      const descent=Math.min(previous.position[1],y);
      frames.push({progress,position:[x,descent,z],target:[x,descent,0],fov});
    };
    if(stops.about!==undefined){
      const copyOffset=-halfHeight*width/height*(compact?.66:.21);
      append(stops.about,axisHeight*(compact?.245:.34),18.8,copyOffset);
    }
    // The jaw clears the collection heading before the first project arrives.
    append(stops.intro,axisHeight*.045,20.8);
    // A single long push into the collection makes its near/far planes legible.
    stops.projects.forEach((progress,index)=>{
      const travel=index/Math.max(1,stops.projects.length-1);
      append(progress,axisHeight*(-.035-.345*travel),21-travel*2.2);
    });
    append(stops.exit,-axisHeight*.49,20.4);
    // Let the tip leave above the viewport before the sheet becomes the main subject.
    const belowTip=-axisHeight*.5-halfHeight*1.16;
    append(stops.lab,belowTip,17.8);
    const endY=Math.min(frames[frames.length-1].position[1],belowTip);
    frames.push({progress:1,position:[0,endY,17.8],target:[0,endY,0],fov});
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

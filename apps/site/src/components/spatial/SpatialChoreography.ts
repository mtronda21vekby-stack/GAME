import type { SpatialJourneyStops } from "./SpatialAxis";

const smooth=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*t*(t*(t*6-15)+10);};
export const spatialArrivalEnd=(stops?:SpatialJourneyStops)=>stops?Math.max(.02,Math.min(.12,stops.intro*.5)):.08;

/** The full-size LAB sheet belongs to its own chapter, after the catalogue clears. */
export const spatialInterludeVisible=(transition?:Pick<DOMRect,"top"|"bottom">)=>!!transition&&transition.top<=0&&transition.bottom>0;

/** Both effects retrace the scroll clock. Time adds only the existing quiet ambience. */
export function spatialChoreography(progress:number,stops?:SpatialJourneyStops){
  const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
  const exit=stops?.exit??.76,lab=stops?.lab??.9;
  return {arrival:smooth(p/spatialArrivalEnd(stops)),departure:smooth((p-exit)/Math.max(.001,lab-exit))};
}

/** A world's light grows into the next one along the measured collection path. */
export function spatialWorldBlend(progress:number,stops:SpatialJourneyStops|undefined,worlds:readonly number[]) {
  if(!worlds.length)return {from:0,to:0,mix:0};
  const projects=stops?.projects??[];
  for(let i=0;i<Math.min(projects.length,worlds.length)-1;i++){
    if(progress<=projects[i+1])return {from:worlds[i],to:worlds[i+1],mix:smooth((progress-projects[i])/Math.max(.001,projects[i+1]-projects[i]))};
  }
  const last=worlds[Math.min(worlds.length,projects.length||1)-1];
  return {from:last,to:last,mix:0};
}

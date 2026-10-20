import type { SpatialJourneyStops } from "./SpatialAxis";

const smooth=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*t*(t*(t*6-15)+10);};
export const spatialArrivalEnd=(stops?:SpatialJourneyStops)=>stops?Math.max(.02,Math.min(.12,stops.intro*.5)):.08;

/** Both effects retrace the scroll clock. Time adds only the existing quiet ambience. */
export function spatialChoreography(progress:number,stops?:SpatialJourneyStops){
  const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
  const exit=stops?.exit??.76,lab=stops?.lab??.9;
  return {arrival:smooth(p/spatialArrivalEnd(stops)),departure:smooth((p-exit)/Math.max(.001,lab-exit))};
}

import { platformGames } from "../../lib/platformGames";
import { SPATIAL_CATEGORIES, type SpatialReturn } from "./spatialNavigation";

const KEY="blackcrownCase";
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);

export function spatialCaseIndex(hash:string){
  if(!hash.startsWith("#game/"))return;
  let id:string;try{id=decodeURIComponent(hash.slice(6));}catch{return;}
  const index=platformGames.findIndex(g=>g.id===id);return index<0?undefined:index;
}

/** One case history entry. Related-case buttons replace it; Back closes and Forward reopens. */
export function writeSpatialCase(history:Pick<History,"state"|"pushState"|"replaceState">&Partial<Pick<History,"scrollRestoration">>,location:Pick<Location,"pathname"|"search">,index:number,view:SpatialReturn,replace=false){
  const game=platformGames[index];if(!game)return;
  const state={...(record(history.state)?history.state:{}),[KEY]:{version:1,pushed:true,origin:{...view}}};
  const url=location.pathname+location.search+"#game/"+game.id;
  if(replace)history.replaceState(state,"",url);else history.pushState(state,"",url);
  if(history.scrollRestoration!==undefined)history.scrollRestoration="manual";
}

export function hasSpatialCaseEntry(state:unknown){return record(state)&&record(state[KEY])&&state[KEY].version===1&&state[KEY].pushed===true;}
export function spatialCaseOrigin(state:unknown):SpatialReturn|undefined{
  if(!record(state)||!record(state[KEY])||!record(state[KEY].origin))return;
  const v=state[KEY].origin;if(typeof v.worldIndex!=="number"||!platformGames[v.worldIndex]||typeof v.scrollY!=="number"||!Number.isFinite(v.scrollY)||v.scrollY<0||!SPATIAL_CATEGORIES.includes(v.category as typeof SPATIAL_CATEGORIES[number]))return;
  return {worldIndex:v.worldIndex,scrollY:v.scrollY,category:v.category as string};
}

export function clearSpatialCase(history:Pick<History,"state"|"replaceState">,location:Pick<Location,"pathname"|"search">){
  const state={...(record(history.state)?history.state:{})};delete state[KEY];history.replaceState(state,"",location.pathname+location.search);
}

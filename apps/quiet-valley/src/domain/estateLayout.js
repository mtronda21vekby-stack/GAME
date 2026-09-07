/** Shared spatial contract: rendered shoreline and buildable land use the same extent.
 * Only terrain grows. Existing objects retain their world positions and real sizes. */
export const ESTATE_SCALES = Object.freeze([1, 1, 1.25, 1.55, 1.9]);
export const BASE_TERRAIN = Object.freeze({x:14.75, z:11.5});
export const BUILDING_FOOTPRINTS = Object.freeze({
 tool_shed:[1.5,1.3], bunkhouse:[1.3,1.15], staff_house:[1.5,1.35],
 honey_house:[1.5,1.3], greenhouse:[1.75,1.3], works_depot:[2,1.55]
});
export function estateTier(tier=1){return Number.isFinite(tier)?Math.max(1,Math.min(4,Math.floor(tier))):1;}
export function estateScale(tier){return ESTATE_SCALES[estateTier(tier)];}
export function terrainBounds(tier){const scale=estateScale(tier);return {x:BASE_TERRAIN.x*scale,z:BASE_TERRAIN.z*scale,scale};}
// This is the same 80-vertex contour as geometry('island'), including its irregular shore.
const coastCache=new Map();
export function shoreline(tier){tier=estateTier(tier);if(coastCache.has(tier))return coastCache.get(tier);const b=terrainBounds(tier);const poly=Array.from({length:80},(_,i)=>{
 const a=i/80*Math.PI*2;return [Math.cos(a)*b.x*(1+.02*Math.sin(a*5)),Math.sin(a)*b.z*(1+.03*Math.sin(a*3))];
});coastCache.set(tier,poly);return poly;}
export function insideShore(tier,x,z,margin=.3){
 const b=terrainBounds(tier),px=x*b.x/(b.x-margin),pz=z*b.z/(b.z-margin),poly=shoreline(tier);let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const [ax,az]=poly[i],[bx,bz]=poly[j];
  if((az>pz)!==(bz>pz)&&px<(bx-ax)*(pz-az)/(bz-az)+ax)inside=!inside;
 }
 return inside;
}
export function footprint(key,rotation=0){const size=BUILDING_FOOTPRINTS[key]||[.94,.94];return rotation%2?[size[1],size[0]]:size;}
export function overlaps(a,halfA,b,halfB,gap=.12){return Math.abs(a.x-b.x)<halfA[0]+halfB[0]+gap&&Math.abs(a.z-b.z)<halfA[1]+halfB[1]+gap;}
export function estateMeadowCell(tier,x,z,half=[.94,.94]){
 if(estateTier(tier)<2||!Number.isInteger(x)||!Number.isInteger(z)||x%2||z%2)return false;
 // Protect the original working farm, its trees, animals, pond and structures.
 const nx=Math.max(0,Math.abs(x)-half[0]),nz=Math.max(0,Math.abs(z)-half[1]);
 if(nx*nx/(13.7*13.7)+nz*nz/(10.6*10.6)<1)return false;
 return [-1,1].every(sx=>[-1,1].every(sz=>insideShore(tier,x+sx*half[0],z+sz*half[1])));
}
export function estateCollision(s,x,z,half=[.94,.94],ignore=null){
 return Object.entries(s.world.estate?.placements||{}).some(([key,p])=>key!==ignore&&
  s.world.estate.buildings.includes(key)&&overlaps({x,z},half,p,footprint(key,p.rotation)));
}

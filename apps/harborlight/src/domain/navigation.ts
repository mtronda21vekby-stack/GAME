import type {V2,MapDef} from './types.js';
export const distance=(a:V2,b:V2)=>Math.hypot(a.x-b.x,a.z-b.z);
export const finitePoint=(p:unknown):p is V2=>!!p&&typeof p==='object'&&Number.isFinite((p as V2).x)&&Number.isFinite((p as V2).z)&&Math.abs((p as V2).x)<=19&&Math.abs((p as V2).z)<=16;
export function clearPoint(p:V2,map:MapDef,padding=.63):boolean{
 return finitePoint(p)&&map.islands.every(o=>Math.hypot((p.x-o.x)/(o.r+padding),(p.z-o.z)/(o.rz+padding))>1);
}
export function clearSegment(a:V2,b:V2,map:MapDef,padding=.63):boolean{
 const steps=Math.ceil(distance(a,b)/.2);for(let i=0;i<=steps;i++)if(!clearPoint({x:a.x+(b.x-a.x)*i/Math.max(1,steps),z:a.z+(b.z-a.z)*i/Math.max(1,steps)},map,padding))return false;return true;
}
export function validPath(from:V2,path:V2[],map:MapDef):boolean{
 if(!Array.isArray(path)||path.length<1||path.length>160)return false;
 let last=from;for(const p of path){if(!finitePoint(p)||!clearSegment(last,p,map))return false;last=p;}return true;
}
/** Navigation is assistance, not autopilot: the player chooses vessel, destination and timing. */
export function findRoute(start:V2,end:V2,map:MapDef):V2[]{
 if(!clearPoint(end,map))return [];
 if(clearSegment(start,end,map))return [{...end}];
 const key=(x:number,z:number)=>`${x},${z}`;const initial={x:Math.round(start.x),z:Math.round(start.z)};
 const frontier=[initial],scores=new Map<string,number>([[key(initial.x,initial.z),0]]),parent=new Map<string,string>();
 let goal='';let guard=0;
 while(frontier.length&&guard++<1600){
  frontier.sort((a,b)=>(scores.get(key(a.x,a.z))!+distance(a,end))-(scores.get(key(b.x,b.z))!+distance(b,end)));
  const curr=frontier.shift()!,ck=key(curr.x,curr.z);
  if(distance(curr,end)<1.5&&clearSegment(curr,end,map)){goal=ck;break;}
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
   if(!dx&&!dz)continue;const next={x:curr.x+dx,z:curr.z+dz};if(!clearSegment(curr,next,map))continue;
   const nk=key(next.x,next.z),g=scores.get(ck)!+Math.hypot(dx,dz);
   if(g>=(scores.get(nk)??Infinity))continue;
   scores.set(nk,g);parent.set(nk,ck);if(!frontier.some(p=>key(p.x,p.z)===nk))frontier.push(next);
  }
 }
 if(!goal)return [];
 const reversed:V2[]=[end];while(parent.has(goal)){const [x,z]=goal.split(',').map(Number);reversed.push({x:x!,z:z!});goal=parent.get(goal)!;}
 reversed.reverse();const result:V2[]=[];let anchor=start;
 for(let i=0;i<reversed.length;){let furthest=i;for(let j=i;j<reversed.length;j++)if(clearSegment(anchor,reversed[j]!,map))furthest=j;result.push(reversed[furthest]!);anchor=reversed[furthest]!;i=furthest+1;}
 return validPath(start,result,map)?result:[];
}
export function nearestApproach(a0:V2,a1:V2,b0:V2,b1:V2):number{
 const x=a0.x-b0.x,z=a0.z-b0.z,dx=(a1.x-a0.x)-(b1.x-b0.x),dz=(a1.z-a0.z)-(b1.z-b0.z);
 const t=Math.max(0,Math.min(1,-(x*dx+z*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x+dx*t,z+dz*t);
}

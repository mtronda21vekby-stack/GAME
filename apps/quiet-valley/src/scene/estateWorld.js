/** Radial estate presentation. One continuous coast; no satellite pads or connecting tongues. */
import {estateScale,terrainBounds} from '../domain/estateLayout.js';
import {makeEstateModel} from './estateModels.js';
import {mm,ortho,look,mul} from '../rendering/math.js';
export function createEstateWorld(BaseWorld,X){
 return {make(R,art){
  const world=BaseWorld.make(R,art),farm=world.roots.farm,terrain=art.terrain;
  if(!terrain?.layers?.length)throw Error('Farm terrain bindings are missing');
  const buildings={},workers={};let tier=1;
  for(const key of Object.keys(X.estateBuildings)){buildings[key]=makeEstateModel(R,key,farm);buildings[key].visible=false;}
  for(const [key,color] of Object.entries({gardener:'#718d62',rancher:'#927450',collector:'#8b7a94',beekeeper:'#b79752',foreman:'#7b8580'})){
   const g=R.group([0,.28,0],[.72,.72,.72],[0,0,0],farm);
   R.add('cylinder',[0,.76,0],[.32,1.05,.32],color,[0,0,0],g);
   R.add('sphere',[0,1.48,0],[.28,.31,.28],'#d6b18d',[0,0,0],g);
   for(const x of [-.18,.18])R.add('cylinder',[x,.18,0],[.1,.55,.1],'#655f52',[0,0,0],g);
   workers[key]=g;g.visible=false;
  }
  const baseSync=world.sync.bind(world),baseInspect=world.inspect.bind(world),baseFocus=world.focusCamera.bind(world);
  function camera(mobile){
   const c=baseFocus('farm',mobile);if(tier===1)return c;
   const b=terrainBounds(tier),aspect=R.w&&R.h?R.w/R.h:(mobile?390/844:1.6);
   const horizontal=Math.hypot(b.x*Math.cos(c.yaw),b.z*Math.sin(c.yaw))*1.06;
   c.size=Math.max(c.size*estateScale(tier),horizontal/aspect*1.1);
   c.target=[0,.3,0];return c;
  }
  world.sync=function(s){
   baseSync(s);const e=s.world.estate,previous=tier;tier=e.tier;const scale=estateScale(tier);
   if(R.sun){const radius=s.world.region==='farm'?Math.max(24,terrainBounds(tier).x*1.1):24;R.light=mm(ortho(-radius,radius,-radius,radius,1,95),look(mul(R.sun,42),[0,0,0]));}
   for(const r of terrain.layers){r.node.s[0]=r.scale[0]*scale;r.node.s[2]=r.scale[2]*scale;}
   for(const r of terrain.shore){r.node.p[0]=r.position[0]*scale;r.node.p[2]=r.position[2]*scale;}
   for(const [key,g] of Object.entries(buildings)){
    const p=e.placements[key];g.visible=e.buildings.includes(key)&&!!p;
    if(p){g.p=[p.x,.28,p.z];g.r[1]=p.rotation*Math.PI/2;}
   }
   for(const [key,g] of Object.entries(workers)){
    const p=e.placements[X.staffRoles[key].requires];g.visible=e.staff.includes(key)&&!!p;
    if(p){const a=p.rotation*Math.PI/2;g.p=[p.x+Math.sin(a)*1.55,.28,p.z+Math.cos(a)*1.55];g.r[1]=a;}
   }
   if(s.world.region==='farm'&&tier>previous&&R.camera){
    const c=camera((R.w||globalThis.innerWidth||1440)<700);
    Object.assign(R.camera,{...c,size:Math.max(R.camera.size,c.size)});R.cameraVP?.();
   }
  };
  world.focusCamera=function(region,mobile=false){return region==='farm'?camera(mobile):baseFocus(region,mobile);};
  world.inspect=function(){
   const turf=terrain.layers[1].node,scale=estateScale(tier);
   return {...baseInspect(),estate:{layout:'radial-v2',tier,scale,areaPercent:Math.round(scale*scale*100),
    terrainLayers:terrain.layers.length,tierPads:0,bridges:0,
    bounds:{minX:-turf.s[0],maxX:turf.s[0],minZ:-turf.s[2],maxZ:turf.s[2]},
    buildings:Object.entries(buildings).filter(([,g])=>g.visible).map(([key,g])=>({key,x:g.p[0],z:g.p[2],rotation:Math.round(g.r[1]/(Math.PI/2))})),
    staff:Object.entries(workers).filter(([,g])=>g.visible).map(([key])=>key)}};
  };
  return world;
 }};
}

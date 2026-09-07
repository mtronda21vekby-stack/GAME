/* Physical farm-estate layer. Radial growth remains additive to the authoritative ValleyWorld. */
'use strict';
export function createEstateWorld(BaseWorld,FarmExpansion){
 return {make(R,art){
  const world=BaseWorld.make(R,art),farm=world.roots.farm;
  const group=(p=[0,0,0],parent=farm,s=[1,1,1],r=[0,0,0])=>R.group(p,s,r,parent);
  const add=(type,p,s,c,parent,r=[0,0,0],alpha=1)=>R.add(type,p,s,c,r,parent,alpha);
  const box=(p,s,c,parent,r=[0,0,0],alpha=1)=>add('bevelBox',p,s,c,parent,r,alpha);
  const ball=(p,s,c,parent)=>add('sphere',p,s,c,parent);
  const cyl=(p,s,c,parent,r=[0,0,0])=>add('cylinder',p,s,c,parent,r);
  const cone=(p,s,c,parent,r=[0,0,0])=>add('cone',p,s,c,parent,r);
  const rings={},buildings={},workers={},placedStructures=new Map();
  let visibleTier=1,extraGrid=null,extraPreview=null,lastPlacementState=null;
  const bounds=FarmExpansion.estateBounds||{1:{rx:14.75,rz:11.5},2:{rx:18,rz:14.5},3:{rx:21,rz:17},4:{rx:24,rz:19.5}};

  function removeGroup(root){
   if(!root)return;
   const belongs=n=>{while(n){if(n===root)return true;n=n.parent;}return false;};
   R.meshes=R.meshes.filter(n=>!belongs(n));
   for(const batch of R.batches.values())batch.nodes=batch.nodes.filter(n=>!belongs(n));
  }

  /* A purchased tier is one centered island footprint, not a side pad. The original farm
     sits on top of it, so only the newly purchased annulus is visible around the whole coast. */
  function radialLand(tier,b){
   const g=rings[tier]=group();g.visible=false;
   add('island',[0,-.78,0],[b.rx,1.55,b.rz],'#897963',g);
   add('island',[0,-.39,0],[b.rx+.22,.85,b.rz+.18],'#b09b78',g);
   const top=add('island',[0,-.01,0],[b.rx+.38,.24,b.rz+.31],'#9fb674',g);top.fx=[4,0,0,0];
   const rocks=Math.max(44,Math.round((b.rx+b.rz)*1.55));
   for(let i=0;i<rocks;i++){
    const a=i/rocks*Math.PI*2,x=Math.cos(a)*b.rx*.955,z=Math.sin(a)*b.rz*.94;
    box([x,-.71-(i%3)*.06,z],[.72+(i%4)*.11,.86,.68+(i%2)*.14],i%3?'#a18d6e':'#b09a7a',g,[0,a,0]);
   }
   // Sparse vegetation on the new perimeter makes the added land read as living terrain.
   for(let i=0;i<28;i++){
    const a=i/28*Math.PI*2,rr=.78+(i%4)*.045,x=Math.cos(a)*b.rx*rr,z=Math.sin(a)*b.rz*rr;
    const t=group([x,.13,z],g,[.7,.7,.7]);
    cone([0,.32,0],[.08,.62,.08],i%2?'#819c58':'#91a965',t,[0,0,(i%2?.22:-.18)]);
   }
   return g;
  }
  radialLand(2,bounds[2]);radialLand(3,bounds[3]);radialLand(4,bounds[4]);

  function cottage(parent,p,scale=1,roof='#79917d',rotation=0){
   const g=group(p,parent,[scale,scale,scale],[0,rotation,0]);
   box([0,1,0],[2.7,2,2.15],'#decda9',g);
   for(const side of [-1,1])box([side*.66,2.17,0],[1.65,.18,2.55],roof,g,[0,0,-side*.43]);
   box([-.55,.72,1.1],[.65,1.35,.08],'#64816e',g);box([.62,1.18,1.12],[.72,.72,.07],'#7ca5a3',g);return g;
  }
  function shed(parent,p,rotation=0){const g=group(p,parent,[1,1,1],[0,rotation,0]);box([0,.85,0],[2.45,1.7,1.85],'#b39365',g);cone([0,1.95,0],[1.75,1.25,1.55],'#647966',g,[0,Math.PI/4,0]);box([0,.63,.96],[.82,1.25,.08],'#6a775f',g);return g;}
  function greenhouse(parent,p,rotation=0){const g=group(p,parent,[1,1,1],[0,rotation,0]);box([0,.12,0],[3.2,.22,2.25],'#b8a989',g);for(const x of [-1.45,0,1.45])cyl([x,1.05,0],[.07,2,.07],'#748b7c',g);for(const z of [-1,1])box([0,1.95,z],[3.05,.08,.07],'#748b7c',g);for(const side of [-1,1])box([side*.75,2.2,0],[1.7,.07,2.3],'#b9d5c8',g,[0,0,-side*.48],.67);for(let i=0;i<8;i++)ball([-1.15+i%4*.75,.55,-.55+Math.floor(i/4)*1.1],[.28,.42,.28],i%2?'#6f9a61':'#88a66a',g);return g;}
  function depot(parent,p,rotation=0){const g=group(p,parent,[1,1,1],[0,rotation,0]);box([0,.18,0],[3.6,.32,2.7],'#9d8d72',g);for(let x=-1.3;x<=1.3;x+=1.3)box([x,.72,0],[.18,1.45,.18],'#7f6b4e',g);box([0,1.48,0],[3.25,.15,2.45],'#6f7d68',g);for(let i=0;i<5;i++)box([-1.25+i*.62,.45,.65],[.5,.5,.72],i%2?'#ae8d5f':'#8e7653',g);return g;}
  function gazebo(parent,p,rotation=0){const g=group(p,parent,[1,1,1],[0,rotation,0]);for(const x of [-1.25,1.25])for(const z of [-1,1])cyl([x,1.15,z],[.11,2.25,.11],'#8b7655',g);cone([0,2.65,0],[2.15,1.45,1.75],'#7a8d72',g,[0,Math.PI/4,0]);box([0,.25,0],[2.7,.2,2.15],'#c6b590',g);return g;}
  function workshop(parent,p,rotation=0){const g=depot(parent,p,rotation);box([0,1.02,-1.05],[2.2,.85,.12],'#5f6f62',g);return g;}

  /* Functional estate buildings now sit around the purchased circumference rather than on
     detached pads. Their domain behavior is unchanged. */
  buildings.tool_shed=shed(farm,[14.9,.14,-5.2],-.18);
  buildings.bunkhouse=cottage(farm,[14.4,.14,5.8],.82,'#8c9e83',.12);
  buildings.staff_house=cottage(farm,[-15.6,.14,-6.4],.92,'#9b8274',-.12);
  buildings.honey_house=shed(farm,[-16.2,.14,4.7],.15);
  buildings.greenhouse=greenhouse(farm,[-4.5,.14,14.1],.05);
  buildings.works_depot=depot(farm,[5.2,.14,14.4],-.05);
  for(const g of Object.values(buildings))g.visible=false;

  function person(parent,p,shirt){const g=group(p,parent,[.72,.72,.72]);cyl([0,.76,0],[.32,1.05,.32],shirt,g);ball([0,1.48,0],[.28,.31,.28],'#d6b18d',g);for(const x of [-.18,.18])cyl([x,.18,0],[.10,.55,.10],'#655f52',g);return g;}
  workers.gardener=person(farm,[12.5,.18,-3.8],'#718d62');
  workers.rancher=person(farm,[12.7,.18,4.0],'#927450');
  workers.collector=person(farm,[-13.4,.18,-5.0],'#8b7a94');
  workers.beekeeper=person(farm,[-13.8,.18,3.7],'#b79752');
  workers.foreman=person(farm,[3.4,.18,12.3],'#7b8580');
  for(const g of Object.values(workers))g.visible=false;

  function structureModel(type,d){
   const rot=(d.rotation||0)*Math.PI/2,p=[d.x,.15,d.z];
   if(type==='garden_shed')return shed(farm,p,rot);
   if(type==='gazebo')return gazebo(farm,p,rot);
   if(type==='storage_hut')return cottage(farm,p,.66,'#907b6b',rot);
   if(type==='field_greenhouse')return greenhouse(farm,p,rot);
   if(type==='workshop')return workshop(farm,p,rot);
   return null;
  }
  function syncPlacedStructures(s){
   for(const [,g] of placedStructures)removeGroup(g);placedStructures.clear();
   if(s.world.region!=='farm')return;
   for(const d of s.world.decor){
    if(!FarmExpansion.radialStructures?.[d.type])continue;
    const g=structureModel(d.type,d);if(g)placedStructures.set(d.id,g);
   }
  }

  const baseSync=world.sync.bind(world),baseInspect=world.inspect.bind(world),baseFocus=world.focusCamera.bind(world),baseSetPlacement=world.setPlacement.bind(world),basePreview=world.preview.bind(world);
  world.sync=function(s){
   baseSync(s);const e=s.world.estate||{tier:1,buildings:[],staff:[]};
   const previousTier=visibleTier;visibleTier=e.tier;
   for(const [tier,g] of Object.entries(rings))g.visible=s.world.region==='farm'&&e.tier===Number(tier);
   for(const [key,g] of Object.entries(buildings))g.visible=s.world.region==='farm'&&e.buildings.includes(key);
   for(const [key,g] of Object.entries(workers))g.visible=s.world.region==='farm'&&e.staff.includes(key);
   syncPlacedStructures(s);
   lastPlacementState=s;
   if(s.world.region==='farm'&&e.tier>previousTier&&R.camera){
    const targetSize=innerWidth<700?({2:30,3:34,4:38}[e.tier]||30):({2:19.8,3:22.8,4:26}[e.tier]||19.8);
    R.camera.size=Math.max(R.camera.size,targetSize);R.camera.target=[0,0,0];R.cameraVP?.();
   }
  };
  world.focusCamera=function(region,mobile=false){
   const c=baseFocus(region,mobile);
   if(region==='farm'){
    const factor={1:1,2:1.32,3:1.52,4:1.72}[visibleTier]||1;c.size*=factor;c.target=[0,0,0];
   }
   return c;
  };
  world.setPlacement=function(type,s,rotation=0){
   baseSetPlacement(type,s,rotation);removeGroup(extraGrid);extraGrid=null;extraPreview=null;lastPlacementState=s;
   if(!type||s.world.region!=='farm'||(s.world.estate?.tier||1)<2)return;
   extraGrid=group([0,0,0],farm);const b=bounds[s.world.estate.tier]||bounds[2];
   const maxX=Math.ceil(b.rx/2)*2,maxZ=Math.ceil(b.rz/2)*2;
   for(let x=-maxX;x<=maxX;x+=2)for(let z=-maxZ;z<=maxZ;z+=2){
    if(!FarmExpansion.radialEstateCell?.(s,'farm',x,z))continue;
    const occupied=s.world.decor.some(d=>d.region==='farm'&&d.x===x&&d.z===z);
    const valid=type==='remove'?occupied:!FarmExpansion.radialEstatePlacementCheck?.(s,'farm',x,z);
    box([x,.30,z],[1.82,.028,1.82],valid?'#c6dfae':'#d4b8a1',extraGrid,[0,0,0],valid?.38:.20);
   }
   extraPreview=box([0,.335,0],[1.88,.045,1.88],'#bfe0aa',extraGrid,[0,0,0],.56);extraPreview.visible=false;
  };
  world.preview=function(x,z,s){
   basePreview(x,z,s);lastPlacementState=s;
   if(!extraPreview)return;
   const radial=FarmExpansion.radialEstateCell?.(s,s.world.region,x,z);
   extraPreview.visible=!!radial&&!FarmExpansion.radialEstatePlacementCheck?.(s,s.world.region,x,z);
   if(extraPreview.visible){extraPreview.p[0]=x;extraPreview.p[2]=z;}
  };
  world.inspect=function(){
   const base=baseInspect(),b=bounds[visibleTier]||bounds[1];
   return {...base,estate:{tier:visibleTier,radial:true,buildableRing:visibleTier>=2,visibleRing:Object.entries(rings).find(([,g])=>g.visible)?.[0]||null,placedStructures:[...placedStructures.keys()],buildings:Object.entries(buildings).filter(([,g])=>g.visible).map(([k])=>k),staff:Object.entries(workers).filter(([,g])=>g.visible).map(([k])=>k),bounds:{base:bounds[1],current:b}}};
  };
  return world;
 }};
}

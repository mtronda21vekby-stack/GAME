/* Physical farm-estate layer. It decorates ValleyWorld so the domain remains authoritative. */
'use strict';
export function createEstateWorld(BaseWorld,FarmExpansion){
 return {make(R,art){
  const world=BaseWorld.make(R,art),farm=world.roots.farm;
  const group=(p=[0,0,0],parent=farm,s=[1,1,1])=>R.group(p,s,[0,0,0],parent);
  const add=(type,p,s,c,parent,r=[0,0,0],alpha=1)=>R.add(type,p,s,c,r,parent,alpha);
  const box=(p,s,c,parent,r=[0,0,0])=>add('bevelBox',p,s,c,parent,r);
  const ball=(p,s,c,parent)=>add('sphere',p,s,c,parent);
  const cyl=(p,s,c,parent,r=[0,0,0])=>add('cylinder',p,s,c,parent,r);
  const cone=(p,s,c,parent,r=[0,0,0])=>add('cone',p,s,c,parent,r);
  const tiers={},buildings={},workers={};
  let visibleTier=1;

  function land(key,p,s){
   const g=tiers[key]=group(p);g.visible=false;
   add('island',[0,-.62,0],[s[0],1.34,s[1]],'#8f8065',g);
   add('island',[0,-.25,0],[s[0]+.22,.78,s[1]+.18],'#b09b78',g);
   const top=add('island',[0,.09,0],[s[0]+.34,.25,s[1]+.28],'#9fb674',g);top.fx=[4,0,0,0];
   for(let i=0;i<18;i++){
    const a=i/18*Math.PI*2;
    box([Math.cos(a)*s[0]*.94,-.61,Math.sin(a)*s[1]*.92],[.72,.82,.64],i%2?'#a18d6e':'#b09a7a',g,[0,a,0]);
   }
   return g;
  }

  /* Base farm already spans about X ±14.75 / Z ±11.5. These pads deliberately
     extend beyond that shoreline while overlapping it enough to read as one island. */
  const t2=land(2,[17.0,0,1.2],[5.2,6.1]);       // east wing: reaches X ~22.5
  const t3=land(3,[-16.9,0,-6.9],[5.4,4.9]);     // southwest wing: reaches X ~-22.6 / Z ~-12.1
  const t4=land(4,[0,0,14.6],[8.0,4.8]);         // north wing: reaches Z ~19.7

  function path(parent,x,z,w,d,r=[0,0,0]){add('island',[x,.30,z],[w,.06,d],'#d2c39c',parent,r);}
  path(t2,-2.4,0,4.8,.48);
  path(t3,2.3,.5,5.0,.48,[0,.08,0]);
  path(t4,0,-1.25,6.8,.5);

  // Connection tongues visually stitch each new parcel into the original shoreline.
  const bridges={
   2:group([13.8,.01,1.2],farm),
   3:group([-13.7,.01,-6.9],farm),
   4:group([0,.01,11.3],farm)
  };
  add('island',[0,.08,0],[3.6,.24,3.2],'#9fb674',bridges[2]);
  add('island',[0,.08,0],[3.8,.24,3.0],'#9fb674',bridges[3]);
  add('island',[0,.08,0],[5.6,.24,3.5],'#9fb674',bridges[4]);
  for(const g of Object.values(bridges))g.visible=false;

  function cottage(parent,p,scale=1,roof='#79917d'){
   const g=group(p,parent,[scale,scale,scale]);
   box([0,1,0],[2.7,2,2.15],'#decda9',g);
   for(const side of [-1,1])box([side*.66,2.17,0],[1.65,.18,2.55],roof,g,[0,0,-side*.43]);
   box([-.55,.72,1.1],[.65,1.35,.08],'#64816e',g);box([.62,1.18,1.12],[.72,.72,.07],'#7ca5a3',g);return g;
  }
  function shed(parent,p){const g=group(p,parent);box([0,.85,0],[2.45,1.7,1.85],'#b39365',g);cone([0,1.95,0],[1.75,1.25,1.55],'#647966',g,[0,Math.PI/4,0]);box([0,.63,.96],[.82,1.25,.08],'#6a775f',g);return g;}
  function greenhouse(parent,p){const g=group(p,parent);box([0,.12,0],[3.2,.22,2.25],'#b8a989',g);for(const x of [-1.45,0,1.45])cyl([x,1.05,0],[.07,2.0,.07],'#748b7c',g);for(const z of [-1.0,1.0])box([0,1.95,z],[3.05,.08,.07],'#748b7c',g);for(const side of [-1,1]){const roof=box([side*.75,2.2,0],[1.7,.07,2.3],'#b9d5c8',g,[0,0,-side*.48]);roof.a=.65;}for(let i=0;i<8;i++)ball([-1.15+i%4*.75,.55,-.55+Math.floor(i/4)*1.1],[.28,.42,.28],i%2?'#6f9a61':'#88a66a',g);return g;}
  function depot(parent,p){const g=group(p,parent);box([0,.18,0],[3.6,.32,2.7],'#9d8d72',g);for(let x=-1.3;x<=1.3;x+=1.3)box([x,.72,0],[.18,1.45,.18],'#7f6b4e',g);box([0,1.48,0],[3.25,.15,2.45],'#6f7d68',g);for(let i=0;i<5;i++)box([-1.25+i*.62,.45,.65],[.5,.5,.72],i%2?'#ae8d5f':'#8e7653',g);return g;}

  buildings.tool_shed=shed(t2,[-1.4,.23,-2.0]);
  buildings.bunkhouse=cottage(t2,[1.5,.23,1.7],.78,'#8c9e83');
  buildings.staff_house=cottage(t3,[.9,.23,.55],.92,'#9b8274');
  buildings.honey_house=shed(t3,[-2.2,.23,-1.25]);
  buildings.greenhouse=greenhouse(t4,[-2.7,.23,.45]);
  buildings.works_depot=depot(t4,[2.8,.23,.25]);
  for(const g of Object.values(buildings))g.visible=false;

  function person(parent,p,shirt){const g=group(p,parent,[.72,.72,.72]);cyl([0,.76,0],[.32,1.05,.32],shirt,g);ball([0,1.48,0],[.28,.31,.28],'#d6b18d',g);for(const x of [-.18,.18])cyl([x,.18,0],[.10,.55,.10],'#655f52',g);return g;}
  workers.gardener=person(t2,[-2.7,.28,1.15],'#718d62');
  workers.rancher=person(t2,[2.45,.28,-1.05],'#927450');
  workers.collector=person(t3,[2.25,.28,-1.35],'#8b7a94');
  workers.beekeeper=person(t3,[-3.05,.28,1.0],'#b79752');
  workers.foreman=person(t4,[.45,.28,-1.45],'#7b8580');
  for(const g of Object.values(workers))g.visible=false;

  const baseSync=world.sync.bind(world),baseInspect=world.inspect.bind(world),baseFocus=world.focusCamera.bind(world);
  world.sync=function(s){
   baseSync(s);const e=s.world.estate||{tier:1,buildings:[],staff:[]};
   const previousTier=visibleTier;visibleTier=e.tier;
   for(const [tier,g] of Object.entries(tiers))g.visible=s.world.region==='farm'&&e.tier>=Number(tier);
   for(const [tier,g] of Object.entries(bridges))g.visible=s.world.region==='farm'&&e.tier>=Number(tier);
   for(const [key,g] of Object.entries(buildings))g.visible=s.world.region==='farm'&&e.buildings.includes(key);
   for(const [key,g] of Object.entries(workers))g.visible=s.world.region==='farm'&&e.staff.includes(key);

   // When the player buys more land, reveal the new coastline immediately instead of
   // leaving it outside the previous crop-focused camera framing.
   if(s.world.region==='farm'&&e.tier>previousTier&&R.camera){
    const targetSize=innerWidth<700?({2:27.5,3:29.5,4:32}[e.tier]||27.5):({2:17.8,3:19.8,4:22.2}[e.tier]||17.8);
    R.camera.size=Math.max(R.camera.size,targetSize);
    R.camera.target=[0,0,e.tier>=4?2.3:0];
    R.cameraVP?.();
   }
  };
  world.focusCamera=function(region,mobile=false){
   const c=baseFocus(region,mobile);
   if(region==='farm'){
    const factor={1:1,2:1.18,3:1.31,4:1.47}[visibleTier]||1;
    c.size*=factor;
    if(visibleTier>=4)c.target=[0,0,2.3];
   }
   return c;
  };
  world.inspect=function(){
   const base=baseInspect();return {...base,estate:{tier:visibleTier,tierPads:Object.values(tiers).filter(g=>g.visible).length,bridges:Object.values(bridges).filter(g=>g.visible).length,buildings:Object.entries(buildings).filter(([,g])=>g.visible).map(([k])=>k),staff:Object.entries(workers).filter(([,g])=>g.visible).map(([k])=>k),bounds:{base:{x:14.75,z:11.5},tier2:{x:22.5,z:7.6},tier3:{x:-22.6,z:-12.1},tier4:{x:8.3,z:19.7}}}};
  };
  return world;
 }};
}

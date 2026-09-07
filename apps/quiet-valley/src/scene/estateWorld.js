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
  const tiers={};const buildings={};const workers={};
  function land(key,p,s){
   const g=tiers[key]=group(p);g.visible=false;
   add('island',[0,-.58,0],[s[0],1.25,s[1]],'#9f9274',g);
   add('island',[0,-.22,0],[s[0]+.18,.72,s[1]+.16],'#b7a582',g);
   const top=add('island',[0,.09,0],[s[0]+.28,.24,s[1]+.24],'#a9bd7e',g);top.fx=[4,0,0,0];
   for(let i=0;i<12;i++){const a=i/12*Math.PI*2;box([Math.cos(a)*s[0]*.91,-.58,Math.sin(a)*s[1]*.90],[.62,.74,.58],i%2?'#aa9b7c':'#b4a486',g,[0,a,0]);}
   return g;
  }
  const t2=land(2,[10.8,0,1.1],[3.7,5.2]);
  const t3=land(3,[-9.5,0,-7.1],[4.3,3.4]);
  const t4=land(4,[0,0,10.0],[6.3,3.0]);
  function path(parent,x,z,w,d){add('island',[x,.30,z],[w,.055,d],'#d1c29e',parent);}
  path(t2,-1.4,0,2.2,.42);path(t3,1.2,.4,2.7,.42);path(t4,0,0,4.4,.45);
  function cottage(parent,p,scale=1,roof='#79917d'){
   const g=group(p,parent,[scale,scale,scale]);
   box([0,1,0],[2.7,2,2.15],'#decda9',g);for(const side of [-1,1])box([side*.66,2.17,0],[1.65,.18,2.55],roof,g,[0,0,-side*.43]);
   box([-.55,.72,1.1],[.65,1.35,.08],'#64816e',g);box([.62,1.18,1.12],[.72,.72,.07],'#7ca5a3',g);return g;
  }
  function shed(parent,p){const g=group(p,parent);box([0,.85,0],[2.45,1.7,1.85],'#b39365',g);cone([0,1.95,0],[1.75,1.25,1.55],'#647966',g,[0,Math.PI/4,0]);box([0,.63,.96],[.82,1.25,.08],'#6a775f',g);return g;}
  function greenhouse(parent,p){const g=group(p,parent);box([0,.12,0],[3.2,.22,2.25],'#b8a989',g);for(const x of [-1.45,0,1.45])cyl([x,1.05,0],[.07,2.0,.07],'#748b7c',g);for(const z of [-1.0,1.0])box([0,1.95,z],[3.05,.08,.07],'#748b7c',g);for(const side of [-1,1]){const roof=box([side*.75,2.2,0],[1.7,.07,2.3],'#b9d5c8',g,[0,0,-side*.48]);roof.a=.65;}for(let i=0;i<8;i++)ball([-1.15+i%4*.75,.55,-.55+Math.floor(i/4)*1.1],[.28,.42,.28],i%2?'#6f9a61':'#88a66a',g);return g;}
  function depot(parent,p){const g=group(p,parent);box([0,.18,0],[3.6,.32,2.7],'#9d8d72',g);for(let x=-1.3;x<=1.3;x+=1.3)box([x,.72,0],[.18,1.45,.18],'#7f6b4e',g);box([0,1.48,0],[3.25,.15,2.45],'#6f7d68',g);for(let i=0;i<5;i++)box([-1.25+i*.62,.45,.65],[.5,.5,.72],i%2?'#ae8d5f':'#8e7653',g);return g;}
  buildings.tool_shed=shed(t2,[-.8,.23,-1.6]);
  buildings.bunkhouse=cottage(t2,[1.25,.23,1.55],.72,'#8c9e83');
  buildings.staff_house=cottage(t3,[.55,.23,.35],.9,'#9b8274');
  buildings.honey_house=shed(t3,[-2.0,.23,-1.05]);
  buildings.greenhouse=greenhouse(t4,[-2.1,.23,.15]);
  buildings.works_depot=depot(t4,[2.3,.23,.05]);
  for(const g of Object.values(buildings))g.visible=false;
  function person(parent,p,shirt){const g=group(p,parent,[.72,.72,.72]);cyl([0,.76,0],[.32,1.05,.32],shirt,g);ball([0,1.48,0],[.28,.31,.28],'#d6b18d',g);for(const x of [-.18,.18])cyl([x,.18,0],[.10,.55,.10],'#655f52',g);return g;}
  workers.gardener=person(t2,[-2.2,.28,.8],'#718d62');
  workers.rancher=person(t2,[2.15,.28,-.75],'#927450');
  workers.collector=person(t3,[1.95,.28,-1.2],'#8b7a94');
  workers.beekeeper=person(t3,[-2.8,.28,.7],'#b79752');
  workers.foreman=person(t4,[.3,.28,-1.1],'#7b8580');
  for(const g of Object.values(workers))g.visible=false;
  const baseSync=world.sync.bind(world),baseInspect=world.inspect.bind(world),baseFocus=world.focusCamera.bind(world);
  world.sync=function(s){
   baseSync(s);const e=s.world.estate||{tier:1,buildings:[],staff:[]};
   for(const [tier,g] of Object.entries(tiers))g.visible=s.world.region==='farm'&&e.tier>=Number(tier);
   for(const [key,g] of Object.entries(buildings))g.visible=s.world.region==='farm'&&e.buildings.includes(key);
   for(const [key,g] of Object.entries(workers))g.visible=s.world.region==='farm'&&e.staff.includes(key);
  };
  world.focusCamera=function(region,mobile=false){const c=baseFocus(region,mobile);if(region==='farm')c.size*=1.08;return c;};
  world.inspect=function(){const base=baseInspect();return {...base,estate:{tierPads:Object.values(tiers).filter(g=>g.visible).length,buildings:Object.entries(buildings).filter(([,g])=>g.visible).map(([k])=>k),staff:Object.entries(workers).filter(([,g])=>g.visible).map(([k])=>k)}};};
  return world;
 }};
}

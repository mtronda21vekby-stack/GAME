import test from 'node:test';
import assert from 'node:assert/strict';
import {createDomain} from '../src/domain/createDomain.js';
import {createEstateWorld} from '../src/scene/estateWorld.js';

function harness(){
 let now=1_000_000;
 const clock={now:()=>now};
 const domain=createDomain(clock);
 const state=domain.commands.fresh(now);
 state.coins=5000;state.world.materials.wood=200;state.world.materials.stone=200;
 return {domain,state,now:()=>now,advance:ms=>{now+=ms;domain.commands.tick(state,now);}};
}

test('island expansion unlocks buildings and staff capacity progressively',()=>{
 const h=harness(),act=a=>h.domain.commands.act(h.state,a,h.now());
 assert.equal(h.state.world.estate.tier,1);
 assert.equal(act({type:'buildEstate',key:'tool_shed'}).ok,false);
 assert.equal(act({type:'expandEstate'}).ok,true);
 assert.equal(h.state.world.estate.tier,2);
 assert.equal(act({type:'buildEstate',key:'tool_shed'}).ok,true);
 assert.equal(act({type:'hireStaff',key:'gardener'}).ok,true);
 assert.deepEqual(h.state.world.estate.staff,['gardener']);
 assert.equal(act({type:'hireStaff',key:'rancher'}).ok,false,'tier two starts with one staff slot without housing');
 assert.equal(act({type:'buildEstate',key:'bunkhouse'}).ok,true);
 assert.equal(act({type:'hireStaff',key:'rancher'}).ok,true);
});

test('purchased estate grows as one radial coastline rather than detached side pads',()=>{
 const priorWidth=globalThis.innerWidth;globalThis.innerWidth=1280;
 try{
  const nodes=[];
  const R={
   meshes:[],batches:new Map(),camera:{size:14,target:[0,0,0]},cameraVP(){},
   group(p=[0,0,0],s=[1,1,1],r=[0,0,0],parent=null){const n={p,s,r,parent,visible:true};nodes.push(n);return n;},
   add(type,p,s,c,r=[0,0,0],parent=null,alpha=1){const n={type,p,s,c,r,parent,alpha,visible:true};nodes.push(n);this.meshes.push(n);return n;}
  };
  const farm=R.group();
  const BaseWorld={make(){return {roots:{farm},sync(){},setPlacement(){},preview(){},focusCamera(){return {size:14,target:[0,0,0]}},inspect(){return {}}};}};
  const expansion={
   estateBounds:{1:{rx:14.75,rz:11.5},2:{rx:18,rz:14.5},3:{rx:21,rz:17},4:{rx:24,rz:19.5}},
   radialStructures:{},radialEstateCell(){return false;},radialEstatePlacementCheck(){return 'blocked';}
  };
  const world=createEstateWorld(BaseWorld,expansion).make(R,{});
  const state={world:{region:'farm',decor:[],estate:{tier:1,buildings:[],staff:[]}}};
  world.sync(state);let i=world.inspect().estate;
  assert.equal(i.radial,true);assert.equal(i.visibleRing,null);assert.deepEqual(i.bounds.current,{rx:14.75,rz:11.5});
  state.world.estate.tier=2;world.sync(state);i=world.inspect().estate;
  assert.equal(i.visibleRing,'2');assert.equal(i.buildableRing,true);assert.deepEqual(i.bounds.current,{rx:18,rz:14.5});
  state.world.estate.tier=4;world.sync(state);i=world.inspect().estate;
  assert.equal(i.visibleRing,'4');assert.deepEqual(i.bounds.current,{rx:24,rz:19.5});
  assert.ok(R.camera.size>=26,'max estate must reframe the camera to show the full circular coast');
 }finally{
  if(priorWidth===undefined)delete globalThis.innerWidth;else globalThis.innerWidth=priorWidth;
 }
});

test('tier two shoreline accepts player items and placeable structures outside old coast',()=>{
 const h=harness(),act=a=>h.domain.commands.act(h.state,a,h.now());
 assert.equal(act({type:'placeDecor',region:'farm',key:'bench',x:16,z:0,rotation:0}).ok,false,'tier one cannot build beyond old shoreline');
 assert.equal(act({type:'expandEstate'}).ok,true);
 const bench=act({type:'placeDecor',region:'farm',key:'bench',x:16,z:0,rotation:0});
 assert.equal(bench.ok,true);assert.match(bench.message,/новой земле/);
 const shed=act({type:'placeDecor',region:'farm',key:'garden_shed',x:-16,z:0,rotation:1});
 assert.equal(shed.ok,true);assert.ok(h.state.world.decor.some(d=>d.type==='garden_shed'&&d.x===-16));
 const raw=JSON.parse(JSON.stringify(h.state)),restored=h.domain.commands.validate(raw,h.now());
 assert.ok(restored.world.decor.some(d=>d.type==='bench'&&d.x===16),'radial decor must survive validation');
 assert.ok(restored.world.decor.some(d=>d.type==='garden_shed'&&d.x===-16),'radial structures must survive validation');
});

test('higher tiers expand buildable cells on every side of the island',()=>{
 const h=harness(),act=a=>h.domain.commands.act(h.state,a,h.now()),X=h.domain.queries.FarmExpansion;
 act({type:'expandEstate'});
 assert.equal(X.radialEstateCell(h.state,'farm',16,0),true,'tier 2 east ring');
 assert.equal(X.radialEstateCell(h.state,'farm',-16,0),true,'tier 2 west ring');
 assert.equal(X.radialEstateCell(h.state,'farm',0,12),true,'tier 2 north ring');
 assert.equal(X.radialEstateCell(h.state,'farm',0,-12),true,'tier 2 south ring');
 assert.equal(X.radialEstateCell(h.state,'farm',20,0),false);
 act({type:'expandEstate'});
 assert.equal(X.radialEstateCell(h.state,'farm',18,0),true,'tier 3 adds another full ring');
 act({type:'expandEstate'});
 assert.equal(X.radialEstateCell(h.state,'farm',22,0),true,'tier 4 reaches the outer ring');
});

test('gardener and rancher perform real farm work on ticks',()=>{
 const h=harness(),act=a=>h.domain.commands.act(h.state,a,h.now());
 act({type:'expandEstate'});act({type:'buildEstate',key:'tool_shed'});act({type:'buildEstate',key:'bunkhouse'});act({type:'hireStaff',key:'gardener'});act({type:'hireStaff',key:'rancher'});
 const plot=h.state.plots[7];assert.equal(plot.crop,null);assert.equal(act({type:'plant',id:7,crop:'wheat'}).ok,true);assert.equal(plot.waterAt,0);
 const animal=h.state.animals[0];animal.hunger=20;const wheat=h.state.inventory.wheat;
 h.advance(1000);
 assert.ok(plot.waterAt>0,'gardener must start the crop cycle');assert.ok(plot.readyAt>plot.waterAt);
 assert.ok(animal.hunger>20,'rancher must feed a hungry animal');assert.equal(h.state.inventory.wheat,wheat-1);
});

test('collector moves finished animal goods into inventory',()=>{
 const h=harness(),act=a=>h.domain.commands.act(h.state,a,h.now());
 act({type:'expandEstate'});act({type:'expandEstate'});act({type:'buildEstate',key:'staff_house'});act({type:'hireStaff',key:'collector'});
 const animal=h.state.animals.find(a=>a.type==='cow');animal.stock=2;const before=h.state.inventory.milk;
 h.advance(1000);assert.equal(animal.stock,0);assert.equal(h.state.inventory.milk,before+2);
});

test('estate state survives save validation while invalid future data is bounded',()=>{
 const h=harness(),act=a=>h.domain.commands.act(h.state,a,h.now());
 act({type:'expandEstate'});act({type:'buildEstate',key:'tool_shed'});act({type:'hireStaff',key:'gardener'});
 const raw=JSON.parse(JSON.stringify(h.state));raw.world.estate.staff.push('hacker');raw.world.estate.tier=99;
 const restored=h.domain.commands.validate(raw,h.now());
 assert.equal(restored.world.estate.tier,4);assert.ok(restored.world.estate.buildings.includes('tool_shed'));
 assert.ok(restored.world.estate.staff.includes('gardener'));assert.ok(!restored.world.estate.staff.includes('hacker'));
});

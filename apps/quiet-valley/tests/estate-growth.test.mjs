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

test('estate 3D pads extend beyond the original farm shoreline and reveal per tier',()=>{
 const priorWidth=globalThis.innerWidth;globalThis.innerWidth=1280;
 try{
  const nodes=[];
  const R={
   camera:{size:14,target:[0,0,0]},cameraVP(){},
   group(p=[0,0,0],s=[1,1,1],r=[0,0,0],parent=null){const n={p,s,r,parent,visible:true};nodes.push(n);return n;},
   add(type,p,s,c,r=[0,0,0],parent=null,alpha=1){const n={type,p,s,c,r,parent,alpha,visible:true};nodes.push(n);return n;}
  };
  const farm=R.group();
  const BaseWorld={make(){return {roots:{farm},sync(){},focusCamera(){return {size:14,target:[0,0,0]}},inspect(){return {}}};}};
  const world=createEstateWorld(BaseWorld,{}).make(R,{});
  const state={world:{region:'farm',estate:{tier:1,buildings:[],staff:[]}}};
  world.sync(state);
  let i=world.inspect().estate;
  assert.equal(i.tierPads,0);
  assert.equal(i.bounds.base.x,14.75);
  assert.ok(i.bounds.tier2.x>i.bounds.base.x+5,'tier 2 east coast must visibly exceed the old shoreline');
  assert.ok(Math.abs(i.bounds.tier3.x)>i.bounds.base.x+5,'tier 3 west coast must visibly exceed the old shoreline');
  assert.ok(i.bounds.tier4.z>i.bounds.base.z+7,'tier 4 north coast must visibly exceed the old shoreline');
  state.world.estate.tier=2;world.sync(state);i=world.inspect().estate;assert.equal(i.tierPads,1);assert.equal(i.bridges,1);
  state.world.estate.tier=4;world.sync(state);i=world.inspect().estate;assert.equal(i.tierPads,3);assert.equal(i.bridges,3);
  assert.ok(R.camera.size>=22.2,'max estate expansion must reframe the camera to show the new coast');
 }finally{
  if(priorWidth===undefined)delete globalThis.innerWidth;else globalThis.innerWidth=priorWidth;
 }
});

test('gardener and rancher perform real farm work on ticks',()=>{
 const h=harness(),act=a=>h.domain.commands.act(h.state,a,h.now());
 act({type:'expandEstate'});act({type:'buildEstate',key:'tool_shed'});act({type:'buildEstate',key:'bunkhouse'});act({type:'hireStaff',key:'gardener'});act({type:'hireStaff',key:'rancher'});
 const plot=h.state.plots[7];assert.equal(plot.crop,null);assert.equal(act({type:'plant',id:7,crop:'wheat'}).ok,true);assert.equal(plot.waterAt,0);
 const animal=h.state.animals[0];animal.hunger=20;const wheat=h.state.inventory.wheat;
 h.advance(1000);
 assert.ok(plot.waterAt>0,'gardener must start the crop cycle');
 assert.ok(plot.readyAt>plot.waterAt);
 assert.ok(animal.hunger>20,'rancher must feed a hungry animal');
 assert.equal(h.state.inventory.wheat,wheat-1);
});

test('collector moves finished animal goods into inventory',()=>{
 const h=harness(),act=a=>h.domain.commands.act(h.state,a,h.now());
 act({type:'expandEstate'});act({type:'expandEstate'});act({type:'buildEstate',key:'staff_house'});act({type:'hireStaff',key:'collector'});
 const animal=h.state.animals.find(a=>a.type==='cow');animal.stock=2;const before=h.state.inventory.milk;
 h.advance(1000);
 assert.equal(animal.stock,0);assert.equal(h.state.inventory.milk,before+2);
});

test('estate state survives save validation while invalid future data is bounded',()=>{
 const h=harness(),act=a=>h.domain.commands.act(h.state,a,h.now());
 act({type:'expandEstate'});act({type:'buildEstate',key:'tool_shed'});act({type:'hireStaff',key:'gardener'});
 const raw=JSON.parse(JSON.stringify(h.state));raw.world.estate.staff.push('hacker');raw.world.estate.tier=99;
 const restored=h.domain.commands.validate(raw,h.now());
 assert.equal(restored.world.estate.tier,4);
 assert.ok(restored.world.estate.buildings.includes('tool_shed'));
 assert.ok(restored.world.estate.staff.includes('gardener'));
 assert.ok(!restored.world.estate.staff.includes('hacker'));
});

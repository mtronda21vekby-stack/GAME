import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDomain} from '../src/domain/createDomain.js';
import {createFarmArt} from '../src/scene/farm.js';
import {createValleyWorld} from '../src/scene/valley.js';
import {createEstateWorld} from '../src/scene/estateWorld.js';
import {estateScale,estateMeadowCell,footprint,insideShore} from '../src/domain/estateLayout.js';
const manifest=JSON.parse(readFileSync(new URL('../dist/manifest.json',import.meta.url),'utf8'));
const {parseCommand}=await import(new URL('../dist/assets/'+manifest.sourceHash+'/application/commands.js',import.meta.url));
const now=1_000_000;
function farm(){const d=createDomain({now:()=>now}),s=d.commands.fresh(now);s.coins=10000;s.world.materials={wood:1000,stone:1000};return {d,s,X:d.queries.FarmExpansion,act:a=>d.commands.act(s,a,now)};}
function renderer(){return {w:1440,h:900,motion:0,meshes:[],batches:new Map(),camera:{size:14},cameraVP(){},
 group(p=[0,0,0],s=[1,1,1],r=[0,0,0],parent=null){return {p,s,r,parent,visible:true};},
 add(type,p,s,c,r=[0,0,0],parent=null,alpha=1){const n={type,p,s,c:[.5,.6,.4],fx:[0,0,0,0],r,parent,alpha,visible:true};this.meshes.push(n);return n;}};}

test('actual terrain meshes grow in every direction without resizing crops, buildings or shoreline stones',()=>{
 const {d,s,X,act}=farm(),R=renderer(),art=createFarmArt(d.queries.FarmSim).make(R);
 const world=createEstateWorld(createValleyWorld(X,d.queries.FarmSim),X).make(R,art);
 const plots=art.cropModels.map(m=>[m.x,m.z,...m.dirt.s]);const count=R.meshes.length;
 const rocks=art.terrain.shore.map(r=>({position:[...r.node.p],size:[...r.node.s]}));
 for(let tier=1;tier<=4;tier++){
  if(tier>1)assert.equal(act({type:'expandEstate'}).ok,true);world.sync(s);
  const i=world.inspect().estate,scale=estateScale(tier);
  assert.equal(i.layout,'radial-v2');assert.equal(i.tierPads,0);assert.equal(i.bridges,0);
  assert.equal(i.bounds.maxX,14.75*scale);assert.equal(i.bounds.minX,-14.75*scale);
  assert.equal(i.bounds.maxZ,11.5*scale);assert.equal(i.bounds.minZ,-11.5*scale);
  assert.equal(R.meshes.length,count,'growth must not accumulate terrain fragments');
  assert.deepEqual(art.cropModels.map(m=>[m.x,m.z,...m.dirt.s]),plots);
  art.terrain.shore.forEach((r,k)=>{assert.equal(r.node.p[0],rocks[k].position[0]*scale);assert.equal(r.node.p[2],rocks[k].position[2]*scale);assert.deepEqual(r.node.s,rocks[k].size);});
 }
});

test('tier two opens usable cells north, south, east and west and preserves decor on reload',()=>{
 const {d,s,X,act}=farm(),sides=[[16,0],[-16,0],[0,12],[0,-12]];
 for(const [x,z] of sides)assert.ok(X.placementCheck(s,'farm',x,z),'unbought land must be blocked');
 assert.equal(act({type:'expandEstate'}).ok,true);
 for(const [x,z] of sides){assert.equal(X.placementCheck(s,'farm',x,z),'');assert.equal(act({type:'placeDecor',key:'lamp',region:'farm',x,z,rotation:0}).ok,true);}
 const saved=d.commands.validate(JSON.parse(JSON.stringify(s)),now);
 assert.deepEqual(saved.world.decor,s.world.decor);assert.equal(X.decorCapacity(saved),48);
});

test('every estate building can be placed and moved; full footprints and conflicts are authoritative',()=>{
 const {d,s,X,act}=farm();for(let i=0;i<3;i++)act({type:'expandEstate'});
 for(const key of Object.keys(X.estateBuildings)){
  const p=X.placementCells(s,'estate:'+key).find(c=>c.valid);assert.ok(p,key+' requires a real site');
  const funds=s.coins,cost=X.estateBuildings[key].cost.coins;
  assert.equal(act({type:'buildEstate',key,x:p.x,z:p.z,rotation:0}).ok,true);assert.equal(s.coins,funds-cost);
  assert.equal(act({type:'placeDecor',key:'tree',region:'farm',x:p.x,z:p.z,rotation:0}).ok,false);
  const q=X.placementCells(s,'estate:'+key,1).find(c=>c.valid&&(c.x!==p.x||c.z!==p.z));assert.ok(q);
  const before=s.coins;assert.equal(act({type:'moveEstate',key,x:q.x,z:q.z,rotation:1}).ok,true);assert.equal(s.coins,before);
  const half=footprint(key,1);for(const sx of [-1,1])for(const sz of [-1,1])assert.ok(insideShore(4,q.x+sx*half[0],q.z+sz*half[1]));
 }
 const restored=d.commands.validate(JSON.parse(JSON.stringify(s)),now);
 assert.deepEqual(restored.world.estate.placements,s.world.estate.placements);
});

test('invalid terrain, occupied sites, wrong regions and insufficient resources never spend construction costs',()=>{
 const {s,X,act}=farm();act({type:'expandEstate'});
 for(const [x,z] of [[0,0],[100,0],[17,0],[18,14],[Infinity,0]]){
  const coins=s.coins;assert.equal(act({type:'buildEstate',key:'tool_shed',x,z,rotation:0}).ok,false);assert.equal(s.coins,coins);
 }
 act({type:'placeDecor',region:'farm',key:'lamp',x:16,z:0,rotation:0});
 assert.ok(X.buildingPlacementCheck(s,'tool_shed',16,0,0));
 const coins=s.coins;assert.equal(act({type:'buildEstate',key:'tool_shed',x:16,z:0,rotation:0}).ok,false);assert.equal(s.coins,coins);
 s.world.region='orchard';assert.equal(act({type:'buildEstate',key:'tool_shed',x:-16,z:0,rotation:0}).ok,false);s.world.region='farm';
 s.coins=0;const materials={...s.world.materials};assert.equal(act({type:'buildEstate',key:'tool_shed',x:-16,z:0,rotation:0}).ok,false);assert.deepEqual(s.world.materials,materials);
 assert.equal(estateMeadowCell(2,18,14),false);
});

test('old satellite saves migrate owned buildings and staff without charging or deleting decorations',()=>{
 const {d,s,X,act}=farm();act({type:'expandEstate'});act({type:'buildEstate',key:'tool_shed'});act({type:'hireStaff',key:'gardener'});
 act({type:'placeDecor',region:'farm',key:'lamp',x:16,z:0,rotation:0});
 const raw=JSON.parse(JSON.stringify(s));delete raw.world.estate.placements;delete raw.world.estate.layoutVersion;
 const restored=d.commands.validate(raw,now);
 assert.equal(restored.coins,raw.coins);assert.deepEqual(restored.world.materials,raw.world.materials);
 assert.deepEqual(restored.world.decor,raw.world.decor);assert.deepEqual(restored.world.estate.staff,['gardener']);
 const p=restored.world.estate.placements.tool_shed;assert.ok(p);assert.equal(X.buildingPlacementCheck(restored,'tool_shed',p.x,p.z,p.rotation),'');
 assert.deepEqual(d.commands.validate(restored,now).world.estate,restored.world.estate);
});

test('placement schema validates complete coordinates and keeps legacy key-only construction',()=>{
 assert.deepEqual(parseCommand({type:'buildEstate',key:'tool_shed'}),{type:'buildEstate',key:'tool_shed'});
 assert.equal(parseCommand({type:'buildEstate',key:'tool_shed',x:16,z:0,rotation:1}).x,16);
 assert.throws(()=>parseCommand({type:'buildEstate',key:'tool_shed',x:16}));
 assert.throws(()=>parseCommand({type:'moveEstate',key:'tool_shed',x:16,z:0}));
 assert.throws(()=>parseCommand({type:'moveEstate',key:'tool_shed',x:16,z:0,rotation:4}));
});

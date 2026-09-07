import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingFarm} from '../src/scene/livingFarm.js';

function node(p=[0,0,0],s=[1,1,1],r=[0,0,0],parent=null){return {p:[...p],s:[...s],r:[...r],parent,visible:true,fx:[0,0,0,0]};}
function renderer(){return {
 meshes:[],
 group(p=[0,0,0],s=[1,1,1],r=[0,0,0],parent=null){const n=node(p,s,r,parent);this.meshes.push(n);return n;},
 add(type,p,s,c,r=[0,0,0],parent=null,alpha=1){const n={...node(p,s,r,parent),type,c:[.5,.5,.5],alpha};this.meshes.push(n);return n;}
};}
function baseArt(){return {make(R){
 const animalModels=new Map();
 const makeAnimal=(id,type,x,z)=>{const g=R.group([x,.23,z]),head=R.group([0,1,0],[1,1,1],[0,0,0],g),body=R.add('sphere',[0,.8,0],[.4,.4,.6],'#fff',[0,0,0],g),tail=R.group([0,.7,-.5],[1,1,1],[0,0,0],g),legs=[R.group([-.2,.4,0],[1,1,1],[0,0,0],g),R.group([.2,.4,0],[1,1,1],[0,0,0],g)];const m={id,type,g,head,body,tail,legs,target:[x,z],wait:0,phase:0,pet:0};animalModels.set(id,m);return m;};
 makeAnimal(0,'cow',20,20);makeAnimal(1,'sheep',-20,-20);makeAnimal(2,'chicken',0,0);
 const villagers=['elena','mia','fedor','lea'].map((id,i)=>({id,name:id,g:R.group([20+i,.23,20]),head:R.group(),torso:R.group(),arms:[R.group(),R.group()],legs:[R.group(),R.group()],route:[[20,20]],routeIndex:0,target:[20,20],wait:0,phase:i}));
 return {animalModels,villagers,animalModel(data){return makeAnimal(data.id,data.type,0,0);},animate(){},updateCrops(){}};
 }};}

test('living farm places animals inside species habitats and villagers on authored work routes',()=>{
 const R=renderer(),art=createLivingFarm(baseArt()).make(R);
 const cow=art.animalModels.get(0),sheep=art.animalModels.get(1),chicken=art.animalModels.get(2);
 assert.ok(cow.g.p[0]>=2.75&&cow.g.p[0]<=8.75&&cow.g.p[2]>=-4.75&&cow.g.p[2]<=2.55);
 assert.ok(sheep.g.p[0]>=2.75&&sheep.g.p[0]<=8.75&&sheep.g.p[2]>=-4.75&&sheep.g.p[2]<=2.55);
 assert.ok(chicken.g.p[0]>=5.8&&chicken.g.p[0]<=9.15&&chicken.g.p[2]>=3.65&&chicken.g.p[2]<=5.55);
 for(const v of art.villagers)assert.ok(v.route.length>=7,`${v.id} needs a meaningful service route`);
 assert.ok(R.meshes.length>40,'living pass should add physical work-yard props and carried items');
});

test('living farm movement keeps animals contained after animation',()=>{
 const R=renderer(),art=createLivingFarm(baseArt()).make(R);
 const state={animals:[{id:0,type:'cow',hunger:20},{id:1,type:'sheep',hunger:90},{id:2,type:'chicken',hunger:30}]};
 for(const m of art.animalModels.values()){m.g.p=[50,.23,-50];m.target=[99,99];}
 art.animate(10,.2,state);
 const snapshot=art.livingWorld.inspect();
 for(const a of snapshot.animals){
  const z=art.livingWorld.animalZones?.[a.type];
  assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.z));
 }
 const cow=art.animalModels.get(0),chicken=art.animalModels.get(2);
 assert.ok(cow.g.p[0]<=8.75&&cow.g.p[2]>=-4.75);
 assert.ok(chicken.g.p[0]<=9.15&&chicken.g.p[2]>=3.65);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createFarmLayout} from '../src/scene/farmLayout.js';

function renderer(){
 const R={meshes:[]};
 R.group=(p=[0,0,0],s=[1,1,1],r=[0,0,0],parent=null)=>({p:[...p],s:[...s],r:[...r],parent,visible:true,isGroup:true});
 R.add=(type,p,s,c,r=[0,0,0],parent=null,alpha=1)=>{const n={type,p:[...p],s:[...s],c,r:[...r],parent,alpha,visible:true,fx:[0,0,0,0]};R.meshes.push(n);return n;};
 return R;
}

function baseFarm(){
 return {make(R){
  const roots=[];
  for(const p of [[-6.5,.2,-6.8],[-1.15,.2,-7.85],[-10,.2,-3.65],[-5.2,.2,7.1],[-2.55,.2,6.75],[-8.5,.2,6.7],[8.2,.2,4.4],[1.65,.2,7.65]]){
   const g=R.group(p);R.add('box',[0,0,0],[1,1,1],'#fff',[0,0,0],g);roots.push(g);
  }
  const cropModels=[];
  for(let id=0;id<16;id++){
   const x=-7.5+(id%4)*2.04,z=-2.35+Math.floor(id/4)*2.04;
   const dirt=R.add('box',[x,.29,z],[1.73,.2,1.73],'#694b32');
   const border=R.add('box',[x+.88,.36,z],[.10,.18,1.88],'#aa794d');
   const ridges=[R.add('box',[x-.4,.42,z],[.17,.11,1.58],'#856343'),R.add('box',[x+.4,.42,z],[.17,.11,1.58],'#856343')];
   const species={carrot:{g:R.group([x,.43,z]),nodes:[]},wheat:{g:R.group([x,.43,z]),nodes:[]},pumpkin:{g:R.group([x,.43,z]),nodes:[]}};
   for(const sp of Object.values(species))R.add('sphere',[0,.2,0],[.1,.1,.1],'#fff',[0,0,0],sp.g);
   cropModels.push({id,x,z,dirt,border,ridges,species});
  }
  const oldTrough=R.add('box',[3.1,.47,-3.75],[1.65,.4,.7],'#9b8160');
  const oldHay=R.add('cylinder',[7.6,.52,-4.25],[.4,.63,.4],'#c4a84d');
  const villagers=['elena','mia','fedor','lea'].map(id=>({id,g:R.group([0,.2,0]),route:[],target:[0,0],wait:0}));
  const livingWorld={villagerRoutes:{elena:[],mia:[],fedor:[],lea:[]}};
  return {villagers,livingWorld,cropModels,marketPoint:[-5.2,2,7.1],orderBoardPoint:[-2.55,2.45,6.75],troughPoint:[3.1,.8,-3.75],_roots:roots,_oldTrough:oldTrough,_oldHay:oldHay};
 }};
}

test('v0.9.2 moves complete landmark groups into the new farm zones',()=>{
 const R=renderer(),art=createFarmLayout(baseFarm()).make(R);
 assert.equal(art.layoutWorld.version,'0.9.2');
 assert.equal(art.layoutWorld.rebuild,true);
 assert.deepEqual(art._roots[0].p,[-8.15,.2,-6.15]);
 assert.deepEqual(art._roots[2].p,[-9.35,.2,.35]);
 assert.deepEqual(art._roots[3].p,[-8.05,.2,5.95]);
 assert.deepEqual(art._roots[6].p,[8.15,.2,4.65]);
 assert.equal(art.layoutWorld.moved.farmhouse,true);
 assert.equal(art.layoutWorld.moved.market,true);
 assert.equal(art.layoutWorld.moved.coop,true);
});

test('sixteen beds form two clean blocks with a wide service aisle',()=>{
 const R=renderer(),art=createFarmLayout(baseFarm()).make(R);
 assert.equal(art.cropModels.length,16);
 assert.deepEqual(art.layoutWorld.plotCenters[0],[-7.25,-3.05]);
 assert.deepEqual(art.layoutWorld.plotCenters[3],[-.05,-3.05]);
 assert.deepEqual(art.layoutWorld.plotCenters[15],[-.05,3.10]);
 assert.equal(art.cropModels[0].x,-7.25);
 assert.equal(art.cropModels[15].z,3.10);
 assert.ok(art.layoutWorld.plotCenters[2][0]-art.layoutWorld.plotCenters[1][0]>=3.1);
 const ids=art.cropModels.map(m=>m.id);
 assert.deepEqual(ids,[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
});

test('old livestock clutter is removed and interaction anchors point at rebuilt utilities',()=>{
 const R=renderer(),art=createFarmLayout(baseFarm()).make(R);
 assert.equal(art._oldTrough.visible,false);
 assert.equal(art._oldHay.visible,false);
 assert.ok(art.layoutWorld.removedLoose>=2);
 assert.deepEqual(art.troughPoint,[7.05,.8,-3.72]);
 assert.deepEqual(art.marketPoint,[-8.05,2.0,5.95]);
 assert.deepEqual(art.orderBoardPoint,[-5.45,2.45,6.15]);
});

test('villagers use the rebuilt roads rather than crossing crop or pasture interiors',()=>{
 const R=renderer(),art=createFarmLayout(baseFarm()).make(R);
 const mia=art.villagers.find(v=>v.id==='mia');
 const fedor=art.villagers.find(v=>v.id==='fedor');
 const lea=art.villagers.find(v=>v.id==='lea');
 assert.deepEqual(mia.g.p.slice(0,3),[-7.60,.2,5.55]);
 assert.deepEqual(lea.g.p.slice(0,3),[7.80,.2,4.55]);
 assert.ok(mia.route.length>=8);
 assert.ok(fedor.route.every(([x,z])=>x>=-9.0&&x<=-5.7&&z>=-4.9&&z<=.4));
 assert.ok(lea.route.every(([x,z])=>x>=.8&&x<=7.9&&z>=3.6&&z<=4.6));
 assert.deepEqual(art.livingWorld.villagerRoutes.mia,mia.route);
});

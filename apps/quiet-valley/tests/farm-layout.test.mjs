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
  for(const p of [[-6.5,.2,-6.8],[-1.15,.2,-7.85],[-10,.2,-3.65],[-5.2,.2,7.1],[-2.55,.2,6.75],[8.2,.2,4.4],[7.55,.23,-4.45],[-4.15,.23,5.55],[-.85,.23,-4.32]]){
   const g=R.group(p);R.add('box',[0,0,0],[1,1,1],'#fff',[0,0,0],g);roots.push(g);
  }
  const cropModels=[];
  for(let id=0;id<16;id++){
   const x=-7.5+(id%4)*2.04,z=-2.35+Math.floor(id/4)*2.04;
   const dirt=R.add('box',[x,.29,z],[1.73,.2,1.73],'#694b32');
   const ridges=[R.add('box',[x-.4,.42,z],[.17,.11,1.58],'#856343'),R.add('box',[x+.4,.42,z],[.17,.11,1.58],'#856343')];
   const species={carrot:{g:R.group([x,.43,z]),nodes:[]},wheat:{g:R.group([x,.43,z]),nodes:[]},pumpkin:{g:R.group([x,.43,z]),nodes:[]}};
   for(const sp of Object.values(species))R.add('sphere',[0,.2,0],[.1,.1,.1],'#fff',[0,0,0],sp.g);
   cropModels.push({id,x,z,dirt,ridges,species});
  }
  const duplicate=R.add('box',[3.1,.47,-3.75],[1,.4,.7],'#fff');
  const villagers=['elena','mia','fedor','lea'].map(id=>({id,g:R.group([0,.2,0]),route:[],target:[0,0],wait:0}));
  const livingWorld={villagerRoutes:{elena:[],mia:[],fedor:[],lea:[]}};
  return {villagers,livingWorld,cropModels,marketPoint:[-5.2,2,7.1],orderBoardPoint:[-2.55,2.45,6.75],troughPoint:[3.1,.8,-3.75],_roots:roots,_duplicate:duplicate};
 }};
}

test('layout pass separates utility, homes, market and livestock from crop footprints',()=>{
 const R=renderer(),art=createFarmLayout(baseFarm()).make(R);
 assert.equal(art.layoutWorld.moved.farmhouse,true);
 assert.equal(art.layoutWorld.moved.market,true);
 assert.equal(art.layoutWorld.moved.coop,true);
 assert.deepEqual(art._roots[0].p,[-8.65,.2,-6.10]);
 assert.deepEqual(art._roots[2].p,[-8.05,.2,.65]);
 assert.deepEqual(art._roots[3].p,[-8.45,.2,6.45]);
 assert.deepEqual(art._roots[5].p,[8.05,.2,5.05]);
 assert.equal(art._duplicate.visible,false);
 assert.ok(art.layoutWorld.removedLoose>=1);
});

test('crop beds preserve IDs and leave a wide central service aisle',()=>{
 const R=renderer(),art=createFarmLayout(baseFarm()).make(R);
 assert.equal(art.cropModels.length,16);
 assert.deepEqual(art.layoutWorld.plotCenters[0],[-6.35,-2.85]);
 assert.deepEqual(art.layoutWorld.plotCenters[3],[.80,-2.85]);
 assert.deepEqual(art.layoutWorld.plotCenters[15],[.80,3.75]);
 assert.equal(art.cropModels[0].x,-6.35);
 assert.equal(art.cropModels[15].z,3.75);
 const leftInner=art.layoutWorld.plotCenters[1][0],rightInner=art.layoutWorld.plotCenters[2][0];
 assert.ok(rightInner-leftInner>=2.9,'central crop aisle must remain clearly wider than normal bed spacing');
});

test('villager routes follow redesigned paths and remain inside runtime bounds',()=>{
 const R=renderer(),art=createFarmLayout(baseFarm()).make(R);
 const mia=art.villagers.find(v=>v.id==='mia');
 const fedor=art.villagers.find(v=>v.id==='fedor');
 const lea=art.villagers.find(v=>v.id==='lea');
 assert.deepEqual(mia.g.p.slice(0,3),[-8.10,.2,6.20]);
 assert.deepEqual(lea.g.p.slice(0,3),[7.95,.2,4.85]);
 assert.ok(mia.route.length>=6);
 assert.ok(lea.route.every(([x,z])=>x>=2&&x<=8.1&&z>=3.0&&z<=5.1));
 assert.ok(fedor.route.every(([x,z])=>x>=-8.2&&x<=8.4&&z>=-7.5&&z<=7.6));
 assert.deepEqual(art.livingWorld.villagerRoutes.mia,mia.route);
});

test('interaction anchors move with the visual market, order board and trough',()=>{
 const R=renderer(),art=createFarmLayout(baseFarm()).make(R);
 assert.deepEqual(art.marketPoint,[-8.45,2.0,6.45]);
 assert.deepEqual(art.orderBoardPoint,[-5.95,2.45,6.25]);
 assert.deepEqual(art.troughPoint,[4.25,.8,-4.15]);
 assert.deepEqual(art.layoutWorld.anchors.market,art.marketPoint);
});

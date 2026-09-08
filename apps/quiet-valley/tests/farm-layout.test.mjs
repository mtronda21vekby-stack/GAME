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

test('recovery pass keeps major authored landmarks fixed',()=>{
 const R=renderer(),art=createFarmLayout(baseFarm()).make(R);
 assert.equal(art.layoutWorld.recovery,true);
 assert.deepEqual(art.layoutWorld.landmarks.farmhouse,[-6.5,-6.8]);
 assert.deepEqual(art.layoutWorld.landmarks.windmill,[-10,-3.65]);
 assert.deepEqual(art.layoutWorld.landmarks.market,[-5.2,7.1]);
 assert.deepEqual(art.layoutWorld.landmarks.coop,[8.2,4.4]);
 assert.deepEqual(art._roots[0].p,[-6.5,.2,-6.8]);
 assert.deepEqual(art._roots[2].p,[-10,.2,-3.65]);
 assert.deepEqual(art._roots[3].p,[-5.2,.2,7.1]);
 assert.deepEqual(art._roots[5].p,[8.2,.2,4.4]);
});

test('crop beds preserve authored IDs and stable 4x4 coordinates',()=>{
 const R=renderer(),art=createFarmLayout(baseFarm()).make(R);
 assert.equal(art.cropModels.length,16);
 assert.deepEqual(art.layoutWorld.plotCenters[0],[-7.5,-2.35]);
 assert.deepEqual(art.layoutWorld.plotCenters[3],[-1.38,-2.35]);
 assert.deepEqual(art.layoutWorld.plotCenters[15],[-1.38,3.77]);
 assert.equal(art.cropModels[0].x,-7.5);
 assert.equal(art.cropModels[15].z,3.77);
 const ids=art.cropModels.map(m=>m.id);
 assert.deepEqual(ids,[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
});

test('villager recovery routes stay inside walkable authored corridors',()=>{
 const R=renderer(),art=createFarmLayout(baseFarm()).make(R);
 const mia=art.villagers.find(v=>v.id==='mia');
 const fedor=art.villagers.find(v=>v.id==='fedor');
 const lea=art.villagers.find(v=>v.id==='lea');
 assert.deepEqual(mia.g.p.slice(0,3),[-5.0,.2,6.4]);
 assert.deepEqual(lea.g.p.slice(0,3),[7.9,.2,4.0]);
 assert.ok(mia.route.length>=6);
 assert.ok(lea.route.every(([x,z])=>x>=4.5&&x<=8.0&&z>=2.8&&z<=4.1));
 assert.ok(fedor.route.every(([x,z])=>x>=-9.0&&x<=-7.4&&z>=-3.6&&z<=1.3));
 assert.deepEqual(art.livingWorld.villagerRoutes.mia,mia.route);
});

test('interaction anchors match visible authored props after recovery',()=>{
 const R=renderer(),art=createFarmLayout(baseFarm()).make(R);
 assert.deepEqual(art.marketPoint,[-5.2,2.0,7.1]);
 assert.deepEqual(art.orderBoardPoint,[-2.55,2.45,6.75]);
 assert.deepEqual(art.troughPoint,[3.1,.8,-3.75]);
 assert.deepEqual(art.layoutWorld.anchors.market,art.marketPoint);
 assert.deepEqual(art.layoutWorld.anchors.orders,art.orderBoardPoint);
 assert.deepEqual(art.layoutWorld.anchors.trough,art.troughPoint);
});

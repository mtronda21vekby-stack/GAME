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
  const duplicate=R.add('box',[3.1,.47,-3.75],[1,.4,.7],'#fff');
  const villagers=['elena','mia','fedor','lea'].map(id=>({id,g:R.group([0,.2,0]),route:[],target:[0,0],wait:0}));
  const livingWorld={villagerRoutes:{elena:[],mia:[],fedor:[],lea:[]}};
  return {villagers,livingWorld,_roots:roots,_duplicate:duplicate};
 }};
}

test('layout pass moves authored districts and removes duplicate loose stable clutter',()=>{
 const R=renderer(),art=createFarmLayout(baseFarm()).make(R);
 assert.equal(art.layoutWorld.moved.farmhouse,true);
 assert.equal(art.layoutWorld.moved.market,true);
 assert.equal(art.layoutWorld.moved.coop,true);
 assert.deepEqual(art._roots[0].p,[-8.35,.2,-6.45]);
 assert.deepEqual(art._roots[3].p,[-7.05,.2,6.55]);
 assert.deepEqual(art._roots[5].p,[8.0,.2,5.0]);
 assert.equal(art._duplicate.visible,false);
 assert.ok(art.layoutWorld.removedLoose>=1);
});

test('villager routes follow the new functional districts',()=>{
 const R=renderer(),art=createFarmLayout(baseFarm()).make(R);
 const mia=art.villagers.find(v=>v.id==='mia');
 const lea=art.villagers.find(v=>v.id==='lea');
 assert.deepEqual(mia.g.p.slice(0,3),[-7.0,.2,6.05]);
 assert.deepEqual(lea.g.p.slice(0,3),[7.95,.2,4.85]);
 assert.ok(mia.route.length>=6);
 assert.ok(lea.route.every(([x,z])=>x>=2&&x<=8.1&&z>=3.2&&z<=5.1));
 assert.deepEqual(art.livingWorld.villagerRoutes.mia,mia.route);
});

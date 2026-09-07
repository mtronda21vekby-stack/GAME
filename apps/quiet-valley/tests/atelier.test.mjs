import {test} from 'node:test';import assert from 'node:assert/strict';
import {createDomain} from '../src/domain/createDomain.js';
import {surplus,marketReserves,nextFarmGoal} from '../src/domain/journey.js';
import {geometry} from '../src/rendering/geometry.js';
const make=()=>{const now=1800000000000,d=createDomain({now:()=>now});return {now,d,state:d.commands.fresh(now)};};
test('surplus reserves all active orders plus livestock feed',()=>{
 const {d,state,now}=make();state.inventory.wheat=50;state.inventory.carrot=50;
 const reserved=marketReserves(state),plan=surplus(state,d.queries.FarmSim.PRODUCTS),coins=state.coins;
 const result=d.commands.act(state,{type:'sellSurplus'},now);assert.equal(result.ok,true);
 assert.equal(state.inventory.wheat,reserved.wheat);assert.equal(state.inventory.carrot,reserved.carrot);
 assert.equal(state.coins,coins+plan.total);
 const after=JSON.stringify(state.inventory);assert.equal(d.commands.act(state,{type:'sellSurplus'},now).ok,false);assert.equal(JSON.stringify(state.inventory),after);
});
test('market query never mutates inventories or orders',()=>{
 const {d,state}=make(),before=JSON.stringify(state);surplus(state,d.queries.FarmSim.PRODUCTS);assert.equal(JSON.stringify(state),before);
});
test('first morning guidance changes after real harvest, care and delivery',()=>{
 const {d,state,now}=make(),q=d.queries.FarmProduction;
 assert.equal(q.nextGoal(state).view,'garden');d.commands.act(state,{type:'harvest',id:0},now);
 assert.equal(q.nextGoal(state).view,'water');d.commands.act(state,{type:'water',id:2},now);
 assert.equal(q.nextGoal(state).view,'animals');d.commands.act(state,{type:'feed',id:1},now);
 assert.equal(q.nextGoal(state).view,'orders');
});
test('rain does not strand guidance on a watering step with no dry crop',()=>{
 const {state}=make();state.stats.harvests=1;for(const p of state.plots)if(p.crop)p.waterAt=1;
 assert.equal(nextFarmGoal(state,{}).view,'animals');
});
test('chamfered boxes retain footprint, finite normals and bounded triangle cost',()=>{
 const g=geometry('bevelBox');assert.equal(g.length/18,44);
 for(let i=0;i<g.length;i+=6){for(let j=0;j<3;j++)assert.ok(Math.abs(g[i+j])<=.50001);assert.ok(Math.abs(Math.hypot(g[i+3],g[i+4],g[i+5])-1)<.0001);}
});

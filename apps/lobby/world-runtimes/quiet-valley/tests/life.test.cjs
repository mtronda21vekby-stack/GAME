const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../src/gameplay.js');
const Sim=require('../src/expansion.js').sim;
const NOW=1900000000000;
test('new farm starts on free lease week with four characters',()=>{const s=Sim.fresh(NOW);assert.equal(s.version,4);assert.equal(G.leaseStatus(s).week,1);assert.equal(G.leaseStatus(s).debt,0);assert.deepEqual(Object.keys(G.CHARACTERS),['elena','mia','fedor','lea']);});
test('rent appears once after first active week and never stacks',()=>{const s=Sim.fresh(NOW);s.game.playedMs=G.DAY_MS*7;s.game.lastActiveAt=NOW;Sim.tick(s,NOW+1000);assert.equal(s.game.rentDebt,55);s.game.playedMs=G.DAY_MS*30;Sim.tick(s,NOW+2000);assert.equal(s.game.rentDebt,55);});
test('paying rent builds trust and three hearts reduce future rent',()=>{const s=Sim.fresh(NOW);s.game.playedMs=G.DAY_MS*7;s.game.lastActiveAt=NOW;Sim.tick(s,NOW+1000);s.coins=500;let r=Sim.act(s,{type:'payRent'},NOW+1100);assert.equal(r.ok,true);assert.equal(s.game.relationships.elena,1);s.game.relationships.elena=3;assert.equal(G.rentPrice(s),45);});
test('character orders build friendship and friendship raises payout',()=>{const s=Sim.fresh(NOW);const o=s.game.orders.find(o=>o.charId==='mia');for(const [k,n] of Object.entries(o.items))s.inventory[k]=n;const before=G.orderPreview(s,o,NOW).reward;Sim.act(s,{type:'deliverOrder',id:o.id},NOW);assert.equal(s.game.relationships.mia,1);const next=s.game.orders.find(o=>o.charId==='mia');if(next)assert.ok(G.orderPreview(s,next,NOW).reward>=next.reward);assert.ok(before>=o.reward);});

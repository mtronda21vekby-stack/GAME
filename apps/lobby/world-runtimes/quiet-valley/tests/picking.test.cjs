const assert=require('node:assert/strict');const {test}=require('node:test');const P=require('../src/picking.js');
const polygon=[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}];
test('polygon interior / exterior',()=>{assert.equal(P.inside({x:5,y:5},polygon),true);assert.equal(P.inside({x:15,y:5},polygon),false);});
test('edge distance is stable for zero-length edges',()=>assert.equal(P.edgeDistance({x:3,y:4},{x:0,y:0},{x:0,y:0}),5));
const R={cameraVP(){},project(p){return {x:200+p[0]*40-p[2]*20,y:200+p[0]*15+p[2]*30-p[1]*14,z:0};}};
const plots=Array.from({length:16},(_,id)=>({id,x:id%4*2.04,z:Math.floor(id/4)*2.04}));
test('all 16 visible raised plot centers map to the correct plot',()=>{for(const m of plots){const q=R.project([m.x,.475,m.z]);assert.equal(P.plotAt(R,plots,q.x,q.y),m.id);}});
test('touches on outer raised-soil corners do not hit a neighbor',()=>{for(const m of plots)for(const dx of [-.8,.8])for(const dz of [-.8,.8]){const q=R.project([m.x+dx,.475,m.z+dz]);assert.equal(P.plotAt(R,plots,q.x,q.y,8),m.id);}});
test('distant taps never silently select a plot',()=>assert.equal(P.plotAt(R,plots,-500,-500,8),null));

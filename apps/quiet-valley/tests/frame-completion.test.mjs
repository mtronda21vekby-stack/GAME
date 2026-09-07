import {test} from 'node:test';
import assert from 'node:assert/strict';
import {waitForGPUFrame} from '../src/rendering/frameCompletion.js';
function driver(statuses) {
 let waits = 0, deletes = 0, flushed = false;
 const gl = {SYNC_GPU_COMMANDS_COMPLETE:1, ALREADY_SIGNALED:2, CONDITION_SATISFIED:3, TIMEOUT_EXPIRED:4, WAIT_FAILED:5,
  fenceSync:()=>({}), flush:()=>{flushed=true;}, isContextLost:()=>false,
  clientWaitSync:(sync,flags,timeout)=>{assert.equal(flags,0);assert.equal(timeout,0);waits++;return statuses.shift()??4;},
  deleteSync:()=>{deletes++;}
 };
 return {gl,inspect:()=>({waits,deletes,flushed})};
}
test('GPU fence polls with zero blocking timeout and disposes after completion',async()=>{
 const d=driver([4,4,3]);const confirmed=await waitForGPUFrame(d.gl,{pollMs:0});assert.equal(confirmed,true);assert.deepEqual(d.inspect(),{waits:3,deletes:1,flushed:true});
});
test('GPU fence stops polling and releases resources on lifetime cancellation',async()=>{
 const d=driver([4]),controller=new AbortController();const task=waitForGPUFrame(d.gl,{signal:controller.signal,pollMs:50});controller.abort();
 await assert.rejects(task,/cancelled/);assert.equal(d.inspect().deletes,1);assert.equal(d.inspect().waits,1);
});
test('GPU wait failure and timeout use a nonfatal browser-frame fallback',async()=>{
 for(const status of [5,4]){const d=driver([status]);const confirmed=await waitForGPUFrame(d.gl,{timeoutMs:0});assert.equal(confirmed,false);assert.equal(d.inspect().deletes,1);}
});
test('missing fence support falls back immediately',async()=>{
 const d=driver([]);d.gl.fenceSync=()=>null;const confirmed=await waitForGPUFrame(d.gl);assert.equal(confirmed,false);assert.equal(d.inspect().deletes,0);
});
test('Lost graphics context rejects completion and releases its fence',async()=>{
 const d=driver([]);d.gl.isContextLost=()=>true;await assert.rejects(waitForGPUFrame(d.gl),/context lost/);assert.equal(d.inspect().deletes,1);
});

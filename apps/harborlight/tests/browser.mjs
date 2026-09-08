import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createGame} from '../dist/src/domain/simulation.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'evidence/browser');fs.mkdirSync(out,{recursive:true});
const server=spawn(process.execPath,[path.join(root,'scripts/serve.mjs')],{stdio:'pipe'});
const summary=[],wait=ms=>new Promise(r=>setTimeout(r,ms)),url='http://127.0.0.1:4173/';
for(let i=0;i<30;i++){try{await fetch(url);break;}catch{await wait(250);}}
const record=state=>JSON.stringify({version:1,profile:{unlocked:2,best:[0,0,0],played:0,audio:false,quality:'balanced'},run:state});
function fixture(map,phase='playing',stage=0){const state=createGame(map,95);state.phase=phase;state.stage=stage;return state;}
try{
 for(const [name,engine,mobile]of [['chromium-desktop',chromium,false],['webkit-mobile',webkit,true]]){
  const browser=await engine.launch({headless:true});let ctx,p,scenario='boot';const errors=[];
  const ready=()=>p.waitForFunction(()=>window.Harborlight?.inspect().ready,{},{timeout:20000});
  const inspect=()=>p.evaluate(()=>window.Harborlight.inspect());
  const shot=async n=>p.screenshot({path:path.join(out,name+'-'+n+'.png')});
  const check=text=>{summary.push(name+': '+text);console.log('PASS',summary.at(-1));};
  // Each persisted fixture has its own origin storage. Setting storage in a live game and
  // reloading is wrong: the pagehide autosave rightly overwrites that injected record.
  async function boot(saved,location=url){
   if(ctx)await ctx.close();
   ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
   if(saved!==undefined)await ctx.addInitScript(raw=>localStorage.setItem('harborlight.v1',raw),saved);
   p=await ctx.newPage();p.setDefaultTimeout(12000);
   p.on('pageerror',e=>errors.push({scenario,message:e.message}));
   p.on('console',e=>{if(e.type()==='error'&&!e.text().includes('favicon.ico'))errors.push({scenario,message:e.text()});});
   await p.goto(location,{waitUntil:'networkidle'});await ready();
  }
  const tap=async selector=>{const loc=p.locator(selector);if(mobile)await loc.tap();else await loc.click();};
  try{
   await boot();await shot('menu');
   assert.ok((await inspect()).render.webgl.includes('WebGL 2'));assert.ok((await inspect()).render.triangles>20000);check('real first WebGL frame');
   scenario='routing';await tap('#start');await p.waitForFunction(()=>window.Harborlight.inspect().mode==='play');await shot('first-watch');
   const first=(await inspect()).state.ships[0];await tap(`[data-ship="${first.id}"]`);await tap('[data-port="fishing"]');
   assert.match(await p.locator('#toast').innerText(),/причал/);check('wrong destination rejected');
   if(!mobile){
    const shipLabel=p.locator(`[data-ship="${first.id}"]`);const box=await shipLabel.boundingBox();
    const points=await p.evaluate(()=>[{x:-15,z:2},{x:-13,z:2}].map(point=>window.Harborlight.project(point)));
    await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();
    for(const point of points)await p.mouse.move(point.x,point.y,{steps:5});await p.mouse.up();
    assert.ok((await inspect()).state.ships.find(b=>b.id===first.id).path.length>0);check('manual mouse-drawn course');
   }
   await tap('[data-port="cargo"]');assert.ok((await inspect()).state.ships.find(b=>b.id===first.id).path.length>0);
   await tap('#hold');const held=(await inspect()).state.ships.find(b=>b.id===first.id);await wait(400);const after=(await inspect()).state.ships.find(b=>b.id===first.id);assert.ok(Math.abs(after.x-held.x)<.02);await tap('#hold');check('routing and stop/resume');
   await p.waitForFunction(()=>window.Harborlight.inspect().state.delivered>=1,{},{timeout:24000});await shot('delivery');check('timed delivery rewarded');
   scenario='pause-save';await tap('#pause');const time=(await inspect()).state.time;await wait(400);assert.equal((await inspect()).state.time,time);await tap('#resume');
   await tap('#focus');assert.ok((await inspect()).state.focusLeft>5);check('pause and tactical focus');
   await tap('#pause');const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('harborlight.v1')));assert.ok(saved.run.score>0);
   await p.reload({waitUntil:'networkidle'});await ready();await tap('#continue');assert.equal((await inspect()).state.score,saved.run.score);check('native browser-storage reload');
   scenario='upgrade';await boot(record(fixture(0,'upgrade',0)));await tap('#continue');
   await p.locator('#upgrade-modal').waitFor({state:'visible'});await shot('upgrade');await tap('[data-upgrade="speed"]');
   assert.equal((await inspect()).state.upgrades.speed,1);assert.equal((await inspect()).state.stage,1);await wait(900);await shot('sunset');check('upgrade and next watch');
   scenario='storm';await boot(record(fixture(1,'playing',2)));await tap('#continue');await wait(900);await shot('storm-strait');check('storm map using same renderer');
   scenario='archipelago';await boot(record(fixture(2)));await tap('#continue');await shot('archipelago');check('third navigable map');
   scenario='loss-replay';const lost=fixture(2);lost.strikes=2;lost.ships[0].age=99;await boot(record(lost));await tap('#continue');
   await p.locator('#result-modal').waitFor({state:'visible'});assert.equal((await inspect()).state.phase,'lost');await shot('result');check('loss and result screen');
   await tap('#play-again');assert.equal((await inspect()).state.strikes,0);check('replay starts clean');
   scenario='corrupt-save';await boot('{broken');await tap('#start');await wait(2200);assert.equal(await p.evaluate(()=>localStorage.getItem('harborlight.v1')),'{broken');check('corrupt save preserved');
   scenario='standalone-file';await boot(undefined,pathToFileURL(path.join(root,'Harborlight.html')).href);await tap('#start');
   assert.ok((await inspect()).state.ships.length>0);check('standalone HTML real file launch');
   assert.deepEqual(errors,[],'Browser/GL console errors');check('no JS or GL errors');
   fs.writeFileSync(path.join(out,name+'-diagnostics.json'),JSON.stringify(await inspect(),null,2));
  }catch(error){
   try{await shot('FAILED-'+scenario);fs.writeFileSync(path.join(out,name+'-failure.json'),JSON.stringify({scenario,error:String(error),errors,state:await inspect()},null,2));}catch{}
   throw error;
  }finally{await browser.close();}
 }
 fs.writeFileSync(path.join(root,'evidence/browser-tests.json'),JSON.stringify({passed:summary.length,checks:summary},null,2));
 console.log('PASS',summary.length,'browser checks');
}finally{server.kill();fs.writeFileSync(path.join(root,'evidence/browser-progress.json'),JSON.stringify(summary,null,2));}

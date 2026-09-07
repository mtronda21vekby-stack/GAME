import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const out=path.join(root,'evidence/browser');fs.mkdirSync(out,{recursive:true});
const server=spawn(process.execPath,[path.join(root,'scripts/serve.mjs')],{stdio:'pipe'});let summary=[];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<30;i++){try{await fetch('http://127.0.0.1:4173');break;}catch{await wait(250);}}
try{
 for(const [name,engine,mobile]of [['chromium-desktop',chromium,false],['webkit-mobile',webkit,true]]){
  const browser=await engine.launch({headless:true});const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',e=>{if(e.type()==='error'&&!e.text().includes('favicon.ico'))errors.push(e.text());});
  p.setDefaultTimeout(12000);
  const ready=()=>p.waitForFunction(()=>window.Harborlight?.inspect().ready,{},{timeout:20000});
  const inspect=()=>p.evaluate(()=>window.Harborlight.inspect());
  const shot=async n=>{await p.screenshot({path:path.join(out,name+'-'+n+'.png')});};
  await p.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await ready();await shot('menu');
  assert.equal((await inspect()).render.webgl.includes('WebGL 2'),true);assert.ok((await inspect()).render.triangles>20000);summary.push(name+': real first WebGL frame');
  await p.click('#start');await p.waitForFunction(()=>window.Harborlight.inspect().mode==='play');await shot('first-watch');
  const first=(await inspect()).state.ships[0];await p.locator(`[data-ship="${first.id}"]`).click();await p.locator('[data-port="fishing"]').click();
  assert.match(await p.locator('#toast').innerText(),/причал/);summary.push(name+': wrong destination rejected');
  await p.locator('[data-port="cargo"]').click();assert.ok((await inspect()).state.ships.find(b=>b.id===first.id).path.length>0);
  await p.click('#hold');const held=(await inspect()).state.ships.find(b=>b.id===first.id);await wait(400);const after=(await inspect()).state.ships.find(b=>b.id===first.id);assert.ok(Math.abs(after.x-held.x)<.02);await p.click('#hold');summary.push(name+': routing and stop/resume');
  await p.waitForFunction(()=>window.Harborlight.inspect().state.delivered>=1,{},{timeout:24000});await shot('delivery');summary.push(name+': timed delivery rewarded');
  await p.click('#pause');const time=(await inspect()).state.time;await wait(400);assert.equal((await inspect()).state.time,time);await p.click('#resume');
  await p.click('#focus');assert.ok((await inspect()).state.focusLeft>5);summary.push(name+': pause and focus');
  await p.click('#pause');const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('harborlight.v1')));assert.ok(saved.run.score>0);await p.reload({waitUntil:'networkidle'});await ready();await p.click('#continue');assert.equal((await inspect()).state.score,saved.run.score);summary.push(name+': native browser-storage reload');
  // Controlled persisted fixtures isolate phase-specific UI; the complete game loop is also tested in the pure domain suite.
  async function fixture(map,phase,stage){await p.evaluate(async({map,phase,stage})=>{const {createGame}=await import('/src/domain/simulation.js');const s=createGame(map,95);s.phase=phase;s.stage=stage;localStorage.setItem('harborlight.v1',JSON.stringify({version:1,profile:{unlocked:2,best:[0,0,0],played:0,audio:false,quality:'balanced'},run:s}));},{map,phase,stage});await p.reload({waitUntil:'networkidle'});await ready();await p.click('#continue');}
  await fixture(0,'upgrade',0);await p.locator('[data-upgrade="speed"]').click();assert.equal((await inspect()).state.upgrades.speed,1);assert.equal((await inspect()).state.stage,1);await shot('sunset');summary.push(name+': real upgrade and next watch');
  await fixture(1,'playing',2);await wait(900);await shot('storm-strait');summary.push(name+': storm map, same renderer');
  await fixture(2,'playing',0);await shot('archipelago');summary.push(name+': third map');
  await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('harborlight.v1'));o.run.strikes=2;o.run.ships[0].age=99;localStorage.setItem('harborlight.v1',JSON.stringify(o));});await p.reload({waitUntil:'networkidle'});await ready();await p.click('#continue');await p.locator('#result-modal').waitFor({state:'visible'});assert.equal((await inspect()).state.phase,'lost');await shot('result');summary.push(name+': loss and result screen');
  await p.click('#play-again');assert.equal((await inspect()).state.strikes,0);summary.push(name+': replay starts clean');
  await p.evaluate(()=>localStorage.setItem('harborlight.v1','{broken'));await p.reload({waitUntil:'networkidle'});await ready();await p.click('#start');await wait(2200);assert.equal(await p.evaluate(()=>localStorage.getItem('harborlight.v1')),'{broken');summary.push(name+': corrupt save preserved');
  assert.deepEqual(errors,[],'Browser/GL console errors');summary.push(name+': no JS or GL errors');
  fs.writeFileSync(path.join(out,name+'-diagnostics.json'),JSON.stringify(await inspect(),null,2));await browser.close();
 }
 fs.writeFileSync(path.join(root,'evidence/browser-tests.json'),JSON.stringify({passed:summary.length,checks:summary},null,2));console.log('PASS',summary.length,summary.join('\n'));
}finally{server.kill();}

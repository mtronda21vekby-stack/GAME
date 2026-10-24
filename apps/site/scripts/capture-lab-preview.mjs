import {chromium,webkit} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const base=process.argv[2],out=path.resolve(process.argv[3]||'lab-browser-evidence');
if(!/^https:\/\/[a-z0-9-]+\.game-6wa\.pages\.dev$/.test(base||''))throw new Error('Requires a returned isolated preview URL');
fs.mkdirSync(out,{recursive:true});
const results=[];
for(const [name,engine,width,height] of [['chromium-393',chromium,393,852],['chromium-430',chromium,430,932],['chromium-1440',chromium,1440,900],['webkit-393',webkit,393,852]]){
  const browser=await engine.launch({headless:true,args:engine===chromium?['--enable-unsafe-swiftshader']:[]});
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width<500,hasTouch:width<500,recordVideo:{dir:path.join(out,name),size:{width,height}}});
  const page=await context.newPage(),errors=[],failed=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
  const started=Date.now();
  try{
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.locator('.spatialPage').waitFor();
    await page.waitForFunction(()=>document.querySelector('.spatialJourney')?.dataset.brandReady==='1',{},{timeout:60000});
    const readyMs=Date.now()-started;
    await page.screenshot({path:path.join(out,`${name}-01-hero.png`)});
    const labTop=await page.locator('#spatial-lab').evaluate(el=>el.getBoundingClientRect().top+scrollY);
    const labHeight=await page.locator('#spatial-lab').evaluate(el=>el.getBoundingClientRect().height);
    for(const [label,top] of [['02-arrival',labTop-height*.42],['03-lab',labTop],['04-pass',labTop+height*.42],['05-outro',labTop+labHeight-height*.45]]){
      await page.evaluate(top=>scrollTo({top,behavior:'instant'}),top);await page.waitForTimeout(2200);
      await page.screenshot({path:path.join(out,`${name}-${label}.png`)});
    }
    // A continuous gesture-length journey is retained in the context video.
    await page.evaluate(top=>scrollTo({top,behavior:'instant'}),labTop-height*.55);
    await page.waitForTimeout(1200);
    await page.evaluate(async({start,end})=>{const since=performance.now();await new Promise(resolve=>{function step(now){const p=Math.min(1,(now-since)/6500);scrollTo({top:start+(end-start)*p,behavior:'instant'});p<1?requestAnimationFrame(step):resolve();}requestAnimationFrame(step);});},{start:labTop-height*.55,end:labTop+labHeight-height*.15});
    await page.waitForTimeout(700);
    await page.evaluate(top=>scrollTo({top,behavior:'instant'}),labTop);await page.waitForTimeout(2200);
    const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,scene:document.querySelector('.spatialPage').dataset.sceneState,journey:{...document.querySelector('.spatialJourney').dataset}}));
    checks.push({name:'no-horizontal-overflow',passed:layout.scrollWidth<=width+1});
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(800);await page.screenshot({path:path.join(out,`${name}-06-reduced.png`)});await page.emulateMedia({reducedMotion:'no-preference'});
    const opener=page.getByRole('button',{name:'Об игре Quiet Valley',exact:true});await opener.click();
    const detail=page.locator('#spatial-game-detail');await detail.waitFor({state:'visible'});await page.waitForTimeout(1700);await page.screenshot({path:path.join(out,`${name}-07-case.png`)});
    await page.goBack();await page.waitForTimeout(1100);await page.goForward();await page.waitForTimeout(1700);
    checks.push({name:'back-forward-case',passed:await detail.isVisible()});
    await page.setViewportSize({width:width===1440?1300:430,height:height===900?820:932});
    await detail.getByRole('button',{name:'Закрыть панель и вернуться к выбранной игре',exact:true}).click();await page.waitForTimeout(1500);
    checks.push({name:'resize-close',passed:!(await detail.isVisible())&&await page.evaluate(()=>document.body.style.overflow!=='hidden')});
    await opener.click();await page.waitForTimeout(1500);checks.push({name:'reopen',passed:await detail.isVisible()});
    await detail.getByRole('button',{name:'Закрыть панель и вернуться к выбранной игре',exact:true}).click();await page.waitForTimeout(1400);
    await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(1200);
    await page.getByRole('link',{name:/Профиль/}).first().click();checks.push({name:'profile-disabled',passed:new URL(page.url()).pathname==='/'});
    results.push({name,readyMs,layout,checks,errors,failed});
  }catch(error){results.push({name,failure:String(error),checks,errors,failed});}
  await context.close();await browser.close();
}
// A separate context actually denies WebGL rather than relabelling a screenshot.
{
 const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:393,height:852}});
 await context.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /^webgl|experimental-webgl/.test(kind)?null:original.call(this,kind,...args);};});
 const page=await context.newPage();await page.goto(base);await page.locator('.spatialPage[data-scene-state="fallback"]').waitFor({timeout:20000});
 await page.locator('#spatial-lab').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'chromium-393-08-no-webgl.png')});
 results.push({name:'no-webgl-fallback',passed:true});await context.close();await browser.close();
}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(({name,readyMs,failure,checks,errors})=>({name,readyMs,failure,checks,errors})),null,2));
if(results.some(r=>r.failure||r.checks?.some(c=>!c.passed)))process.exitCode=1;

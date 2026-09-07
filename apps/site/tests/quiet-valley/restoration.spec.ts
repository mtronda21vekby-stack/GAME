import {test,expect,type Page} from '@playwright/test';
import {VERSION} from '../../../quiet-valley/src/app/version.js';
const PATH='/games/quiet-valley/';
const info=(page:Page)=>page.evaluate(()=> (window as any).FarmApp.inspect());
async function ready(page:Page){
 await expect(page.locator('body')).toHaveAttribute('data-runtime-ready','true');
 await expect(page.locator('#error')).toBeHidden();
 if(await page.locator('.intro-start').isVisible())await page.locator('.intro-start').click();
 const i=await info(page);expect(i.frames).toBeGreaterThan(0);expect(i.version).toBe(VERSION);
 expect(i.meshes).toBeGreaterThan(8500);expect(i.shadow).toBe(true);
 expect(i.presentedRegion).toBe(i.state.world.region);expect(i.presentationPending).toBe(false);
}
async function open(page:Page){await page.goto(PATH);await ready(page);}
async function tap(page:Page,x:number,y:number){
 if(test.info().project.name.includes('mobile'))await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
}
function watch(page:Page){
 const errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('requestfailed',request=>errors.push(`${request.failure()?.errorText}: ${request.url()}`));
 return errors;
}
// Separate scenarios have independent save stores and time budgets. In particular,
// ready() never navigates; the old reload()->boot()->goto() canceled WebKit modules.
test('real first frame, protected playfield and smart crop interactions',async({page},testInfo)=>{
 const errors=watch(page);await open(page);const isMobile=testInfo.project.name.includes('mobile');
 expect((await info(page)).graphics.quality).toBe('balanced');
 await page.screenshot({path:testInfo.outputPath('farm-day.png')});
 if(!isMobile)await page.locator('#focus-garden').click();
 let p=await page.evaluate(()=> (window as any).FarmApp.projectPlot(0));await tap(page,p.x,p.y);
 await expect.poll(async()=> (await info(page)).state.plots[0].crop).toBe(null);
 await page.locator('[data-tool="plant"]').click();await page.locator('[data-seed="wheat"]').click();
 p=await page.evaluate(()=> (window as any).FarmApp.projectPlot(0));await tap(page,p.x,p.y);
 await expect.poll(async()=> (await info(page)).state.plots[0].crop).toBe('wheat');
 await page.locator('[data-tool="water"]').click();
 p=await page.evaluate(()=> (window as any).FarmApp.projectPlot(0));await tap(page,p.x,p.y);
 await expect.poll(async()=> (await info(page)).state.plots[0].waterAt).toBeGreaterThan(0);
 await page.screenshot({path:testInfo.outputPath('garden-water.png')});
 const ui=await page.locator('#objective-chip').boundingBox();expect(ui?.height).toBeLessThan(95);
 expect(await page.locator('.platform-back').getAttribute('href')).toBe('/games/');
 expect(errors).toEqual([]);
});
test('mill reserves ingredients, completes once, and persists across one real reload',async({page},testInfo)=>{
 const errors=watch(page);await open(page);await page.locator('#open-production').click();
 await page.locator('[data-action="buildWorkshop"][data-key="mill"]').click();
 await page.locator('[data-action="craft"][data-key="flour"]').click();
 await expect.poll(async()=> (await info(page)).state.production.jobs.length).toBe(1);
 await page.screenshot({path:testInfo.outputPath('production.png')});
 await expect(page.locator('[data-action="collectCraft"]')).toBeEnabled({timeout:40000});
 await page.locator('[data-action="collectCraft"]').click();
 await expect.poll(async()=> (await info(page)).state.inventory.flour).toBe(2);
 await expect(page.locator('[data-action="collectCraft"]')).toHaveCount(0);
 await page.locator('[data-close-modal]').click();
 await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('bc.world.quiet-valley.v1')||'{}').inventory?.flour)).toBe(2);
 const coins=(await info(page)).state.coins;
 await page.reload();await ready(page); // Exactly one navigation, not a second goto.
 expect((await info(page)).state.coins).toBe(coins);expect((await info(page)).state.inventory.flour).toBe(2);
 expect(errors).toEqual([]);
});
test('all four detailed locations survive travel without accumulating scene objects',async({page},testInfo)=>{
 const errors=watch(page);await open(page);const meshes=(await info(page)).meshes;
 for(const region of ['orchard','river','forest','farm']){
  await page.locator('#quick-map').click();await page.locator(`[data-travel="${region}"]`).click();
  await expect.poll(async()=> (await info(page)).state.world.region).toBe(region);
  await expect(page.locator('#location-shade')).not.toHaveClass(/active/);
  // State/labels alone can change before the GPU presents the destination.
  await expect.poll(async()=>{const i=await info(page);return {region:i.presentedRegion,pending:i.presentationPending};})
   .toEqual({region,pending:false});
  await expect(page.locator('#error')).toBeHidden();
  await page.screenshot({path:testInfo.outputPath(region+'.png')});
 }
 expect((await info(page)).meshes).toBe(meshes);
 await expect(page.locator('#error')).toBeHidden();expect(errors).toEqual([]);
});
test('animal care spends actual feed and lighting presets preserve the same farm',async({page},testInfo)=>{
 // Chromium CI uses software rendering. This scenario also rebuilds both high
 // and low quality framebuffers; retain every assertion with a separate budget.
 test.setTimeout(180000);
 const errors=watch(page);await open(page);const isMobile=testInfo.project.name.includes('mobile');
 if(!isMobile)await page.locator('#focus-animals').click();
 const before=(await info(page)).state;
 const p=await page.evaluate(()=> (window as any).FarmApp.projectAnimal(1));await tap(page,p.x,p.y);
 await page.locator('[data-action="feed"][data-id="1"]').click();
 await expect.poll(async()=> (await info(page)).state.inventory.wheat).toBe(before.inventory.wheat-1);
 expect((await info(page)).state.animals.find((a:any)=>a.id===1).hunger).toBeGreaterThan(90);
 await page.screenshot({path:testInfo.outputPath('animal-care.png')});
 await page.locator('[data-close-details]').click();if(!isMobile)await page.locator('#home-camera').click();
 await page.locator('#menu-toggle').click();await page.locator('#quick-graphics').click();
 await page.locator('[data-lighting="evening"]').click();
 await page.waitForTimeout(1200);await page.screenshot({path:testInfo.outputPath('farm-evening.png')});
 await page.locator('#menu-toggle').click();await page.locator('#quick-graphics').click();
 await page.locator('[data-quality="high"]').click();
 expect((await info(page)).graphics.quality).toBe('high');expect((await info(page)).graphics.post).toBe(true);
 await page.locator('[data-quality="low"]').click();expect((await info(page)).graphics.quality).toBe('low');
 expect((await info(page)).shadow).toBe(true);await expect(page.locator('#error')).toBeHidden();expect(errors).toEqual([]);
});
test('corrupt save stays intact and the recovery screen never erases it',async({page})=>{
 await open(page);await page.evaluate(()=>localStorage.setItem('bc.world.quiet-valley.v1','{broken-save'));
 await page.reload();await ready(page);
 expect(await page.evaluate(()=>localStorage.getItem('bc.world.quiet-valley.v1'))).toBe('{broken-save');
 expect((await info(page)).persistence.blocked).toBe(true);
});

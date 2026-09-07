import {test,expect,type Page} from '@playwright/test';
const PATH='/games/quiet-valley/';
const info=(p:Page)=>p.evaluate(()=> (window as any).FarmApp.inspect());
async function boot(p:Page){
 await p.goto(PATH);await expect(p.locator('body')).toHaveAttribute('data-runtime-ready','true');
 await expect(p.locator('#error')).toBeHidden();
 if(await p.locator('.intro-start').isVisible())await p.locator('.intro-start').click();
 const i=await info(p);expect(i.frames).toBeGreaterThan(0);expect(i.version).toBe('0.6.2-restored.1');
 expect(i.meshes).toBeGreaterThan(8500);expect(i.shadow).toBe(true);expect(i.graphics.quality).toBe('balanced');
}
async function tap(p:Page,x:number,y:number){if(test.info().project.name.includes('mobile'))await p.touchscreen.tap(x,y);else await p.mouse.click(x,y);}
test('restored scene, crop loop, production, save reload and four locations',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push('request:'+r.url()));
 await boot(page);
 await page.screenshot({path:testInfo.outputPath('farm-first-frame.png')});
 // Use the visible canvas/input, not a mutation-only test hook.
 await page.locator('#focus-garden').click();
 await page.locator('[data-tool="harvest"]').click();
 let point=await page.evaluate(()=> (window as any).FarmApp.projectPlot(0));await tap(page,point.x,point.y);
 await expect.poll(async()=> (await info(page)).state.plots[0].crop).toBe(null);
 await page.locator('[data-tool="plant"]').click();await page.locator('[data-seed="wheat"]').click();
 point=await page.evaluate(()=> (window as any).FarmApp.projectPlot(0));await tap(page,point.x,point.y);
 await expect.poll(async()=> (await info(page)).state.plots[0].crop).toBe('wheat');
 await page.locator('[data-tool="water"]').click();
 point=await page.evaluate(()=> (window as any).FarmApp.projectPlot(0));await tap(page,point.x,point.y);
 await expect.poll(async()=> (await info(page)).state.plots[0].waterAt).toBeGreaterThan(0);
 await page.locator('#home-camera').click();await page.locator('#open-production').click();
 await page.locator('[data-action="buildWorkshop"][data-key="mill"]').click();
 await page.locator('[data-action="craft"][data-key="flour"]').click();
 await expect.poll(async()=> (await info(page)).state.production.jobs.length).toBe(1);
 await page.screenshot({path:testInfo.outputPath('production-running.png')});
 await expect(page.locator('#error')).toBeHidden();
 await expect(page.locator('[data-action="collectCraft"]')).toBeEnabled({timeout:40000});
 await page.locator('[data-action="collectCraft"]').click();
 await expect.poll(async()=> (await info(page)).state.inventory.flour).toBe(2);
 await page.locator('[data-close-modal]').click();
 // autosave is the actual browser storage implementation, not an injected fake.
 await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('bc.world.quiet-valley.v1')||'{}').inventory?.flour)).toBe(2);
 const coins=(await info(page)).state.coins;await page.reload();await boot(page);
 expect((await info(page)).state.coins).toBe(coins);expect((await info(page)).state.inventory.flour).toBe(2);
 for(const region of ['orchard','river','forest','farm']){
  await page.locator('#quick-map').click();await page.locator(`[data-travel="${region}"]`).click();
  await expect.poll(async()=> (await info(page)).state.world.region).toBe(region);
  await page.waitForTimeout(250);await page.screenshot({path:testInfo.outputPath(region+'.png')});
 }
 await expect(page.locator('#error')).toBeHidden();expect(errors).toEqual([]);
 expect(await page.locator('.platform-back').getAttribute('href')).toBe('/games/');
});
test('corrupt save stays intact and diagnosis does not erase user data',async({page})=>{
 await page.goto(PATH);await page.evaluate(()=>localStorage.setItem('bc.world.quiet-valley.v1','{broken-save'));
 await page.reload();await boot(page);
 expect(await page.evaluate(()=>localStorage.getItem('bc.world.quiet-valley.v1'))).toBe('{broken-save');
 expect((await info(page)).persistence.blocked).toBe(true);
});

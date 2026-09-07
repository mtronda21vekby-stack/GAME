import {test,expect,type Page} from '@playwright/test';
const PATH='/games/quiet-valley/';
const info=(page:Page)=>page.evaluate(()=> (window as any).FarmApp.inspect());
async function ready(page:Page){
 await expect(page.locator('body')).toHaveAttribute('data-runtime-ready','true');
 await expect(page.locator('#error')).toBeHidden();
 if(await page.locator('.intro-start').isVisible())await page.locator('.intro-start').click();
 await expect.poll(async()=> (await info(page)).presentationPending).toBe(false);
 await expect(page.locator('#open-estate')).toBeVisible();
}
async function fundedFarm(page:Page){
 await page.goto(PATH);await ready(page);
 // Test fixture only. Every expansion, placement and relocation below uses visible UI.
 await page.evaluate(()=>{
  const key='bc.world.quiet-valley.v1',raw=localStorage.getItem(key);if(!raw)throw Error('Missing fixture save');
  const s=JSON.parse(raw);s.coins=10000;s.world.materials={wood:1000,stone:1000};localStorage.setItem(key,JSON.stringify(s));
 });
 await page.reload();await ready(page);
}
async function cell(page:Page,x:number,z:number,mobile:boolean){
 const q=await page.evaluate(({x,z})=>(window as any).FarmApp.projectWorld(x,z),{x,z});
 const hit=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,{x:q.x,y:q.y});
 expect(hit,'New land must be visible and tappable, not hidden beneath UI').toBe('world');
 if(mobile)await page.touchscreen.tap(q.x,q.y);else await page.mouse.click(q.x,q.y);
}
async function openLand(page:Page){await page.locator('#open-estate').click();await expect(page.locator('.estate-panel')).toBeVisible();}
async function decorTool(page:Page,key:string){
 await openLand(page);await page.locator('#modal [data-valley-tab="decor"]').click();await page.locator(`[data-place="${key}"]`).click();
 await expect(page.locator('#build-controls')).toBeVisible();
}
function grows(before:any,after:any){
 expect(after.maxX).toBeGreaterThan(before.maxX);expect(after.minX).toBeLessThan(before.minX);
 expect(after.maxZ).toBeGreaterThan(before.maxZ);expect(after.minZ).toBeLessThan(before.minZ);
}

test('continuous radial land supports four-sided decoration, chosen building sites, free relocation and saved staff',async({page},testInfo)=>{
 // This scenario contains three real navigations, four-side placement and six modal visits.
 test.setTimeout(420000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const mobile=testInfo.project.name.includes('mobile');
 await fundedFarm(page);const initial=await info(page);
 expect(initial.state.world.estate.tier).toBe(1);
 await page.screenshot({path:testInfo.outputPath('radial-01-before.png')});
 await openLand(page);await page.locator('[data-action="expandEstate"]').click();
 await expect.poll(async()=> (await info(page)).state.world.estate.tier).toBe(2);
 await page.locator('[data-close-modal]').click();
 const expanded=await info(page);grows(initial.world.estate.bounds,expanded.world.estate.bounds);
 expect(expanded.world.estate.layout).toBe('radial-v2');expect(expanded.world.estate.tierPads).toBe(0);expect(expanded.world.estate.bridges).toBe(0);
 expect(expanded.state.coins).toBe(initial.state.coins-180);
 expect(expanded.state.world.materials).toEqual({wood:990,stone:992});
 await page.waitForTimeout(700);await page.screenshot({path:testInfo.outputPath('radial-02-expanded.png')});

 await decorTool(page,'lamp');
 for(const [x,z] of [[16,0],[-16,0],[0,12],[0,-12]]){
  await cell(page,x,z,mobile);
  await expect.poll(async()=> (await info(page)).state.world.decor.some((d:any)=>d.x===x&&d.z===z&&d.type==='lamp')).toBe(true);
 }
 await page.locator('#build-finish').click();
 await decorTool(page,'remove');await cell(page,16,0,mobile);
 await expect.poll(async()=> (await info(page)).state.world.decor.length).toBe(3);
 await page.locator('#build-finish').click();

 await openLand(page);const funds=(await info(page)).state.coins;
 await page.locator('[data-place="estate:tool_shed"]').click();
 expect((await info(page)).state.coins).toBe(funds,'choosing a site must not charge before construction');
 expect((await info(page)).construction.type).toBe('estate:tool_shed');
 await page.screenshot({path:testInfo.outputPath('radial-03-placement-grid.png')});
 await cell(page,16,0,mobile);
 await expect.poll(async()=> (await info(page)).state.world.estate.placements.tool_shed).toEqual({x:16,z:0,rotation:0});
 expect((await info(page)).state.coins).toBe(funds-90);
 expect((await info(page)).world.estate.buildings).toContainEqual({key:'tool_shed',x:16,z:0,rotation:0});
 await expect(page.locator('#build-controls')).toBeHidden();
 await page.screenshot({path:testInfo.outputPath('radial-04-building-on-new-land.png')});

 await openLand(page);const paid=(await info(page)).state.coins;
 await expect(page.locator('[data-place="estate:tool_shed"]')).toHaveText('Переместить');
 await page.locator('[data-place="estate:tool_shed"]').click();await page.locator('#build-rotate').click();
 await cell(page,-4,-12,mobile);
 await expect.poll(async()=> (await info(page)).state.world.estate.placements.tool_shed).toEqual({x:-4,z:-12,rotation:1});
 expect((await info(page)).state.coins).toBe(paid);
 await openLand(page);await page.locator('[data-action="hireStaff"][data-key="gardener"]').click();
 await page.locator('[data-close-modal]').click();
 const saved=(await info(page)).state;
 expect(saved.world.estate.staff).toContain('gardener');
 await page.reload();await ready(page);
 const restored=(await info(page)).state;
 expect(restored.world.estate.placements).toEqual(saved.world.estate.placements);
 expect(restored.world.estate.staff).toEqual(saved.world.estate.staff);expect(restored.world.decor).toEqual(saved.world.decor);
 expect(restored.coins).toBe(saved.coins);
 for(const tier of [3,4]){
  const before=(await info(page)).world.estate.bounds;
  await openLand(page);await page.locator('[data-action="expandEstate"]').click();await page.locator('[data-close-modal]').click();
  const after=await info(page);expect(after.state.world.estate.tier).toBe(tier);grows(before,after.world.estate.bounds);
 }
 await page.waitForTimeout(700);await page.screenshot({path:testInfo.outputPath('radial-05-largest-estate.png')});
 expect((await info(page)).world.estate.tierPads).toBe(0);expect(errors).toEqual([]);
 await expect(page.locator('#error')).toBeHidden();
});

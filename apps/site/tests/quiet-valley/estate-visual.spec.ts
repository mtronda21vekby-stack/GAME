import {test,expect,type Page} from '@playwright/test';

const PATH='/games/quiet-valley/';
const info=(page:Page)=>page.evaluate(()=> (window as any).FarmApp.inspect());

async function ready(page:Page){
 await expect(page.locator('body')).toHaveAttribute('data-runtime-ready','true');
 await expect(page.locator('#error')).toBeHidden();
 if(await page.locator('.intro-start').isVisible())await page.locator('.intro-start').click();
 await expect.poll(async()=> (await info(page)).presentationPending).toBe(false);
}

async function fundedFreshFarm(page:Page){
 await page.goto(PATH);await ready(page);
 await page.evaluate(()=>{
  const key='bc.world.quiet-valley.v1';
  const raw=localStorage.getItem(key);if(!raw)throw new Error('Quiet Valley save missing');
  const save=JSON.parse(raw);save.coins=5000;save.world.materials.wood=200;save.world.materials.stone=200;
  localStorage.setItem(key,JSON.stringify(save));
 });
 await page.reload();await ready(page);
}

async function openEstate(page:Page){
 const direct=page.locator('#open-land');
 if(!await direct.isVisible()){
  const menu=page.locator('#menu-toggle');
  await expect(menu).toBeVisible();await menu.click();
 }
 await expect(direct).toBeVisible();await direct.click();
}

test('buying estate tier 2 grows one radial buildable coastline around the original island',async({page},testInfo)=>{
 await fundedFreshFarm(page);
 const before=await info(page);
 expect(before.state.world.estate.tier).toBe(1);
 expect(before.world.estate.radial).toBe(true);
 expect(before.world.estate.visibleRing).toBeNull();
 expect(before.world.estate.bounds.base.rx).toBe(14.75);
 expect(before.world.estate.bounds.current.rx).toBe(14.75);

 await openEstate(page);
 const expand=page.locator('[data-action="expandEstate"]');
 await expect(expand).toBeVisible();await expect(expand).toBeEnabled();
 await expand.click();

 await expect.poll(async()=> (await info(page)).state.world.estate.tier).toBe(2);
 await expect.poll(async()=> (await info(page)).world.estate.visibleRing).toBe('2');
 const after=await info(page);
 expect(after.world.estate.buildableRing).toBe(true);
 expect(after.world.estate.bounds.current.rx).toBeGreaterThan(after.world.estate.bounds.base.rx+3);
 expect(after.world.estate.bounds.current.rz).toBeGreaterThan(after.world.estate.bounds.base.rz+2);
 expect(after.camera.size).toBeGreaterThan(before.camera.size);

 await page.locator('[data-close-modal]').click();
 await page.waitForTimeout(900);
 await page.screenshot({path:testInfo.outputPath('estate-tier2-radial-coast.png')});
 await expect(page.locator('#error')).toBeHidden();
});

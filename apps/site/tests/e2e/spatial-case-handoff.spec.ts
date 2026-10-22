import {expect,test} from "@playwright/test";
import {installApiAdapter} from "./apiAdapter";

test("@off case poster arrives before preview; failed preview recovers on healthy Next",async({page})=>{
  await installApiAdapter(page);
  await page.route("**/media/game-previews/ballcrown.webm",route=>route.fulfill({status:404,body:"missing preview"}));
  await page.goto("/");
  await page.getByRole("button",{name:"Об игре Ballcrown",exact:true}).click();
  const detail=page.locator("#spatial-game-detail");
  await expect(detail).toHaveAttribute("data-media-arrived","false");
  await expect(detail.locator("video")).toHaveCount(0);
  await expect(detail).toHaveAttribute("data-media-arrived","true");
  await expect(detail.getByText("Статичный кадр",{exact:true})).toBeVisible();
  await detail.getByRole("button",{name:"Следующая игра →",exact:true}).click();
  await expect(detail).toHaveAttribute("data-game-id","evofish");
  await expect(detail).toHaveAttribute("data-media-arrived","true");
  const video=detail.locator("video");
  await expect(video).toHaveAttribute("src","/media/game-previews/evofish.webm");
  await expect.poll(()=>video.evaluate(node=>!(node as HTMLVideoElement).paused&&(node as HTMLVideoElement).currentTime>0)).toBe(true);
});

test("@off rapid Back/Forward retargets one case and reduced motion restores its source",async({page})=>{
  await installApiAdapter(page);
  await page.goto("/");
  const opener=page.getByRole("button",{name:"Об игре Quiet Valley",exact:true});
  await opener.click();
  await expect(page).toHaveURL(/#game\/quiet-valley$/);
  await page.goBack();
  await page.goForward();
  const detail=page.locator("#spatial-game-detail");
  await expect(detail).toHaveAttribute("open","");
  await expect(detail).toHaveAttribute("data-media-arrived","true");
  await expect(page.locator('[data-case-handoff="true"]')).toHaveCount(1);
  await page.emulateMedia({reducedMotion:"reduce"});
  await detail.getByRole("button",{name:"Закрыть панель и вернуться к выбранной игре",exact:true}).click();
  await expect(detail).not.toHaveAttribute("open","");
  await expect(page.locator('[data-case-handoff="true"]')).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect.poll(()=>page.evaluate(()=>document.body.style.overflow)).not.toBe("hidden");
});

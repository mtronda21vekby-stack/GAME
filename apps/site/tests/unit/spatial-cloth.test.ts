import { describe, expect, it } from "vitest";
import { SpatialCloth } from "../../src/components/spatial/SpatialCloth";

describe("Spatial cloth interaction clock",()=>{
  it("bounds a grab, holds on pause and returns to rest without replacing vertices",()=>{
    const cloth=new SpatialCloth(true),positions=cloth.geometry.attributes.position.array;
    cloth.grab(.5,.4,5,-4);for(let i=1;i<=30;i++)cloth.update(i/60);
    expect(cloth.drag.value.z).toBeGreaterThan(.2);expect(cloth.drag.value.z).toBeLessThanOrEqual(.26);
    const held=cloth.drag.value.clone();cloth.release();for(let i=0;i<30;i++)cloth.update(.5);expect(cloth.drag.value.equals(held)).toBe(true);
    for(let i=1;i<=120;i++)cloth.update(.5+i/60);
    expect(Math.abs(cloth.drag.value.z)+Math.abs(cloth.drag.value.w)).toBeLessThan(.0001);expect(cloth.geometry.attributes.position.array).toBe(positions);
    cloth.setQuality(true,true);cloth.grab(.5,.5,.2,.2);cloth.update(3);expect(cloth.drag.value.z).toBe(0);cloth.dispose();
  });
  it("holds the pointer indentation when scene time is paused and settles it after release",()=>{
    const cloth=new SpatialCloth(false);
    cloth.setHover(2,-2,1);
    cloth.update(.095);
    expect(cloth.hover.value.z).toBeGreaterThan(.6);
    expect(cloth.hover.value.x).toBeLessThanOrEqual(.98);
    expect(cloth.hover.value.y).toBeGreaterThanOrEqual(.02);
    const held=cloth.hover.value.clone();
    cloth.setHover(.5,.5,0);
    for(let i=0;i<60;i++)cloth.update(.095);
    expect(cloth.hover.value.equals(held)).toBe(true);
    for(let i=1;i<=60;i++)cloth.update(.095+i/60);
    expect(cloth.hover.value.z).toBeLessThan(.0001);
    cloth.dispose();
  });

  it("clears old impulses and suppresses new pointer/tap movement in reduced motion",()=>{
    const cloth=new SpatialCloth(true);
    cloth.setHover(.4,.3,1);cloth.update(.1);cloth.touch(.4,.3,.1);
    expect(cloth.hover.value.z).toBeGreaterThan(0);
    expect(cloth.hits.value.some(hit=>hit.w>0)).toBe(true);
    cloth.setQuality(true,true);
    cloth.setHover(.9,.9,1);cloth.touch(.9,.9,.2);cloth.update(8);
    expect(cloth.motion.value).toBe(0);
    expect(cloth.hover.value.z).toBe(0);
    expect(cloth.hits.value.every(hit=>hit.w===0)).toBe(true);
    cloth.setQuality(true,false);cloth.update(8.1);
    expect(cloth.hover.value.z).toBe(0);
    expect(cloth.hits.value.every(hit=>hit.w===0)).toBe(true);
    cloth.dispose();
  });
});

import { describe,expect,it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { fitLabComposition,labCameraPass,labAnnotationPosition } from "../../src/components/spatial/labComposition";

describe("world-anchored LAB passage",()=>{
  it.each([[393,852],[430,932],[1440,900],[844,390]])("fits independent world geometry and bounded annotations at %ix%i",(width,height)=>{
    const compact=width<=760||height<=520,camera=new PerspectiveCamera(compact?36:38,width/height,.1,100);
    camera.position.set(0,-20,compact?19.6:17.8);camera.lookAt(0,-20,0);camera.updateMatrixWorld(true);
    const fitted=fitLabComposition(camera,width,height,compact),before=fitted.center.clone();
    expect(fitted.center.z).toBe(4.4);expect(fitted.scale.toArray().every(x=>Number.isFinite(x)&&x>0)).toBe(true);
    const first=fitted.center.clone().project(camera),pass=labCameraPass(.9,.75,.95,false);
    camera.position.x+=pass.x;camera.position.z+=pass.z;camera.lookAt(pass.targetX,-20,0);camera.updateMatrixWorld(true);
    const second=fitted.center.clone().project(camera);
    expect(first.distanceTo(second)).toBeGreaterThan(.03);
    expect(fitted.center.equals(before)).toBe(true);
    for(const kind of ["title","note"] as const)for(const offset of [-20,0,20]){
      const p=labAnnotationPosition(fitted.center.clone().add(new Vector3(offset,offset,0)),camera,width,height,kind,compact);
      expect(p.x).toBeGreaterThanOrEqual(compact?26:60);expect(p.x).toBeLessThan(width-20);
      expect(p.y).toBeGreaterThanOrEqual(height*.23);expect(p.y).toBeLessThanOrEqual(height*.74);
    }
  });
  it("retraces continuously, stays bounded and freezes its camera arc in reduced motion",()=>{
    const samples=Array.from({length:1001},(_,i)=>labCameraPass(i/1000,.75,.95,false));
    samples.forEach((value,i)=>{
      expect(Object.values(value).every(Number.isFinite)).toBe(true);
      expect(value.x).toBeGreaterThanOrEqual(0);expect(value.x).toBeLessThanOrEqual(1.6);
      if(i)expect(Math.abs(value.x-samples[i-1].x)).toBeLessThan(.016);
      expect(value).toEqual(labCameraPass(i/1000,.75,.95,false));
    });
    expect(labCameraPass(1,.75,.95,true)).toEqual({x:0,y:0,z:0,targetX:0});
    expect(labCameraPass(NaN,.75,.95,false)).toEqual({x:0,y:-0,z:-0,targetX:0});
  });
});
